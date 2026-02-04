-- ตาราง Users (ผู้ใช้งาน) - รองรับ Multi-tenant
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL COMMENT 'รหัสองค์กรที่สังกัด',
    username VARCHAR(100) NOT NULL COMMENT 'ชื่อผู้ใช้',
    email VARCHAR(100) NOT NULL COMMENT 'อีเมล',
    password_hash VARCHAR(255) NOT NULL COMMENT 'รหัสผ่านที่เข้ารหัส',
    
    -- Personal Info
    first_name VARCHAR(100) COMMENT 'ชื่อจริง',
    last_name VARCHAR(100) COMMENT 'นามสกุล',
    phone VARCHAR(20) COMMENT 'เบอร์โทรศัพท์',
    avatar_url VARCHAR(255) COMMENT 'รูปโปรไฟล์',
    
    -- Role & Permissions
    role ENUM('owner', 'admin', 'manager', 'accountant', 'user') DEFAULT 'user' COMMENT 'บทบาท',
    permissions JSON COMMENT 'สิทธิ์การเข้าถึงแต่ละโมดูล',
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE COMMENT 'สถานะการใช้งาน',
    email_verified BOOLEAN DEFAULT FALSE COMMENT 'ยืนยันอีเมลแล้ว',
    email_verified_at TIMESTAMP NULL,
    
    -- Security
    last_login_at TIMESTAMP NULL COMMENT 'เข้าสู่ระบบล่าสุด',
    last_login_ip VARCHAR(45) COMMENT 'IP ที่เข้าสู่ระบบล่าสุด',
    failed_login_attempts INT DEFAULT 0 COMMENT 'จำนวนครั้งที่ล็อกอินผิด',
    locked_until TIMESTAMP NULL COMMENT 'ล็อกบัญชีจนถึง',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL COMMENT 'Soft delete',
    
    -- Indexes
    UNIQUE KEY unique_email_per_tenant (tenant_id, email),
    UNIQUE KEY unique_username_per_tenant (tenant_id, username),
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_is_active (is_active),
    
    -- Foreign Keys
    CONSTRAINT fk_users_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางผู้ใช้งาน (Multi-tenant)';
