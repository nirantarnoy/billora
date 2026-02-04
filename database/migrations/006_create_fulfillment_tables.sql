-- Fulfillment Tables

-- 1. Warehouses
CREATE TABLE IF NOT EXISTS warehouses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    code VARCHAR(50) NOT NULL COMMENT 'รหัสคลัง',
    name VARCHAR(255) NOT NULL COMMENT 'ชื่อคลังสินค้า',
    address TEXT COMMENT 'ที่อยู่',
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_warehouse_tenant (tenant_id, code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางคลังสินค้า';

-- 2. Warehouse Locations
CREATE TABLE IF NOT EXISTS warehouse_locations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    warehouse_id INT NOT NULL,
    tenant_id INT NOT NULL,
    name VARCHAR(100) NOT NULL COMMENT 'ชื่อ Location (Shelf/Bin)',
    description TEXT,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE,
    INDEX idx_location_warehouse (warehouse_id),
    INDEX idx_location_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางตำแหน่งจัดเก็บสินค้า';

-- 3. Product Units (Optional but good to have)
CREATE TABLE IF NOT EXISTS product_units (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    name VARCHAR(100) NOT NULL COMMENT 'ชื่อหน่วยนับ (ชิ้น, อัน, กล่อง)',
    code VARCHAR(50) COMMENT 'รหัสหน่วยนับ',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_unit_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางหน่วยนับสินค้า';

-- 4. Products (Main Table)
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    code VARCHAR(100) NOT NULL COMMENT 'รหัสสินค้า',
    name VARCHAR(255) NOT NULL COMMENT 'ชื่อสินค้า',
    sku VARCHAR(100) NOT NULL COMMENT 'SKU หลัก',
    description TEXT,
    unit_id INT COMMENT 'หน่วยนับ',
    cost DECIMAL(15, 2) DEFAULT 0.00 COMMENT 'ต้นทุน',
    sale_price DECIMAL(15, 2) DEFAULT 0.00 COMMENT 'ราคาขาย',
    avg_cost DECIMAL(15, 2) DEFAULT 0.00 COMMENT 'ต้นทุนเฉลี่ย',
    image_urls JSON COMMENT 'เก็บรายการรูปภาพมากสุด 4 รูป',
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_product_tenant (tenant_id),
    INDEX idx_product_sku (sku)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางข้อมูลสินค้า';

-- 5. Marketplace Product Mapping
CREATE TABLE IF NOT EXISTS marketplace_product_mappings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    tenant_id INT NOT NULL,
    platform VARCHAR(50) NOT NULL COMMENT 'Platform (shopee, lazada, tiktok)',
    marketplace_sku VARCHAR(255) NOT NULL COMMENT 'SKU บน Marketplace',
    marketplace_product_id VARCHAR(255) COMMENT 'ID สินค้าบน Marketplace',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_mapping_product (product_id),
    INDEX idx_mapping_sku (marketplace_sku)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางจับคู่สินค้ากับ Marketplace';
