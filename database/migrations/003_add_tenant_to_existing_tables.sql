-- เพิ่ม tenant_id ให้กับตารางที่มีอยู่แล้ว เพื่อรองรับ Multi-tenant
-- ใช้ IF NOT EXISTS เพื่อป้องกัน error

-- ตาราง bills (ถ้ามี)
SET @exist := (SELECT COUNT(*) FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'bills' 
    AND COLUMN_NAME = 'tenant_id');

SET @sqlstmt := IF(@exist = 0, 
    'ALTER TABLE bills 
     ADD COLUMN tenant_id INT NULL AFTER id,
     ADD INDEX idx_bills_tenant_id (tenant_id),
     ADD CONSTRAINT fk_bills_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE',
    'SELECT "Column tenant_id already exists in bills" AS message');

PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ตาราง payment_slips (ถ้ามี)
SET @exist := (SELECT COUNT(*) FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'payment_slips' 
    AND COLUMN_NAME = 'tenant_id');

SET @sqlstmt := IF(@exist = 0, 
    'ALTER TABLE payment_slips 
     ADD COLUMN tenant_id INT NULL AFTER id,
     ADD INDEX idx_payment_slips_tenant_id (tenant_id),
     ADD CONSTRAINT fk_payment_slips_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE',
    'SELECT "Column tenant_id already exists in payment_slips" AS message');

PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
