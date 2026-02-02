const db = require('../config/db');

async function recordAction(userId, action, details, req) {
    try {
        const ip = req ? (req.headers['x-forwarded-for'] || req.socket.remoteAddress) : 'system';
        await db.execute(
            'INSERT INTO action_logs (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
            [userId, action, details, ip]
        );
    } catch (err) {
        console.error('Failed to record action:', err);
    }
}

module.exports = { recordAction };
