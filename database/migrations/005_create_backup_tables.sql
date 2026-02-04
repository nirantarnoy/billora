-- ตาราง Backup Schedules (กำหนดการ Backup อัตโนมัติ)
CREATE TABLE IF NOT EXISTS backup_schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NULL COMMENT 'NULL = Full backup, มีค่า = Tenant backup',
    
    -- Schedule Settings
    name VARCHAR(255) NOT NULL COMMENT 'ชื่อ Schedule',
    description TEXT COMMENT 'คำอธิบาย',
    cron_expression VARCHAR(100) NOT NULL COMMENT 'Cron expression (e.g., 0 2 * * * = ทุกวัน 2:00 AM)',
    backup_type ENUM('full', 'tenant') DEFAULT 'full' COMMENT 'ประเภท Backup',
    
    -- Retention Policy
    retention_days INT DEFAULT 7 COMMENT 'เก็บไฟล์ Backup กี่วัน',
    max_backups INT DEFAULT 10 COMMENT 'เก็บไฟล์สูงสุดกี่ไฟล์',
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE COMMENT 'เปิดใช้งาน',
    last_run_at TIMESTAMP NULL COMMENT 'รันครั้งล่าสุดเมื่อไหร่',
    next_run_at TIMESTAMP NULL COMMENT 'รันครั้งถัดไปเมื่อไหร่',
    
    -- Notification
    notify_on_success BOOLEAN DEFAULT FALSE COMMENT 'แจ้งเตือนเมื่อสำเร็จ',
    notify_on_failure BOOLEAN DEFAULT TRUE COMMENT 'แจ้งเตือนเมื่อล้มเหลว',
    notification_email VARCHAR(255) COMMENT 'อีเมลสำหรับแจ้งเตือน',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT COMMENT 'ผู้สร้าง',
    
    -- Indexes
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_is_active (is_active),
    INDEX idx_next_run (next_run_at),
    
    -- Foreign Keys
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางกำหนดการ Backup อัตโนมัติ';

-- ตาราง Backup History (ประวัติการ Backup)
CREATE TABLE IF NOT EXISTS backup_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    schedule_id INT NULL COMMENT 'อ้างอิงจาก backup_schedules (NULL = Manual backup)',
    
    -- Backup Info
    filename VARCHAR(255) NOT NULL COMMENT 'ชื่อไฟล์',
    filepath VARCHAR(500) NOT NULL COMMENT 'ที่อยู่ไฟล์',
    file_size BIGINT COMMENT 'ขนาดไฟล์ (bytes)',
    backup_type ENUM('full', 'tenant', 'manual') DEFAULT 'manual',
    
    -- Status
    status ENUM('pending', 'running', 'success', 'failed') DEFAULT 'pending',
    error_message TEXT COMMENT 'ข้อความ Error (ถ้ามี)',
    
    -- Duration
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    duration_seconds INT COMMENT 'ระยะเวลาที่ใช้ (วินาที)',
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT COMMENT 'ผู้ทำ Backup (NULL = Auto)',
    
    -- Indexes
    INDEX idx_schedule_id (schedule_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    
    -- Foreign Keys
    FOREIGN KEY (schedule_id) REFERENCES backup_schedules(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางประวัติการ Backup';

-- Insert Default Schedules
INSERT INTO backup_schedules (name, description, cron_expression, backup_type, retention_days, is_active) VALUES
('Daily Full Backup', 'สำรองข้อมูลทั้งหมดทุกวันเวลา 02:00 AM', '0 2 * * *', 'full', 7, TRUE),
('Weekly Full Backup', 'สำรองข้อมูลทั้งหมดทุกวันอาทิตย์เวลา 03:00 AM', '0 3 * * 0', 'full', 30, FALSE);
