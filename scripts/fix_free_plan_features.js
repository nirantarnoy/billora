/**
 * Fix Free Plan Features Script
 * 
 * วัตถุประสงค์:
 * 1. อัปเดตฟีเจอร์ของแพ็กเกจ 'free' ในฐานข้อมูลให้ถูกต้อง (ปิดโมดูลพรีเมียม)
 * 2. อัปเดต Tenant ทั้งหมดที่ใช้แพ็กเกจ 'free' ให้ใช้ฟีเจอร์ใหม่นี้
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

async function fixFreePlan() {
    let connection;
    try {
        console.log('--- Fixing Free Plan Features ---');

        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'bill_ocr'
        });

        // 1. กำหนดฟีเจอร์สำหรับแพ็กเกจ Free
        const freeFeatures = {
            ocr: true,
            dashboard: true,
            bills: true,
            slips: true,
            reports: false,
            inventory: false,
            fulfillment: false,
            multichannel: false,
            ai_audit: false,
            api_access: false
        };
        const featuresJson = JSON.stringify(freeFeatures);

        // 2. อัปเดตตาราง subscription_plans
        console.log('Updating subscription_plans table...');
        const [planResult] = await connection.query(
            'UPDATE subscription_plans SET features = ? WHERE plan_code = ?',
            [featuresJson, 'free']
        );
        console.log(`Updated ${planResult.affectedRows} plan(s).`);

        // 3. อัปเดต Tenants ที่ใช้แพ็กเกจ free และยังไม่มี features หรือ features ไม่ถูกต้อง
        console.log('Updating existing free tenants...');
        const [tenantResult] = await connection.query(
            'UPDATE tenants SET features = ? WHERE subscription_plan = ?',
            [featuresJson, 'free']
        );
        console.log(`Updated ${tenantResult.affectedRows} tenant(s).`);

        console.log('--- Done! ---');
    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (connection) await connection.end();
    }
}

fixFreePlan();
