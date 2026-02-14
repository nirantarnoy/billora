const TenantModel = require('../models/TenantModel');
const pool = require('../config/db');

class AdminTenantController {
    /**
     * แสดงรายการ Tenants ทั้งหมด
     */
    static async listTenants(req, res) {
        try {
            const tenants = await TenantModel.getAll();

            // ดึงข้อมูลแผนทั้งหมดเพื่อใช้ใน Modal เปลี่ยนแผน
            const [plans] = await pool.query('SELECT * FROM subscription_plans WHERE is_active = TRUE ORDER BY price_monthly ASC');

            res.render('tenants', {
                title: 'จัดการ Tenant',
                active: 'admin-tenants',
                tenants,
                plans,
                user: req.session.user
            });
        } catch (error) {
            console.error('Error listing tenants:', error);
            res.status(500).send('Internal Server Error');
        }
    }

    /**
     * อัพเดทสถานะการใช้งาน (Active/Inactive)
     */
    static async apiUpdateStatus(req, res) {
        try {
            const { id } = req.params;
            const { is_active } = req.body;

            const [result] = await pool.query(
                'UPDATE tenants SET is_active = ?, updated_at = NOW() WHERE id = ?',
                [is_active === true || is_active === 'true' ? 1 : 0, id]
            );

            if (result.affectedRows > 0) {
                res.json({ success: true, message: 'อัพเดทสถานะเรียบร้อยแล้ว' });
            } else {
                res.status(404).json({ success: false, message: 'ไม่พบข้อมูล Tenant' });
            }
        } catch (error) {
            console.error('Update status error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * เปลี่ยนแพ็กเกจ Tenant
     */
    static async apiChangePlan(req, res) {
        try {
            const { id } = req.params;
            const { planId, status, endDate } = req.body;

            // 1. ดึงข้อมูลแผนใหม่
            const [[plan]] = await pool.query('SELECT * FROM subscription_plans WHERE id = ?', [planId]);
            if (!plan) {
                return res.status(404).json({ success: false, message: 'ไม่พบแพ็กเกจที่ระบุ' });
            }

            // 2. ปิดแพ็กเกจเดิมก่อน (Deactivate old ones)
            await pool.query('UPDATE tenant_subscriptions SET status = "expired" WHERE tenant_id = ? AND status = "active"', [id]);

            // 3. คำนวณวันหมดอายุ (ถ้าไม่ได้ระบุมาให้บวก 1 ปี)
            const finalEndDate = endDate ? new Date(endDate) : new Date(new Date().setFullYear(new Date().getFullYear() + 1));

            // 4. อัพเดทข้อมูลในตาราง tenants
            await TenantModel.updateSubscription(id, {
                subscription_plan: plan.plan_code,
                subscription_status: status || 'active',
                subscription_end_date: finalEndDate,
                max_users: plan.max_users,
                max_storage_mb: plan.max_storage_mb,
                max_transactions_per_month: plan.max_transactions_per_month,
                features: typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features
            });

            // 5. เพิ่มบันทึกในตาราง tenant_subscriptions
            await pool.query(`
                INSERT INTO tenant_subscriptions (tenant_id, plan_id, status, start_date, end_date, amount, currency)
                VALUES (?, ?, ?, NOW(), ?, ?, ?)
            `, [id, planId, status || 'active', finalEndDate, plan.price_monthly, plan.currency || 'THB']);

            res.json({ success: true, message: `เปลี่ยนเป็นแพ็กเกจ ${plan.plan_name} เรียบร้อยแล้ว` });
        } catch (error) {
            console.error('Change plan error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * อนุมัติ Tenant (Approval)
     */
    static async apiApproveTenant(req, res) {
        try {
            const { id } = req.params;
            const success = await TenantModel.approve(id);
            if (success) {
                res.json({ success: true, message: 'อนุมัติ Tenant เรียบร้อยแล้ว' });
            } else {
                res.status(404).json({ success: false, message: 'ไม่พบข้อมูล Tenant' });
            }
        } catch (error) {
            console.error('Approve tenant error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * ลบ Tenant (Soft Delete)
     */
    static async apiDeleteTenant(req, res) {
        try {
            const { id } = req.params;
            const success = await TenantModel.delete(id);
            if (success) {
                res.json({ success: true, message: 'ลบ Tenant เรียบร้อยแล้ว' });
            } else {
                res.status(404).json({ success: false, message: 'ไม่พบข้อมูล Tenant' });
            }
        } catch (error) {
            console.error('Delete tenant error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = AdminTenantController;
