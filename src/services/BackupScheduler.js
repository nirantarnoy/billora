/**
 * Backup Scheduler Service
 * ระบบจัดการ Auto Backup ตามเวลาที่กำหนด
 */

const cron = require('node-cron');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

class BackupScheduler {
    constructor() {
        this.tasks = new Map();
        // Use process.cwd() for standalone executable compatibility
        this.backupDir = path.join(process.cwd(), 'backups');

        // สร้างโฟลเดอร์ backup ถ้ายังไม่มี
        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir, { recursive: true });
        }
    }

    /**
     * เริ่มต้น Scheduler จากฐานข้อมูล
     */
    async init() {
        try {
            const [schedules] = await pool.query(`
                SELECT * FROM backup_schedules 
                WHERE is_active = TRUE
            `);

            for (const schedule of schedules) {
                this.addSchedule(schedule);
            }

            console.log(`✓ Loaded ${schedules.length} backup schedules`);
        } catch (error) {
            console.error('Error loading backup schedules:', error);
        }
    }

    /**
     * เพิ่ม Schedule ใหม่
     */
    addSchedule(schedule) {
        const { id, cron_expression, backup_type, retention_days } = schedule;

        // ตรวจสอบว่า cron expression ถูกต้องหรือไม่
        if (!cron.validate(cron_expression)) {
            console.error(`Invalid cron expression for schedule ${id}: ${cron_expression}`);
            return false;
        }

        // ลบ task เดิมถ้ามี
        this.removeSchedule(id);

        // สร้าง cron task ใหม่
        const task = cron.schedule(cron_expression, async () => {
            console.log(`Running backup schedule ${id} at ${new Date().toISOString()}`);
            await this.executeBackup(schedule);
        });

        this.tasks.set(id, task);
        console.log(`✓ Added backup schedule ${id}: ${cron_expression}`);
        return true;
    }

    /**
     * ลบ Schedule
     */
    removeSchedule(scheduleId) {
        const task = this.tasks.get(scheduleId);
        if (task) {
            task.stop();
            this.tasks.delete(scheduleId);
            console.log(`✓ Removed backup schedule ${scheduleId}`);
            return true;
        }
        return false;
    }

    /**
     * ดึงรายชื่อตารางที่มี tenant_id (Dynamic Table Detection)
     */
    async getTenantTables() {
        try {
            const dbName = process.env.DB_NAME || 'bill_ocr';
            const [rows] = await pool.query(`
                SELECT TABLE_NAME 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE COLUMN_NAME = 'tenant_id' 
                AND TABLE_SCHEMA = ?
            `, [dbName]);

            // รายชื่อตารางหลักที่ต้อง Backup เสมอ
            const defaultTables = ['users', 'bills', 'payment_slips'];

            // รวมตารางที่ตรวจพบกับตารางหลัก (Unique)
            const foundTables = rows.map(r => r.TABLE_NAME);
            const allTables = [...new Set([...defaultTables, ...foundTables])];

            return allTables.join(' ');
        } catch (error) {
            console.error('Error fetching tenant tables:', error);
            // Fallback
            return 'users bills payment_slips';
        }
    }

    /**
     * ทำการ Backup
     */
    async executeBackup(schedule) {
        const { id, backup_type, retention_days, tenant_id } = schedule;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        let historyId = null;

        try {
            let filename, command;

            if (backup_type === 'full') {
                // Full Database Backup
                filename = `backup_full_${timestamp}.sql`;
                command = this.getFullBackupCommand(filename);
            } else if (backup_type === 'tenant') {
                // Tenant-specific Backup
                filename = `backup_tenant_${tenant_id}_${timestamp}.sql`;

                // ใช้ Dynamic Tables แทนการ Hardcode
                const tables = await this.getTenantTables();
                console.log(`[Backup ${id}] Backing up tables for tenant ${tenant_id}: ${tables}`);

                command = this.getTenantBackupCommand(filename, tenant_id, tables);
            }

            const filepath = path.join(this.backupDir, filename);

            // Execute backup
            await this.runCommand(command);

            // บันทึกประวัติ (Local Success)
            historyId = await this.logBackup(id, filename, filepath);

            // ลบไฟล์เก่าตาม retention policy
            await this.cleanOldBackups(retention_days);

            console.log(`✓ Backup completed: ${filename}`);

            // Remove/Remote Backup Logic
            if (schedule.remote_storage_type === 'sftp') {
                try {
                    await this.uploadToRemote(schedule, filepath, filename);
                    await this.updateRemoteStatus(historyId, 'success');
                } catch (remoteErr) {
                    await this.updateRemoteStatus(historyId, 'failed', remoteErr.message);
                }
            }

        } catch (error) {
            console.error(`✗ Backup failed for schedule ${id}:`, error);
            if (historyId) {
                await this.logBackupError(id, error.message);
            } else {
                await this.logBackupError(id, error.message);
            }
        }
    }

    /**
     * อัปโหลดไฟล์ไปยัง Remote Server (SFTP)
     */
    async uploadToRemote(schedule, localFilePath, filename) {
        console.log(`[Backup ${schedule.id}] Uploading to remote server (${schedule.remote_host})...`);

        let Client;
        try {
            Client = require('ssh2-sftp-client');
        } catch (e) {
            console.warn("Module 'ssh2-sftp-client' not found. Please install it with 'npm install ssh2-sftp-client'");
            throw new Error("Module 'ssh2-sftp-client' not found.");
        }

        const sftp = new Client();

        const config = {
            host: schedule.remote_host,
            port: schedule.remote_port || 22,
            username: schedule.remote_username,
            password: schedule.remote_password
        };

        try {
            await sftp.connect(config);
            // Use posix path for remote server
            const remotePath = (schedule.remote_path || '/').replace(/\\/g, '/') + '/' + filename;
            await sftp.put(localFilePath, remotePath);
            await sftp.end();
            console.log(`✓ Uploaded to remote: ${remotePath}`);
            return true;
        } catch (err) {
            console.error(`✗ Remote upload failed: ${err.message}`);
            throw err;
        }
    }

    /**
     * ค้นหา path ของ mysqldump
     */
    findMysqldump() {
        const { execSync } = require('child_process');

        // Try to find mysqldump using 'where' command on Windows
        try {
            const result = execSync('where mysqldump', { encoding: 'utf8' });
            const paths = result.trim().split('\n');
            if (paths.length > 0 && paths[0]) {
                return `"${paths[0].trim()}"`;
            }
        } catch (err) {
            // 'where' command failed
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

        for (const p of possiblePaths) {
            if (fs.existsSync(p)) {
                return `"${p}"`;
            }
        }

        return 'mysqldump';
    }

    /**
     * ค้นหา path ของ mysql (client) สำหรับ Restore
     */
    findMysqlClient() {
        const { execSync } = require('child_process');

        // ลองหา mysql จาก path เดียวกับ mysqldump ก่อน
        const mysqldumpPath = this.findMysqldump().replace(/"/g, '');
        if (mysqldumpPath.endsWith('mysqldump.exe')) {
            const mysqlPath = mysqldumpPath.replace('mysqldump.exe', 'mysql.exe');
            if (fs.existsSync(mysqlPath)) {
                return `"${mysqlPath}"`;
            }
        }

        try {
            const result = execSync('where mysql', { encoding: 'utf8' });
            const paths = result.trim().split('\n');
            if (paths.length > 0 && paths[0]) {
                return `"${paths[0].trim()}"`;
            }
        } catch (err) { }

        return 'mysql';
    }

    /**
     * คำสั่ง Backup ทั้งหมด
     */
    getFullBackupCommand(filename) {
        const filepath = path.join(this.backupDir, filename);
        const dbConfig = {
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'bill_ocr'
        };

        const mysqldump = this.findMysqldump();

        return `${mysqldump} -h ${dbConfig.host} -u ${dbConfig.user} ${dbConfig.password ? `-p${dbConfig.password}` : ''} ${dbConfig.database} > "${filepath}"`;
    }

    /**
     * คำสั่ง Backup เฉพาะ Tenant
     */
    getTenantBackupCommand(filename, tenantId, tables) {
        const filepath = path.join(this.backupDir, filename);
        const dbConfig = {
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'bill_ocr'
        };

        const mysqldump = this.findMysqldump();

        // ใช้รายชื่อตารางที่ส่งเข้ามา (Dynamic)
        const where = `--where="tenant_id=${tenantId}"`;

        return `${mysqldump} -h ${dbConfig.host} -u ${dbConfig.user} ${dbConfig.password ? `-p${dbConfig.password}` : ''} ${dbConfig.database} ${tables} ${where} > "${filepath}"`;
    }

    /**
     * Restore database from file
     */
    async restoreBackup(filepath) {
        if (!fs.existsSync(filepath)) {
            throw new Error('ไม่พบไฟล์ Backup');
        }

        const dbConfig = {
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'bill_ocr'
        };

        const mysql = this.findMysqlClient();

        // Command: mysql -u user -p dbname < file.sql
        const command = `${mysql} -h ${dbConfig.host} -u ${dbConfig.user} ${dbConfig.password ? `-p${dbConfig.password}` : ''} ${dbConfig.database} < "${filepath}"`;

        console.log(`Restoring backup from ${filepath}...`);
        await this.runCommand(command);
        console.log('✓ Restore completed successfully');
        return true;
    }

    /**
     * รันคำสั่ง Shell
     */
    runCommand(command) {
        return new Promise((resolve, reject) => {
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(stdout);
                }
            });
        });
    }

    /**
     * บันทึกประวัติ Backup
     */
    async logBackup(scheduleId, filename, filepath) {
        try {
            const stats = fs.statSync(filepath);

            const [result] = await pool.query(`
                INSERT INTO backup_history 
                (schedule_id, filename, file_path, file_size, status, created_at)
                VALUES (?, ?, ?, ?, 'success', NOW())
            `, [scheduleId, filename, filepath, stats.size]);


            return result.insertId;
        } catch (error) {
            console.error('Error logging backup:', error);
            return null;
        }
    }

    /**
     * อัปเดตสถานะ Remote Backup
     */
    async updateRemoteStatus(historyId, status, errorMessage = null) {
        if (!historyId) return;
        try {
            await pool.query(`
                UPDATE backup_history 
                SET remote_status = ?, remote_error_message = ? 
                WHERE id = ?
            `, [status, errorMessage, historyId]);
        } catch (error) {
            console.error('Error updating remote status:', error);
        }
    }

    /**
     * บันทึก Error
     */
    async logBackupError(scheduleId, errorMessage) {
        try {
            await pool.query(`
                INSERT INTO backup_history 
                (schedule_id, status, error_message, created_at)
                VALUES (?, 'failed', ?, NOW())
            `, [scheduleId, errorMessage]);
        } catch (error) {
            console.error('Error logging backup error:', error);
        }
    }

    /**
     * ลบไฟล์ Backup เก่า
     */
    async cleanOldBackups(retentionDays) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

            // ลบจากฐานข้อมูล
            const [oldBackups] = await pool.query(`
                SELECT file_path FROM backup_history 
                WHERE created_at < ? AND status = 'success'
            `, [cutoffDate]);


            // ลบไฟล์
            for (const backup of oldBackups) {
                if (fs.existsSync(backup.file_path)) {
                    fs.unlinkSync(backup.file_path);
                }
            }


            // ลบ record จากฐานข้อมูล
            await pool.query(`
                DELETE FROM backup_history 
                WHERE created_at < ?
            `, [cutoffDate]);

            console.log(`✓ Cleaned ${oldBackups.length} old backups`);
        } catch (error) {
            console.error('Error cleaning old backups:', error);
        }
    }

    /**
     * รีโหลด Schedule ทั้งหมด
     */
    async reload() {
        // หยุด tasks ทั้งหมด
        for (const [id, task] of this.tasks) {
            task.stop();
        }
        this.tasks.clear();

        // โหลดใหม่
        await this.init();
    }

    /**
     * หยุด Scheduler ทั้งหมด
     */
    stopAll() {
        for (const [id, task] of this.tasks) {
            task.stop();
        }
        this.tasks.clear();
        console.log('✓ All backup schedules stopped');
    }
}

// Export singleton instance
module.exports = new BackupScheduler();
