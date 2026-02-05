const db = require('./src/config/db');

async function upgradeAdmin() {
    try {
        // 1. Get Enterprise Plan ID
        const [plans] = await db.execute("SELECT id FROM subscription_plans WHERE plan_code = 'enterprise'");
        if (plans.length === 0) throw new Error("Enterprise plan not found");
        const enterprisePlanId = plans[0].id;

        // 2. Find Admin User and Tenant
        const [users] = await db.execute("SELECT tenant_id FROM users WHERE role = 'admin' OR username = 'admin' LIMIT 1");
        if (users.length === 0) throw new Error("Admin user not found");
        const tenantId = users[0].tenant_id;

        console.log(`Upgrading Tenant ID: ${tenantId} to Enterprise Plan (ID: ${enterprisePlanId})`);

        // 3. Update or Insert Subscription
        const now = new Date();
        const nextYear = new Date();
        nextYear.setFullYear(now.getFullYear() + 1);

        // Deactivate old subscriptions
        await db.execute("UPDATE tenant_subscriptions SET status = 'expired' WHERE tenant_id = ?", [tenantId]);

        // Add new Enterprise subscription
        await db.execute(`
            INSERT INTO tenant_subscriptions (tenant_id, plan_id, start_date, end_date, amount, payment_status, status)
            VALUES (?, ?, ?, ?, 0, 'paid', 'active')
        `, [tenantId, enterprisePlanId, now, nextYear]);

        console.log("Success: Admin tenant upgraded to Enterprise plan.");
        process.exit(0);
    } catch (err) {
        console.error("Error:", err.message);
        process.exit(1);
    }
}

upgradeAdmin();
