-- Migration: Add index to status and type in ocr_logs for better performance
-- Created: 2026-02-09

-- เพิ่ม Index ให้กับ status และ type เพื่อให้ดึงประวัติการตรวจสอบได้เร็วขึ้น
SET @idx_query = IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ocr_logs' AND INDEX_NAME = 'idx_logs_status_type') = 0,
    'CREATE INDEX idx_logs_status_type ON ocr_logs(tenant_id, status, type)',
    'SELECT 1'
);
PREPARE stmt FROM @idx_query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
