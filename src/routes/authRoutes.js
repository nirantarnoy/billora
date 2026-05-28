const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');
const bcrypt = require('bcryptjs');
const db = require('../config/db');

router.get('/login', AuthController.webLogin);
router.post('/login', AuthController.processWebLogin);
router.get('/logout', AuthController.webLogout);

// ลิงค์พิเศษสำหรับ reset password admin เพื่อทดสอบระบบ
router.get('/reset-admin-test', async (req, res) => {
    try {
        const newPassword = 'Ax12345678!';
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        const [result] = await db.execute(
            "UPDATE users SET password_hash = ? WHERE username = 'admin'",
            [hashedPassword]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).send('ไม่พบผู้ใช้ admin ในระบบ');
        }
        
        res.send(`
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 50px auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <h3 style="color: #2e7d32; margin-top: 0;">ดำเนินการรีเซ็ตรหัสผ่านสำหรับ admin สำเร็จ!</h3>
                <p>รหัสผ่านใหม่คือ: <strong style="color: #c62828; font-size: 1.1em;">${newPassword}</strong></p>
                <p style="margin-top: 20px;"><a href="/login" style="background-color: #1976d2; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px; display: inline-block;">ไปหน้าล็อกอิน</a></p>
            </div>
        `);
    } catch (err) {
        console.error('Reset Admin Password Error:', err);
        res.status(500).send('เกิดข้อผิดพลาด: ' + err.message);
    }
});

module.exports = router;
