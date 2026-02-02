const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { recordAction } = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'billora-jwt-secret-key-2026';

class AuthController {
    // Web Login
    async webLogin(req, res) {
        if (req.session.user) return res.redirect('/dashboard');
        res.render('login', { error: null, layout: false, _csrf: req.csrfToken ? req.csrfToken() : '' });
    }

    async processWebLogin(req, res) {
        const { username, password } = req.body;
        try {
            const [users] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);
            if (users.length > 0) {
                const user = users[0];
                const match = await bcrypt.compare(password, user.password);
                if (match) {
                    req.session.user = {
                        id: user.id,
                        username: user.username,
                        role: user.role,
                        company_id: user.company_id || 1,
                        permissions: typeof user.permissions === 'string' ? JSON.parse(user.permissions) : user.permissions
                    };
                    await recordAction(user.id, 'Login', 'เข้าสู่ระบบผ่าน Web Browser', req);
                    return res.redirect('/dashboard');
                }
            }
            res.render('login', { error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง', layout: false, _csrf: req.csrfToken ? req.csrfToken() : '' });
        } catch (err) {
            res.status(500).send(err.message);
        }
    }

    async webLogout(req, res) {
        req.session.destroy();
        res.redirect('/login');
    }

    // API Login (Flutter)
    async apiLogin(req, res) {
        const { username, password } = req.body;
        try {
            const [users] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);
            if (users.length > 0) {
                const user = users[0];
                const match = await bcrypt.compare(password, user.password);
                if (match) {
                    const permissions = typeof user.permissions === 'string' ? JSON.parse(user.permissions) : user.permissions;
                    const payload = {
                        id: user.id,
                        username: user.username,
                        role: user.role,
                        company_id: user.company_id || 1,
                        permissions: permissions
                    };
                    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
                    return res.json({
                        success: true,
                        token,
                        user: { id: user.id, username: user.username, role: user.role, permissions }
                    });
                }
            }
            res.status(401).json({ success: false, message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }
}

module.exports = new AuthController();
