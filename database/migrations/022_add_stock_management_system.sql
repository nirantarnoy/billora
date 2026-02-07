-- Migration for Stock Management Feature
-- Added manually to sync development with production server

-- 1. Add stock-related columns to the product table
ALTER TABLE product ADD COLUMN qty_on_hand DECIMAL(15,4) DEFAULT 0;
ALTER TABLE product ADD COLUMN qty_reserved DECIMAL(15,4) DEFAULT 0;

-- 2. Create tracking table for inventory movements per order
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางติดตามสถานะการตัดสต๊อกรายออเดอร์';
