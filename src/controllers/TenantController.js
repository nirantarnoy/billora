/**
 * Tenant Controller
 * จัดการ Tenant (องค์กร/บริษัท)
 */

const TenantModel = require('../models/TenantModel');
const UserModel = require('../models/UserModel');

class TenantController {
    /**
     * แสดงข้อมูล Tenant ปัจจุบัน
     */
    static async getCurrent(req, res) {
        try {
            const tenant = req.tenant;

            // ดึงสถิติเพิ่มเติม
            const userCount = await UserModel.countByTenant(tenant.id);
            const quota = {
                users: await TenantModel.checkQuota(tenant.id, 'users'),
                transactions: await TenantModel.checkQuota(tenant.id, 'transactions')
            };

            res.json({
                success: true,
                data: {
                    ...tenant,
                    stats: {
                        user_count: userCount
                    },
                    quota
                }
            });
        } catch (error) {
            console.error('Get Current Tenant Error:', error);
            res.status(500).json({
                success: false,
                message: 'เกิดข้อผิดพลาดในการดึงข้อมูลองค์กร'
            });
        }
    }

    /**
     * อัพเดทข้อมูล Tenant
     */
    static async update(req, res) {
        try {
            const tenantId = req.tenantId;
            const user = req.session.user;

            // เฉพาะ owner หรือ admin เท่านั้นที่แก้ไขได้
            if (!['owner', 'admin'].includes(user.role)) {
                return res.status(403).json({
                    success: false,
                    message: 'คุณไม่มีสิทธิ์แก้ไขข้อมูลองค์กร'
                });
            }

            const updated = await TenantModel.update(tenantId, req.body);

            if (!updated) {
                return res.status(400).json({
                    success: false,
                    message: 'ไม่สามารถอัพเดทข้อมูลได้'
                });
            }

            res.json({
                success: true,
                message: 'อัพเดทข้อมูลองค์กรสำเร็จ'
            });
        } catch (error) {
            console.error('Update Tenant Error:', error);
            res.status(500).json({
                success: false,
                message: 'เกิดข้อผิดพลาดในการอัพเดทข้อมูล'
            });
        }
    }

    /**
     * ดูข้อมูล Subscription
     */
    static async getSubscription(req, res) {
        try {
            const tenant = req.tenant;

            // คำนวณจำนวนวันที่เหลือ
            let daysRemaining = null;
            if (tenant.subscription_end_date) {
                const endDate = new Date(tenant.subscription_end_date);
                const today = new Date();
                daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
            }

            res.json({
                success: true,
                data: {
                    plan: tenant.subscription_plan,
                    status: tenant.subscription_status,
                    start_date: tenant.subscription_start_date,
                    end_date: tenant.subscription_end_date,
                    days_remaining: daysRemaining,
                    limits: {
                        max_users: tenant.max_users,
                        max_storage_mb: tenant.max_storage_mb,
                        max_transactions_per_month: tenant.max_transactions_per_month
                    },
                    features: tenant.features ? JSON.parse(tenant.features) : {}
                }
            });
        } catch (error) {
            console.error('Get Subscription Error:', error);
            res.status(500).json({
                success: false,
                message: 'เกิดข้อผิดพลาดในการดึงข้อมูล subscription'
            });
        }
    }

    /**
     * ตรวจสอบ Quota
     */
    static async checkQuota(req, res) {
        try {
            const { type } = req.params; // users, transactions, storage
            const tenantId = req.tenantId;

            const quota = await TenantModel.checkQuota(tenantId, type);

            res.json({
                success: true,
                data: quota
            });
        } catch (error) {
            console.error('Check Quota Error:', error);
            res.status(500).json({
                success: false,
                message: 'เกิดข้อผิดพลาดในการตรวจสอบ quota'
            });
        }
    }

