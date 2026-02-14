const db = require('../config/db');
const { recordAction } = require('../utils/logger');
const fs = require('fs');
const path = require('path');
const { exec, execSync } = require('child_process');
const SecurityLogModel = require('../models/SecurityLogModel');

// Helper function to find mysqldump executable
function findMysqldump() {
    // Try to find mysqldump using 'where' command on Windows
    try {
        const result = execSync('where mysqldump', { encoding: 'utf8' });
        const paths = result.trim().split('\n');
        if (paths.length > 0 && paths[0]) {
            return `"${paths[0].trim()}"`;
        }
    } catch (err) { }

    const possiblePaths = [
        'E:\\xampp\\mysql\\bin\\mysqldump.exe',
        'C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysqldump.exe',
        'C:\\Program Files\\MySQL\\MySQL Server 5.7\\bin\\mysqldump.exe',
        'C:\\laragon\\bin\\mysql\\mysql-8.0.30-winx64\\bin\\mysqldump.exe'
    ];

    for (const p of possiblePaths) {
        if (fs.existsSync(p)) return `"${p}"`;
    }
    return 'mysqldump';
}

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
            title: 'สำรองและคืนค่าข้อมูล',
            user: req.session.user,
            _csrf: req.csrfToken ? req.csrfToken() : ''
        });
    }

    async createBackup(req, res) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `backup-${timestamp}.sql`;
        const filePath = path.join(__dirname, '../../backups', fileName);

        const dbUser = process.env.DB_USER || 'root';
        const dbPassword = process.env.DB_PASSWORD || '';
        const dbName = process.env.DB_NAME || 'bill_ocr';
        const mysqldumpCmd = findMysqldump();

        let cmd = dbPassword
            ? `${mysqldumpCmd} -u ${dbUser} -p${dbPassword} ${dbName} > "${filePath}"`
            : `${mysqldumpCmd} -u ${dbUser} ${dbName} > "${filePath}"`;

        exec(cmd, async (err) => {
            if (err) return res.redirect('/admin/backup?error=' + encodeURIComponent('ไม่สามารถสำรองข้อมูลได้'));
            await recordAction(req.session.user.id, 'Create Backup', `สร้างไฟล์สำรอง ${fileName}`, req);
            res.redirect('/admin/backup?success=' + encodeURIComponent('สำรองข้อมูลสำเร็จ'));
        });
    }

    async deleteBackup(req, res) {
        const { fileName } = req.body;
        const filePath = path.join(__dirname, '../../backups', fileName);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            await recordAction(req.session.user.id, 'Delete Backup', `ลบไฟล์สำรอง ${fileName}`, req);
        }
        res.redirect('/admin/backup?success=' + encodeURIComponent('ลบไฟล์สำรองสำเร็จ'));
    }

    async restoreBackup(req, res) {
        const { fileName } = req.body;
        const filePath = path.join(__dirname, '../../backups', fileName);
        if (!fs.existsSync(filePath)) return res.redirect('/admin/backup?error=FileNotFound');

        const dbUser = process.env.DB_USER || 'root';
        const dbPassword = process.env.DB_PASSWORD || '';
        const dbName = process.env.DB_NAME || 'bill_ocr';
        const mysqlCmd = findMysqldump().replace('mysqldump', 'mysql');

        let cmd = dbPassword
            ? `${mysqlCmd} -u ${dbUser} -p${dbPassword} ${dbName} < "${filePath}"`
            : `${mysqlCmd} -u ${dbUser} ${dbName} < "${filePath}"`;

        exec(cmd, async (err) => {
            if (err) return res.redirect('/admin/backup?error=RestoreFailed');
            await recordAction(req.session.user.id, 'Restore Backup', `คืนค่าจากไฟล ${fileName}`, req);
            res.redirect('/admin/backup?success=RestoreSuccess');
        });
    }

    // Action Logs
    async listLogs(req, res) {
        try {
            const { user_id, startDate, endDate, page = 1, limit = 20 } = req.query;
            const offset = (parseInt(page) - 1) * parseInt(limit);

            let where = 'WHERE 1=1';
            let params = [];
            if (user_id) { where += ' AND al.user_id = ?'; params.push(user_id); }
            if (startDate) { where += ' AND DATE(al.created_at) >= ?'; params.push(startDate); }
            if (endDate) { where += ' AND DATE(al.created_at) <= ?'; params.push(endDate); }

            const [countRows] = await db.execute(`SELECT COUNT(*) as total FROM action_logs al ${where}`, params);
            const totalItems = countRows[0].total;
            const totalPages = Math.ceil(totalItems / parseInt(limit));

            const [logs] = await db.execute(`
                SELECT al.*, u.username 
                FROM action_logs al 
                LEFT JOIN users u ON al.user_id = u.id 
                ${where} 
                ORDER BY al.created_at DESC 
                LIMIT ${parseInt(limit)} OFFSET ${offset}
            `, params);

            const [users] = await db.execute('SELECT id, username FROM users ORDER BY username ASC');

            res.render('action_logs', {
                logs, users, active: 'logs', title: 'บันทึกกิจกรรม',
                filter: { user_id: user_id || '', startDate: startDate || '', endDate: endDate || '', limit: parseInt(limit) },
                pagination: { currentPage: parseInt(page), totalPages, totalItems, limit: parseInt(limit) },
                _csrf: req.csrfToken ? req.csrfToken() : ''
            });
        } catch (err) { res.status(500).send(err.message); }
    }

    // Security Logs
    async listSecurityLogs(req, res) {
        try {
            const { event_type, severity, page = 1, limit = 20 } = req.query;
            const offset = (parseInt(page) - 1) * parseInt(limit);

            let where = 'WHERE 1=1';
            let params = [];
            if (event_type) { where += ' AND event_type = ?'; params.push(event_type); }
            if (severity) { where += ' AND severity = ?'; params.push(severity); }

            const [countRows] = await db.query(`SELECT COUNT(*) as total FROM security_logs ${where}`, params);
            const totalItems = countRows[0].total;
            const totalPages = Math.ceil(totalItems / parseInt(limit));

            const [logs] = await db.query(`
                SELECT s.*, t.company_name, u.username 
                FROM security_logs s
                LEFT JOIN tenants t ON s.tenant_id = t.id
                LEFT JOIN users u ON s.user_id = u.id
                ${where} 
                ORDER BY s.created_at DESC 
                LIMIT ${parseInt(limit)} OFFSET ${offset}
            `, params);

            res.render('security_logs', {
                logs, active: 'security-logs', title: 'ประวัติความปลอดภัย',
                filter: { event_type: event_type || '', severity: severity || '', limit: parseInt(limit) },
                pagination: { currentPage: parseInt(page), totalPages, totalItems, limit: parseInt(limit) },
                user: req.session.user,
                _csrf: req.csrfToken ? req.csrfToken() : ''
            });
        } catch (err) { res.status(500).send(err.message); }
    }
}

module.exports = new ManagementController();
