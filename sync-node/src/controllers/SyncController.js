const moment = require('moment');
const db = require('../models/db');
const OrderSyncService = require('../services/OrderSyncService');
const NewTestOrderSyncService = require('../services/NewTestOrderSyncService');
const TiktokIncomeService = require('../services/TiktokIncomeService');
const ShopeeIncomeService = require('../services/ShopeeIncomeService');

class SyncController {
    async actionIndex() {
        console.log("Starting SaaS Multi-tenant Sync Process...");

        try {
            // 1. ดึงข้อมูล User ทั้งหมดที่มีการตั้งค่า Online Channel ไว้
            const [users] = await db.execute('SELECT DISTINCT user_id FROM online_channel WHERE status = 1');
            console.log(`Found ${users.length} active tenants to sync.`);

            const orderService = new OrderSyncService();
            const shopeeOrderService = new NewTestOrderSyncService(); // ควรปรับให้รับ userId เช่นกัน
            const tiktokIncome = new TiktokIncomeService(); // ควรปรับให้รับ userId เช่นกัน
            const shopeeIncome = new ShopeeIncomeService(); // ควรปรับให้รับ userId เช่นกัน

            for (const user of users) {
                const userId = user.user_id;
                console.log(`>>> Syncing for User ID: ${userId}`);

                // 2. Sync Orders สำหรับ User นี้
                const [channels] = await db.execute('SELECT * FROM online_channel WHERE user_id = ? AND status = 1', [userId]);

                for (const channel of channels) {
                    const startTime = moment().format('YYYY-MM-DD HH:mm:ss');
                    let count = 0;
                    let status = 'success';
                    let message = '';

                    try {
                        if (channel.name === 'Tiktok') {
                            count = await orderService.syncTikTokOrders(userId, channel);
                            console.log(`User ${userId} [TikTok]: Synced ${count} orders`);
                            await tiktokIncome.syncAllOrders(userId);
                            message = `Synced ${count} orders and income details`;
                        }
                        else if (channel.name === 'Shopee') {
                            count = await shopeeOrderService.syncShopeeOrders(userId, channel);
                            console.log(`User ${userId} [Shopee]: Synced ${count} orders`);
                            await shopeeIncome.syncAllOrders(userId);
                            message = `Synced ${count} orders and income details`;
                        }
                    } catch (err) {
                        status = 'failed';
                        message = err.message;
                        console.error(`Sync error for user ${userId} channel ${channel.name}:`, err.message);
                    }

                    // Record Sync Log
                    await db.execute(
                        'INSERT INTO sync_log (user_id, type, platform, start_time, end_time, status, total_records, message) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                        [userId, 'order_income', channel.name, startTime, moment().format('YYYY-MM-DD HH:mm:ss'), status, count, message]
                    );
                }
            }

            console.log("Multi-tenant Sync Process Completed.");
            process.exit(0);

        } catch (error) {
            console.error("SaaS Sync FATAL ERROR:", error.message);
            process.exit(1);
        }
    }
}

module.exports = SyncController;
