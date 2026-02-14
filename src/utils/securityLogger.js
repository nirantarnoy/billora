const SecurityLogModel = require('../models/SecurityLogModel');

/**
 * Utility for logging security events easily across the app
 */
const SecurityLogger = {
    /**
     * Log a security event
     */
    async log(req, eventType, severity = 'LOW', details = {}) {
        const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        const userAgent = req.headers['user-agent'];
        const tenantId = req.session?.user?.tenant_id || req.user?.tenant_id || null;
        const userId = req.session?.user?.id || req.user?.id || null;

        return await SecurityLogModel.log({
            event_type: eventType,
            tenant_id: tenantId,
            user_id: userId,
            ip_address: ip,
            user_agent: userAgent,
            severity: severity,
            details: details,
            path: req.originalUrl,
            method: req.method
        });
    },

    // Shortcuts
    async logLoginFailure(req, details) {
        return this.log(req, 'LOGIN_FAILURE', 'MEDIUM', details);
    },

    async logCsrfAttack(req) {
        return this.log(req, 'CSRF_ATTACK', 'HIGH', { reason: 'Invalid CSRF token' });
    },

    async logUnauthorizedAccess(req, message) {
        return this.log(req, 'UNAUTHORIZED_ACCESS', 'MEDIUM', { message });
    },

    async logSuspiciousActivity(req, message, severity = 'MEDIUM') {
        return this.log(req, 'SUSPICIOUS_REQUEST', severity, { message });
    }
};

module.exports = SecurityLogger;
