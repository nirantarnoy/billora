const axios = require('axios');
const crypto = require('crypto');
const moment = require('moment');
const db = require('../models/db');
const StockService = require('./StockService');

class OrderSyncService {
    constructor() {
        this.appKey = '6h9n461r774e1';
        this.appSecret = '1c45a0c25224293abd7de681049f90de3363389a';
    }

    async syncTikTokOrders(userId, channel) {
        // ดึง Token เฉพาะของ User คนนี้
        const [tokens] = await db.execute(
            'SELECT * FROM tiktok_tokens WHERE user_id = ? AND status = "active" LIMIT 1',
            [userId]
        );
        let tokenModel = tokens[0];

        if (!tokenModel) {
            console.error(`User ${userId}: No active TikTok token`);
            return 0;
        }

        if (tokenModel.expires_at && moment(tokenModel.expires_at).isBefore(moment())) {
            tokenModel = await this.refreshTikTokToken(tokenModel);
        }

        const accessToken = tokenModel.access_token;
        const shopCipher = tokenModel.shop_cipher;
        const path = '/order/202309/orders/search';
        let count = 0;

        try {
            const timestamp = Math.floor(Date.now() / 1000);
            const queryParams = {
                app_key: this.appKey,
                page_size: 50,
                shop_cipher: shopCipher,
                sort_field: 'create_time',
                sort_order: 'DESC',
                timestamp: timestamp
            };

            const body = {
                order_status: 'COMPLETED',
                create_time_ge: Math.floor(moment().subtract(15, 'days').unix()),
                create_time_lt: timestamp
            };
            const bodyJson = JSON.stringify(body);
            const sign = this.generateSignForOrder(this.appSecret, queryParams, path, bodyJson);
            const url = `https://open-api.tiktokglobalshop.com${path}?${new URLSearchParams({ ...queryParams, sign, access_token: accessToken }).toString()}`;

            const response = await axios.post(url, bodyJson, {
                headers: { 'Content-Type': 'application/json', 'x-tts-access-token': accessToken }
            });

            if (response.data.code === 0) {
                const orders = response.data.data.orders || [];
                for (const order of orders) {
                    count += await this.processTikTokOrder(userId, channel, order);
                }
            }
        } catch (error) {
            console.error(`User ${userId} TikTok Sync Error:`, error.message);
        }
        return count;
    }

    async processTikTokOrder(userId, channel, orderData) {
        let savedCount = 0;
        for (const item of orderData.line_items) {
            const uniqueOrderId = `${orderData.id}_${item.id}`;
            const price = parseFloat(item.sale_price || 0) / 1000000;
            const orderDate = moment.unix(orderData.create_time).format('YYYY-MM-DD HH:mm:ss');

            await this.checkSaveNewProduct(userId, item.sku_id || item.seller_sku, item.product_name);

            const sql = `
                INSERT IGNORE INTO \`order\` 
                (user_id, order_id, channel_id, sku, product_name, quantity, price, total_amount, order_date, order_status, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
            `;
            const [res] = await db.execute(sql, [
                userId, uniqueOrderId, channel.id, item.sku_id || item.seller_sku,
                item.product_name, item.quantity, price, item.quantity * price, orderDate, orderData.status
            ]);
            if (res.affectedRows > 0) savedCount++;

            // --- AUTO STOCK LOGIC ---
            try {
                const status = orderData.status;
                if (['AWAITING_SHIPMENT', 'AWAITING_COLLECTION', 'PICKED_UP', 'IN_TRANSIT'].includes(status)) {
                    await StockService.reserveStock(userId, orderData.id, item.sku_id || item.seller_sku, item.quantity);
                } else if (['DELIVERED', 'COMPLETED'].includes(status)) {
                    await StockService.deductStock(userId, orderData.id, item.sku_id || item.seller_sku, item.quantity);
                } else if (status === 'CANCELLED') {
                    await StockService.cancelReservation(userId, orderData.id, item.sku_id || item.seller_sku, item.quantity);
                }
            } catch (stockErr) {
                console.error(`[Stock Sync Error] TikTok Order ${orderData.id}:`, stockErr.message);
            }
        }
        return savedCount;
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

    generateSignForOrder(appSecret, params, path, body = '') {
        const sortedKeys = Object.keys(params).sort();
        let stringToSign = appSecret + path;
        for (const key of sortedKeys) stringToSign += key + params[key];
        if (body) stringToSign += body;
        stringToSign += appSecret;
        return crypto.createHmac('sha256', appSecret).update(stringToSign).digest('hex');
    }

    async refreshTikTokToken(tokenModel) {
        try {
            const params = {
                app_key: this.appKey,
                app_secret: this.appSecret,
                refresh_token: tokenModel.refresh_token,
                grant_type: 'refresh_token'
            };
            const response = await axios.get('https://auth.tiktok-shops.com/api/v2/token/refresh', { params });
            if (response.data.data && response.data.data.access_token) {
                const refreshed = response.data.data;
                const expiresAt = moment().add(refreshed.access_token_expire_in, 'seconds').format('YYYY-MM-DD HH:mm:ss');
                await db.execute(
                    'UPDATE tiktok_tokens SET access_token = ?, refresh_token = ?, expires_at = ?, updated_at = NOW() WHERE id = ?',
                    [refreshed.access_token, refreshed.refresh_token, expiresAt, tokenModel.id]
                );
                return { ...tokenModel, access_token: refreshed.access_token, refresh_token: refreshed.refresh_token, expires_at: expiresAt };
            }
        } catch (error) { }
        return tokenModel;
    }
}

module.exports = OrderSyncService;
