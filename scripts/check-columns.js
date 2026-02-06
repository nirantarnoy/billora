require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkColumns() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'bill_ocr'
    });

    try {
        const tables = ['subscription_plans', 'marketplace_connections'];
        for (const table of tables) {
            try {
                const [rows] = await connection.execute(`DESCRIBE ${table}`);
                console.log(`--- Columns in ${table} ---`);
                rows.forEach(r => console.log(r.Field));
                console.log('------------------------------------');
            } catch (e) {
                console.log(`Table ${table} does not exist.`);
            }
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await connection.end();
    }
}

checkColumns();