    /**
     * สร้าง Tenant ใหม่ (สำหรับ Registration)
     */
    static async register(req, res) {
        console.log('[Register] Incoming request body:', JSON.stringify(req.body, null, 2));
        try {
            const {
                company_name,
                company_name_en,
                tax_id,
                address,
                phone,
                email,
                // ข้อมูลผู้ใช้คนแรก (Owner)
                owner_username,
                owner_email,
                owner_password,
                owner_first_name,
                owner_last_name,
                owner_phone
            } = req.body;

            // Validate
            if (!company_name || !owner_email || !owner_password) {
                console.warn('[Register] Missing required fields');
                return res.status(400).json({
                    success: false,
                    message: 'กรุณากรอกข้อมูลให้ครบถ้วน (ชื่อบริษัท, อีเมลผู้ใช้, และรหัสผ่าน)'
                });
            }

            // สร้าง tenant_code
            const tenant_code = await TenantModel.generateTenantCode(company_name);
            console.log('[Register] Generated tenant_code:', tenant_code);

            // สร้าง Tenant
            let tenantId;
            try {
                tenantId = await TenantModel.create({
                    tenant_code,
                    company_name,
                    company_name_en,
                    tax_id,
                    address,
                    phone,
                    email,
                    subscription_plan: 'free'
                });
                console.log('[Register] Tenant created with ID:', tenantId);
            } catch (tenantErr) {
                console.error('[Register] TenantModel.create failed:', tenantErr);
                throw tenantErr;
            }

            // สร้าง Owner User
            let userId;
            try {
                userId = await UserModel.create(tenantId, {
                    username: owner_username || owner_email,
                    email: owner_email,
                    password: owner_password,
                    first_name: owner_first_name,
                    last_name: owner_last_name,
                    phone: owner_phone,
                    role: 'owner',
                    permissions: {
                        dashboard: true,
                        users: true,
                        bills: true,
                        reports: true,
                        settings: true
                    }
                });
                console.log('[Register] Owner user created with ID:', userId);
            } catch (userErr) {
                console.error('[Register] UserModel.create failed:', userErr);
                // ถ้าสร้าง user ไม่ได้ อาจต้องลบ tenant ที่สร้างไปแล้ว? (แต่ในระบบนี้อาจจะใช้ MANUAL FIX ภายหลังได้)
                throw userErr;
            }

            res.status(201).json({
                success: true,
                message: 'ลงทะเบียนสำเร็จ! กรุณารอผูดูแลระบบอนุมัติการใช้งาน',
                data: {
                    tenant_id: tenantId,
                    tenant_code,
                    user_id: userId
                }
            });
        } catch (error) {
            console.error('Register Tenant Error:', error);

            // ตรวจสอบ duplicate key error
            if (error.code === 'ER_DUP_ENTRY') {
                const field = error.sqlMessage.includes('idx_tenant_code') ? 'รหัสองค์กร' : 'ข้อมูล';
                return res.status(400).json({
                    success: false,
                    message: `${field} หรืออีเมลนี้ถูกใช้งานแล้วในระบบ`
                });
            }

            res.status(500).json({
                success: false,
                message: 'เกิดข้อผิดพลาดในการลงทะเบียน: ' + (error.message || 'Unknown error')
            });
        }
    }

    /**
     * ดึงรายการ Tenants ทั้งหมด (Super Admin Only)
     */
    static async getAll(req, res) {
        try {
            // TODO: ตรวจสอบว่าเป็น Super Admin

            const filters = {
                subscription_status: req.query.status,
                subscription_plan: req.query.plan,
                is_active: req.query.is_active,
                limit: req.query.limit
            };

            const tenants = await TenantModel.getAll(filters);

            res.json({
                success: true,
                data: tenants
            });
        } catch (error) {
            console.error('Get All Tenants Error:', error);
            res.status(500).json({
                success: false,
                message: 'เกิดข้อผิดพลาดในการดึงข้อมูล'
            });
        }
    }
}

module.exports = TenantController;
