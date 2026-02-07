const db = require('../config/db');
const EcommerceAPI = require('../utils/ecommerce');
const { encrypt } = require('../utils/crypto');

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
            // Exchange code for tokens
            const tokenData = await EcommerceAPI.getShopeeTokens(code, shop_id);

            if (tokenData.access_token) {
                const encryptedAccess = encrypt(tokenData.access_token);
                const encryptedRefresh = encrypt(tokenData.refresh_token);

                // Save to marketplace_connections (Encrypted)
                await db.execute(
                    `INSERT INTO marketplace_connections 
                    (tenant_id, platform, shop_id, shop_name, access_token, refresh_token, access_token_expires_at) 
                    VALUES (?, 'shopee', ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL ? SECOND))
                    ON DUPLICATE KEY UPDATE 
                    access_token = VALUES(access_token), 
                    refresh_token = VALUES(refresh_token),
                    access_token_expires_at = VALUES(access_token_expires_at),
                    updated_at = NOW()`,
                    [tenantId, shop_id, `Shopee Shop ${shop_id}`, encryptedAccess, encryptedRefresh, tokenData.expire_in]
                );

                // Also sync to online_channels for backward compatibility (Legacy View)
                await db.execute(
                    `INSERT INTO online_channels (tenant_id, platform, shop_name, shop_id, status) 
                    VALUES (?, 'shopee', ?, ?, 'active') 
                    ON DUPLICATE KEY UPDATE status = 'active'`,
                    [tenantId, `Shopee Shop ${shop_id}`, shop_id]
                );

                // --- LEGACY SYNC-NODE COMPATIBILITY ---
                // Save to shopee_tokens (Plain text for legacy sync-node)
                const userId = req.session.user.id;
                const expiresAt = new Date(Date.now() + tokenData.expire_in * 1000);
                await db.execute(
                    `INSERT INTO shopee_tokens 
                    (user_id, shop_id, access_token, refresh_token, expires_at, status, updated_at) 
                    VALUES (?, ?, ?, ?, ?, 'active', NOW())
                    ON DUPLICATE KEY UPDATE 
                    access_token = VALUES(access_token), 
                    refresh_token = VALUES(refresh_token),
                    expires_at = VALUES(expires_at),
                    status = 'active',
                    updated_at = NOW()`,
                    [userId, shop_id, tokenData.access_token, tokenData.refresh_token, expiresAt]
                );

                // Ensure online_channel (singular) exists for sync-node
                await db.execute(
                    `INSERT INTO online_channel (user_id, name, status) 
                    VALUES (?, 'Shopee', 1) 
                    ON DUPLICATE KEY UPDATE status = 1`,
                    [userId]
                );
            }

            res.redirect('/channels?success=shopee');
        } catch (err) {
            console.error('Shopee Callback Error:', err);
            res.status(500).send(`Auth Error: ${err.message}`);
        }
    }

    async tiktokCallback(req, res) {
        const { code } = req.query;
        const tenantId = req.session.user.tenant_id || 1;
        try {
            // Exchange code for tokens
            const tokenData = await EcommerceAPI.getTikTokTokens(code);

            if (tokenData.data && tokenData.data.access_token) {
                const data = tokenData.data;
                const encryptedAccess = encrypt(data.access_token);
                const encryptedRefresh = encrypt(data.refresh_token);
                const shopId = data.seller_name || 'tiktok_shop';

                await db.execute(
                    `INSERT INTO marketplace_connections 
                    (tenant_id, platform, shop_id, shop_name, access_token, refresh_token, access_token_expires_at) 
                    VALUES (?, 'tiktok', ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL ? SECOND))
                    ON DUPLICATE KEY UPDATE 
                    access_token = VALUES(access_token), 
                    refresh_token = VALUES(refresh_token),
                    access_token_expires_at = VALUES(access_token_expires_at)`,
                    [tenantId, data.seller_base_id || shopId, shopId, encryptedAccess, encryptedRefresh, data.access_token_expire_in]
                );

                await db.execute(
                    `INSERT INTO online_channels (tenant_id, platform, shop_name, shop_id, status) 
                    VALUES (?, 'tiktok', ?, ?, 'active') 
                    ON DUPLICATE KEY UPDATE status = 'active'`,
                    [tenantId, shopId, data.seller_base_id || shopId]
                );
            }

            res.redirect('/channels?success=tiktok');
        } catch (err) {
            console.error('TikTok Callback Error:', err);
            res.status(500).send(`Auth Error: ${err.message}`);
        }
    }

    async lazadaCallback(req, res) {
        const { code } = req.query;
        const tenantId = req.session.user.tenant_id || 1;
        try {
            // Exchange code for tokens
            const tokenData = await EcommerceAPI.getLazadaTokens(code);

            if (tokenData.access_token) {
                const encryptedAccess = encrypt(tokenData.access_token);
                const encryptedRefresh = encrypt(tokenData.refresh_token);
                const shopId = tokenData.account || 'lazada_shop';

                await db.execute(
                    `INSERT INTO marketplace_connections 
                    (tenant_id, platform, shop_id, shop_name, access_token, refresh_token, access_token_expires_at) 
                    VALUES (?, 'lazada', ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL ? SECOND))
                    ON DUPLICATE KEY UPDATE 
                    access_token = VALUES(access_token), 
                    refresh_token = VALUES(refresh_token),
                    access_token_expires_at = VALUES(access_token_expires_at)`,
                    [tenantId, shopId, shopId, encryptedAccess, encryptedRefresh, tokenData.expires_in]
                );

                await db.execute(
                    `INSERT INTO online_channels (tenant_id, platform, shop_name, shop_id, status) 
                    VALUES (?, 'lazada', ?, ?, 'active') 
                    ON DUPLICATE KEY UPDATE status = 'active'`,
                    [tenantId, shopId, shopId]
                );
            }

            res.redirect('/channels?success=lazada');
        } catch (err) {
            console.error('Lazada Callback Error:', err);
            res.status(500).send(`Auth Error: ${err.message}`);
        }
    }

    async triggerSync(req, res) {
        const { platform } = req.params;
        const { exec } = require('child_process');
        const path = require('path');
        const { decrypt } = require('../utils/crypto');
        const userId = req.session.user.id;
        const tenantId = req.session.user.tenant_id;

        console.log(`Manual sync triggered for tenant ${tenantId}, platform: ${platform}`);

        try {
            // 1. Migrate data from marketplace_connections to legacy tables for sync-node compatibility
            const [connections] = await db.execute(
                'SELECT * FROM marketplace_connections WHERE tenant_id = ? AND is_active = 1',
                [tenantId]
            );

            for (const conn of connections) {
                const accessToken = decrypt(conn.access_token);
                const refreshToken = decrypt(conn.refresh_token);

                if (conn.platform === 'shopee') {
                    // Update shopee_tokens
                    await db.execute(
                        `INSERT INTO shopee_tokens 
                        (user_id, shop_id, access_token, refresh_token, expires_at, status, updated_at) 
                        VALUES (?, ?, ?, ?, ?, 'active', NOW())
                        ON DUPLICATE KEY UPDATE 
                        access_token = VALUES(access_token), 
                        refresh_token = VALUES(refresh_token),
                        expires_at = VALUES(expires_at),
                        status = 'active',
                        updated_at = NOW()`,
                        [userId, conn.shop_id, accessToken, refreshToken, conn.access_token_expires_at]
                    );

                    // Fetch the express_book_code from online_channels if any
                    const [platformChannels] = await db.execute(
                        'SELECT express_book_code FROM online_channels WHERE tenant_id = ? AND platform = "shopee" LIMIT 1',
                        [tenantId]
                    );
                    const bookCode = platformChannels[0] ? platformChannels[0].express_book_code : null;

                    // Update online_channel
                    await db.execute(
                        `INSERT INTO online_channel (user_id, name, status, express_book_code) 
                        VALUES (?, 'Shopee', 1, ?) 
                        ON DUPLICATE KEY UPDATE status = 1, express_book_code = VALUES(express_book_code)`,
                        [userId, bookCode]
                    );
                }
                // (Add migration for TikTok/Lazada if needed)
            }

            // 2. Run the sync node script
            const syncScriptPath = path.join(__dirname, '../../sync-node/src/index.js');
            const command = `node "${syncScriptPath}"`;

            exec(command, (error, stdout, stderr) => {
                if (error) {
                    console.error(`Sync Error: ${error.message}`);
                    return; // Background process, don't block response
                }
                console.log(`Sync Output: ${stdout}`);
            });

            res.json({ success: true, message: 'Sync process started' });

        } catch (err) {
            console.error('Migration/Sync Error:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    }
}

module.exports = new ChannelController();
