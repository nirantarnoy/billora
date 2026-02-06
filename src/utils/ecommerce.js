const crypto = require('crypto');
const axios = require('axios');

class EcommerceAPI {
    // --- Shopee ---
    static getShopeeBaseUrl() {
        return process.env.SHOPEE_ENV === 'test'
            ? 'https://partner.test-stable.shopeemobile.com'
            : 'https://partner.shopeemobile.com';
    }

    static getShopeeAuthUrl() {
        const cleanEnv = (key) => (process.env[key] || '').trim().replace(/['"]/g, '');

        const partnerId = cleanEnv('SHOPEE_PARTNER_ID');
        const partnerKey = cleanEnv('SHOPEE_PARTNER_KEY');
        const redirectUrl = cleanEnv('SHOPEE_REDIRECT_URL');
        const timestamp = Math.floor(Date.now() / 1000);
        const baseUrl = this.getShopeeBaseUrl();
        const path = "/api/v2/shop/auth_partner";

        // V2 Base String: partner_id + path + timestamp
        const baseString = partnerId + path + timestamp;
        const sign = crypto.createHmac('sha256', partnerKey).update(baseString).digest('hex');

        // Construct final URL with manual concatenation for absolute control
        const finalUrl = baseUrl + path +
            "?partner_id=" + partnerId +
            "&timestamp=" + timestamp +
            "&sign=" + sign +
            "&redirect=" + encodeURIComponent(redirectUrl);

        console.log('--- Shopee Final Dev Debug ---');
        console.log('BaseString:', baseString);
        console.log('Sign:', sign);
        console.log('Final URL:', finalUrl);

        return finalUrl;
    }

    static async getShopeeTokens(code, shopId) {
        const cleanEnv = (key) => (process.env[key] || '').trim().replace(/['"]/g, '');

        const partnerId = parseInt(cleanEnv('SHOPEE_PARTNER_ID'));
        const partnerKey = cleanEnv('SHOPEE_PARTNER_KEY');
        const timestamp = Math.floor(Date.now() / 1000);
        const baseUrl = this.getShopeeBaseUrl();

        const path = "/api/v2/auth/token/get";
        const baseString = `${partnerId}${path}${timestamp}`;
        const sign = crypto.createHmac('sha256', partnerKey).update(baseString).digest('hex');

        const url = `${baseUrl}${path}?partner_id=${partnerId}&timestamp=${timestamp}&sign=${sign}`;

        const response = await axios.post(url, {
            code: code,
            partner_id: partnerId,
            shop_id: parseInt(shopId)
        });

        return response.data;
    }

    // --- TikTok ---
    static getTikTokAuthUrl() {
        const appKey = process.env.TIKTOK_APP_KEY;
        const redirectUrl = process.env.TIKTOK_REDIRECT_URL;
        return `https://services.tiktokshops.com/open/authorize?app_key=${appKey}&state=tiktok&redirect_uri=${redirectUrl}`;
    }

    static async getTikTokTokens(code) {
        const appKey = process.env.TIKTOK_APP_KEY;
        const appSecret = process.env.TIKTOK_APP_SECRET;

        const url = `https://auth.tiktokshops.com/api/v2/token/get?app_key=${appKey}&app_secret=${appSecret}&auth_code=${code}&grant_type=authorized_code`;

        const response = await axios.get(url);
        return response.data;
    }

    // --- Lazada ---
    static getLazadaAuthUrl() {
        const appKey = process.env.LAZADA_APP_KEY;
        const redirectUrl = process.env.LAZADA_REDIRECT_URL;
        return `https://auth.lazada.com/oauth/authorize?response_type=code&force_auth=true&redirect_uri=${redirectUrl}&client_id=${appKey}`;
    }

    static async getLazadaTokens(code) {
        const appKey = process.env.LAZADA_APP_KEY;
        const appSecret = process.env.LAZADA_APP_SECRET;
        const timestamp = Date.now();

        // Lazada signature logic is a bit more complex, simplified here for the flow
        // Actual implementation would require sorting parameters and HmacSha256
        const url = `https://auth.lazada.com/rest/auth/token/create`;

        const response = await axios.get(url, {
            params: {
                code,
                app_key: appKey,
                timestamp,
                sign_method: 'sha256'
            }
        });
        return response.data;
    }
}

module.exports = EcommerceAPI;
