-- ตาราง Tenants (องค์กร/บริษัท)
CREATE TABLE IF NOT EXISTS tenants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_code VARCHAR(50) UNIQUE NOT NULL COMMENT 'รหัสองค์กรที่ไม่ซ้ำ',
    company_name VARCHAR(255) NOT NULL COMMENT 'ชื่อบริษัท/องค์กร',
    company_name_en VARCHAR(255) COMMENT 'ชื่อบริษัทภาษาอังกฤษ',
    tax_id VARCHAR(20) COMMENT 'เลขประจำตัวผู้เสียภาษี',
    address TEXT COMMENT 'ที่อยู่',
    phone VARCHAR(20) COMMENT 'เบอร์โทรศัพท์',
    email VARCHAR(100) COMMENT 'อีเมล',
    logo_url VARCHAR(255) COMMENT 'โลโก้บริษัท',
    
    -- Subscription Info
    subscription_plan ENUM('free', 'basic', 'professional', 'enterprise') DEFAULT 'free' COMMENT 'แพ็กเกจที่ใช้',
    subscription_status ENUM('active', 'suspended', 'cancelled', 'expired') DEFAULT 'active' COMMENT 'สถานะการใช้งาน',
    subscription_start_date DATETIME COMMENT 'วันที่เริ่มใช้งาน',
    subscription_end_date DATETIME COMMENT 'วันที่หมดอายุ',
    
    -- Limits
    max_users INT DEFAULT 5 COMMENT 'จำนวนผู้ใช้สูงสุด',
    max_storage_mb INT DEFAULT 1024 COMMENT 'พื้นที่จัดเก็บสูงสุด (MB)',
    max_transactions_per_month INT DEFAULT 1000 COMMENT 'จำนวน transaction สูงสุดต่อเดือน',
    
    -- Settings
    settings JSON COMMENT 'การตั้งค่าเพิ่มเติม',
    features JSON COMMENT 'ฟีเจอร์ที่เปิดใช้งาน',
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE COMMENT 'สถานะการใช้งาน',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL COMMENT 'Soft delete',
    
    INDEX idx_tenant_code (tenant_code),
    INDEX idx_subscription_status (subscription_status),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางข้อมูลองค์กร/บริษัท (Tenants)';
