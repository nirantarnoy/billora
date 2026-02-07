const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function update() {
    const db = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'bill_ocr'
    });

    console.log('Running stock feature migrations...');

    // Add columns to product table
    try {
        await db.query(`ALTER TABLE product ADD COLUMN qty_on_hand DECIMAL(15,4) DEFAULT 0`);
        console.log('Added qty_on_hand to product');
    } catch (e) {
        if (e.code === 'ER_DUP_COLUMN_NAME') console.log('qty_on_hand already exists');
        else throw e;
    }

    try {
        await db.query(`ALTER TABLE product ADD COLUMN qty_reserved DECIMAL(15,4) DEFAULT 0`);
        console.log('Added qty_reserved to product');
    } catch (e) {
        if (e.code === 'ER_DUP_COLUMN_NAME') console.log('qty_reserved already exists');
        else throw e;
    }

    // Create tracking table
    await db.query(`
        CREATE TABLE IF NOT EXISTS inventory_movement_status (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            order_sn VARCHAR(100) NOT NULL,
            sku VARCHAR(100) NOT NULL,
            movement_type ENUM('NONE', 'RESERVED', 'DEDUCTED') DEFAULT 'NONE',
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uq_order_sku (user_id, order_sn, sku)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('Checked inventory_movement_status table');

    console.log('Stock migrations completed.');
    await db.end();
}

update().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});
