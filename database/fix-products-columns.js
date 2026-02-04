require('dotenv').config();
const mysql = require('mysql2/promise');

async function fixProductsTable() {
    const config = {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT || 3306
    };

    console.log('Connecting to database...');
    const conn = await mysql.createConnection(config);

    try {
        console.log('Checking "products" table columns...');
        const [columns] = await conn.query(`SHOW COLUMNS FROM products`);
        const existingColumns = columns.map(c => c.Field);
        console.log('Existing columns:', existingColumns.join(', '));

        const columnsToAdd = [
            { name: 'code', type: "VARCHAR(100) NULL COMMENT 'รหัสสินค้า' AFTER tenant_id" },
            { name: 'sku', type: "VARCHAR(100) NOT NULL DEFAULT '' COMMENT 'SKU' AFTER name" },
            { name: 'unit_id', type: "INT NULL COMMENT 'หน่วยนับ' AFTER description" },
            { name: 'cost', type: "DECIMAL(15, 2) DEFAULT 0.00 COMMENT 'ต้นทุน' AFTER unit_id" },
            { name: 'sale_price', type: "DECIMAL(15, 2) DEFAULT 0.00 COMMENT 'ราคาขาย' AFTER cost" },
            { name: 'avg_cost', type: "DECIMAL(15, 2) DEFAULT 0.00 COMMENT 'ต้นทุนเฉลี่ย' AFTER sale_price" },
            { name: 'image_urls', type: "JSON COMMENT 'เก็บรายการรูปภาพมากสุด 4 รูป' AFTER avg_cost" },
            { name: 'status', type: "ENUM('active', 'inactive') DEFAULT 'active' AFTER image_urls" },
            { name: 'created_at', type: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER status" },
            { name: 'updated_at', type: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at" }
        ];

        for (const col of columnsToAdd) {
            if (!existingColumns.includes(col.name)) {
                console.log(`Adding column "${col.name}"...`);
                try {
                    await conn.query(`ALTER TABLE products ADD COLUMN ${col.name} ${col.type}`);
                    console.log(`✓ Added ${col.name}`);
                } catch (err) {
                    console.error(`✗ Failed to add ${col.name}:`, err.message);
                }
            } else {
                console.log(`- Column "${col.name}" already exists.`);
            }
        }

        console.log('Done fixing columns.');

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await conn.end();
    }
}

fixProductsTable();
