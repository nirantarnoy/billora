/**
 * Tenant Middleware
 * ป้องกันข้อมูลปะปนกันระหว่าง tenant ในระบบ SaaS
 */

const pool = require('../config/db');
const ErrorHandler = require('./errorHandler');

/**
 * ตรวจสอบและโหลดข้อมูล Tenant
 * ใช้กับทุก request ที่ต้องการ tenant context
 */
const loadTenant = async (req, res, next) => {
    try {
        const user = req.session.user || req.user;

        if (!user || !user.tenant_id) {
            if (req.xhr || req.path.startsWith('/api/')) {
                return res.status(401).json({
                    success: false,
                    error: 'NO_TENANT',
                    message: 'ไม่พบข้อมูลองค์กร'
                });
            }
            return res.redirect('/login');
        }

        // โหลดข้อมูล tenant
        const [tenants] = await pool.query(
            `SELECT * FROM tenants WHERE id = ? AND is_active = TRUE AND deleted_at IS NULL`,
            [user.tenant_id]
        );

        if (tenants.length === 0) {
            if (req.xhr || req.path.startsWith('/api/')) {
                return res.status(403).json({
                    success: false,
                    error: 'TENANT_INACTIVE',
                    message: 'องค์กรของคุณถูกระงับการใช้งาน'
                });
            }
            req.session.destroy();
            return res.redirect('/login?error=tenant_inactive');
        }

        const tenant = tenants[0];

        // Standalone Mode: Bypass Subscription Checks
        if (process.env.APP_MODE === 'standalone') {
            req.tenant = tenant;
            req.tenantId = tenant.id;
            res.locals.tenant = tenant;
            res.locals.tenantId = tenant.id;
            // Assuming full features for standalone
            res.locals.isStandalone = true;
            next();
            return;
        }

        // ตรวจสอบ subscription
        if (tenant.subscription_status !== 'active') {
            if (req.xhr || req.path.startsWith('/api/')) {
                return res.status(402).json({
                    success: false,
                    error: 'SUBSCRIPTION_EXPIRED',
                    message: 'แพ็กเกจของคุณหมดอายุแล้ว กรุณาต่ออายุ',
                    subscription_status: tenant.subscription_status
                });
            }
            return res.redirect('/subscription/renew');
        }

        // ตรวจสอบวันหมดอายุ
        if (tenant.subscription_end_date && new Date(tenant.subscription_end_date) < new Date()) {
            // อัพเดทสถานะเป็น expired
            await pool.query(
                `UPDATE tenants SET subscription_status = 'expired' WHERE id = ?`,
                [tenant.id]
            );

            if (req.xhr || req.path.startsWith('/api/')) {
                return res.status(402).json({
                    success: false,
                    error: 'SUBSCRIPTION_EXPIRED',
                    message: 'แพ็กเกจของคุณหมดอายุแล้ว'
                });
            }
            return res.redirect('/subscription/renew');
        }

        // เก็บข้อมูล tenant ใน request
        req.tenant = tenant;
        req.tenantId = tenant.id;

        // เก็บไว้ใน locals สำหรับ views
        res.locals.tenant = tenant;
        res.locals.tenantId = tenant.id;

        next();
    } catch (error) {
        console.error('Load Tenant Error:', error);
        res.status(500).json({
            success: false,
            error: 'SERVER_ERROR',
            message: 'เกิดข้อผิดพลาดในการโหลดข้อมูลองค์กร'
        });
    }
};

/**
 * ตรวจสอบ Quota/Limits ของ Tenant
 */
