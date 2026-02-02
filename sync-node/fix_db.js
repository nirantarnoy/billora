const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixMigration() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'bill_ocr'
    });

    console.log('Checking and fixing database columns for SaaS...');

    const tablesToCheck = [
        'online_channel',
        'tiktok_tokens',
        'shopee_tokens',
        'order',
        'product',
        'tiktok_income_details',
        'shopee_income_details',
        'sync_log',
        'bills'
    ];

    for (const table of tablesToCheck) {
        const [columns] = await connection.query(`SHOW COLUMNS FROM \`${table}\``);
        const hasUserId = columns.some(c => c.Field === 'user_id');

        if (!hasUserId) {
            console.log(`Adding user_id to ${table}...`);
            await connection.query(`ALTER TABLE \`${table}\` ADD COLUMN user_id INT NOT NULL AFTER id`);
            await connection.query(`ALTER TABLE \`${table}\` ADD INDEX idx_user (user_id)`);
        }
    }

    // เฉพาะ online_channel เพิ่ม express_book_code
    const [ocCols] = await connection.query(`SHOW COLUMNS FROM online_channel`);
    if (!ocCols.some(c => c.Field === 'express_book_code')) {
        console.log('Adding express_book_code to online_channel...');
        await connection.query('ALTER TABLE online_channel ADD COLUMN express_book_code VARCHAR(50) AFTER status');
    }

    // เฉพาะ bills เพิ่ม vat และ items
    const [billCols] = await connection.query(`SHOW COLUMNS FROM bills`);
    if (!billCols.some(c => c.Field === 'vat')) {
        console.log('Adding vat to bills...');
        await connection.query('ALTER TABLE bills ADD COLUMN vat DECIMAL(15,4) DEFAULT 0 AFTER total_amount');
    }
    if (!billCols.some(c => c.Field === 'items')) {
        console.log('Adding items to bills...');
        await connection.query('ALTER TABLE bills ADD COLUMN items JSON AFTER vat');
    }

    console.log('Database fix completed!');
    await connection.end();
}

fixMigration().catch(err => {
    console.error('Fix failed:', err);
    process.exit(1);
});
