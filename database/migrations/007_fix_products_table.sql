-- Add tenant_id to products if it doesn't exist
-- This is needed because 'products' table might have existed from a previous version

SET @dbname = DATABASE();
SET @tablename = "products";
SET @columnname = "tenant_id";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 1",
  "ALTER TABLE products ADD COLUMN tenant_id INT NOT NULL DEFAULT 1 AFTER id, ADD INDEX idx_product_tenant (tenant_id)"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Also check if image_urls is JSON or text
-- If it was old, it might be different. But we'll assume it's okay or we'll fix it if we hit errors.
