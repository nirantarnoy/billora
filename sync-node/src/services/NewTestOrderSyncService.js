const axios = require('axios');
const crypto = require('crypto');
const moment = require('moment');
const db = require('../models/db');
const StockService = require('./StockService');

class NewTestOrderSyncService {
    constructor() {
        this.partnerId = process.env.SHOPEE_PARTNER_ID;
        this.partnerKey = process.env.SHOPEE_PARTNER_KEY;
    }

    async syncShopeeOrders(userId, channel) {
        // ดึง Token เฉพาะของ User คนนี้
        const [tokens] = await db.execute(
            'SELECT * FROM shopee_tokens WHERE user_id = ? AND status = "active" ORDER BY created_at DESC LIMIT 1',
            [userId]
        );
        let tokenModel = tokens[0];

        if (!tokenModel) {
            console.warn(`User ${userId}: No active Shopee token found`);
            return 0;
        }

        if (moment(tokenModel.expires_at).isBefore(moment())) {
            tokenModel = await this.refreshShopeeToken(tokenModel);
            if (!tokenModel) return 0;
        }

        let accessToken = tokenModel.access_token;
        const shopId = tokenModel.shop_id;
        let count = 0;
        let cursor = '';

        try {
            do {
                const timestamp = Math.floor(Date.now() / 1000);
                const path = "/api/v2/order/get_order_list";
                const baseString = this.partnerId + path + timestamp + accessToken + shopId;
                const sign = crypto.createHmac('sha256', this.partnerKey).update(baseString).digest('hex');

                const params = {
                    partner_id: parseInt(this.partnerId),
                    shop_id: parseInt(shopId),
                    sign: sign,
                    timestamp: timestamp,
                    access_token: accessToken,
                    time_range_field: 'create_time',
                    time_from: Math.floor(moment().subtract(15, 'days').unix()),
                    time_to: timestamp,
                    page_size: 50,
                    response_optional_fields: 'order_status',
                };

                if (cursor) params.cursor = cursor;

                const response = await axios.get('https://partner.shopeemobile.com' + path, { params, timeout: 30000 });
                const data = response.data;

                console.log(`Shopee API Response for Shop ${shopId}:`, JSON.stringify({
                    error: data.error,
                    message: data.message,
                    order_count: data.response ? (data.response.order_list ? data.response.order_list.length : 0) : 0,
                    more_data: data.response ? data.response.more : false
                }));

                if (data.error || !data.response || !data.response.order_list) {
                    if (data.error) console.error(`Shopee API Error: ${data.error} - ${data.message}`);
                    break;
                }

                const orderSns = data.response.order_list.map(o => o.order_sn);
                if (orderSns.length > 0) {
                    count += await this.processShopeeOrdersBatch(userId, channel, orderSns, accessToken, shopId);
                }

                cursor = data.response.next_cursor || '';
                if (cursor) await new Promise(r => setTimeout(r, 200));

            } while (cursor);

            return count;
        } catch (error) {
            console.error(`User ${userId} Shopee Sync Error:`, error.message);
            return 0;
        }
    }

