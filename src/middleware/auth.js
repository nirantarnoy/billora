const jwt = require('jsonwebtoken');
const ErrorHandler = require('./errorHandler');
const SecurityLogger = require('../utils/securityLogger');
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
            // Handle specific JWT errors
            if (err.name === 'TokenExpiredError') {
                SecurityLogger.logSuspiciousActivity(req, 'Expired JWT token', 'MEDIUM');
                if (req.xhr || req.originalUrl.startsWith('/api/')) {
                    return res.status(401).json({ success: false, error: 'TOKEN_EXPIRED', message: 'Token หมดอายุ' });
                }
                return res.redirect('/login?error=token_expired');
            } else if (err.name === 'JsonWebTokenError') {
                SecurityLogger.logSuspiciousActivity(req, 'Invalid JWT token', 'MEDIUM');
                if (req.xhr || req.originalUrl.startsWith('/api/')) {
                    return res.status(401).json({ success: false, error: 'TOKEN_INVALID', message: 'Token ไม่ถูกต้อง' });
                }
                return res.redirect('/login?error=token_invalid');
            }
            // Generic JWT error handling (e.g., if a custom error type indicates account suspension)
            // This part is an interpretation of the user's malformed edit, assuming they wanted to add account status checks.
            // If the error object contains information about an inactive account, handle it.
            // This is a placeholder; actual implementation would depend on how 'account_inactive' is signaled by the JWT verification or custom logic.
            if (err.message === 'account_inactive') { // Example: if jwt.verify throws an error with this message
                SecurityLogger.logSuspiciousActivity(req, 'Attempt to login with inactive account via JWT', 'HIGH');
                if (req.xhr || req.originalUrl.startsWith('/api/')) {
                    return res.status(401).json({ success: false, message: 'บัญชีถูกระงับ' });
                }
                return res.redirect('/login?error=account_inactive');
            }

            // Fallback for any other unexpected JWT errors
            SecurityLogger.logSuspiciousActivity(req, 'Unexpected JWT verification error', 'MEDIUM', err.message);
            if (req.xhr || req.originalUrl.startsWith('/api/')) {
                return res.status(401).json({ success: false, error: 'TOKEN_ERROR', message: 'เกิดข้อผิดพลาดในการตรวจสอบ Token' });
            }
            return res.redirect('/login?error=auth_error');
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
