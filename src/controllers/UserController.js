const db = require('../config/db');
const bcrypt = require('bcryptjs');

class UserController {
    async listUsers(req, res) {
        try {
            const companyId = req.session.user.company_id || 1;
            const [users] = await db.execute('SELECT * FROM users WHERE company_id = ?', [companyId]);
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
            const companyId = req.session.user.company_id || 1;
            const hashedPassword = await bcrypt.hash(password, 10);

            await db.execute(
                'INSERT INTO users (username, password, role, company_id, permissions) VALUES (?, ?, ?, ?, ?)',
                [username, hashedPassword, role, companyId, JSON.stringify(permissions)]
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
}

module.exports = new UserController();