const checkTenantLimits = (limitType) => {
    return async (req, res, next) => {
        try {
            const tenant = req.tenant;

            if (!tenant) {
                return res.status(403).json({
                    success: false,
                    error: 'NO_TENANT',
                    message: 'ไม่พบข้อมูลองค์กร'
                });
            }

            switch (limitType) {
                case 'users':
                    // ตรวจสอบจำนวนผู้ใช้
                    const [userCount] = await pool.query(
                        `SELECT COUNT(*) as count FROM users WHERE tenant_id = ? AND deleted_at IS NULL`,
                        [tenant.id]
                    );

                    if (userCount[0].count >= tenant.max_users) {
                        return res.status(403).json({
                            success: false,
                            error: 'USER_LIMIT_EXCEEDED',
                            message: `คุณใช้งานผู้ใช้ครบจำนวนสูงสุดแล้ว (${tenant.max_users} คน)`,
                            current: userCount[0].count,
                            limit: tenant.max_users
                        });
                    }
                    break;

                case 'storage':
                    // ตรวจสอบพื้นที่จัดเก็บ (ตัวอย่าง)
                    // TODO: Implement storage check
                    break;

                case 'transactions':
                    // ตรวจสอบจำนวน transactions ในเดือนนี้
                    const [transCount] = await pool.query(
                        `SELECT COUNT(*) as count FROM bills 
                         WHERE tenant_id = ? 
                         AND YEAR(created_at) = YEAR(CURRENT_DATE()) 
                         AND MONTH(created_at) = MONTH(CURRENT_DATE())`,
                        [tenant.id]
                    );

                    if (transCount[0].count >= tenant.max_transactions_per_month) {
                        return res.status(403).json({
                            success: false,
                            error: 'TRANSACTION_LIMIT_EXCEEDED',
                            message: `คุณใช้งานครบจำนวน transaction ในเดือนนี้แล้ว (${tenant.max_transactions_per_month})`,
                            current: transCount[0].count,
                            limit: tenant.max_transactions_per_month
                        });
                    }
                    break;
            }

            next();
        } catch (error) {
            console.error('Check Tenant Limits Error:', error);
            res.status(500).json({
                success: false,
                error: 'SERVER_ERROR',
                message: 'เกิดข้อผิดพลาดในการตรวจสอบ quota'
            });
        }
    };
};

/**
 * ตรวจสอบ Feature Access
 */
const checkFeatureAccess = (featureName) => {
    return (req, res, next) => {
        const tenant = req.tenant;

        if (!tenant) {
            return res.status(403).json({
                success: false,
                error: 'NO_TENANT',
                message: 'ไม่พบข้อมูลองค์กร'
            });
        }

        const features = tenant.features ? JSON.parse(tenant.features) : {};

        if (process.env.APP_MODE === 'standalone') {
            next();
            return;
        }

        if (!features[featureName]) {
            return res.status(403).json({
                success: false,
                error: 'FEATURE_NOT_AVAILABLE',
                message: `ฟีเจอร์ ${featureName} ไม่รองรับในแพ็กเกจของคุณ`,
                feature: featureName,
                current_plan: tenant.subscription_plan
            });
        }

        next();
    };
};

/**
 * Tenant Scope Query Helper
 * ใช้สำหรับเพิ่ม WHERE tenant_id = ? ให้กับ query อัตโนมัติ
 */
const addTenantScope = (query, params, tenantId) => {
    // ถ้า query มี WHERE แล้ว ให้เพิ่ม AND
    if (query.toUpperCase().includes('WHERE')) {
        query = query.replace(/WHERE/i, `WHERE tenant_id = ? AND`);
        params.unshift(tenantId);
    } else {
        // ถ้ายังไม่มี WHERE ให้เพิ่มเข้าไป
        const fromIndex = query.toUpperCase().indexOf('FROM');
        const orderIndex = query.toUpperCase().indexOf('ORDER BY');
        const limitIndex = query.toUpperCase().indexOf('LIMIT');

        let insertIndex = query.length;
        if (orderIndex > -1) insertIndex = orderIndex;
        else if (limitIndex > -1) insertIndex = limitIndex;

        query = query.slice(0, insertIndex) + ` WHERE tenant_id = ? ` + query.slice(insertIndex);
        params.unshift(tenantId);
    }

    return { query, params };
};

module.exports = {
    loadTenant,
    checkTenantLimits,
    checkFeatureAccess,
    addTenantScope
};
