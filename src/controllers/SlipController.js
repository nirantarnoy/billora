const db = require('../config/db');

class SlipController {
    async listSlips(req, res) {
        try {
            const userId = req.session.user.id;
            const tenantId = req.session.user.tenant_id || req.session.user.company_id || 1;
            const page = parseInt(req.query.page) || 1;
            const limitParam = req.query.limit || '20';
            const limit = limitParam === 'all' ? null : parseInt(limitParam);
            const search = req.query.search || '';
            const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Bangkok' });
            const startDate = req.query.startDate;
            const endDate = req.query.endDate;
            const startUploadDate = req.query.startUploadDate; // Removed default today
            const endUploadDate = req.query.endUploadDate; // Removed default today
            const offset = (page - 1) * (limit || 0);

            let whereClause = 'WHERE tenant_id = ?';
            let params = [tenantId];

            if (search) {
                whereClause += ' AND (sender_name LIKE ? OR receiver_name LIKE ? OR trans_id LIKE ? OR raw_text LIKE ?)';
                params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
            }

            if (startDate) {
                whereClause += ' AND DATE(datetime) >= ?';
                params.push(startDate);
            }
            if (endDate) {
                whereClause += ' AND DATE(datetime) <= ?';
                params.push(endDate);
            }

            const [[{ total }]] = await db.execute(`SELECT COUNT(*) as total FROM payment_slips ${whereClause}`, params);

            let query = `SELECT * FROM payment_slips ${whereClause} ORDER BY id DESC`;
            if (limit) {
                query += ` LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;
                // params.push(parseInt(limit), parseInt(offset));
            }

            const [slips] = await db.execute(query, params);

            res.render('slips', {
                slips,
                user: req.session.user,
                page,
                limit: limitParam,
                search,
                startDate,
                endDate,
                total,
                totalPages: limit ? Math.ceil(total / limit) : 1,
                active: 'slips',
                title: 'จัดการรายการรับเงิน (Slips)',
                _csrf: req.csrfToken ? req.csrfToken() : ''
            });
        } catch (err) {
            res.status(500).send(err.message);
        }
    }

    async listOcrLogs(req, res) {
        const today = new Date().toISOString().split('T')[0];
        const startDate = req.query.startDate || today;
        const endDate = req.query.endDate || today;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        let countQuery = `
      SELECT COUNT(*) as total
      FROM ocr_logs l 
      JOIN users u ON l.user_id = u.id 
    `;

        let dataQuery = `
      SELECT l.*, u.username 
      FROM ocr_logs l 
      JOIN users u ON l.user_id = u.id 
    `;

        const params = [];
        let where = "";

        if (startDate || endDate) {
            where = " WHERE ";
            const conditions = [];
            if (startDate) {
                conditions.push("DATE(l.created_at) >= ?");
                params.push(startDate);
            }
            if (endDate) {
                conditions.push("DATE(l.created_at) <= ?");
                params.push(endDate);
            }
            where += conditions.join(" AND ");
        }

        countQuery += where;
        dataQuery += where + ` ORDER BY l.created_at DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;

        try {
            const [[{ total }]] = await db.execute(countQuery, params);
            const [logs] = await db.execute(dataQuery, params);

            res.render('history', {
                user: req.session.user,
                logs,
                active: 'history',
                title: 'ประวัติการอ่าน OCR',
                filters: { startDate, endDate },
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(total / limit),
                    totalItems: total,
                    limit: limit
                },
                _csrf: req.csrfToken ? req.csrfToken() : ''
            });
        } catch (err) {
            res.status(500).send(err.message);
        }
    }

    async getApiHistory(req, res) {
        const userId = req.session.user.id;
        try {
            const [bills] = await db.execute(
                'SELECT id, store_name, date, total_amount, image_path, created_at, "RECEIPT" as type FROM bills WHERE user_id = ? ORDER BY created_at DESC',
                [userId]
            );

            const [slips] = await db.execute(
                'SELECT id, trans_id, sender_name, receiver_name, amount, datetime, image_path, created_at, "BANK_SLIP" as type FROM payment_slips WHERE user_id = ? ORDER BY created_at DESC',
                [userId]
            );

            const history = [...bills, ...slips].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            res.json({ success: true, history });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }
}

module.exports = new SlipController();
