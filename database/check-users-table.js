/**
 * ตรวจสอบโครงสร้างตาราง users
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkUsersTable() {
    let connection;

    try {
        console.log('🔍 ตรวจสอบโครงสร้างตาราง users...\n');

        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'bill_ocr'
        });

        // ดูโครงสร้างตาราง users
        const [columns] = await connection.query(`
            SHOW COLUMNS FROM users
        `);

        console.log('📋 โครงสร้างตาราง users ปัจจุบัน:\n');
        console.table(columns.map(col => ({
            Field: col.Field,
            Type: col.Type,
            Null: col.Null,
            Key: col.Key,
            Default: col.Default
        })));

        console.log('\n📝 คอลัมน์ที่มี:');
        columns.forEach(col => {
            console.log(`  - ${col.Field}`);
        });

        // ตรวจสอบคอลัมน์ที่ต้องการ
        const requiredColumns = ['id', 'tenant_id', 'username', 'email', 'password_hash', 'first_name', 'last_name', 'phone', 'role', 'permissions'];
        const existingColumns = columns.map(col => col.Field);
        const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));

        if (missingColumns.length > 0) {
            console.log('\n❌ คอลัมน์ที่ขาดหายไป:');
            missingColumns.forEach(col => {
                console.log(`  - ${col}`);
            });
            console.log('\n💡 แนะนำ: ควร DROP TABLE users และรัน migration ใหม่');
        } else {
            console.log('\n✅ โครงสร้างตารางครบถ้วน!');
        }

    } catch (error) {
        console.error('\n❌ เกิดข้อผิดพลาด:');
        console.error(error.message);

        if (error.code === 'ER_NO_SUCH_TABLE') {
            console.log('\n⚠ ไม่พบตาราง users - ต้องรัน migration 002');
        }
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

checkUsersTable();
