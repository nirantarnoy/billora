/**
 * Create System Admin User
 * สร้าง user admin สำหรับระบบ
 */

require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function createAdminUser() {
    let connection;

    try {
        console.log('👤 สร้าง System Admin User...\n');

        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'bill_ocr'
        });

        console.log('✓ เชื่อมต่อฐานข้อมูลสำเร็จ\n');

        // 1. ตรวจสอบว่ามี tenant_id = 1 หรือไม่ (System Tenant)
        console.log('▶ ตรวจสอบ System Tenant...');

        const [tenants] = await connection.query('SELECT id FROM tenants WHERE id = 1');

        if (tenants.length === 0) {
            console.log('⚠ ไม่พบ System Tenant - กำลังสร้าง...');

            await connection.query(`
                INSERT INTO tenants (
                    id, company_name, tenant_code, subscription_plan,
                    max_users, max_storage_gb, max_transactions_per_month,
                    is_active
                ) VALUES (
                    1, 'System', 'SYSTEM', 'enterprise',
                    999, 999, 999999,
                    TRUE
                )
            `);

            console.log('✓ สร้าง System Tenant สำเร็จ\n');
        } else {
            console.log('✓ พบ System Tenant แล้ว\n');
        }

        // 2. ตรวจสอบว่ามี admin user หรือไม่
        console.log('▶ ตรวจสอบ Admin User...');

        const [existingAdmin] = await connection.query(
            'SELECT id FROM users WHERE username = ? OR email = ?',
            ['admin', 'admin@system.local']
        );

        if (existingAdmin.length > 0) {
            console.log('⚠ Admin user มีอยู่แล้ว - กำลังอัพเดท...');

            const hashedPassword = await bcrypt.hash('admin123', 10);

            await connection.query(`
                UPDATE users 
                SET password_hash = ?,
                    role = 'admin',
                    is_active = TRUE,
                    permissions = ?
                WHERE username = 'admin' OR email = 'admin@system.local'
            `, [
                hashedPassword,
                JSON.stringify({
                    dashboard: true,
                    users: true,
                    tenants: true,
                    bills: true,
                    reports: true,
                    settings: true,
                    system: true
                })
            ]);

            console.log('✓ อัพเดท Admin user สำเร็จ\n');
        } else {
            console.log('⚠ ไม่พบ Admin user - กำลังสร้าง...');

            const hashedPassword = await bcrypt.hash('admin123', 10);

            await connection.query(`
                INSERT INTO users (
                    tenant_id, username, email, password_hash,
                    first_name, last_name, role, permissions, is_active
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                1, // System tenant
                'admin',
                'admin@system.local',
                hashedPassword,
                'System',
                'Administrator',
                'admin',
                JSON.stringify({
                    dashboard: true,
                    users: true,
                    tenants: true,
                    bills: true,
                    reports: true,
                    settings: true,
                    system: true
                }),
                true
            ]);

            console.log('✓ สร้าง Admin user สำเร็จ\n');
        }

        console.log('='.repeat(60));
        console.log('🎉 สำเร็จ!\n');
        console.log('📋 ข้อมูล Admin User:');
        console.log('  Username: admin');
        console.log('  Email:    admin@system.local');
        console.log('  Password: admin123');
        console.log('  Role:     admin');
        console.log('  Tenant:   System (ID: 1)');
        console.log('='.repeat(60));
        console.log('\n💡 ใช้งาน:');
        console.log('  1. Login ที่ http://localhost:5000/login');
        console.log('  2. ใช้ username: admin หรือ email: admin@system.local');
        console.log('  3. Password: admin123\n');

    } catch (error) {
        console.error('\n❌ เกิดข้อผิดพลาด:');
        console.error(error.message);

        if (error.code === 'ER_DUP_ENTRY') {
            console.log('\n💡 Admin user มีอยู่แล้ว - ลอง Login ด้วย:');
            console.log('   Username: admin');
            console.log('   Password: admin123\n');
        } else {
            console.error('\nรายละเอียด:', error);
            process.exit(1);
        }
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

createAdminUser();
