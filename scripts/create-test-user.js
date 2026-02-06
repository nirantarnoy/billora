/**
 * Script to create a test user with a free plan
 * Run with: node scripts/create-test-user.js
 */

require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function createTestUser() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'bill_ocr'
    });

    try {
        console.log('Creating test tenant and user...');

        // 1. Create a new tenant with 'free' plan
        const tenantCode = 'TESTTENANT' + Math.floor(Math.random() * 1000);
        const [tenantResult] = await connection.execute(
            `INSERT INTO tenants (tenant_code, company_name, subscription_plan, is_active) 
             VALUES (?, ?, ?, ?)`,
            [tenantCode, 'Test Organization', 'free', 1]
        );
        const tenantId = tenantResult.insertId;
        console.log(`Tenant created with ID: ${tenantId}`);

        // 2. Link tenant to 'free' subscription plan object if tenant_subscriptions table exists
        // Get plan ID for 'free'
        const [plans] = await connection.execute('SELECT id FROM subscription_plans WHERE plan_code = "free"');
        if (plans.length > 0) {
            const planId = plans[0].id;
            await connection.execute(
                `INSERT INTO tenant_subscriptions (tenant_id, plan_id, status, start_date, end_date) 
                 VALUES (?, ?, 'active', NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR))`,
                [tenantId, planId]
            );
            console.log('Free subscription linked.');
        }

        // 3. Create a test user (member role)
        const passwordHash = await bcrypt.hash('test1234', 10);
        const [userResult] = await connection.execute(
            `INSERT INTO users (tenant_id, username, email, password_hash, role, is_active, permissions) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                tenantId,
                'testuser',
                'test@example.com',
                passwordHash,
                'member',
                1,
                JSON.stringify({
                    dashboard: true,
                    bills: true,
                    slips: true,
                    inventory: true
                })
            ]
        );
        console.log(`User created with ID: ${userResult.insertId}`);
        console.log('---------------------------------');
        console.log('LOGIN DETAILS:');
        console.log('Username: testuser');
        console.log('Password: test1234');
        console.log('Tenant: Test Organization');
        console.log('Plan: Free');
        console.log('---------------------------------');

    } catch (error) {
        console.error('Error creating test user:', error);
    } finally {
        await connection.end();
    }
}

createTestUser();
