-- Add Remote Backup Configuration to backup_schedules
ALTER TABLE backup_schedules
ADD COLUMN remote_storage_type ENUM('none', 'sftp', 'ftp') DEFAULT 'none' AFTER notification_email,
ADD COLUMN remote_host VARCHAR(255) NULL AFTER remote_storage_type,
ADD COLUMN remote_port INT DEFAULT 22 AFTER remote_host,
ADD COLUMN remote_username VARCHAR(255) NULL AFTER remote_port,
ADD COLUMN remote_password VARCHAR(255) NULL AFTER remote_username,
ADD COLUMN remote_path VARCHAR(255) DEFAULT '/' AFTER remote_password;

-- Add Remote Status to backup_history
ALTER TABLE backup_history
ADD COLUMN remote_status ENUM('pending', 'success', 'failed', 'skipped') DEFAULT 'skipped' AFTER status,
ADD COLUMN remote_error_message TEXT NULL AFTER remote_status;
