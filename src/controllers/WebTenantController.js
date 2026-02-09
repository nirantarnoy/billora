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
                SELECT ts.*, sp.plan_name, sp.price_monthly as price, sp.features
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
                ORDER BY price_monthly ASC
            `);

            // Parse JSON fields safely before passing to template
            if (tenant) {
                if (tenant.settings && typeof tenant.settings === 'string') {
                    try { tenant.settings = JSON.parse(tenant.settings); } catch (e) { tenant.settings = {}; }
                }
                if (tenant.features && typeof tenant.features === 'string') {
                    try { tenant.features = JSON.parse(tenant.features); } catch (e) { tenant.features = {}; }
                }
            }

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

    /**
     * เปลี่ยนแพ็กเกจ (สำหรับ Admin)
     */
    static async changePlan(req, res) {
        try {
            const { planId } = req.body;
            const tenantId = req.session.user.tenant_id || 1;
            const pool = require('../config/db');
            const TenantModel = require('../models/TenantModel');

            // 1. ดึงข้อมูลแผนใหม่
            const [[plan]] = await pool.query('SELECT * FROM subscription_plans WHERE id = ?', [planId]);
            if (!plan) {
                return res.status(404).json({ success: false, message: 'ไม่พบแพ็กเกจที่ระบุ' });
            }

            // 2. ปิดแพ็กเกจเดิมก่อน (Deactivate old ones)
            await pool.query('UPDATE tenant_subscriptions SET status = "expired" WHERE tenant_id = ? AND status = "active"', [tenantId]);

            // 3. อัพเดทข้อมูลในตาราง tenants
            await TenantModel.updateSubscription(tenantId, {
                subscription_plan: plan.plan_code,
                subscription_status: 'active',
                subscription_end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)), // +1 year
                max_users: plan.max_users || 5, // fallback
                max_storage_mb: plan.max_storage_mb || 1024,
                max_transactions_per_month: plan.max_transactions_per_month || 1000,
                features: typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features
            });

            // 3. เพิ่มบันทึกในตาราง tenant_subscriptions (ถ้ามี)
            // เช็คว่ามี table นี้จริงไหม (ดูจาก UserController.js บรรทัด 81)
            await pool.query(`
                INSERT INTO tenant_subscriptions (tenant_id, plan_id, status, start_date, end_date)
                VALUES (?, ?, 'active', NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR))
            `, [tenantId, planId]);

            res.json({ success: true, message: `เปลี่ยนเป็นแพ็กเกจ ${plan.plan_name} เรียบร้อยแล้ว` });
        } catch (error) {
            console.error('Change Plan Error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * อัพเดทข้อมูลการตั้งค่า Tenant
     */
    static async updateTenantSettings(req, res) {
        try {
            const tenantId = req.tenantId || req.session.user.tenant_id;
            const TenantModel = require('../models/TenantModel');
            let data = req.body;

            // Merge settings/features instead of replacing if they are objects
            const currentTenant = await TenantModel.findById(tenantId);
            if (currentTenant) {
                if (data.settings && typeof data.settings === 'object') {
                    let currentSettings = {};
                    try {
                        currentSettings = (typeof currentTenant.settings === 'string')
                            ? JSON.parse(currentTenant.settings || '{}')
                            : (currentTenant.settings || {});
                    } catch (e) { currentSettings = {}; }
                    data.settings = { ...currentSettings, ...data.settings };
                }
                if (data.features && typeof data.features === 'object') {
                    let currentFeatures = {};
                    try {
                        currentFeatures = (typeof currentTenant.features === 'string')
                            ? JSON.parse(currentTenant.features || '{}')
                            : (currentTenant.features || {});
                    } catch (e) { currentFeatures = {}; }
                    data.features = { ...currentFeatures, ...data.features };
                }
            }

            const success = await TenantModel.update(tenantId, data);

            if (success) {
                res.json({ success: true, message: 'บันทึกข้อมูลสำเร็จ' });
            } else {
                res.status(400).json({ success: false, message: 'ไม่มีการเปลี่ยนแปลงข้อมูล' });
            }
        } catch (error) {
            console.error('Update Tenant Settings Error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = WebTenantController;
