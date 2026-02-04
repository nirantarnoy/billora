require('dotenv').config();
const mysql = require('mysql2/promise');

async function migrate() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || 'bill_ocr',
        port: process.env.DB_PORT || 3306
    });

    console.log('Connected to database...');

    try {
        // Check if columns exist to avoid error
        const [cols] = await connection.execute("SHOW COLUMNS FROM products LIKE 'min_stock'");
        if (cols.length === 0) {
            console.log('Adding columns...');
            await connection.execute('ALTER TABLE products ADD COLUMN min_stock DECIMAL(10,2) DEFAULT 0');
            await connection.execute('ALTER TABLE products ADD COLUMN max_stock DECIMAL(10,2) DEFAULT 0');
            await connection.execute('ALTER TABLE products ADD COLUMN multiple_qty DECIMAL(10,2) DEFAULT 1');
            console.log('Columns added successfully.');
        } else {
            console.log('Columns already exist.');
        }

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await connection.end();
    }
}

migrate();
