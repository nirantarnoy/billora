const db = require('../config/db');
const { recordAction } = require('../utils/logger');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

class ManagementController {
    // Backup & Restore
    async listBackups(req, res) {
        const backupDir = path.join(__dirname, '../../backups');
        if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir);

        const files = fs.readdirSync(backupDir)
            .filter(f => f.endsWith('.sql'))
            .map(f => {
                const stats = fs.statSync(path.join(backupDir, f));
                return {
                    name: f,
                    size: (stats.size / 1024).toFixed(2) + ' KB',
                    date: stats.mtime
                };
            })
            .sort((a, b) => b.date - a.date);

        res.render('backup', {
            backups: files,
            success: req.query.success || null,
            error: req.query.error || null,
            active: 'backup',
            title: 'สำรองและคืนค่าข้อมูล'
        });
    }

    async createBackup(req, res) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `backup-${timestamp}.sql`;
        const filePath = path.join(__dirname, '../../backups', fileName);

        // Command depends on environment, simplified here
        const cmd = `mysqldump -u root bill_ocr > "${filePath}"`;

        exec(cmd, async (err) => {
            if (err) return res.redirect('/admin/backup?error=' + encodeURIComponent(err.message));
            await recordAction(req.session.user.id, 'Create Backup', `สร้างไฟล์สำรอง ${fileName}`, req);
            res.redirect('/admin/backup?success=' + encodeURIComponent('สำรองข้อมูลสำเร็จ: ' + fileName));
        });
    }

    // Action Logs
    async listLogs(req, res) {
        try {
            const { user, startDate, endDate } = req.query;
            let where = 'WHERE 1=1';
            let params = [];

            if (user) { where += ' AND u.username LIKE ?'; params.push(`%${user}%`); }
            if (startDate) { where += ' AND DATE(al.created_at) >= ?'; params.push(startDate); }
            if (endDate) { where += ' AND DATE(al.created_at) <= ?'; params.push(endDate); }

            const [logs] = await db.execute(`
                SELECT al.*, u.username 
                FROM action_logs al 
                LEFT JOIN users u ON al.user_id = u.id 
                ${where} 
                ORDER BY al.created_at DESC LIMIT 100
            `, params);

            const [users] = await db.execute('SELECT id, username FROM users ORDER BY username ASC');

            const filter = {
                user_id: req.query.user_id || '',
                startDate: startDate || '',
                endDate: endDate || ''
            };

            res.render('action_logs', {
                logs,
                users,
                filter,
                active: 'logs',
                title: 'บันทึกกิจกรรม',
                _csrf: req.csrfToken ? req.csrfToken() : ''
            });
        } catch (err) {
            res.status(500).send(err.message);
        }
    }
}

module.exports = new ManagementController();