    async processShopeeOrdersBatch(userId, channel, orderSns, accessToken, shopId) {
        let count = 0;
        const timestamp = Math.floor(Date.now() / 1000);
        const path = "/api/v2/order/get_order_detail";
        const baseString = this.partnerId + path + timestamp + accessToken + shopId;
        const sign = crypto.createHmac('sha256', this.partnerKey).update(baseString).digest('hex');

        try {
            const response = await axios.get('https://partner.shopeemobile.com' + path, {
                params: {
                    partner_id: parseInt(this.partnerId),
                    timestamp: timestamp,
                    access_token: accessToken,
                    shop_id: parseInt(shopId),
                    sign: sign,
                    order_sn_list: orderSns.join(','),
                    response_optional_fields: 'item_list',
                }
            });

            if (!response.data.response || !response.data.response.order_list) return 0;

            const allowedStatuses = ['READY_TO_SHIP', 'PROCESSED', 'SHIPPED', 'COMPLETED', 'TO_CONFIRM_RECEIVE'];

            for (const orderDetail of response.data.response.order_list) {
                if (!allowedStatuses.includes(orderDetail.order_status)) continue;

                for (const item of orderDetail.item_list) {
                    const uniqueOrderId = `${orderDetail.order_sn}_${item.item_id}`;
                    const sku = item.model_sku || item.item_sku || 'N/A';
                    const price = parseFloat(item.model_discounted_price || item.discounted_price || 0);
                    const orderDate = moment.unix(orderDetail.create_time).format('YYYY-MM-DD HH:mm:ss');

                    await this.checkSaveNewProduct(userId, sku, item.item_name);

                    const sql = `
                        INSERT IGNORE INTO \`order\` 
                        (user_id, order_id, channel_id, shop_id, order_sn, sku, product_name, quantity, price, total_amount, order_date, order_status, created_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
                    `;
                    const [res] = await db.execute(sql, [
                        userId, uniqueOrderId, channel.id, shopId, orderDetail.order_sn,
                        sku, item.item_name, item.quantity_purchased, price, item.quantity_purchased * price,
                        orderDate, orderDetail.order_status
                    ]);
                    if (res.affectedRows > 0) count++;

                    // --- AUTO STOCK LOGIC ---
                    try {
                        const status = orderDetail.order_status;
                        const platform = 'shopee';
                        if (['READY_TO_SHIP', 'PROCESSED', 'SHIPPED'].includes(status)) {
                            await StockService.reserveStock(userId, orderDetail.order_sn, sku, item.quantity_purchased, platform);
                        } else if (status === 'COMPLETED') {
                            await StockService.deductStock(userId, orderDetail.order_sn, sku, item.quantity_purchased, platform);
                        } else if (status === 'CANCELLED') {
                            await StockService.cancelReservation(userId, orderDetail.order_sn, sku, item.quantity_purchased, platform);
                        }
                    } catch (stockErr) {
                        console.error(`[Stock Sync Error] Order ${orderDetail.order_sn}:`, stockErr.message);
                    }
                }
            }
        } catch (error) {
            console.error('Shopee Batch Error:', error.message);
        }
        return count;
    }

    async checkSaveNewProduct(userId, sku, name) {
        if (!sku) return;
        try {
            await db.execute(
                'INSERT IGNORE INTO product (user_id, sku, name) VALUES (?, ?, ?)',
                [userId, sku.trim(), (name || '').trim()]
            );
        } catch (e) { }
    }

    async refreshShopeeToken(tokenModel) {
        try {
            const timestamp = Math.floor(Date.now() / 1000);
            const path = "/api/v2/auth/access_token/get";
            const baseString = this.partnerId + path + timestamp;
            const sign = crypto.createHmac('sha256', this.partnerKey).update(baseString).digest('hex');

            const response = await axios.post('https://partner.shopeemobile.com' + path, {
                shop_id: parseInt(tokenModel.shop_id),
                partner_id: parseInt(this.partnerId),
                refresh_token: tokenModel.refresh_token,
            }, {
                params: { partner_id: parseInt(this.partnerId), timestamp, sign }
            });

            if (response.data.access_token) {
                const refreshed = response.data;
                const expiresAt = moment().add(refreshed.expire_in || 14400, 'seconds').format('YYYY-MM-DD HH:mm:ss');
                await db.execute(
                    'UPDATE shopee_tokens SET access_token = ?, refresh_token = ?, expires_at = ?, updated_at = NOW() WHERE id = ?',
                    [refreshed.access_token, refreshed.refresh_token, expiresAt, tokenModel.id]
                );
                return { ...tokenModel, access_token: refreshed.access_token, refresh_token: refreshed.refresh_token, expires_at: expiresAt };
            }
        } catch (error) { }
        return null;
    }
}

module.exports = NewTestOrderSyncService;
