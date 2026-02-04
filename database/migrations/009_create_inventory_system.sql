-- Inventory System Tables

-- 1. Inventory Lots (For FIFO/LIFO control)
CREATE TABLE IF NOT EXISTS inventory_lots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    product_id INT NOT NULL,
    lot_no VARCHAR(100) NOT NULL COMMENT 'เลข Lot',
    mfg_date DATE COMMENT 'วันที่ผลิต',
    exp_date DATE COMMENT 'วันหมดอายุ',
    cost DECIMAL(15, 2) DEFAULT 0.00 COMMENT 'ต้นทุนต่อหน่วยใน Lot นี้',
    quantity_initial DECIMAL(15, 2) DEFAULT 0.00 COMMENT 'จำนวนเริ่มต้น',
    quantity_remaining DECIMAL(15, 2) DEFAULT 0.00 COMMENT 'จำนวนคงเหลือใน Lot (global)',
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_lot_product (product_id),
    INDEX idx_lot_no (lot_no),
    INDEX idx_lot_exp (exp_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางเก็บข้อมูล Lot สินค้า';

-- 2. Inventory Balances (Current Stock per Location & Lot)
CREATE TABLE IF NOT EXISTS inventory_balances (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    product_id INT NOT NULL,
    warehouse_id INT NOT NULL,
    location_id INT NULL COMMENT 'NULL if general warehouse area',
    lot_id INT NULL COMMENT 'NULL if no lot control',
    quantity DECIMAL(15, 2) DEFAULT 0.00 COMMENT 'จำนวนคงเหลือ',
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE,
    FOREIGN KEY (location_id) REFERENCES warehouse_locations(id) ON DELETE SET NULL,
    FOREIGN KEY (lot_id) REFERENCES inventory_lots(id) ON DELETE CASCADE,
    UNIQUE KEY uniq_balance (warehouse_id, location_id, product_id, lot_id),
    INDEX idx_balance_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางยอดคงเหลือสินค้าแยกตามคลัง/ตำแหน่ง/Lot';

-- 3. Inventory Transactions (History)
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    transaction_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    type ENUM('ADJUSTMENT', 'ISSUE', 'RETURN', 'RECEIVE', 'FULFILLMENT', 'TRANSFER') NOT NULL COMMENT 'ประเภทรายการ',
    product_id INT NOT NULL,
    warehouse_id INT NOT NULL,
    location_id INT NULL,
    lot_id INT NULL,
    quantity DECIMAL(15, 2) NOT NULL COMMENT 'จำนวน (บวก=เพิ่ม, ลบ=ลด)',
    stock_in DECIMAL(15, 2) DEFAULT 0.00 COMMENT 'ยอดรับเข้า',
    stock_out DECIMAL(15, 2) DEFAULT 0.00 COMMENT 'ยอดจ่ายออก',
    value_amount DECIMAL(15, 2) DEFAULT 0.00 COMMENT 'มูลค่ารายการ (Qty * Cost)',
    reference_no VARCHAR(100) COMMENT 'เลขที่อ้างอิง (Order ID, PO No)',
    reason VARCHAR(255) COMMENT 'เหตุผล',
    note TEXT,
    created_by INT COMMENT 'User ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE,
    FOREIGN KEY (location_id) REFERENCES warehouse_locations(id) ON DELETE SET NULL,
    FOREIGN KEY (lot_id) REFERENCES inventory_lots(id) ON DELETE SET NULL,
    INDEX idx_trans_product (product_id),
    INDEX idx_trans_date (transaction_date),
    INDEX idx_trans_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางความเคลื่อนไหวสินค้า';
