/**
 * Web Controller สำหรับหน้า Register และ User Management
 */

class WebTenantController {
    /**
     * แสดงหน้า Register
     */
    static async showRegisterPage(req, res) {
        try {
            res.render('register', {
                layout: false, // ไม่ใช้ layout (standalone page)
                title: 'ลงทะเบียนองค์กร',
                error: null
            });
        } catch (error) {
            console.error('Error showing register page:', error);
            res.status(500).send('Internal Server Error');
        }
    }

    /**
     * แสดงหน้า User Management (สำหรับแต่ละ Tenant)
     */
    static async showUserManagementPage(req, res) {
        try {
            const tenantId = req.tenantId; // จาก loadTenant middleware
            const UserModel = require('../models/UserModel');

            // ดึงรายการผู้ใช้ทั้งหมดใน tenant นี้
            const users = await UserModel.getAllByTenant(tenantId);

            res.render('tenant-users', {
                title: 'จัดการผู้ใช้',
                users: users,
                tenant: req.tenant,
                user: req.user || req.session.user
            });
        } catch (error) {
            console.error('Error showing user management page:', error);
            res.status(500).send('Internal Server Error');
        }
    }

    /**
     * แสดงหน้า Tenant Settings
     */
    static async showTenantSettings(req, res) {
        try {
            const tenantId = req.tenantId;
            const TenantModel = require('../models/TenantModel');

            // ดึงข้อมูล tenant
            const tenant = await TenantModel.findById(tenantId);

            // ดึงข้อมูล subscription
            const pool = require('../config/db');
            const [subscriptions] = await pool.query(`
                SELECT ts.*, sp.name as plan_name, sp.price, sp.features
                FROM tenant_subscriptions ts
                LEFT JOIN subscription_plans sp ON ts.plan_id = sp.id
                WHERE ts.tenant_id = ?
                ORDER BY ts.created_at DESC
                LIMIT 1
            `, [tenantId]);

            const currentSubscription = subscriptions[0] || null;

            // ดึงแพ็กเกจทั้งหมด
            const [plans] = await pool.query(`
                SELECT * FROM subscription_plans
                WHERE is_active = TRUE
                ORDER BY price ASC
            `);

            res.render('tenant-settings', {
                title: 'ตั้งค่าองค์กร',
                tenant: tenant,
                subscription: currentSubscription,
                plans: plans,
                user: req.user || req.session.user
            });
        } catch (error) {
            console.error('Error showing tenant settings:', error);
            res.status(500).send('Internal Server Error');
        }
    }
}

module.exports = WebTenantController;
