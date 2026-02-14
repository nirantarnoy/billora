const pool = require('../config/db');

class SecurityLogModel {
    /**
     * บันทึก Log เหตุการณ์ความปลอดภัย
     */
    static async log(data) {
        const {
            event_type,
            tenant_id = null,
            user_id = null,
            ip_address,
            user_agent = null,
            severity = 'LOW',
            details = null,
            path = null,
            method = null
        } = data;

        try {
            const [result] = await pool.query(
                `INSERT INTO security_logs (
                    event_type, tenant_id, user_id, ip_address, 
                    user_agent, severity, details, path, method
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    event_type,
                    tenant_id,
                    user_id,
                    ip_address,
                    user_agent,
                    severity,
                    typeof details === 'object' ? JSON.stringify(details) : details,
                    path,
                    method
                ]
            );
            return result.insertId;
        } catch (error) {
            console.error('[SecurityLogModel] Error logging security event:', error);
            return null;
        }
    }

    /**
     * ดึง Log ล่าสุด (สำหรับ Super Admin)
     */
    static async getRecent(limit = 100) {
        const [rows] = await pool.query(
            `SELECT s.*, t.company_name, u.username 
             FROM security_logs s
             LEFT JOIN tenants t ON s.tenant_id = t.id
             LEFT JOIN users u ON s.user_id = u.id
             ORDER BY s.created_at DESC 
             LIMIT ?`,
            [limit]
        );
        return rows;
    }

    /**
     * ดึงสถิติตาม IP (เพื่อตรวจ Brute Force)
     */
    static async countRecentEventsByIp(ip, eventType, minutes = 15) {
        const [rows] = await pool.query(
            `SELECT COUNT(*) as count 
             FROM security_logs 
             WHERE ip_address = ? AND event_type = ? 
             AND created_at >= NOW() - INTERVAL ? MINUTE`,
            [ip, eventType, minutes]
        );
        return rows[0].count;
    }
}

module.exports = SecurityLogModel;
