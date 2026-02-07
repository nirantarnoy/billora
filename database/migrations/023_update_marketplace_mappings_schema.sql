-- Migration to update marketplace product mappings with model and SKU IDs
-- Necessary for accurate stock updates on Shopee and TikTok

ALTER TABLE marketplace_product_mappings ADD COLUMN marketplace_model_id VARCHAR(255) AFTER marketplace_product_id;
ALTER TABLE marketplace_product_mappings ADD COLUMN marketplace_sku_id VARCHAR(255) AFTER marketplace_model_id;
ALTER TABLE marketplace_product_mappings ADD COLUMN marketplace_warehouse_id VARCHAR(255) AFTER marketplace_sku_id;
