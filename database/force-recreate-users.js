/**
 * Force Recreate Users Table
 * บังคับ DROP และสร้างตาราง users ใหม่
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

async function forceRecreateUsers() {
    let connection;

    try {
        console.log('🔧 Force Recreate Users Table...\n');

        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'bill_ocr'
        });

        console.log('✓ เชื่อมต่อฐานข้อมูลสำเร็จ\n');

        // 1. ปิด Foreign Key Checks
        console.log('▶ ปิด Foreign Key Checks...');
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');
        console.log('✓ ปิด Foreign Key Checks สำเร็จ\n');

        // 2. DROP ตาราง users
        console.log('▶ กำลัง DROP ตาราง users...');
        await connection.query('DROP TABLE IF EXISTS users');
        console.log('✓ DROP ตาราง users สำเร็จ\n');

        // 3. เปิด Foreign Key Checks
        console.log('▶ เปิด Foreign Key Checks...');
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log('✓ เปิด Foreign Key Checks สำเร็จ\n');

        // 4. สร้างตาราง users ใหม่
        console.log('▶ กำลังสร้างตาราง users ใหม่...');

        const createTableSQL = `
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL COMMENT 'รหัสองค์กรที่สังกัด',
    username VARCHAR(100) NOT NULL COMMENT 'ชื่อผู้ใช้',
    email VARCHAR(100) NOT NULL COMMENT 'อีเมล',
    password_hash VARCHAR(255) NOT NULL COMMENT 'รหัสผ่านที่เข้ารหัส',
    
    -- Personal Info
    first_name VARCHAR(100) COMMENT 'ชื่อจริง',
    last_name VARCHAR(100) COMMENT 'นามสกุล',
    phone VARCHAR(20) COMMENT 'เบอร์โทรศัพท์',
    avatar_url VARCHAR(255) COMMENT 'รูปโปรไฟล์',
    
    -- Role & Permissions
    role ENUM('owner', 'admin', 'manager', 'accountant', 'user') DEFAULT 'user' COMMENT 'บทบาท',
    permissions JSON COMMENT 'สิทธิ์การเข้าถึงแต่ละโมดูล',
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE COMMENT 'สถานะการใช้งาน',
    email_verified BOOLEAN DEFAULT FALSE COMMENT 'ยืนยันอีเมลแล้ว',
    email_verified_at TIMESTAMP NULL,
    
    -- Security
    last_login_at TIMESTAMP NULL COMMENT 'เข้าสู่ระบบล่าสุด',
    last_login_ip VARCHAR(45) COMMENT 'IP ที่เข้าสู่ระบบล่าสุด',
    failed_login_attempts INT DEFAULT 0 COMMENT 'จำนวนครั้งที่ล็อกอินผิด',
    locked_until TIMESTAMP NULL COMMENT 'ล็อกบัญชีจนถึง',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL COMMENT 'Soft delete',
    
    -- Indexes
    UNIQUE KEY unique_email_per_tenant (tenant_id, email),
    UNIQUE KEY unique_username_per_tenant (tenant_id, username),
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_is_active (is_active),
    
    -- Foreign Keys
    CONSTRAINT fk_users_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางผู้ใช้งาน (Multi-tenant)';
        `;

        await connection.query(createTableSQL);
        console.log('✓ สร้างตาราง users สำเร็จ\n');

        // 5. ตรวจสอบโครงสร้าง
        console.log('▶ ตรวจสอบโครงสร้างตาราง...\n');

        const [columns] = await connection.query('SHOW COLUMNS FROM users');

        console.log('📋 โครงสร้างตาราง users ใหม่:\n');
        columns.forEach(col => {
            const mark = ['email', 'password_hash', 'first_name', 'last_name', 'phone'].includes(col.Field) ? '✅' : '  ';
            console.log(`  ${mark} ${col.Field} (${col.Type})`);
        });

        // ตรวจสอบคอลัมน์ที่จำเป็น
        const requiredColumns = ['email', 'password_hash', 'first_name', 'last_name', 'phone'];
        const existingColumns = columns.map(col => col.Field);
        const hasAllColumns = requiredColumns.every(col => existingColumns.includes(col));

        console.log('\n' + '='.repeat(60));
        if (hasAllColumns) {
            console.log('🎉 สำเร็จ! ตารางมีคอลัมน์ครบถ้วน\n');
        } else {
            console.log('⚠ คำเตือน: ยังขาดบางคอลัมน์\n');
        }

        console.log('ขั้นตอนถัดไป:');
        console.log('  1. Restart server (Ctrl+C แล้ว nodemon .\\server.js)');
        console.log('  2. ลองลงทะเบียนที่ http://localhost:5000/register');
        console.log('  3. ถ้าสำเร็จจะได้ Tenant Code และ redirect ไป /login\n');

    } catch (error) {
        console.error('\n❌ เกิดข้อผิดพลาด:');
        console.error(error.message);
        console.error('\nรายละเอียด:', error);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

forceRecreateUsers();
