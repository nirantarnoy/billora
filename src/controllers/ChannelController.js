const db = require('../config/db');
const EcommerceAPI = require('../utils/ecommerce');

class ChannelController {
    async listChannels(req, res) {
        try {
            const tenantId = req.session.user.tenant_id || 1;
            const [channels] = await db.execute('SELECT * FROM online_channels WHERE tenant_id = ?', [tenantId]);
            res.render('channels', {
                channels,
                user: req.session.user,
                active: 'channels',
                title: 'จัดการช่องทางขายออนไลน์',
                _csrf: req.csrfToken ? req.csrfToken() : ''
            });
        } catch (err) {
            res.status(500).send(err.message);
        }
    }

    async saveChannel(req, res) {
        const { platform, shop_name, shop_id } = req.body;
        const tenantId = req.session.user.tenant_id || 1;
        try {
            const [existing] = await db.execute('SELECT id FROM online_channels WHERE tenant_id = ? AND platform = ?', [tenantId, platform]);

            if (existing.length > 0) {
                await db.execute(
                    'UPDATE online_channels SET shop_name = ?, shop_id = ?, status = "active" WHERE id = ?',
                    [shop_name, shop_id, existing[0].id]
                );
            } else {
                await db.execute(
                    'INSERT INTO online_channels (tenant_id, platform, shop_name, shop_id, status) VALUES (?, ?, ?, ?, "active")',
                    [tenantId, platform, shop_name, shop_id]
                );
            }
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }

    async updateBookCode(req, res) {
        const { id } = req.params;
        const { express_book_code } = req.body;
        try {
            await db.execute('UPDATE online_channels SET express_book_code = ? WHERE id = ?', [express_book_code, id]);
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }

    async disconnectChannel(req, res) {
        const { platform } = req.query;
        const tenantId = req.session.user.tenant_id || 1;
        try {
            await db.execute('DELETE FROM online_channels WHERE tenant_id = ? AND platform = ?', [tenantId, platform]);
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }

    // OAuth
    initiateAuth(req, res) {
        const { platform } = req.params;
        let authUrl = '';
        switch (platform) {
            case 'shopee': authUrl = EcommerceAPI.getShopeeAuthUrl(); break;
            case 'tiktok': authUrl = EcommerceAPI.getTikTokAuthUrl(); break;
            case 'lazada': authUrl = EcommerceAPI.getLazadaAuthUrl(); break;
            default: return res.status(400).send('Invalid platform');
        }
        res.redirect(authUrl);
    }

    async shopeeCallback(req, res) {
        const { code, shop_id } = req.query;
        const tenantId = req.session.user.tenant_id || 1;
        try {
            await db.execute(
                `INSERT INTO online_channels (tenant_id, platform, shop_name, shop_id, status, access_token) 
         VALUES (?, 'shopee', ?, ?, 'active', ?) 
         ON DUPLICATE KEY UPDATE shop_name = VALUES(shop_name), shop_id = VALUES(shop_id), status = 'active', access_token = VALUES(access_token)`,
                [tenantId, `Shopee Shop ${shop_id}`, shop_id, code]
            );
            res.redirect('/channels?success=shopee');
        } catch (err) {
            res.status(500).send(`Auth Error: ${err.message}`);
        }
    }

    async tiktokCallback(req, res) {
        const { code } = req.query;
        const tenantId = req.session.user.tenant_id || 1;
        try {
            await db.execute(
                `INSERT INTO online_channels (tenant_id, platform, shop_name, shop_id, status, access_token) 
         VALUES (?, 'tiktok', 'My TikTok Shop', 'tiktok_shop_id', 'active', ?) 
         ON DUPLICATE KEY UPDATE status = 'active', access_token = VALUES(access_token)`,
                [tenantId, code]
            );
            res.redirect('/channels?success=tiktok');
        } catch (err) {
            res.status(500).send(`Auth Error: ${err.message}`);
        }
    }

    async lazadaCallback(req, res) {
        const { code } = req.query;
        const tenantId = req.session.user.tenant_id || 1;
        try {
            await db.execute(
                `INSERT INTO online_channels (tenant_id, platform, shop_name, shop_id, status, access_token) 
         VALUES (?, 'lazada', 'My Lazada Shop', 'lazada_shop_id', 'active', ?) 
         ON DUPLICATE KEY UPDATE status = 'active', access_token = VALUES(access_token)`,
                [tenantId, code]
            );
            res.redirect('/channels?success=lazada');
        } catch (err) {
            res.status(500).send(`Auth Error: ${err.message}`);
        }
    }
}

module.exports = new ChannelController();
