const jwt = require('jsonwebtoken');
const ErrorHandler = require('./errorHandler');
const JWT_SECRET = process.env.JWT_SECRET || 'billora-jwt-secret-key-2026';

const isAuthenticated = (req, res, next) => {
    // Check Session (Web)
    if (req.session.user) return next();

    // Check JWT (API/Mobile)
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            req.user = decoded;
            if (!req.session) req.session = {};
            req.session.user = decoded;
            return next();
        } catch (err) {
            if (req.xhr || req.path.startsWith('/api/')) {
                return res.status(401).json({ success: false, error: 'TOKEN_INVALID', message: 'Token ไม่ถูกต้องหรือหมดอายุ' });
            }
        }
    }

    // No auth found
    return ErrorHandler.unauthorized(req, res);
};

/**
 * ตรวจสอบว่าเป็น Admin หรือ Owner
 * Owner = เจ้าขององค์กร, Admin = ผู้ดูแลระบบ
 */
const isAdmin = (req, res, next) => {
    const user = req.session.user || req.user;

    // รองรับทั้ง admin และ owner
    if (user && (user.role === 'admin' || user.role === 'owner')) {
        return next();
    }

    // ใช้ ErrorHandler สำหรับแสดง error สวยงาม
    return ErrorHandler.forbidden(req, res, 'คุณไม่มีสิทธิ์เข้าถึงส่วนนี้ (Admin/Owner Only)');
};

/**
 * ตรวจสอบสิทธิ์ตาม permission
 */
const hasPermission = (module) => {
    return (req, res, next) => {
        const user = req.session.user || req.user;

        // Admin และ Owner มีสิทธิ์ทุกอย่าง
        if (user && (user.role === 'admin' || user.role === 'owner')) {
            return next();
        }

        // ตรวจสอบ permission
        if (user && user.permissions && user.permissions[module]) {
            return next();
        }

        // ใช้ ErrorHandler สำหรับแสดง error สวยงาม
        return ErrorHandler.forbidden(req, res, `คุณไม่มีสิทธิ์เข้าถึงโมดูล ${module}`);
    };
};

/**
 * ตรวจสอบว่าเป็น Super Admin เท่านั้น
 * ใช้สำหรับจัดการ Multi-tenant
 */
const isSuperAdmin = (req, res, next) => {
    const user = req.session.user || req.user;

    // ตรวจสอบว่าเป็น admin และอยู่ใน System tenant (ID: 1)
    if (user && user.role === 'admin' && user.tenant_id === 1) {
        return next();
    }

    return ErrorHandler.forbidden(req, res, 'ฟังก์ชันนี้สำหรับ Super Admin เท่านั้น');
};

module.exports = {
    isAuthenticated,
    isAdmin,
    hasPermission,
    isSuperAdmin
};
