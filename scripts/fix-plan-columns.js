require('dotenv').config();
const mysql = require('mysql2/promise');

async function runFix() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'bill_ocr'
    });

    try {
        console.log('Adding missing columns to subscription_plans...');

        const columns = [
            'ALTER TABLE subscription_plans ADD COLUMN description TEXT AFTER plan_name_en',
            'ALTER TABLE subscription_plans ADD COLUMN price_yearly DECIMAL(10,2) DEFAULT 0 AFTER price_monthly',
            'ALTER TABLE subscription_plans ADD COLUMN currency VARCHAR(3) DEFAULT "THB" AFTER price_yearly'
        ];

        for (const sql of columns) {
            try {
                await connection.execute(sql);
                console.log(`Success: ${sql}`);
            } catch (e) {
                if (e.code === 'ER_DUP_FIELDNAME') {
                    console.log(`Skipped (Exists): ${sql}`);
                } else {
                    console.error(`Error executing ${sql}:`, e.message);
                }
            }
        }

        console.log('Done.');
    } catch (error) {
        console.error('Connection Error:', error);
    } finally {
        await connection.end();
    }
}

runFix();
