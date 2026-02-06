-- Marketplace Connections Table
-- stores API keys, access tokens, and refresh tokens securely
CREATE TABLE IF NOT EXISTS marketplace_connections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    platform VARCHAR(50) NOT NULL COMMENT 'shopee, tiktok, lazada',
    shop_id VARCHAR(100) NOT NULL COMMENT 'รหัสร้านค้าของ platform',
    shop_name VARCHAR(255) COMMENT 'ชื่อร้านค้า',
    
    -- API Credentials (ENCRYPTED)
    access_token TEXT COMMENT 'Access Token (Encrypted)',
    refresh_token TEXT COMMENT 'Refresh Token (Encrypted)',
    
    -- Token Expiry
    access_token_expires_at DATETIME,
    refresh_token_expires_at DATETIME,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    last_sync_at DATETIME,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_conn_tenant (tenant_id),
    INDEX idx_conn_platform (platform),
    INDEX idx_conn_shop (shop_id),
    CONSTRAINT fk_marketplace_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางเก็บการเชื่อมต่อ Marketplace ของลูกค้า';
