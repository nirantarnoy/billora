const db = require('../config/db');
const { recordAction } = require('../utils/logger');
const ocrQueue = require('../queues/ocrQueue');
const { getIsRedisOffline } = require('../config/redis');
const { handleFileProcessing } = require('../services/OcrService');



class BillController {
    // Web: List Bills
    async listBills(req, res) {
        try {
            const userId = req.session.user.id;
            const tenantId = req.session.user.tenant_id || 1;
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
                query += ` LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;
                // params.push(parseInt(limit), parseInt(offset));
            }

            const [bills] = await db.execute(query, params);

            // Ensure items is an array (handle stringified JSON from DB)
            const processedBills = bills.map(bill => {
                let items = bill.items;
                if (typeof items === 'string') {
                    try { items = JSON.parse(items); } catch (e) { items = []; }
                }
                return { ...bill, items: items || [] };
            });

            res.render('bills', {
                bills: processedBills,
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

    // API: Upload (Modified to use Queue)
    async upload(req, res) {
        const uploadedFiles = [];
        if (req.files['files']) uploadedFiles.push(...req.files['files']);
        if (req.files['file']) uploadedFiles.push(...req.files['file']);

        if (uploadedFiles.length === 0) {
            return res.status(400).json({ success: false, error: "ไม่พบไฟล์ที่อัปโหลด" });
        }

        const userId = req.session.user.id;
        const source = req.headers['x-source'] || (req.headers['authorization'] ? 'MOBILE' : 'BROWSER');

        // Fallback: If Redis is offline, process synchronously
        if (getIsRedisOffline()) {
            console.log('[Upload] Fallback: Redis is offline, processing in SYNC mode');
            const results = [];
            const errors = [];

            for (const file of uploadedFiles) {
                try {
                    const result = await handleFileProcessing(file, userId, source);
                    results.push({ success: true, fileName: file.originalname, ...result });
                } catch (err) {
                    errors.push({ fileName: file.originalname, error: err.message });
                }
            }

            // Emit update via socket
            if (results.length > 0) {
                const io = req.app.get('io');
                if (io) {
                    io.emit('new_upload', {
                        count: results.length,
                        results: results.map(r => ({
                            type: r.type,
                            amount: r.amount,
                            sender: r.sName || r.storeName,
                            receiver: r.rName
                        }))
                    });
                }
            }
            return res.json({ success: true, results, errors, mode: 'sync' });
        }

        try {
            const jobs = await Promise.all(uploadedFiles.map(file => {
                return ocrQueue.add('ocr-job', {
                    file: {
                        path: file.path,
                        originalname: file.originalname,
                        mimetype: file.mimetype,
                        size: file.size
                    },
                    userId,
                    source
                });
            }));

            res.json({
                success: true,
                message: `กำลังประมวลผล ${jobs.length} ไฟล์ในระบบคิว`,
                jobIds: jobs.map(j => j.id),
                mode: 'queue'
            });
        } catch (err) {
            console.error('Queue error:', err);
            res.status(500).json({ success: false, error: "ไม่สามารถเพิ่มงานลงในคิวได้" });
        }

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
