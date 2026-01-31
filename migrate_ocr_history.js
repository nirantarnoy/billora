const mysql = require('mysql2/promise');

async function migrate() {
    const db = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'bill_ocr'
    });

    try {
        console.log('Adding source column to bills and payment_slips...');

        await db.query(`ALTER TABLE bills ADD COLUMN source ENUM('BROWSER', 'MOBILE', 'LINE') DEFAULT 'BROWSER' AFTER image_path`);
        console.log('Column source added to bills');

        await db.query(`ALTER TABLE payment_slips ADD COLUMN source ENUM('BROWSER', 'MOBILE', 'LINE') DEFAULT 'BROWSER' AFTER image_path`);
        console.log('Column source added to payment_slips');

        console.log('Creating ocr_logs table...');
        await db.query(`
            CREATE TABLE IF NOT EXISTS ocr_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                type ENUM('BANK_SLIP', 'RECEIPT', 'UNKNOWN') NOT NULL,
                source ENUM('BROWSER', 'MOBILE', 'LINE') NOT NULL,
                status VARCHAR(50) NOT NULL,
                amount DECIMAL(15, 2) DEFAULT 0,
                trans_id VARCHAR(100),
                image_path VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        `);
        console.log('Table ocr_logs created successfully');

    } catch (err) {
        console.error('Migration error:', err.message);
    } finally {
        await db.end();
        process.exit();
    }
}

migrate();
