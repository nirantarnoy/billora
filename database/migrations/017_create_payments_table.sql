-- ตารางบันทึกการชำระเงิน
CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    subscription_id INT, -- FK ไปยัง tenant_subscriptions (ถ้าสมัครสมาชิก)
    
    transaction_no VARCHAR(100) UNIQUE NOT NULL COMMENT 'เลขที่รายการภายใน',
    omise_charge_id VARCHAR(100) COMMENT 'ID จาก Omise',
    
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'THB',
    
    payment_method ENUM('credit_card', 'promptpay', 'internet_banking', 'bill_payment') NOT NULL,
    status ENUM('pending', 'succeeded', 'failed', 'expired', 'reversed') DEFAULT 'pending',
    
    failure_code VARCHAR(100),
    failure_message TEXT,
    
    omise_raw_data JSON COMMENT 'ข้อมูลดิบจาก Omise',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_omise_charge (omise_charge_id),
    INDEX idx_status (status),
    
    CONSTRAINT fk_payments_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
