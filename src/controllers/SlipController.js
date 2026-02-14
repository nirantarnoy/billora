const db = require('../config/db');

class SlipController {
    async listSlips(req, res) {
        try {
            const userId = req.session.user.id;
            const userTenantId = req.session.user.tenant_id;
            const isAdmin = userTenantId === 1;

            const page = parseInt(req.query.page) || 1;
            const limitParam = req.query.limit || '20';
            const limit = limitParam === 'all' ? null : parseInt(limitParam);
            const search = req.query.search || '';
            const startDate = req.query.startDate;
            const endDate = req.query.endDate;
            const startUploadDate = req.query.startUploadDate;
            const endUploadDate = req.query.endUploadDate;
            const filterTenantId = req.query.tenant_id;
            const offset = (page - 1) * (limit || 0);

            let whereClause = '';
            let params = [];

            if (isAdmin) {
                if (filterTenantId) {
                    whereClause = 'WHERE tenant_id = ?';
                    params.push(filterTenantId);
                } else {
                    whereClause = 'WHERE 1=1';
                }
            } else {
                whereClause = 'WHERE tenant_id = ?';
                params.push(userTenantId);
            }

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
        const userTenantId = req.session.user.tenant_id;
        const isAdmin = userTenantId === 1;

        const today = new Date().toISOString().split('T')[0];
        const startDate = req.query.startDate || today;
        const endDate = req.query.endDate || today;
        const filterTenantId = req.query.tenant_id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        let baseWhere = "";
        const baseParams = [];

        if (isAdmin) {
            if (filterTenantId) {
                baseWhere = "WHERE l.tenant_id = ?";
                baseParams.push(filterTenantId);
            } else {
                baseWhere = "WHERE 1=1";
            }
        } else {
            baseWhere = "WHERE l.tenant_id = ?";
            baseParams.push(userTenantId);
        }

        let countQuery = `
      SELECT COUNT(*) as total
      FROM ocr_logs l 
      JOIN users u ON l.user_id = u.id 
      ${baseWhere}
    `;

        let dataQuery = `
      SELECT l.*, u.username 
      FROM ocr_logs l 
      JOIN users u ON l.user_id = u.id 
      ${baseWhere}
    `;

        const params = [...baseParams];

        if (startDate || endDate) {
            const conditions = [];
            if (startDate) {
                conditions.push("DATE(l.created_at) >= ?");
                params.push(startDate);
            }
            if (endDate) {
                conditions.push("DATE(l.created_at) <= ?");
                params.push(endDate);
            }

            // Append AND if baseWhere is WHERE 1=1 or other condition
            if (conditions.length > 0) {
                // Note: we already have baseWhere (e.g., WHERE tenant_id = ? OR WHERE 1=1)
                // So we just add AND
                const dateClause = " AND " + conditions.join(" AND ");
                countQuery += dateClause;
                dataQuery += dateClause;
            }
        }

        dataQuery += ` ORDER BY l.created_at DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;

        // Need to duplicate params for countQuery if we ran it separately, but here we construct query.
        // Actually, db.execute expects params to match placeholders.
        // My construction logic above appends date params to `params` array which is used for both count? 
        // No, countQuery needs its own params? 
        // Let's rebuild params correctly.

        const finalParams = [...baseParams];
        if (startDate) finalParams.push(startDate);
        if (endDate) finalParams.push(endDate);

        try {
            const [[{ total }]] = await db.execute(countQuery, finalParams);
            const [logs] = await db.execute(dataQuery, finalParams);

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
            console.error(err);
            res.status(500).send(err.message);
        }
    }

    async getApiHistory(req, res) {
        const userTenantId = req.session.user.tenant_id;
        const isAdmin = userTenantId === 1;
        const filterTenantId = req.query.tenant_id;

        let whereClause = '';
        let params = [];

        if (isAdmin) {
            if (filterTenantId) {
                whereClause = 'WHERE tenant_id = ?';
                params.push(filterTenantId);
            } else {
                whereClause = 'WHERE 1=1';
            }
        } else {
            whereClause = 'WHERE tenant_id = ?';
            params.push(userTenantId);
        }

        try {
            const [bills] = await db.execute(
                `SELECT id, store_name, date, total_amount, image_path, created_at, "RECEIPT" as type FROM bills ${whereClause} ORDER BY created_at DESC`,
                [...params]
            );

            const [slips] = await db.execute(
                `SELECT id, trans_id, sender_name, receiver_name, amount, datetime, image_path, created_at, "BANK_SLIP" as type FROM payment_slips ${whereClause} ORDER BY created_at DESC`,
                [...params]
            );

            const [logs] = await db.execute(
                `SELECT id, "VERIFY_FAILED" as trans_id, status as sender_name, "FAILED" as receiver_name, amount, created_at as datetime, image_path, created_at, "BANK_SLIP" as type, status FROM ocr_logs ${whereClause.replace('WHERE', 'WHERE (status = "invalid_receiver") AND ')} ORDER BY created_at DESC`,
                // Note: logic above for logs is a bit complex with WHERE replacement. 
                // Original was: WHERE tenant_id = ? AND status = "invalid_receiver"
                // New logic needs to handle 1=1 or tenant_id=?
            );

            // Re-implement Logs Query safely
            let logQuery = `SELECT id, "VERIFY_FAILED" as trans_id, status as sender_name, "FAILED" as receiver_name, amount, created_at as datetime, image_path, created_at, "BANK_SLIP" as type, status FROM ocr_logs ${whereClause} AND status = "invalid_receiver" ORDER BY created_at DESC`;
            const [logsResults] = await db.execute(logQuery, [...params]);


            const history = [...bills, ...slips, ...logsResults].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            res.json({ success: true, history });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }
}

module.exports = new SlipController();
