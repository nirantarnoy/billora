const db = require('../config/db');
const { recordAction } = require('../utils/logger');
const { handleFileProcessing } = require('../services/OcrService');

class BillController {
    // Web: List Bills
    async listBills(req, res) {
        try {
            const userId = req.session.user.id;
            const page = parseInt(req.query.page) || 1;
            const limitParam = req.query.limit || '20';
            const limit = limitParam === 'all' ? null : parseInt(limitParam);
            const search = req.query.search || '';
            const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Bangkok' });
            const startDate = req.query.startDate;
            const endDate = req.query.endDate;
            const startUploadDate = req.query.startUploadDate !== undefined ? req.query.startUploadDate : today;
            const endUploadDate = req.query.endUploadDate !== undefined ? req.query.endUploadDate : today;
            const offset = (page - 1) * (limit || 0);

            let whereClause = 'WHERE user_id = ?';
            let params = [userId];

            if (search) {
                whereClause += ' AND (store_name LIKE ? OR raw_text LIKE ?)';
                params.push(`%${search}%`, `%${search}%`);
            }

            if (startDate) { whereClause += ' AND date >= ?'; params.push(startDate); }
            if (endDate) { whereClause += ' AND date <= ?'; params.push(endDate); }
            if (startUploadDate) { whereClause += ' AND DATE(created_at) >= ?'; params.push(startUploadDate); }
            if (endUploadDate) { whereClause += ' AND DATE(created_at) <= ?'; params.push(endUploadDate); }

            const [[{ total }]] = await db.execute(`SELECT COUNT(*) as total FROM bills ${whereClause}`, params);

            let query = `SELECT * FROM bills ${whereClause} ORDER BY id DESC`;
            if (limit) {
                query += ` LIMIT ? OFFSET ?`;
                params.push(limit, offset);
            }

            const [bills] = await db.execute(query, params);

            res.render('bills', {
                bills,
                user: req.session.user,
                page,
                limit: limitParam,
                search,
                startDate,
                endDate,
                startUploadDate,
                endUploadDate,
                total,
                totalPages: limit ? Math.ceil(total / limit) : 1,
                active: 'bills',
                title: 'จัดการรายจ่ายและใบเสร็จ',
                _csrf: req.csrfToken ? req.csrfToken() : ''
            });
        } catch (err) {
            res.status(500).send(err.message);
        }
    }

    // API: Upload (Used by both Web & Flutter)
    async upload(req, res) {
        const uploadedFiles = [];
        if (req.files['files']) uploadedFiles.push(...req.files['files']);
        if (req.files['file']) uploadedFiles.push(...req.files['file']);

        if (uploadedFiles.length === 0) {
            return res.status(400).json({ success: false, error: "ไม่พบไฟล์ที่อัปโหลด" });
        }

        const userId = req.session.user.id;
        const source = req.headers['x-source'] || (req.headers['authorization'] ? 'MOBILE' : 'BROWSER');
        const results = [];
        const errors = [];

        for (const file of uploadedFiles) {
            try {
                const result = await handleFileProcessing(file, userId, source, req);
                results.push({ fileName: file.originalname, ...result });
            } catch (err) {
                console.error('Upload processing error:', err);
                errors.push({ fileName: file.originalname, error: err.message });
            }
        }

        if (results.length > 0) {
            req.app.get('io').emit('new_upload', {
                count: results.length,
                results: results.map(r => ({
                    type: r.type,
                    amount: r.amount,
                    sender: r.sName || r.store_name,
                    receiver: r.rName
                }))
            });
        }

        res.json({ success: true, results, errors });
    }

    // API: Delete Bill
    async deleteBill(req, res) {
        try {
            const { id } = req.params;
            const userId = req.session.user.id;
            const [result] = await db.execute('DELETE FROM bills WHERE id = ? AND user_id = ?', [id, userId]);
            if (result.affectedRows > 0) {
                await recordAction(userId, 'Delete Bill', `ลบบิลรหัส ${id}`, req);
                return res.json({ success: true });
            }
            res.status(404).json({ success: false, error: 'ไม่พบข้อมูลที่ต้องการลบ' });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }
}

module.exports = new BillController();
