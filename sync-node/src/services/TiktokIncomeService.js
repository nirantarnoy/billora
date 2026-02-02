const axios = require('axios');
const crypto = require('crypto');
const moment = require('moment');
const db = require('../models/db');

class TiktokIncomeService {
    constructor() {
        this.appKey = '6h9n461r774e1';
        this.appSecret = '1c45a0c25224293abd7de681049f90de3363389a';
    }

    async syncAllOrders(userId) {
        console.log(`User ${userId}: Syncing TikTok Income...`);

        try {
            const [channels] = await db.execute('SELECT * FROM online_channel WHERE user_id = ? AND name = ?', [userId, 'Tiktok']);
            const tiktokChannel = channels[0];
            if (!tiktokChannel) return 0;

            const query = `
                SELECT DISTINCT o.order_id 
                FROM \`order\` o
                LEFT JOIN tiktok_income_details t ON o.user_id = t.user_id AND SUBSTRING_INDEX(o.order_id, '_', 1) = t.order_id
                WHERE o.user_id = ? 
                AND o.channel_id = ? 
                AND o.order_id IS NOT NULL 
                AND t.order_id IS NULL
                LIMIT 50
            `;
            const [pendingOrders] = await db.execute(query, [userId, tiktokChannel.id]);

            let count = 0;
            for (const row of pendingOrders) {
                const actualOrderId = row.order_id.split('_')[0];
                if (await this.syncOrderIncome(userId, actualOrderId, row.order_id)) {
                    count++;
                }
                await new Promise(resolve => setTimeout(resolve, 200));
            }
            return count;

        } catch (error) {
            console.error(`User ${userId} TikTok Income Error:`, error.message);
            return 0;
        }
    }

    async syncOrderIncome(userId, orderId, originOrderId) {
        const [tokens] = await db.execute(
            'SELECT * FROM tiktok_tokens WHERE user_id = ? AND status = "active" LIMIT 1',
            [userId]
        );
        let tokenModel = tokens[0];

        if (!tokenModel || !tokenModel.shop_cipher) return false;

        if (tokenModel.expires_at && moment(tokenModel.expires_at).isBefore(moment())) {
            tokenModel = await this.refreshTikTokToken(tokenModel);
        }

        return await this.fetchAndSaveSettlementDetail(userId, tokenModel, orderId, originOrderId);
    }

    async fetchAndSaveSettlementDetail(userId, tokenModel, orderId, originOrderId) {
        const timestamp = Math.floor(Date.now() / 1000);
        const path = `/finance/202309/orders/${orderId}/statement_transactions`;
        const params = {
            app_key: this.appKey,
            shop_cipher: tokenModel.shop_cipher,
            timestamp: timestamp
        };

        const sign = this.generateSign(this.appSecret, params, path);
        const url = `https://open-api.tiktokglobalshop.com${path}?${new URLSearchParams({ ...params, sign }).toString()}`;

        try {
            const response = await axios.get(url, {
                headers: { 'x-tts-access-token': tokenModel.access_token },
                timeout: 30000
            });

            if (response.data.code !== 0 || !response.data.data) return false;

            const transactions = response.data.data.statement_transactions || [];
            if (transactions.length === 0) return false;

            const tx = transactions[0];
            const getAmount = (key) => tx[key] ? parseFloat(tx[key]) : 0.0;

            const [orders] = await db.execute('SELECT order_date FROM `order` WHERE user_id = ? AND order_id = ? LIMIT 1', [userId, originOrderId]);
            const orderDate = orders[0] ? orders[0].order_date : null;

            const sql = `
                INSERT INTO tiktok_income_details 
                (user_id, order_id, order_date, settlement_amount, revenue_amount, fee_and_tax_amount, actual_shipping_fee_amount, currency, statement_transactions, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
                ON DUPLICATE KEY UPDATE 
                settlement_amount = VALUES(settlement_amount),
                revenue_amount = VALUES(revenue_amount),
                fee_and_tax_amount = VALUES(fee_and_tax_amount),
                actual_shipping_fee_amount = VALUES(actual_shipping_fee_amount),
                statement_transactions = VALUES(statement_transactions),
                updated_at = NOW()
            `;
            await db.execute(sql, [
                userId, orderId, orderDate, getAmount('settlement_amount'), getAmount('revenue_amount'),
                getAmount('fee_amount'), getAmount('actual_shipping_fee_amount'), tx.currency || 'THB',
                JSON.stringify(transactions)
            ]);

            return true;
        } catch (error) {
            return false;
        }
    }

    generateSign(appSecret, params, path) {
        const sortedKeys = Object.keys(params).sort();
        let stringToSign = appSecret + path;
        for (const key of sortedKeys) stringToSign += key + params[key];
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
            const url = `https://auth.tiktok-shops.com/api/v2/token/refresh?${new URLSearchParams(params).toString()}`;
            const response = await axios.get(url);
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

module.exports = TiktokIncomeService;
