-- Migration for Stock Management and Multi-channel Sync
-- This file combines latest migrations for easy deployment

-- 1. [022] Add stock-related columns to the product table
ALTER TABLE product ADD COLUMN IF NOT EXISTS qty_on_hand DECIMAL(15,4) DEFAULT 0;
ALTER TABLE product ADD COLUMN IF NOT EXISTS qty_reserved DECIMAL(15,4) DEFAULT 0;

-- 2. [022] Create tracking table for inventory movements per order
CREATE TABLE IF NOT EXISTS inventory_movement_status (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    order_sn VARCHAR(100) NOT NULL,
    sku VARCHAR(100) NOT NULL,
    movement_type ENUM('NONE', 'RESERVED', 'DEDUCTED') DEFAULT 'NONE',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_order_sku (user_id, order_sn, sku),
    INDEX idx_ims_user (user_id),
    INDEX idx_ims_order (order_sn)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. [023] Update marketplace mappings
ALTER TABLE marketplace_product_mappings ADD COLUMN IF NOT EXISTS marketplace_model_id VARCHAR(255) AFTER marketplace_product_id;
ALTER TABLE marketplace_product_mappings ADD COLUMN IF NOT EXISTS marketplace_sku_id VARCHAR(255) AFTER marketplace_model_id;
ALTER TABLE marketplace_product_mappings ADD COLUMN IF NOT EXISTS marketplace_warehouse_id VARCHAR(255) AFTER marketplace_sku_id;

-- 4. [024] Add source_platform to inventory transactions
ALTER TABLE inventory_transactions ADD COLUMN IF NOT EXISTS source_platform VARCHAR(50) DEFAULT 'web' AFTER reference_no;

-- Update existing records
UPDATE inventory_transactions SET source_platform = 'web' WHERE source_platform IS NULL;
