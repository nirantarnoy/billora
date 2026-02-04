-- ตาราง Subscription Plans
CREATE TABLE IF NOT EXISTS subscription_plans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    plan_code VARCHAR(50) UNIQUE NOT NULL COMMENT 'รหัสแพ็กเกจ',
    plan_name VARCHAR(100) NOT NULL COMMENT 'ชื่อแพ็กเกจ',
    plan_name_en VARCHAR(100) COMMENT 'ชื่อแพ็กเกจภาษาอังกฤษ',
    description TEXT COMMENT 'รายละเอียด',
    
    -- Pricing
    price_monthly DECIMAL(10,2) DEFAULT 0 COMMENT 'ราคาต่อเดือน',
    price_yearly DECIMAL(10,2) DEFAULT 0 COMMENT 'ราคาต่อปี',
    currency VARCHAR(3) DEFAULT 'THB' COMMENT 'สกุลเงิน',
    
    -- Limits
    max_users INT DEFAULT 5,
    max_storage_mb INT DEFAULT 1024,
    max_transactions_per_month INT DEFAULT 1000,
    
    -- Features
    features JSON COMMENT 'ฟีเจอร์ที่รองรับ',
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ตาราง Subscription History
CREATE TABLE IF NOT EXISTS tenant_subscriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    plan_id INT NOT NULL,
    
    -- Subscription Period
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    
    -- Payment
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'THB',
    payment_method ENUM('credit_card', 'bank_transfer', 'promptpay', 'other') COMMENT 'วิธีการชำระเงิน',
    payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
    payment_date DATETIME NULL,
    payment_reference VARCHAR(100) COMMENT 'เลขที่อ้างอิง',
    
    -- Invoice
    invoice_number VARCHAR(50) COMMENT 'เลขที่ใบแจ้งหนี้',
    invoice_url VARCHAR(255) COMMENT 'ลิงก์ใบแจ้งหนี้',
    
    -- Status
    status ENUM('active', 'expired', 'cancelled') DEFAULT 'active',
    auto_renew BOOLEAN DEFAULT FALSE COMMENT 'ต่ออายุอัตโนมัติ',
    
    -- Notes
    notes TEXT COMMENT 'หมายเหตุ',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_plan_id (plan_id),
    INDEX idx_status (status),
    INDEX idx_payment_status (payment_status),
    
    CONSTRAINT fk_tenant_subscriptions_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_tenant_subscriptions_plan FOREIGN KEY (plan_id) REFERENCES subscription_plans(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ข้อมูลแพ็กเกจเริ่มต้น
INSERT IGNORE INTO subscription_plans (plan_code, plan_name, plan_name_en, description, price_monthly, price_yearly, max_users, max_storage_mb, max_transactions_per_month, features) VALUES
('free', 'ฟรี', 'Free', 'แพ็กเกจทดลองใช้งาน', 0, 0, 2, 512, 100, 
    JSON_OBJECT(
        'ocr', true,
        'dashboard', true,
        'reports', false,
        'api_access', false,
        'support', 'email'
    )
),
('basic', 'เบสิค', 'Basic', 'แพ็กเกจสำหรับธุรกิจขนาดเล็ก', 499, 4990, 5, 2048, 1000,
    JSON_OBJECT(
        'ocr', true,
        'dashboard', true,
        'reports', true,
        'api_access', false,
        'support', 'email'
    )
),
('professional', 'โปร', 'Professional', 'แพ็กเกจสำหรับธุรกิจขนาดกลาง', 1499, 14990, 20, 10240, 5000,
    JSON_OBJECT(
        'ocr', true,
        'dashboard', true,
        'reports', true,
        'api_access', true,
        'support', 'priority'
    )
),
('enterprise', 'องค์กร', 'Enterprise', 'แพ็กเกจสำหรับองค์กรขนาดใหญ่', 4999, 49990, 100, 51200, 999999,
    JSON_OBJECT(
        'ocr', true,
        'dashboard', true,
        'reports', true,
        'api_access', true,
        'support', 'dedicated',
        'custom_features', true
    )
);
