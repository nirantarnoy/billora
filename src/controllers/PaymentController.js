const omise = require('omise')({
    publicKey: process.env.OMISE_PUBLIC_KEY,
    secretKey: process.env.OMISE_SECRET_KEY,
});
const PaymentModel = require('../models/PaymentModel');
const TenantModel = require('../models/TenantModel');
const pool = require('../config/db');

class PaymentController {
    /**
     * สร้างรายการจ่ายเงิน (Checkout)
     */
    static async checkout(req, res) {
        try {
            const { token, source, planId, amount, paymentMethod } = req.body;
            const tenantId = req.session.user.tenant_id;

            // 1. ตรวสอบราคากับ DB เพื่อป้องกันการปลอมปราบราคาจากฝั่ง Client
            const [[plan]] = await pool.query('SELECT * FROM subscription_plans WHERE id = ?', [planId]);
            if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });

            // ราคาต้องคูณ 100 เพราะ Omise ใช้หน่วยสตางค์ (THB)
            const omiseAmount = Math.round(plan.price_monthly * 100);

            // 2. สร้าง Charge ใน Omise
            const chargeData = {
                amount: omiseAmount,
                currency: 'thb',
                description: `Subscription for ${plan.plan_name}`,
                metadata: {
                    tenant_id: tenantId,
                    plan_id: planId,
                    subscription_type: 'monthly'
                }
            };

            if (token) chargeData.card = token;
            else if (source) chargeData.source = source;
            else return res.status(400).json({ success: false, message: 'Token or Source is required' });

            const charge = await omise.charges.create(chargeData);

            // 3. บันทึกลงตาราง payments ของเรา
            const transaction_no = `PAY-${Date.now()}-${tenantId}`;
            await PaymentModel.create({
                tenant_id: tenantId,
                transaction_no: transaction_no,
                omise_charge_id: charge.id,
                amount: plan.price_monthly,
                currency: 'THB',
                payment_method: paymentMethod || 'credit_card',
                status: charge.status === 'succeeded' ? 'succeeded' : 'pending',
                omise_raw_data: charge
            });

            // 4. ถ้าจ่ายสำเร็จทันที (เช่น บัตรเครดิตปกติ) ให้เปิดใช้งาน Plan ทันที
            if (charge.status === 'succeeded') {
                await PaymentController.activateSubscription(tenantId, plan, charge);
            }

            res.json({
                success: true,
                status: charge.status,
                authorize_uri: charge.authorize_uri, // สำหรับ 3D Secure
                qr_code_url: charge.source ? (charge.source.scannable_code ? charge.source.scannable_code.image.download_uri : null) : null, // สำหรับ PromptPay
                chargeId: charge.id, // ส่ง ID กลับไปให้เช็คสถานะ
                message: charge.status === 'succeeded' ? 'ชำระเงินสำเร็จ' : 'กำลังรอการชำระเงิน'
            });

        } catch (error) {
            console.error('Omise Checkout Error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * รับ Webhook จาก Omise
     */
    static async handleWebhook(req, res) {
        try {
            const event = req.body;
            console.log(`[Omise Webhook] Received event: ${event.key}`);

            if (event.key === 'charge.complete') {
                const charge = event.data;
                console.log(`[Omise Webhook] Processing charge: ${charge.id}, Status: ${charge.status}`);

                const payment = await PaymentModel.findByChargeId(charge.id);
                console.log(`[Omise Webhook] Found local payment: ${payment ? 'Yes' : 'No'}`);

                const isSuccess = charge.status === 'succeeded' || charge.status === 'successful';

                if (payment && payment.status !== 'succeeded' && isSuccess) {
                    // 1. อัพเดทสถานะการจ่ายเงิน
                    await PaymentModel.updateStatus(charge.id, 'succeeded', { raw: charge });
                    console.log(`[Omise Webhook] Payment status updated to succeeded for charge: ${charge.id}`);

                    // 2. เปิดใช้งาน Subscription
                    const tenantId = charge.metadata.tenant_id;
                    const planId = charge.metadata.plan_id;

                    console.log(`[Omise Webhook] Activating plan ${planId} for tenant ${tenantId}`);
                    const [[plan]] = await pool.query('SELECT * FROM subscription_plans WHERE id = ?', [planId]);

                    if (plan) {
                        await PaymentController.activateSubscription(tenantId, plan, charge);
                    } else {
                        console.warn(`[Omise Webhook] Plan ${planId} not found in database!`);
                    }
                } else {
                    console.log(`[Omise Webhook] No action needed for charge: ${charge.id}. Local status: ${payment?.status}, Omise status: ${charge.status}`);
                }
            }

            res.sendStatus(200);
        } catch (error) {
            console.error('Webhook Error:', error);
            res.status(500).send('Internal Server Error');
        }
    }

    /**
     * ดึงสถานะปัจจุบันจาก Omise และอัปเดตระบบ (Sync)
     * ใช้กรณี Webhook ล่าช้าหรือมีปัญหา
     */
    static async syncPaymentStatus(req, res) {
        try {
            const { chargeId } = req.params;
            const tenantId = req.session.user.tenant_id;

            console.log(`[Payment Sync] Checking status for charge: ${chargeId}`);

            // 1. ถาม Omise ตรงๆ
            const charge = await omise.charges.retrieve(chargeId);
            const isSuccess = charge.status === 'succeeded' || charge.status === 'successful';

            if (isSuccess) {
                const payment = await PaymentModel.findByChargeId(charge.id);

                if (payment && payment.status !== 'succeeded') {
                    // ทำเหมือน Webhook
                    await PaymentModel.updateStatus(charge.id, 'succeeded', { raw: charge });

                    const planId = charge.metadata.plan_id;
                    const [[plan]] = await pool.query('SELECT * FROM subscription_plans WHERE id = ?', [planId]);

                    if (plan) {
                        await PaymentController.activateSubscription(tenantId, plan, charge);
                        return res.json({ success: true, message: 'อัปเดตสถานะและเปิดใช้งานแผนเรียบร้อยแล้ว' });
                    }
                } else if (payment && payment.status === 'succeeded') {
                    return res.json({ success: true, message: 'รายการนี้ชำระเงินเรียบร้อยแล้ว' });
                }
            }

            res.json({
                success: false,
                message: charge.status === 'pending' ? 'ยังไม่ได้ชำระเงิน' : 'สถานะชำระเงินไม่ถูกต้อง',
                status: charge.status
            });
        } catch (error) {
            console.error('Sync Error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Helper ฟังก์ชันสำหรับเปิดใช้งานแผน
     */
    static async activateSubscription(tenantId, plan, charge) {
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 1); // +1 เดือน

        // อัพเดทที่ตาราง tenants
        await TenantModel.updateSubscription(tenantId, {
            subscription_plan: plan.plan_code,
            subscription_status: 'active',
            subscription_end_date: endDate,
            max_users: plan.max_users,
            max_storage_mb: plan.max_storage_mb,
            max_transactions_per_month: plan.max_transactions_per_month,
            features: typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features
        });

        // เพิ่มประวัติใน tenant_subscriptions
        await pool.query(`
            INSERT INTO tenant_subscriptions (tenant_id, plan_id, status, start_date, end_date, amount, currency)
            VALUES (?, ?, 'active', NOW(), ?, ?, ?)
        `, [tenantId, plan.id, endDate, plan.price_monthly, 'THB']);

        console.log(`[Subscription] Activated plan ${plan.plan_code} for tenant ${tenantId}`);
    }
}

module.exports = PaymentController;
