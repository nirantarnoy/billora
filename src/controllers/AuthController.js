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
            // รองรับ login ด้วย username หรือ email
            const [users] = await db.execute(
                'SELECT * FROM users WHERE username = ? OR email = ? LIMIT 1',
                [username, username]
            );

            if (users.length > 0) {
                const user = users[0];

                // ใช้ password_hash แทน password
                const passwordField = user.password_hash || user.password;

                if (!passwordField) {
                    return res.render('login', {
                        error: 'ข้อมูลผู้ใช้ไม่ถูกต้อง กรุณาติดต่อผู้ดูแลระบบ',
                        layout: false,
                        _csrf: req.csrfToken ? req.csrfToken() : ''
                    });
                }

                const match = await bcrypt.compare(password, passwordField);

                if (match) {
                    req.session.user = {
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        role: user.role,
                        tenant_id: user.tenant_id,
                        company_id: user.company_id || user.tenant_id || 1,
                        permissions: typeof user.permissions === 'string' ? JSON.parse(user.permissions) : user.permissions
                    };
                    await recordAction(user.id, 'Login', 'เข้าสู่ระบบผ่าน Web Browser', req);
                    return res.redirect('/dashboard');
                }
            }
            res.render('login', { error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง', layout: false, _csrf: req.csrfToken ? req.csrfToken() : '' });
        } catch (err) {
            console.error('Login Error:', err);
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
            // รองรับ login ด้วย username หรือ email
            const [users] = await db.execute(
                'SELECT * FROM users WHERE username = ? OR email = ? LIMIT 1',
                [username, username]
            );

            if (users.length > 0) {
                const user = users[0];

                // ใช้ password_hash แทน password
                const passwordField = user.password_hash || user.password;

                if (!passwordField) {
                    return res.status(401).json({
                        success: false,
                        message: 'ข้อมูลผู้ใช้ไม่ถูกต้อง'
                    });
                }

                const match = await bcrypt.compare(password, passwordField);

                if (match) {
                    const permissions = typeof user.permissions === 'string' ? JSON.parse(user.permissions) : user.permissions;
                    const payload = {
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        role: user.role,
                        tenant_id: user.tenant_id,
                        company_id: user.company_id || user.tenant_id || 1,
                        permissions: permissions
                    };
                    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
                    return res.json({
                        success: true,
                        token,
                        user: { id: user.id, username: user.username, email: user.email, role: user.role, permissions }
                    });
                }
            }
            res.status(401).json({ success: false, message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }

    // Change Password
    async changePassword(req, res) {
        const { currentPassword, newPassword } = req.body;
        const userId = req.session.user?.id || req.user?.id;

        try {
            // Validate input
            if (!currentPassword || !newPassword) {
                return res.status(400).json({ success: false, message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
            }

            if (newPassword.length < 6) {
                return res.status(400).json({ success: false, message: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร' });
            }

            // Get user
            const [users] = await db.execute('SELECT * FROM users WHERE id = ?', [userId]);
            if (users.length === 0) {
                return res.status(404).json({ success: false, message: 'ไม่พบผู้ใช้' });
            }

            const user = users[0];

            // Verify current password
            const passwordField = user.password_hash || user.password;

            if (!passwordField) {
                return res.status(400).json({ success: false, message: 'ข้อมูลผู้ใช้ไม่ถูกต้อง' });
            }

            const match = await bcrypt.compare(currentPassword, passwordField);
            if (!match) {
                return res.status(401).json({ success: false, message: 'รหัสผ่านเดิมไม่ถูกต้อง' });
            }

            // Hash new password
            const hashedPassword = await bcrypt.hash(newPassword, 10);

            // Update password (รองรับทั้ง password_hash และ password)
            await db.execute(
                'UPDATE users SET password_hash = ?, password = ? WHERE id = ?',
                [hashedPassword, hashedPassword, userId]
            );

            // Log action
            await recordAction(userId, 'Change Password', 'เปลี่ยนรหัสผ่านสำเร็จ', req);

            res.json({ success: true, message: 'เปลี่ยนรหัสผ่านสำเร็จ' });
        } catch (err) {
            console.error('Change Password Error:', err);
            res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน' });
        }
    }
}

module.exports = new AuthController();
