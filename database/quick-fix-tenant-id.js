/**
 * Quick Fix: เพิ่ม tenant_id ให้กับตาราง users โดยตรง
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

async function quickFix() {
    let connection;

    try {
        console.log('🔧 Quick Fix: เพิ่ม tenant_id ให้กับตาราง users...\n');

        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'bill_ocr'
        });

        console.log('✓ เชื่อมต่อฐานข้อมูลสำเร็จ\n');

        // ตรวจสอบว่ามีคอลัมน์ tenant_id หรือไม่
        const [columns] = await connection.query(`
            SELECT COLUMN_NAME 
            FROM information_schema.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'users' 
            AND COLUMN_NAME = 'tenant_id'
        `);

        if (columns.length > 0) {
            console.log('⚠ คอลัมน์ tenant_id มีอยู่แล้วในตาราง users');
            console.log('✓ ไม่ต้องทำอะไร\n');
        } else {
            console.log('▶ กำลังเพิ่มคอลัมน์ tenant_id...');

            await connection.query(`
                ALTER TABLE users 
                ADD COLUMN tenant_id INT NULL AFTER id
            `);

            console.log('✓ เพิ่มคอลัมน์ tenant_id สำเร็จ\n');

            console.log('▶ กำลังเพิ่ม index...');

            await connection.query(`
                ALTER TABLE users 
                ADD INDEX idx_users_tenant_id (tenant_id)
            `);

            console.log('✓ เพิ่ม index สำเร็จ\n');

            console.log('▶ กำลังเพิ่ม foreign key...');

            await connection.query(`
                ALTER TABLE users 
                ADD CONSTRAINT fk_users_tenant 
                FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
            `);

            console.log('✓ เพิ่ม foreign key สำเร็จ\n');
        }

        console.log('🎉 เสร็จสิ้น!\n');
        console.log('ขั้นตอนถัดไป:');
        console.log('  1. ลองลงทะเบียนอีกครั้งที่ http://localhost:5000/register');
        console.log('  2. ถ้ายังไม่ได้ ให้ restart server\n');

    } catch (error) {
        console.error('\n❌ เกิดข้อผิดพลาด:');
        console.error(error.message);

        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log('\n✓ คอลัมน์มีอยู่แล้ว - ไม่มีปัญหา');
        } else if (error.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
            console.log('\n✓ Index/FK มีอยู่แล้ว - ไม่มีปัญหา');
        } else {
            process.exit(1);
        }
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

quickFix();
