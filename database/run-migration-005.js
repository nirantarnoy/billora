const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'bill_ocr',
    multipleStatements: true
};

async function runMigration() {
    let connection;
    try {
        console.log('Connecting to database...');
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected!');

        const sqlPath = path.join(__dirname, 'migrations', '005_create_backup_tables.sql');
        console.log(`Reading migration file: ${sqlPath}`);

        if (!fs.existsSync(sqlPath)) {
            console.error('File not found!');
            process.exit(1);
        }

        const sql = fs.readFileSync(sqlPath, 'utf8');
        console.log('Executing SQL...');

        await connection.query(sql);
        console.log('✅ Migration executed successfully!');

    } catch (error) {
        console.error('❌ Error executing migration:', error);
    } finally {
        if (connection) await connection.end();
    }
}

runMigration();
