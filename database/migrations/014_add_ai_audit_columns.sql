-- Migration: Add AI Audit columns to slips and bills
ALTER TABLE `payment_slips` ADD COLUMN `ai_audit_result` JSON DEFAULT NULL AFTER `forgery_reasons`;
ALTER TABLE `bills` ADD COLUMN `ai_audit_result` JSON DEFAULT NULL AFTER `items`;
ALTER TABLE `ocr_logs` ADD COLUMN `ai_processed` TINYINT(1) DEFAULT 0 AFTER `trans_id`;
