const db = require('../config/db');
const { recordAction } = require('../utils/logger');
const fs = require('fs');
const path = require('path');
const { exec, execSync } = require('child_process');

// Helper function to find mysqldump executable
function findMysqldump() {
    // Try to find mysqldump using 'where' command on Windows
    try {
        const result = execSync('where mysqldump', { encoding: 'utf8' });
        const paths = result.trim().split('\n');
        if (paths.length > 0 && paths[0]) {
            return `"${paths[0].trim()}"`;
        }
    } catch (err) {
        // 'where' command failed, mysqldump not in PATH
    }

    // Common MySQL installation paths on Windows
    const possiblePaths = [
        'E:\\xampp\\mysql\\bin\\mysqldump.exe',
        'C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysqldump.exe',
        'C:\\Program Files\\MySQL\\MySQL Server 5.7\\bin\\mysqldump.exe',
        'C:\\Program Files (x86)\\MySQL\\MySQL Server 8.0\\bin\\mysqldump.exe',
        'C:\\Program Files (x86)\\MySQL\\MySQL Server 5.7\\bin\\mysqldump.exe',
        'C:\\wamp64\\bin\\mysql\\mysql8.0.27\\bin\\mysqldump.exe',
        'C:\\laragon\\bin\\mysql\\mysql-8.0.30-winx64\\bin\\mysqldump.exe',
        'C:\\MariaDB\\bin\\mysqldump.exe'
    ];

    // Find the first existing path
    for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
            return `"${p}"`;
        }
    }

    // Fallback to just 'mysqldump' and hope it's in PATH
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

        // Get MySQL credentials from environment
        const dbUser = process.env.DB_USER || 'root';
        const dbPassword = process.env.DB_PASSWORD || '';
        const dbName = process.env.DB_NAME || 'bill_ocr';

        // Find mysqldump executable
        const mysqldumpCmd = findMysqldump();

        // Build command with password handling
        let cmd;
        if (dbPassword) {
            cmd = `${mysqldumpCmd} -u ${dbUser} -p${dbPassword} ${dbName} > "${filePath}"`;
        } else {
            cmd = `${mysqldumpCmd} -u ${dbUser} ${dbName} > "${filePath}"`;
        }

        console.log('Backup command:', cmd.replace(/-p\S+/, '-p***')); // Log without password

        exec(cmd, async (err, stdout, stderr) => {
            if (err) {
                console.error('Backup Error:', err);
                console.error('stderr:', stderr);
                return res.redirect('/admin/backup?error=' + encodeURIComponent('ไม่สามารถสำรองข้อมูลได้: ' + err.message));
            }
            await recordAction(req.session.user.id, 'Create Backup', `สร้างไฟล์สำรอง ${fileName}`, req);
            res.redirect('/admin/backup?success=' + encodeURIComponent('สำรองข้อมูลสำเร็จ: ' + fileName));
        });
    }

    async deleteBackup(req, res) {
        const { fileName } = req.body;
        const filePath = path.join(__dirname, '../../backups', fileName);

        try {
            // Check if file exists
            if (!fs.existsSync(filePath)) {
                return res.redirect('/admin/backup?error=' + encodeURIComponent('ไม่พบไฟล์ที่ต้องการลบ'));
            }

            // Delete file
            fs.unlinkSync(filePath);

            await recordAction(req.session.user.id, 'Delete Backup', `ลบไฟล์สำรอง ${fileName}`, req);
            res.redirect('/admin/backup?success=' + encodeURIComponent('ลบไฟล์สำรองสำเร็จ'));
        } catch (err) {
            console.error('Delete Backup Error:', err);
            res.redirect('/admin/backup?error=' + encodeURIComponent('ไม่สามารถลบไฟล์ได้: ' + err.message));
        }
    }

    async restoreBackup(req, res) {
        const { fileName } = req.body;
        const filePath = path.join(__dirname, '../../backups', fileName);

        try {
            // Check if file exists
            if (!fs.existsSync(filePath)) {
                return res.redirect('/admin/backup?error=' + encodeURIComponent('ไม่พบไฟล์ที่ต้องการคืนค่า'));
            }

            // Get MySQL credentials from environment
            const dbUser = process.env.DB_USER || 'root';
            const dbPassword = process.env.DB_PASSWORD || '';
            const dbName = process.env.DB_NAME || 'bill_ocr';

            // Find mysql executable
            const mysqlCmd = findMysqldump().replace('mysqldump', 'mysql');

            // Build restore command
            let cmd;
            if (dbPassword) {
                cmd = `${mysqlCmd} -u ${dbUser} -p${dbPassword} ${dbName} < "${filePath}"`;
            } else {
                cmd = `${mysqlCmd} -u ${dbUser} ${dbName} < "${filePath}"`;
            }

            console.log('Restore command:', cmd.replace(/-p\S+/, '-p***'));

            exec(cmd, async (err, stdout, stderr) => {
                if (err) {
                    console.error('Restore Error:', err);
                    console.error('stderr:', stderr);
                    return res.redirect('/admin/backup?error=' + encodeURIComponent('ไม่สามารถคืนค่าข้อมูลได้: ' + err.message));
                }
                await recordAction(req.session.user.id, 'Restore Backup', `คืนค่าข้อมูลจากไฟล์ ${fileName}`, req);
                res.redirect('/admin/backup?success=' + encodeURIComponent('คืนค่าข้อมูลสำเร็จ'));
            });
        } catch (err) {
            console.error('Restore Backup Error:', err);
            res.redirect('/admin/backup?error=' + encodeURIComponent('เกิดข้อผิดพลาด: ' + err.message));
        }
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

            // Count total
            const [countRows] = await db.execute(`
                SELECT COUNT(*) as total 
                FROM action_logs al 
                ${where}
            `, params);
            const totalItems = countRows[0].total;
            const totalPages = Math.ceil(totalItems / parseInt(limit));

            // Fetch Data
            const [logs] = await db.execute(`
                SELECT al.*, u.username 
                FROM action_logs al 
                LEFT JOIN users u ON al.user_id = u.id 
                ${where} 
                ORDER BY al.created_at DESC 
                LIMIT ${parseInt(limit)} OFFSET ${offset}
            `, params);

            const [users] = await db.execute('SELECT id, username FROM users ORDER BY username ASC');

            const filter = {
                user_id: user_id || '',
                startDate: startDate || '',
                endDate: endDate || '',
                limit: parseInt(limit)
            };

            res.render('action_logs', {
                logs,
                users,
                filter,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalItems,
                    limit: parseInt(limit)
                },
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
