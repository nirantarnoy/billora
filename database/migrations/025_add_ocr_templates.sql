-- Migration: Add OCR Templates and Bill Sync Status
-- Created: 2026-02-08

CREATE TABLE IF NOT EXISTS `ocr_templates` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `match_keyword` varchar(255) NOT NULL COMMENT 'คำค้นหาใน raw_text เพื่อระบุแม่แบบนี้',
  `description` text DEFAULT NULL,
  `system_prompt` text DEFAULT NULL COMMENT 'Prompt เฉพาะสำหรับแม่แบบนี้',
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_template_tenant` (`tenant_id`),
  CONSTRAINT `fk_templates_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add sync status to bills if not exists
SET @dropdown_query = IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'bills' AND COLUMN_NAME = 'sync_status') = 0,
    'ALTER TABLE `bills` ADD COLUMN `sync_status` enum("pending","synced","failed") DEFAULT "pending" AFTER `ai_audit_result`',
    'SELECT 1'
);
PREPARE stmt FROM @dropdown_query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ext_id_query = IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'bills' AND COLUMN_NAME = 'external_id') = 0,
    'ALTER TABLE `bills` ADD COLUMN `external_id` varchar(100) DEFAULT NULL AFTER `sync_status`',
    'SELECT 1'
);
PREPARE stmt FROM @ext_id_query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
