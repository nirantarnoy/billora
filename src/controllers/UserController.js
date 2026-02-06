const db = require('../config/db');
const bcrypt = require('bcryptjs');

class UserController {
    async listUsers(req, res) {
        try {
            const tenantId = req.session.user.tenant_id || 1;
            const [users] = await db.execute('SELECT * FROM users WHERE tenant_id = ?', [tenantId]);
            res.render('users', {
                users,
                active: 'users',
                title: 'จัดการผู้ใช้งาน'
            });
        } catch (err) {
            res.status(500).send(err.message);
        }
    }

    async createUser(req, res) {
        try {
            const { username, password, role, permissions } = req.body;
            const tenantId = req.session.user.tenant_id || 1;
            const hashedPassword = await bcrypt.hash(password, 10);

            await db.execute(
                'INSERT INTO users (username, password_hash, role, tenant_id, permissions) VALUES (?, ?, ?, ?, ?)',
                [username, hashedPassword, role, tenantId, JSON.stringify(permissions)]
            );
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }

    async updateUser(req, res) {
        try {
            const { id } = req.params;
            const { username, password, role, permissions } = req.body;

            let query = 'UPDATE users SET username = ?, role = ?, permissions = ?';
            const params = [username, role, JSON.stringify(permissions)];

            if (password) {
                const hashedPassword = await bcrypt.hash(password, 10);
                query += ', password = ?';
                params.push(hashedPassword);
            }

            query += ' WHERE id = ?';
            params.push(id);

            await db.execute(query, params);
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }

    async deleteUser(req, res) {
        try {
            const { id } = req.params;
            await db.execute('DELETE FROM users WHERE id = ?', [id]);
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }

    async showProfile(req, res) {
        try {
            const userId = req.session.user.id;
            const tenantId = req.session.user.tenant_id || 1;

            // Get User full info
            const [[user]] = await db.execute('SELECT * FROM users WHERE id = ?', [userId]);

            // Get Tenant info
            const [[tenant]] = await db.execute('SELECT * FROM tenants WHERE id = ?', [tenantId]);

            // Get Current Subscription
            const [subscriptions] = await db.execute(`
                SELECT ts.*, sp.plan_name, sp.plan_code, sp.features, sp.price_monthly
                FROM tenant_subscriptions ts
                JOIN subscription_plans sp ON ts.plan_id = sp.id
                WHERE ts.tenant_id = ? AND ts.status = 'active'
                ORDER BY ts.created_at DESC
                LIMIT 1
            `, [tenantId]);

            const subscription = subscriptions[0] || null;

            // Fetch all active plans so users can view/upgrade
            const [plans] = await db.execute('SELECT * FROM subscription_plans WHERE is_active = 1 ORDER BY price_monthly ASC');

            res.render('profile', {
                user,
                tenant,
                subscription,
                plans,
                active: 'profile',
                title: 'โปรไฟล์ของฉัน',
                _csrf: req.csrfToken ? req.csrfToken() : ''
            });
        } catch (err) {
            console.error('showProfile Error:', err);
            res.status(500).send(err.message);
        }
    }
}

module.exports = new UserController();
