const axios = require('axios');
const crypto = require('crypto');
const moment = require('moment');
const db = require('../models/db');

class ShopeeIncomeService {
    constructor() {
        this.partnerId = 2012399;
        this.partnerKey = 'shpk72476151525864414e4b6e475449626679624f695a696162696570417043';
    }

    async syncAllOrders(userId) {
        console.log(`User ${userId}: Syncing Shopee Income...`);

        try {
            const [channels] = await db.execute('SELECT * FROM online_channel WHERE user_id = ? AND name = ?', [userId, 'Shopee']);
            const shopeeChannel = channels[0];
            if (!shopeeChannel) return 0;

            // ค้นหาออเดอร์ของ User นี้ที่ยังไม่มีข้อมูลรายได้
            const query = `
                SELECT DISTINCT o.order_sn 
                FROM \`order\` o
                LEFT JOIN shopee_income_details s ON o.user_id = s.user_id AND o.order_sn = s.order_sn
                WHERE o.user_id = ? 
                AND o.channel_id = ? 
                AND o.order_sn IS NOT NULL 
                AND s.order_sn IS NULL
                LIMIT 50
            `;
            const [rows] = await db.execute(query, [userId, shopeeChannel.id]);

            let count = 0;
            for (const row of rows) {
                if (await this.syncOrderIncome(userId, row.order_sn)) {
                    count++;
                }
                await new Promise(r => setTimeout(r, 200));
            }
            return count;

        } catch (error) {
            console.error(`User ${userId} Shopee Income Error:`, error.message);
            return 0;
        }
    }

    async syncOrderIncome(userId, orderSn) {
        const [tokens] = await db.execute(
            'SELECT * FROM shopee_tokens WHERE user_id = ? AND status = "active" LIMIT 1',
            [userId]
        );
        let tokenModel = tokens[0];

        if (!tokenModel) return false;

        if (moment(tokenModel.expires_at).isBefore(moment())) {
            tokenModel = await this.refreshShopeeToken(tokenModel);
        }

        if (!tokenModel) return false;

        return await this.fetchAndSaveEscrowDetail(userId, tokenModel, orderSn);
    }

    async fetchAndSaveEscrowDetail(userId, tokenModel, orderSn) {
        const timestamp = Math.floor(Date.now() / 1000);
        const path = "/api/v2/payment/get_escrow_detail";
        const baseString = this.partnerId + path + timestamp + tokenModel.access_token + tokenModel.shop_id;
        const sign = crypto.createHmac('sha256', this.partnerKey).update(baseString).digest('hex');

        try {
            const response = await axios.get('https://partner.shopeemobile.com' + path, {
                params: {
                    partner_id: parseInt(this.partnerId),
                    shop_id: parseInt(tokenModel.shop_id),
                    sign: sign,
                    timestamp: timestamp,
                    access_token: tokenModel.access_token,
                    order_sn: orderSn
                }
            });

            const income = response.data.response ? response.data.response.order_income : null;
            if (!income) return false;

            const [orders] = await db.execute('SELECT order_date FROM `order` WHERE user_id = ? AND order_sn = ? LIMIT 1', [userId, orderSn]);
            const orderDate = orders[0] ? orders[0].order_date : null;

            const sql = `
                INSERT INTO shopee_income_details 
                (user_id, order_sn, order_date, buyer_total_amount, commission_fee, transaction_fee, service_fee, escrow_amount, actual_shipping_fee, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
                ON DUPLICATE KEY UPDATE 
                buyer_total_amount = VALUES(buyer_total_amount),
                commission_fee = VALUES(commission_fee),
                transaction_fee = VALUES(transaction_fee),
                service_fee = VALUES(service_fee),
                escrow_amount = VALUES(escrow_amount),
                actual_shipping_fee = VALUES(actual_shipping_fee),
                updated_at = NOW()
            `;
            await db.execute(sql, [
                userId, orderSn, orderDate, income.buyer_total_amount || 0,
                income.commission_fee || 0, income.transaction_fee || 0, income.service_fee || 0,
                income.escrow_amount || 0, income.actual_shipping_fee || 0
            ]);

            return true;
        } catch (error) {
            return false;
        }
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

module.exports = ShopeeIncomeService;
