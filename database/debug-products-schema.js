require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkSchema() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'bill_ocr'
    });

    try {
        const [columns] = await connection.query("SHOW COLUMNS FROM products");
        console.log("Columns in 'products' table:");
        console.table(columns);
    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        await connection.end();
    }
}

checkSchema();
