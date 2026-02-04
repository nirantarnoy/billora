/**
 * Tenant Model
 * จัดการข้อมูลองค์กร/บริษัท
 */

const pool = require('../config/db');

class TenantModel {
    /**
     * สร้าง Tenant ใหม่
     */
    static async create(data) {
        const {
            tenant_code,
            company_name,
            company_name_en,
            tax_id,
            address,
            phone,
            email,
            subscription_plan = 'free',
            max_users = 5,
            max_storage_mb = 1024,
            max_transactions_per_month = 1000
        } = data;

        const [result] = await pool.query(
            `INSERT INTO tenants (
                tenant_code, company_name, company_name_en, tax_id, 
                address, phone, email, subscription_plan,
                subscription_status, subscription_start_date,
                max_users, max_storage_mb, max_transactions_per_month
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', NOW(), ?, ?, ?)`,
            [
                tenant_code, company_name, company_name_en, tax_id,
                address, phone, email, subscription_plan,
                max_users, max_storage_mb, max_transactions_per_month
            ]
        );

        return result.insertId;
    }

    /**
     * ค้นหา Tenant ด้วย ID
     */
    static async findById(id) {
        const [rows] = await pool.query(
            `SELECT * FROM tenants WHERE id = ? AND deleted_at IS NULL`,
            [id]
        );
        return rows[0];
    }

    /**
     * ค้นหา Tenant ด้วย tenant_code
     */
    static async findByCode(tenant_code) {
        const [rows] = await pool.query(
            `SELECT * FROM tenants WHERE tenant_code = ? AND deleted_at IS NULL`,
            [tenant_code]
        );
        return rows[0];
    }

    /**
     * ดึงรายการ Tenants ทั้งหมด (สำหรับ Super Admin)
     */
    static async getAll(filters = {}) {
        let query = `SELECT * FROM tenants WHERE deleted_at IS NULL`;
        const params = [];

        if (filters.subscription_status) {
            query += ` AND subscription_status = ?`;
            params.push(filters.subscription_status);
        }

        if (filters.subscription_plan) {
            query += ` AND subscription_plan = ?`;
            params.push(filters.subscription_plan);
        }

        if (filters.is_active !== undefined) {
            query += ` AND is_active = ?`;
            params.push(filters.is_active);
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
     * อัพเดทข้อมูล Tenant
     */
    static async update(id, data) {
        const allowedFields = [
            'company_name', 'company_name_en', 'tax_id', 'address',
            'phone', 'email', 'logo_url', 'settings', 'features'
        ];

        const updates = [];
        const params = [];

        for (const field of allowedFields) {
            if (data[field] !== undefined) {
                updates.push(`${field} = ?`);
                params.push(data[field]);
            }
        }

        if (updates.length === 0) return false;

        params.push(id);
        const query = `UPDATE tenants SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`;

        const [result] = await pool.query(query, params);
        return result.affectedRows > 0;
    }

    /**
     * อัพเดท Subscription
     */
    static async updateSubscription(id, subscriptionData) {
        const {
            subscription_plan,
            subscription_status,
            subscription_end_date,
            max_users,
            max_storage_mb,
            max_transactions_per_month,
            features
        } = subscriptionData;

        const [result] = await pool.query(
            `UPDATE tenants SET 
                subscription_plan = ?,
                subscription_status = ?,
                subscription_end_date = ?,
                max_users = ?,
                max_storage_mb = ?,
                max_transactions_per_month = ?,
                features = ?,
                updated_at = NOW()
             WHERE id = ?`,
            [
                subscription_plan,
                subscription_status,
                subscription_end_date,
                max_users,
                max_storage_mb,
                max_transactions_per_month,
                JSON.stringify(features),
                id
            ]
        );

        return result.affectedRows > 0;
    }

    /**
     * ระงับการใช้งาน Tenant
     */
    static async suspend(id, reason = null) {
        const [result] = await pool.query(
            `UPDATE tenants SET 
                subscription_status = 'suspended',
                is_active = FALSE,
                settings = JSON_SET(COALESCE(settings, '{}'), '$.suspend_reason', ?),
                updated_at = NOW()
             WHERE id = ?`,
            [reason, id]
        );

        return result.affectedRows > 0;
    }

    /**
     * เปิดใช้งาน Tenant อีกครั้ง
     */
    static async activate(id) {
        const [result] = await pool.query(
            `UPDATE tenants SET 
                subscription_status = 'active',
                is_active = TRUE,
                updated_at = NOW()
             WHERE id = ?`,
            [id]
        );

        return result.affectedRows > 0;
    }

    /**
     * ลบ Tenant (Soft Delete)
     */
    static async delete(id) {
        const [result] = await pool.query(
            `UPDATE tenants SET deleted_at = NOW() WHERE id = ?`,
            [id]
        );

        return result.affectedRows > 0;
    }

    /**
     * ตรวจสอบ Quota
     */
    static async checkQuota(tenantId, quotaType) {
        const tenant = await this.findById(tenantId);
        if (!tenant) return { allowed: false, message: 'Tenant not found' };

        switch (quotaType) {
            case 'users':
                const [userCount] = await pool.query(
                    `SELECT COUNT(*) as count FROM users WHERE tenant_id = ? AND deleted_at IS NULL`,
                    [tenantId]
                );
                return {
                    allowed: userCount[0].count < tenant.max_users,
                    current: userCount[0].count,
                    limit: tenant.max_users
                };

            case 'transactions':
                const [transCount] = await pool.query(
                    `SELECT COUNT(*) as count FROM bills 
                     WHERE tenant_id = ? 
                     AND YEAR(created_at) = YEAR(CURRENT_DATE()) 
                     AND MONTH(created_at) = MONTH(CURRENT_DATE())`,
                    [tenantId]
                );
                return {
                    allowed: transCount[0].count < tenant.max_transactions_per_month,
                    current: transCount[0].count,
                    limit: tenant.max_transactions_per_month
                };

            default:
                return { allowed: true };
        }
    }

    /**
     * สร้าง tenant_code อัตโนมัติ
     */
    static async generateTenantCode(companyName) {
        // สร้างจากชื่อบริษัท + timestamp
        const prefix = companyName
            .replace(/[^a-zA-Z0-9]/g, '')
            .substring(0, 6)
            .toUpperCase();

        const timestamp = Date.now().toString().slice(-6);
        const code = `${prefix}${timestamp}`;

        // ตรวจสอบว่าซ้ำหรือไม่
        const existing = await this.findByCode(code);
        if (existing) {
            // ถ้าซ้ำ ให้เพิ่ม random number
            return `${code}${Math.floor(Math.random() * 100)}`;
        }

        return code;
    }
}

module.exports = TenantModel;
