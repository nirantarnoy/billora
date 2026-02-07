const axios = require('axios');
const crypto = require('crypto');
const db = require('../models/db');
const moment = require('moment');

class StockUpdateService {
    constructor() {
        this.shopeePartnerId = process.env.SHOPEE_PARTNER_ID;
        this.shopeePartnerKey = process.env.SHOPEE_PARTNER_KEY;
        this.tiktokAppKey = process.env.TIKTOK_APP_KEY || '6h9n461r774e1'; // Fallback to provided keys if env not set
        this.tiktokAppSecret = process.env.TIKTOK_APP_SECRET || '1c45a0c25224293abd7de681049f90de3363389a';
    }

    /**
     * Update stock for a specific SKU across all connected platforms
     */
    async updateStockEverywhere(userId, sku, newStock) {
        if (!sku || sku === 'N/A') return;

        console.log(`[StockUpdate] Triggering update for SKU: ${sku}, New Stock: ${newStock}`);

        // 1. Find all mappings for this SKU for the user
        // We join with products to handle the plural/singular table difference if needed, 
        // but marketplace_product_mappings should link to products.id
        const query = `
            SELECT m.*, p.sku as local_sku
            FROM marketplace_product_mappings m
            JOIN products p ON m.product_id = p.id
            WHERE p.sku = ? AND p.tenant_id = (SELECT tenant_id FROM users WHERE id = ? LIMIT 1)
        `;
        const [mappings] = await db.execute(query, [sku, userId]);

        if (mappings.length === 0) {
            console.log(`[StockUpdate] No marketplace mappings found for SKU: ${sku}`);
            return;
        }

        for (const map of mappings) {
            try {
                if (map.platform.toLowerCase() === 'shopee') {
                    await this.updateShopeeStock(userId, map, newStock);
                } else if (map.platform.toLowerCase() === 'tiktok') {
                    await this.updateTikTokStock(userId, map, newStock);
                }
            } catch (err) {
                console.error(`[StockUpdate] Failed for ${map.platform}: ${err.message}`);
            }
        }
    }

    async updateShopeeStock(userId, mapping, quantity) {
        const [tokens] = await db.execute(
            'SELECT * FROM shopee_tokens WHERE user_id = ? AND status = "active" LIMIT 1',
            [userId]
        );
        const tokenModel = tokens[0];
        if (!tokenModel) return;

        // Path for Shopee V2 Stock Update
        const timestamp = Math.floor(Date.now() / 1000);
        const path = "/api/v2/product/update_stock";
        const shopId = tokenModel.shop_id;
        const accessToken = tokenModel.access_token;

        const baseString = this.shopeePartnerId + path + timestamp + accessToken + shopId;
        const sign = crypto.createHmac('sha256', this.shopeePartnerKey).update(baseString).digest('hex');

        const itemId = parseInt(mapping.marketplace_product_id);
        const modelId = mapping.marketplace_model_id ? parseInt(mapping.marketplace_model_id) : 0;

        const body = {
            item_id: itemId,
            stock_list: [
                {
                    stock: parseInt(quantity)
                }
            ]
        };

        if (modelId > 0) {
            body.stock_list[0].model_id = modelId;
        }

        try {
            const response = await axios.post('https://partner.shopeemobile.com' + path, body, {
                params: {
                    partner_id: parseInt(this.shopeePartnerId),
                    shop_id: parseInt(shopId),
                    sign: sign,
                    timestamp: timestamp,
                    access_token: accessToken
                }
            });

            if (response.data.error) {
                console.error(`[Shopee] Stock Update Error: ${response.data.message}`);
            } else {
                console.log(`[Shopee] Updated stock for ${mapping.marketplace_sku} to ${quantity}`);
            }
        } catch (err) {
            console.error(`[Shopee] API Request Failed: ${err.message}`);
        }
    }

    async updateTikTokStock(userId, mapping, quantity) {
        const [tokens] = await db.execute(
            'SELECT * FROM tiktok_tokens WHERE user_id = ? AND status = "active" LIMIT 1',
            [userId]
        );
        const tokenModel = tokens[0];
        if (!tokenModel) return;

        const timestamp = Math.floor(Date.now() / 1000);
        const path = '/product/202309/products/stock/update';

        const body = {
            product_id: mapping.marketplace_product_id,
            skus: [
                {
                    id: mapping.marketplace_sku_id, // SKU ID 
                    inventory: [
                        {
                            quantity: parseInt(quantity),
                            warehouse_id: mapping.marketplace_warehouse_id || "7092147321685313286" // Default or need mapping
                        }
                    ]
                }
            ]
        };

        // Signature Generation for TikTok
        const queryParams = {
            app_key: this.tiktokAppKey,
            shop_cipher: tokenModel.shop_cipher,
            timestamp: timestamp
        };
        const bodyJson = JSON.stringify(body);
        const sign = this.generateTikTokSign(this.tiktokAppSecret, queryParams, path, bodyJson);

        const url = `https://open-api.tiktokglobalshop.com${path}?${new URLSearchParams({ ...queryParams, sign, access_token: tokenModel.access_token }).toString()}`;

        try {
            const response = await axios.post(url, bodyJson, {
                headers: { 'Content-Type': 'application/json', 'x-tts-access-token': tokenModel.access_token }
            });

            if (response.data.code !== 0) {
                console.error(`[TikTok] Stock Update Error: ${response.data.message}`);
            } else {
                console.log(`[TikTok] Updated stock for ${mapping.marketplace_sku} to ${quantity}`);
            }
        } catch (err) {
            console.error(`[TikTok] API Request Failed: ${err.message}`);
        }
    }

    generateTikTokSign(appSecret, params, path, body = '') {
        const sortedKeys = Object.keys(params).sort();
        let stringToSign = appSecret + path;
        for (const key of sortedKeys) stringToSign += key + params[key];
        if (body) stringToSign += body;
        stringToSign += appSecret;
        return crypto.createHmac('sha256', appSecret).update(stringToSign).digest('hex');
    }
}

module.exports = new StockUpdateService();
