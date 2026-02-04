/**
 * Recreate Users Table
 * DROP ตาราง users เดิมและสร้างใหม่ตาม migration 002
 */

require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function recreateUsersTable() {
    let connection;

    try {
        console.log('🔧 Recreate Users Table...\n');

        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'bill_ocr',
            multipleStatements: true
        });

        console.log('✓ เชื่อมต่อฐานข้อมูลสำเร็จ\n');

        // 1. DROP ตาราง users เดิม
        console.log('▶ กำลัง DROP ตาราง users เดิม...');

        try {
            await connection.query('DROP TABLE IF EXISTS users');
            console.log('✓ DROP ตาราง users สำเร็จ\n');
        } catch (error) {
            console.log('⚠ ไม่สามารถ DROP ตาราง users (อาจไม่มีตาราง)\n');
        }

        // 2. อ่าน migration 002
        console.log('▶ กำลังอ่าน migration 002...');

        const migrationPath = path.join(__dirname, 'migrations', '002_create_users_table.sql');

        if (!fs.existsSync(migrationPath)) {
            throw new Error('ไม่พบไฟล์ 002_create_users_table.sql');
        }

        const sql = fs.readFileSync(migrationPath, 'utf8');
        console.log('✓ อ่านไฟล์สำเร็จ\n');

        // 3. สร้างตาราง users ใหม่
        console.log('▶ กำลังสร้างตาราง users ใหม่...');

        await connection.query(sql);
        console.log('✓ สร้างตาราง users สำเร็จ\n');

        // 4. ตรวจสอบโครงสร้าง
        console.log('▶ ตรวจสอบโครงสร้างตาราง...');

        const [columns] = await connection.query('SHOW COLUMNS FROM users');

        console.log('\n📋 โครงสร้างตาราง users ใหม่:\n');
        columns.forEach(col => {
            console.log(`  ✓ ${col.Field} (${col.Type})`);
        });

        console.log('\n🎉 เสร็จสิ้น!\n');
        console.log('ขั้นตอนถัดไป:');
        console.log('  1. ลองลงทะเบียนอีกครั้งที่ http://localhost:5000/register');
        console.log('  2. ถ้ายังไม่ได้ ให้ restart server\n');

    } catch (error) {
        console.error('\n❌ เกิดข้อผิดพลาด:');
        console.error(error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

recreateUsersTable();
