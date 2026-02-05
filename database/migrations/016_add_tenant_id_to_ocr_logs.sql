-- เพิ่ม tenant_id ให้กับตาราง ocr_logs
ALTER TABLE ocr_logs ADD COLUMN tenant_id INT NULL AFTER user_id;
ALTER TABLE ocr_logs ADD INDEX idx_ocr_logs_tenant_id (tenant_id);
ALTER TABLE ocr_logs ADD CONSTRAINT fk_ocr_logs_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
