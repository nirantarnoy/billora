const mysql = require('mysql2/promise');

async function migrate() {
    const db = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'bill_ocr'
    });

    try {
        await db.query('ALTER TABLE bills ADD COLUMN IF NOT EXISTS user_id INT AFTER id');
        await db.query('ALTER TABLE payment_slips ADD COLUMN IF NOT EXISTS user_id INT AFTER id');
        console.log('Migration successful');
    } catch (err) {
        console.error('Migration error:', err.message);
    } finally {
        await db.end();
    }
}

migrate();
