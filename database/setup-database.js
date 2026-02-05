/**
 * Database Setup Script
 * รัน migrations ทั้งหมดอัตโนมัติ
 * 
 * วิธีใช้: node database/setup-database.js
 */

require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// สีสำหรับ console
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

const log = {
    info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
    success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
    error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
    warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
    step: (msg) => console.log(`${colors.cyan}▶${colors.reset} ${msg}`)
};

async function setupDatabase() {
    let connection;

    try {
        console.log('\n' + '='.repeat(60));
        console.log('  🚀 Billora Multi-tenant Database Setup');
        console.log('='.repeat(60) + '\n');

        // 1. เชื่อมต่อฐานข้อมูล
        log.step('กำลังเชื่อมต่อฐานข้อมูล...');

        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'bill_ocr',
            multipleStatements: true
        });

        log.success(`เชื่อมต่อฐานข้อมูล ${process.env.DB_NAME || 'bill_ocr'} สำเร็จ`);
        console.log('');

        // Pre-run Fixes (Check for missing columns BEFORE migrations)
        log.step('ตรวจสอบและซ่อมแซมโครงสร้างตารางพื้นฐาน...');

        // Fix for subscription_plans
        try {
            const [tables] = await connection.query('SHOW TABLES');
            const tableNames = tables.map(t => Object.values(t)[0]);

            if (tableNames.includes('subscription_plans')) {
                const [cols] = await connection.query('SHOW COLUMNS FROM subscription_plans');
                const existing = cols.map(c => c.Field);
                if (!existing.includes('plan_name_en')) {
                    log.info('กำลังเพิ่มคอลัมน์ subscription_plans.plan_name_en...');
                    await connection.query("ALTER TABLE subscription_plans ADD COLUMN plan_name_en VARCHAR(100) AFTER plan_name");
                    log.success('เพิ่มคอลัมน์ plan_name_en สำเร็จ');
                }
            }
        } catch (err) {
            log.warning('การตรวจสอบเบื้องต้น subscription_plans: ' + err.message);
        }

        // 2. รัน migrations
        const migrations = [
            {
                file: '001_create_tenants_table.sql',
                name: 'สร้างตาราง Tenants (องค์กร/บริษัท)'
            },
            {
                file: '002_create_users_table.sql',
                name: 'สร้างตาราง Users (Multi-tenant)'
            },
            {
                file: '003_add_tenant_to_existing_tables.sql',
                name: 'เพิ่ม tenant_id ให้กับตารางเดิม'
            },
            {
                file: '004_create_tenant_subscriptions_table.sql',
                name: 'สร้างตาราง Subscription Plans และ History'
            },
            {
                file: '005_create_backup_tables.sql',
                name: 'สร้างตาราง Backup Schedules และ History'
            },
            {
                file: '006_create_fulfillment_tables.sql',
                name: 'สร้างตาราง Fulfillment (คลังสินค้า, สินค้า, Marketplace Mapping)'
            },
            {
                file: '007_fix_products_table.sql',
                name: 'แก้ไขตาราง products (เพิ่ม tenant_id)'
            },
            {
                file: '008_update_products_schema.sql',
                name: 'อัปเดตโครงสร้าง products (เพิ่ม code, unit, cost, etc)'
            },
            {
                file: '009_create_inventory_system.sql',
                name: 'สร้างตาราง Inventory (Lots, Balances, Transactions)'
            },
            {
                file: '012_add_remote_backup_config.sql',
                name: 'เพิ่มการตั้งค่า Remote Backup (SFTP)'
            },
            {
                file: '013_add_line_user_id_to_users.sql',
                name: 'เพิ่มคอลัมน์ line_user_id ในตาราง Users'
            },
            {
                file: '014_add_ai_audit_columns.sql',
                name: 'เพิ่มคอลัมน์ AI Audit ในตาราง Slips และ Bills'
            },
            {
                file: '015_enable_ai_feature_in_plans.sql',
                name: 'เปิดใช้งานฟีเจอร์ AI Audit ในแพ็กเกจ Professional และ Enterprise'
            },
            {
                file: '016_add_tenant_id_to_ocr_logs.sql',
                name: 'เพิ่ม tenant_id ให้กับตาราง ocr_logs'
            },
            {
                file: '017_create_payments_table.sql',
                name: 'สร้างตาราง Payments (บันทึกการชำระเงิน Omise)'
            }
        ];

        for (const migration of migrations) {
            log.step(`${migration.name}...`);

            const sqlPath = path.join(__dirname, 'migrations', migration.file);

            if (!fs.existsSync(sqlPath)) {
                log.error(`ไม่พบไฟล์: ${migration.file}`);
                continue;
            }

            const sql = fs.readFileSync(sqlPath, 'utf8');

            try {
                await connection.query(sql);
                log.success(`${migration.name} - สำเร็จ`);
            } catch (error) {
                if (error.code === 'ER_TABLE_EXISTS_ERROR') {
                    log.warning(`${migration.name} - ตารางมีอยู่แล้ว (ข้าม)`);
                } else if (error.code === 'ER_DUP_FIELDNAME') {
                    log.warning(`${migration.name} - คอลัมน์มีอยู่แล้ว (ข้าม)`);
                } else if (error.code === 'ER_DUP_KEYNAME') {
                    log.warning(`${migration.name} - Index มีอยู่แล้ว (ข้าม)`);
                } else if (error.code === 'ER_BAD_FIELD_ERROR' && migration.file === '004_create_tenant_subscriptions_table.sql') {
                    log.warning(`${migration.name} - พบการขัดแย้งของ Column (ข้ามเนื่องจากจัดการแล้ว)`);
                } else {
                    throw error;
                }
            }
        }

        // Custom Fix: Update Products Schema (because of multiple versions issue)
        log.step('ตรวจสอบโครงสร้างตาราง products...');
        try {
            const [cols] = await connection.query('SHOW COLUMNS FROM products');
            const existing = cols.map(c => c.Field);

            const columnsToAdd = [
                { name: 'code', type: "VARCHAR(100) NULL COMMENT 'รหัสสินค้า' AFTER tenant_id" },
                { name: 'sku', type: "VARCHAR(100) NOT NULL DEFAULT '' COMMENT 'SKU' AFTER name" },
                { name: 'unit_id', type: "INT NULL COMMENT 'หน่วยนับ' AFTER description" },
                { name: 'cost', type: "DECIMAL(15, 2) DEFAULT 0.00 COMMENT 'ต้นทุน' AFTER unit_id" },
                { name: 'sale_price', type: "DECIMAL(15, 2) DEFAULT 0.00 COMMENT 'ราคาขาย' AFTER cost" },
                { name: 'avg_cost', type: "DECIMAL(15, 2) DEFAULT 0.00 COMMENT 'ต้นทุนเฉลี่ย' AFTER sale_price" },
                { name: 'image_urls', type: "JSON COMMENT 'เก็บรายการรูปภาพมากสุด 4 รูป' AFTER avg_cost" },
                { name: 'status', type: "ENUM('active', 'inactive') DEFAULT 'active' AFTER image_urls" },
                { name: 'created_at', type: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER status" },
                { name: 'updated_at', type: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at" }
            ];

            for (const col of columnsToAdd) {
                if (!existing.includes(col.name)) {
                    log.info(`กำลังเพิ่มคอลัมน์ products.${col.name}...`);
                    await connection.query(`ALTER TABLE products ADD COLUMN ${col.name} ${col.type}`);
                }
            }
            log.success('ตรวจสอบโครงสร้างตาราง products เรียบร้อย');
        } catch (err) {
            log.warning('การตรวจสอบโครงสร้าง products: ' + err.message);
        }

        console.log('');
        log.step('ตรวจสอบตารางที่สร้าง...');

        // 3. ตรวจสอบตารางที่สร้าง
        const [tables] = await connection.query('SHOW TABLES');
        const tableNames = tables.map(t => Object.values(t)[0]);

        const requiredTables = ['tenants', 'users', 'subscription_plans', 'tenant_subscriptions'];
        const missingTables = requiredTables.filter(t => !tableNames.includes(t));

        if (missingTables.length > 0) {
            log.error(`ตารางที่ยังไม่ได้สร้าง: ${missingTables.join(', ')}`);
        } else {
            log.success('ตารางทั้งหมดถูกสร้างเรียบร้อย');
        }

        // 4. แสดงสถิติ
        console.log('\n' + '-'.repeat(60));
        log.info('สถิติฐานข้อมูล:');

        for (const table of requiredTables) {
            if (tableNames.includes(table)) {
                const [rows] = await connection.query(`SELECT COUNT(*) as count FROM ${table}`);
                console.log(`  • ${table}: ${rows[0].count} แถว`);
            }
        }

        // 5. ตรวจสอบว่ามี subscription plans หรือไม่
        const [plans] = await connection.query('SELECT COUNT(*) as count FROM subscription_plans');
        if (plans[0].count === 0) {
            log.warning('ยังไม่มีแพ็กเกจในระบบ - ควรรัน migration 004 อีกครั้ง');
        } else {
            log.success(`มีแพ็กเกจในระบบ: ${plans[0].count} แพ็กเกจ`);
        }

        console.log('-'.repeat(60));
        console.log('');
        log.success('🎉 ติดตั้งฐานข้อมูลสำเร็จ!');
        console.log('');
        log.info('ขั้นตอนถัดไป:');
        console.log('  1. Restart server: nodemon .\\server.js');
        console.log('  2. ทดสอบ API: ดูไฟล์ API_TESTING.http');
        console.log('  3. อ่านคู่มือ: START_HERE.md');
        console.log('');

    } catch (error) {
        console.log('');
        log.error('เกิดข้อผิดพลาด:');
        console.error(error);

        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            log.error('ไม่สามารถเชื่อมต่อฐานข้อมูลได้ - ตรวจสอบ username/password ใน .env');
        } else if (error.code === 'ER_BAD_DB_ERROR') {
            log.error(`ไม่พบฐานข้อมูล ${process.env.DB_NAME || 'bill_ocr'} - กรุณาสร้างฐานข้อมูลก่อน`);
        }

        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// รัน script
setupDatabase();
