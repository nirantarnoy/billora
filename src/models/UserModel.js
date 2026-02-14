/**
 * User Model (Multi-tenant)
 * จัดการข้อมูลผู้ใช้งานในระบบ SaaS
 */

const pool = require('../config/db');
const bcrypt = require('bcryptjs');

class UserModel {
    /**
     * สร้างผู้ใช้ใหม่
     */
    static async create(tenantId, data) {
        const {
            username,
            email,
            password,
            first_name,
            last_name,
            phone,
            role = 'user',
            permissions = {}
        } = data;

        // Hash password
        const password_hash = await bcrypt.hash(password, 10);
        console.log(`[UserModel] Creating user: ${username} for tenantId: ${tenantId}`);

        try {
            const [result] = await pool.query(
                `INSERT INTO users (
                    tenant_id, username, email, password_hash,
                    first_name, last_name, phone, role, permissions
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    tenantId, username, email, password_hash,
                    first_name, last_name, phone, role,
                    JSON.stringify(permissions)
                ]
            );

            console.log(`[UserModel] User created successfully with ID: ${result.insertId}`);
            return result.insertId;
        } catch (error) {
            console.error('[UserModel] Error creating user:', error);
            throw error;
        }
    }

    /**
     * ค้นหาผู้ใช้ด้วย ID (ภายใน tenant เดียวกัน)
     */
    static async findById(tenantId, userId) {
        const [rows] = await pool.query(
            `SELECT id, tenant_id, username, email, first_name, last_name, 
                    phone, avatar_url, role, permissions, is_active, 
                    email_verified, last_login_at, created_at
             FROM users 
             WHERE id = ? AND tenant_id = ? AND deleted_at IS NULL`,
            [userId, tenantId]
        );
        return rows[0];
    }

    /**
     * ค้นหาผู้ใช้ด้วย Email (ภายใน tenant เดียวกัน)
     */
    static async findByEmail(tenantId, email) {
        const [rows] = await pool.query(
            `SELECT * FROM users 
             WHERE email = ? AND tenant_id = ? AND deleted_at IS NULL`,
            [email, tenantId]
        );
        return rows[0];
    }

    /**
     * ค้นหาผู้ใช้ด้วย Username (ภายใน tenant เดียวกัน)
     */
    static async findByUsername(tenantId, username) {
        const [rows] = await pool.query(
            `SELECT * FROM users 
             WHERE username = ? AND tenant_id = ? AND deleted_at IS NULL`,
            [username, tenantId]
        );
        return rows[0];
    }

    /**
     * ดึงรายการผู้ใช้ทั้งหมดใน Tenant
     */
    static async getAllByTenant(tenantId, filters = {}) {
        let query = `
            SELECT id, tenant_id, username, email, first_name, last_name,
                   phone, avatar_url, role, is_active, email_verified,
                   last_login_at, created_at
            FROM users 
            WHERE tenant_id = ? AND deleted_at IS NULL
        `;
        const params = [tenantId];

        if (filters.role) {
            query += ` AND role = ?`;
            params.push(filters.role);
        }

        if (filters.is_active !== undefined) {
            query += ` AND is_active = ?`;
            params.push(filters.is_active);
        }

        if (filters.search) {
            query += ` AND (username LIKE ? OR email LIKE ? OR first_name LIKE ? OR last_name LIKE ?)`;
            const searchTerm = `%${filters.search}%`;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }

        query += ` ORDER BY created_at DESC`;

        if (filters.limit) {
            query += ` LIMIT ?`;
            params.push(parseInt(filters.limit));
        }

        const [rows] = await pool.query(query, params);
        return rows;
    }

    /**
     * ตรวจสอบรหัสผ่าน
     */
    static async verifyPassword(password, password_hash) {
        return await bcrypt.compare(password, password_hash);
    }

    /**
     * Login
     */
    static async login(tenantId, emailOrUsername, password) {
        // ค้นหาผู้ใช้
        const [users] = await pool.query(
            `SELECT * FROM users 
             WHERE tenant_id = ? AND (email = ? OR username = ?) 
             AND deleted_at IS NULL`,
            [tenantId, emailOrUsername, emailOrUsername]
        );

        if (users.length === 0) {
            return { success: false, message: 'ไม่พบผู้ใช้งาน' };
        }

        const user = users[0];

        // ตรวจสอบว่าบัญชีถูกล็อกหรือไม่
        if (user.locked_until && new Date(user.locked_until) > new Date()) {
            return {
                success: false,
                message: 'บัญชีของคุณถูกล็อก กรุณาลองใหม่ภายหลัง',
                locked_until: user.locked_until
            };
        }

        // ตรวจสอบว่าบัญชีถูกระงับหรือไม่
        if (!user.is_active) {
            return { success: false, message: 'บัญชีของคุณถูกระงับการใช้งาน' };
        }

        // ตรวจสอบรหัสผ่าน
        const isValid = await this.verifyPassword(password, user.password_hash);

        if (!isValid) {
            // เพิ่มจำนวนครั้งที่ล็อกอินผิด
            const failedAttempts = user.failed_login_attempts + 1;
            let locked_until = null;

            // ล็อกบัญชีถ้าผิดเกิน 5 ครั้ง
            if (failedAttempts >= 5) {
                locked_until = new Date(Date.now() + 30 * 60 * 1000); // ล็อก 30 นาที
            }

            await pool.query(
                `UPDATE users SET 
                    failed_login_attempts = ?,
                    locked_until = ?
                 WHERE id = ?`,
                [failedAttempts, locked_until, user.id]
            );

            return {
                success: false,
                message: 'รหัสผ่านไม่ถูกต้อง',
                attempts_left: Math.max(0, 5 - failedAttempts)
            };
        }

        // Login สำเร็จ - รีเซ็ตค่า
        await pool.query(
            `UPDATE users SET 
                failed_login_attempts = 0,
                locked_until = NULL,
                last_login_at = NOW(),
                last_login_ip = ?
             WHERE id = ?`,
            [null, user.id] // TODO: เพิ่ม IP address
        );

        // ลบ password_hash ก่อน return
        delete user.password_hash;

        return { success: true, user };
    }

    /**
     * อัพเดทข้อมูลผู้ใช้
     */
    static async update(tenantId, userId, data) {
        const allowedFields = [
            'username', 'email', 'first_name', 'last_name', 'phone', 'avatar_url', 'permissions', 'password'
        ];

        const updates = [];
        const params = [];

        for (const field of allowedFields) {
            if (data[field] !== undefined && data[field] !== '') {
                if (field === 'permissions') {
                    updates.push(`${field} = ?`);
                    params.push(JSON.stringify(data[field]));
                } else if (field === 'password') {
                    const password_hash = await bcrypt.hash(data[field], 10);
                    updates.push(`password_hash = ?`);
                    params.push(password_hash);
                } else {
                    updates.push(`${field} = ?`);
                    params.push(data[field]);
                }
            }
        }

        if (updates.length === 0) return false;

        params.push(userId, tenantId);
        const query = `UPDATE users SET ${updates.join(', ')}, updated_at = NOW() 
                       WHERE id = ? AND tenant_id = ?`;

        const [result] = await pool.query(query, params);
        return result.affectedRows > 0;
    }

    /**
     * เปลี่ยนรหัสผ่าน
     */
    static async changePassword(tenantId, userId, oldPassword, newPassword) {
        const user = await this.findById(tenantId, userId);
        if (!user) return { success: false, message: 'ไม่พบผู้ใช้งาน' };

        // ตรวจสอบรหัสผ่านเดิม
        const [fullUser] = await pool.query(
            `SELECT password_hash FROM users WHERE id = ? AND tenant_id = ?`,
            [userId, tenantId]
        );

        const isValid = await this.verifyPassword(oldPassword, fullUser[0].password_hash);
        if (!isValid) {
            return { success: false, message: 'รหัสผ่านเดิมไม่ถูกต้อง' };
        }

        // เปลี่ยนรหัสผ่าน
        const password_hash = await bcrypt.hash(newPassword, 10);
        await pool.query(
            `UPDATE users SET password_hash = ?, updated_at = NOW() 
             WHERE id = ? AND tenant_id = ?`,
            [password_hash, userId, tenantId]
        );

        return { success: true, message: 'เปลี่ยนรหัสผ่านสำเร็จ' };
    }

    /**
     * อัพเดท Role
     */
    static async updateRole(tenantId, userId, role) {
        const [result] = await pool.query(
            `UPDATE users SET role = ?, updated_at = NOW() 
             WHERE id = ? AND tenant_id = ?`,
            [role, userId, tenantId]
        );

        return result.affectedRows > 0;
    }

    /**
     * ระงับ/เปิดใช้งานผู้ใช้
     */
    static async toggleActive(tenantId, userId, isActive) {
        const [result] = await pool.query(
            `UPDATE users SET is_active = ?, updated_at = NOW() 
             WHERE id = ? AND tenant_id = ?`,
            [isActive, userId, tenantId]
        );

        return result.affectedRows > 0;
    }

    /**
     * ลบผู้ใช้ (Soft Delete)
     */
    static async delete(tenantId, userId) {
        const [result] = await pool.query(
            `UPDATE users SET deleted_at = NOW() 
             WHERE id = ? AND tenant_id = ?`,
            [userId, tenantId]
        );

        return result.affectedRows > 0;
    }

    /**
     * นับจำนวนผู้ใช้ใน Tenant
     */
    static async countByTenant(tenantId) {
        const [rows] = await pool.query(
            `SELECT COUNT(*) as count FROM users 
             WHERE tenant_id = ? AND deleted_at IS NULL`,
            [tenantId]
        );
        return rows[0].count;
    }
}

module.exports = UserModel;
