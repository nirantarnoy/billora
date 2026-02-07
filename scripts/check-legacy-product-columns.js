require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkProductTable() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'bill_ocr'
    });

    try {
        const [rows] = await connection.execute('DESCRIBE product');
        console.log('--- Columns in product ---');
        rows.forEach(r => console.log(`${r.Field} (${r.Type})`));
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await connection.end();
    }
}

checkProductTable();
