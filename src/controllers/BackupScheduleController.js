/**
 * Backup Schedule Controller
 * จัดการ Auto Backup Schedules
 */

const pool = require('../config/db');
const backupScheduler = require('../services/BackupScheduler');

class BackupScheduleController {
    /**
     * แสดงหน้าจัดการ Backup Schedules
     */
    async index(req, res) {
        try {
            const [schedules] = await pool.query(`
                SELECT 
                    bs.*,
                    t.company_name as tenant_name,
                    u.username as created_by_name,
                    (SELECT COUNT(*) FROM backup_history WHERE schedule_id = bs.id AND status = 'success') as success_count,
                    (SELECT COUNT(*) FROM backup_history WHERE schedule_id = bs.id AND status = 'failed') as failed_count
                FROM backup_schedules bs
                LEFT JOIN tenants t ON bs.tenant_id = t.id
                LEFT JOIN users u ON bs.created_by = u.id
                ORDER BY bs.created_at DESC
            `);

            res.render('backup-schedules', {
                title: 'จัดการ Auto Backup',
                active: 'backup',
                schedules,
                _csrf: req.csrfToken ? req.csrfToken() : ''
            });
        } catch (error) {
            console.error('Error loading backup schedules:', error);
            res.status(500).send('Internal Server Error');
        }
    }

