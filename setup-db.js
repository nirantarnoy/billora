require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runSetup() {
    const dbName = process.env.DB_NAME || 'bill_ocr';

    // Connect without database first to create it if needed
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        multipleStatements: true
    });

    try {
        console.log(`🛠️  กำลังตรวจสอบ/สร้างฐานข้อมูล: ${dbName}...`);
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        await connection.query(`USE \`${dbName}\``);

        console.log('🚀 กำลังเริ่มติดตั้งตารางจาก initial_setup.sql...');
        const sqlPath = path.join(__dirname, 'initial_setup.sql');

        if (!fs.existsSync(sqlPath)) {
            throw new Error('ไม่พบไฟล์ initial_setup.sql');
        }

        const sql = fs.readFileSync(sqlPath, 'utf8');
        await connection.query(sql);
        console.log('✅ ติดตั้งฐานข้อมูลและข้อมูลเริ่มต้นสำเร็จ!');
    } catch (err) {
        console.error('❌ เกิดข้อผิดพลาด:', err.message);
    } finally {
        await connection.end();
        process.exit();
    }
}

runSetup();
