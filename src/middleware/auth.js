const jwt = require('jsonwebtoken');
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
    if (req.xhr || req.path.startsWith('/api/')) {
        return res.status(401).json({ success: false, error: 'UNAUTHORIZED', message: 'กรุณาเข้าสู่ระบบ' });
    }
    res.redirect('/login');
};

const isAdmin = (req, res, next) => {
    const user = req.session.user || req.user;
    if (user && user.role === 'admin') {
        return next();
    }
    if (req.xhr || req.path.startsWith('/api/')) {
        return res.status(403).json({ success: false, message: 'Admin access only' });
    }
    res.status(403).send('คุณไม่มีสิทธิ์เข้าถึงส่วนนี้ (Admin Only)');
};

const hasPermission = (module) => {
    return (req, res, next) => {
        const user = req.session.user || req.user;
        if (user && user.permissions && user.permissions[module]) {
            return next();
        }
        res.status(403).json({ success: false, error: 'FORBIDDEN', message: 'คุณไม่มีสิทธิ์เข้าถึงส่วนนี้' });
    };
};

module.exports = {
    isAuthenticated,
    isAdmin,
    hasPermission
};