    /**
     * สร้าง Schedule ใหม่
     */
    async create(req, res) {
        try {
            const {
                name,
                description,
                cron_expression,
                backup_type,
                tenant_id,
                retention_days,
                max_backups,
                notify_on_success,
                notify_on_failure,
                notification_email
            } = req.body;

            const userId = req.session.user.id;

            // Validate cron expression
            const cron = require('node-cron');
            if (!cron.validate(cron_expression)) {
                return res.status(400).json({
                    success: false,
                    message: 'Cron expression ไม่ถูกต้อง'
                });
            }

            // Insert schedule
            const [result] = await pool.query(`
                INSERT INTO backup_schedules 
                (name, description, cron_expression, backup_type, tenant_id, 
                 retention_days, max_backups, notify_on_success, notify_on_failure, 
                 notification_email, created_by)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                name, description, cron_expression, backup_type, tenant_id || null,
                retention_days, max_backups, notify_on_success, notify_on_failure,
                notification_email, userId
            ]);

            // Load schedule into scheduler
            const [newSchedule] = await pool.query(
                'SELECT * FROM backup_schedules WHERE id = ?',
                [result.insertId]
            );

            backupScheduler.addSchedule(newSchedule[0]);

            res.json({
                success: true,
                message: 'สร้าง Schedule สำเร็จ',
                data: { id: result.insertId }
            });
        } catch (error) {
            console.error('Error creating backup schedule:', error);
            res.status(500).json({
                success: false,
                message: 'เกิดข้อผิดพลาดในการสร้าง Schedule'
            });
        }
    }

    /**
     * อัพเดท Schedule
     */
    async update(req, res) {
        try {
            const { id } = req.params;
            const {
                name,
                description,
                cron_expression,
                backup_type,
                tenant_id,
                retention_days,
                max_backups,
                is_active,
                notify_on_success,
                notify_on_failure,
                notification_email
            } = req.body;

            // Validate cron expression
            const cron = require('node-cron');
            if (!cron.validate(cron_expression)) {
                return res.status(400).json({
                    success: false,
                    message: 'Cron expression ไม่ถูกต้อง'
                });
            }

            // Update schedule
            await pool.query(`
                UPDATE backup_schedules SET
                    name = ?,
                    description = ?,
                    cron_expression = ?,
                    backup_type = ?,
                    tenant_id = ?,
                    retention_days = ?,
                    max_backups = ?,
                    is_active = ?,
                    notify_on_success = ?,
                    notify_on_failure = ?,
                    notification_email = ?
                WHERE id = ?
            `, [
                name, description, cron_expression, backup_type, tenant_id || null,
                retention_days, max_backups, is_active, notify_on_success,
                notify_on_failure, notification_email, id
            ]);

            // Reload schedule
            const [updatedSchedule] = await pool.query(
                'SELECT * FROM backup_schedules WHERE id = ?',
                [id]
            );

            if (is_active) {
                backupScheduler.addSchedule(updatedSchedule[0]);
            } else {
                backupScheduler.removeSchedule(parseInt(id));
            }

            res.json({
                success: true,
                message: 'อัพเดท Schedule สำเร็จ'
            });
        } catch (error) {
            console.error('Error updating backup schedule:', error);
            res.status(500).json({
                success: false,
                message: 'เกิดข้อผิดพลาดในการอัพเดท Schedule'
            });
        }
    }

    /**
     * ลบ Schedule
     */
    async delete(req, res) {
        try {
            const { id } = req.params;

            // Remove from scheduler
            backupScheduler.removeSchedule(parseInt(id));

            // Delete from database
            await pool.query('DELETE FROM backup_schedules WHERE id = ?', [id]);

            res.json({
                success: true,
                message: 'ลบ Schedule สำเร็จ'
            });
        } catch (error) {
            console.error('Error deleting backup schedule:', error);
            res.status(500).json({
                success: false,
                message: 'เกิดข้อผิดพลาดในการลบ Schedule'
            });
        }
    }

    /**
     * เปิด/ปิด Schedule
     */
    async toggle(req, res) {
        try {
            const { id } = req.params;

            const [schedule] = await pool.query(
                'SELECT * FROM backup_schedules WHERE id = ?',
                [id]
            );

            if (schedule.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'ไม่พบ Schedule'
                });
            }

            const newStatus = !schedule[0].is_active;

            await pool.query(
                'UPDATE backup_schedules SET is_active = ? WHERE id = ?',
                [newStatus, id]
            );

            if (newStatus) {
                const [updatedSchedule] = await pool.query(
                    'SELECT * FROM backup_schedules WHERE id = ?',
                    [id]
                );
                backupScheduler.addSchedule(updatedSchedule[0]);
            } else {
                backupScheduler.removeSchedule(parseInt(id));
            }

            res.json({
                success: true,
                message: newStatus ? 'เปิดใช้งาน Schedule' : 'ปิดใช้งาน Schedule',
                is_active: newStatus
            });
        } catch (error) {
            console.error('Error toggling backup schedule:', error);
            res.status(500).json({
                success: false,
                message: 'เกิดข้อผิดพลาด'
            });
        }
    }

    /**
     * รัน Backup ทันที
     */
    async runNow(req, res) {
        try {
            const { id } = req.params;

            const [schedule] = await pool.query(
                'SELECT * FROM backup_schedules WHERE id = ?',
                [id]
            );

            if (schedule.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'ไม่พบ Schedule'
                });
            }

            // Run backup
            await backupScheduler.executeBackup(schedule[0]);

            res.json({
                success: true,
                message: 'เริ่มทำ Backup แล้ว'
            });
        } catch (error) {
            console.error('Error running backup:', error);
            res.status(500).json({
                success: false,
                message: 'เกิดข้อผิดพลาดในการทำ Backup'
            });
        }
    }

    /**
     * ดูประวัติ Backup
     */
    async history(req, res) {
        try {
            const { schedule_id } = req.query;

            let query = `
                SELECT 
                    bh.*,
                    bs.name as schedule_name,
                    u.username as created_by_name
                FROM backup_history bh
                LEFT JOIN backup_schedules bs ON bh.schedule_id = bs.id
                LEFT JOIN users u ON bh.created_by = u.id
            `;

            const params = [];

            if (schedule_id) {
                query += ' WHERE bh.schedule_id = ?';
                params.push(schedule_id);
            }

            query += ' ORDER BY bh.created_at DESC LIMIT 100';

            const [history] = await pool.query(query, params);

            res.json({
                success: true,
                data: history
            });
        } catch (error) {
            console.error('Error loading backup history:', error);
            res.status(500).json({
                success: false,
                message: 'เกิดข้อผิดพลาด'
            });
        }
    }
}

module.exports = new BackupScheduleController();
