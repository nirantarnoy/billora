const mysql = require('mysql2/promise');

async function migrate() {
    const db = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'bill_ocr'
    });

    try {
        await db.query('ALTER TABLE payment_slips ADD COLUMN IF NOT EXISTS sender_bank VARCHAR(100) AFTER sender_name');
        await db.query('ALTER TABLE payment_slips ADD COLUMN IF NOT EXISTS receiver_bank VARCHAR(100) AFTER receiver_name');
        console.log('Bank columns added successfully');
    } catch (err) {
        console.error('Migration error:', err.message);
    } finally {
        await db.end();
    }
}

migrate();
