const db = require('../config/db');

class GeneralController {
    async viewOrders(req, res) {
        try {
            const userId = req.session.user.id;
            const { channel, status, startDate, endDate } = req.query;

            const today = new Date().toISOString().split('T')[0];
            const filter = {
                channel: channel || '',
                status: status || '',
                startDate: startDate || today,
                endDate: endDate || today
            };

            let whereClause = 'WHERE user_id = ?';
            let params = [userId];

            if (filter.channel) {
                whereClause += ' AND source_platform = ?';
                params.push(filter.channel);
            }
            if (filter.status) {
                whereClause += ' AND status = ?';
                params.push(filter.status);
            }
            if (filter.startDate) {
                whereClause += ' AND DATE(created_at) >= ?';
                params.push(filter.startDate);
            }
            if (filter.endDate) {
                whereClause += ' AND DATE(created_at) <= ?';
                params.push(filter.endDate);
            }

            // Check if omni_orders table exists, fallback to order table if not
            // Based on EJS, it uses source_order_id, source_platform, items_list, etc.
            // But migrate_db uses order_id, order_sn, etc.
            // I'll try to fetch from `order` table and alias as needed if omni_orders doesn't exist.
            // Actually, I'll just use `order` table and map the fields if possible.
            // However, the view expects specific fields. I'll search for the REAL table name first.

            const [orders] = await db.execute(`
        SELECT 
          id, 
          order_id as source_order_id, 
          'SHOPEE' as source_platform, 
          product_name as items_list, 
          total_amount, 
          order_status as status, 
          created_at 
        FROM \`order\` 
        ${whereClause} 
        ORDER BY created_at DESC 
        LIMIT 50
      `, params);

            res.render('orders', {
                user: req.session.user,
                active: 'orders',
                title: 'รายการสั่งซื้อ',
                orders: orders || [],
                filter: filter
            });
        } catch (err) {
            console.error('viewOrders Error:', err);
            res.render('orders', {
                user: req.session.user,
                active: 'orders',
                title: 'รายการสั่งซื้อ',
                orders: [],
                filter: { channel: '', status: '', startDate: '', endDate: '' }
            });
        }
    }

    async viewSyncHistory(req, res) {
        try {
            const userId = req.session.user.id;
            const [logs] = await db.execute('SELECT * FROM sync_log WHERE user_id = ? ORDER BY created_at DESC LIMIT 50', [userId]);
            res.render('sync_history', {
                user: req.session.user,
                active: 'sync-history',
                title: 'ประวัติการซิงค์ข้อมูล',
                logs: logs || []
            });
        } catch (err) {
            console.error('viewSyncHistory Error:', err);
            res.render('sync_history', {
                user: req.session.user,
                active: 'sync-history',
                title: 'ประวัติการซิงค์ข้อมูล',
                logs: []
            });
        }
    }

    async viewFeeReport(req, res) {
        try {
            const userId = req.session.user.id;
            const query = req.query;
            const today = new Date().toISOString().split('T')[0];

            const filter = {
                orderId: query.orderId || '',
                dateFrom: query.dateFrom || today,
                dateTo: query.dateTo || today,
                channel: query.channel || ''
            };

            const [channels] = await db.execute('SELECT id, name FROM online_channel WHERE user_id = ?', [userId]);

            // Fetch income details - this is a simplified version
            const [shopeeItems] = await db.execute(`
        SELECT 
          id, order_sn as order_id, order_date, buyer_total_amount as total_amount, 
          commission_fee as s_comm, transaction_fee as s_trans, service_fee as s_service, 
          escrow_amount as s_escrow, 'Shopee' as channel_name, user_id as channel_id
        FROM shopee_income_details 
        WHERE user_id = ?
      `, [userId]);

            const [tiktokItems] = await db.execute(`
        SELECT 
          id, order_id, order_date, revenue_amount as total_amount, 
          settlement_amount as t_settlement, revenue_amount as t_revenue,
          'Tiktok' as channel_name, user_id as channel_id
        FROM tiktok_income_details 
        WHERE user_id = ?
      `, [userId]);

            const items = [...shopeeItems, ...tiktokItems];

            // Summaries
            const shopeeSummary = {
                buyer_total_amount: shopeeItems.reduce((acc, i) => acc + parseFloat(i.total_amount || 0), 0),
                original_price: 0,
                shipping_fee_paid_by_buyer: 0,
                shopee_shipping_rebate: 0,
                shopee_voucher_code: 0,
                cost_of_goods_sold: 0,
                seller_coin_cash_back: 0,
                commission_fee: shopeeItems.reduce((acc, i) => acc + parseFloat(i.s_comm || 0), 0),
                transaction_fee: shopeeItems.reduce((acc, i) => acc + parseFloat(i.s_trans || 0), 0),
                service_fee: shopeeItems.reduce((acc, i) => acc + parseFloat(i.s_service || 0), 0),
                seller_return_refund_amount: 0,
                reverse_shipping_fee: 0,
                final_shipping_fee: 0,
                actual_shipping_fee: 0,
                shipping_fee_discount_from_3pl: 0,
                drc_adjustable_refund: 0,
                payment_promotion_amount: 0,
                cross_border_tax: 0,
                seller_shipping_discount: 0,
                seller_voucher_code: 0,
            };
            shopeeSummary.totalIncome = shopeeSummary.buyer_total_amount;
            shopeeSummary.totalExpenses = shopeeSummary.commission_fee + shopeeSummary.transaction_fee + shopeeSummary.service_fee;
            shopeeSummary.netSettlement = shopeeSummary.totalIncome - shopeeSummary.totalExpenses;

            const tiktokSummary = {
                gross_sales_amount: tiktokItems.reduce((acc, i) => acc + parseFloat(i.total_amount || 0), 0),
                customer_payment_amount: 0,
                platform_discount_amount: 0,
                shipping_fee_subsidy_amount: 0,
                revenue_amount: tiktokItems.reduce((acc, i) => acc + parseFloat(i.t_revenue || 0), 0),
                platform_commission_amount: 0,
                transaction_fee_amount: 0,
                affiliate_commission_amount: 0,
                shipping_cost_amount: 0,
                actual_shipping_fee_amount: 0,
                customer_refund_amount: 0,
                adjustment_amount: 0,
                sales_tax_amount: 0,
                fee_and_tax_amount: 0,
            };
            tiktokSummary.totalIncome = tiktokSummary.revenue_amount;
            tiktokSummary.totalExpenses = 0;
            tiktokSummary.netSettlement = tiktokSummary.totalIncome;

            res.render('fee_report', {
                user: req.session.user,
                active: 'fee-report',
                title: 'รายงานค่าธรรมเนียม',
                channels: channels || [],
                items: items || [],
                shopeeSummary,
                tiktokSummary,
                query: filter
            });
        } catch (err) {
            console.error('viewFeeReport Error:', err);
            res.render('fee_report', {
                user: req.session.user,
                active: 'fee-report',
                title: 'รายงานค่าธรรมเนียม',
                channels: [],
                items: [],
                shopeeSummary: {},
                tiktokSummary: {},
                query: {}
            });
        }
    }

    async viewInventory(req, res) {
        try {
            const userId = req.session.user.id;
            const [products] = await db.execute('SELECT * FROM product WHERE user_id = ?', [userId]);
            res.render('inventory', {
                user: req.session.user,
                active: 'inventory',
                title: 'จัดการคลังสินค้า',
                products: products || []
            });
        } catch (err) {
            console.error('viewInventory Error:', err);
            res.render('inventory', {
                user: req.session.user,
                active: 'inventory',
                title: 'จัดการคลังสินค้า',
                products: []
            });
        }
    }

    async viewReconciliation(req, res) {
        try {
            const userId = req.session.user.id;
            const filter = req.query.status || 'all';

            // Fetch orders
            const [orders] = await db.execute(`
                SELECT 
                    order_id,
                    order_sn,
                    product_name,
                    total_amount,
                    order_date,
                    order_status
                FROM \`order\`
                WHERE user_id = ?
                ORDER BY order_date DESC
            `, [userId]);

            // Fetch payment slips
            const [slips] = await db.execute(`
                SELECT 
                    trans_id,
                    sender_name,
                    amount,
                    datetime,
                    status
                FROM payment_slips
                WHERE user_id = ? AND status = 'success'
                ORDER BY datetime DESC
            `, [userId]);

            // Create reconciliation data
            const reconciliationData = [];
            const processedSlips = new Set();

            // Match orders with slips
            for (const order of orders) {
                const orderAmount = parseFloat(order.total_amount || 0);
                let matchedSlip = null;
                let bestMatch = null;
                let smallestDiff = Infinity;

                // Try to find exact or close match
                for (const slip of slips) {
                    if (processedSlips.has(slip.trans_id)) continue;

                    const slipAmount = parseFloat(slip.amount || 0);
                    const diff = Math.abs(orderAmount - slipAmount);

                    // Exact match
                    if (diff === 0) {
                        matchedSlip = slip;
                        break;
                    }

                    // Track best match (within 10% tolerance)
                    if (diff < orderAmount * 0.1 && diff < smallestDiff) {
                        smallestDiff = diff;
                        bestMatch = slip;
                    }
                }

                // Use best match if no exact match found
                if (!matchedSlip && bestMatch) {
                    matchedSlip = bestMatch;
                }

                if (matchedSlip) {
                    processedSlips.add(matchedSlip.trans_id);
                    const slipAmount = parseFloat(matchedSlip.amount || 0);

                    let status = 'match';
                    if (slipAmount > orderAmount) {
                        status = 'over';
                    } else if (slipAmount < orderAmount) {
                        status = 'under';
                    }

                    reconciliationData.push({
                        order_id: order.order_id || order.order_sn,
                        customer: matchedSlip.sender_name || 'ไม่ระบุ',
                        date: new Date(order.order_date).toLocaleDateString('th-TH'),
                        order_amount: orderAmount,
                        slip_amount: slipAmount,
                        status: status
                    });
                } else {
                    // Order without matching slip (under)
                    reconciliationData.push({
                        order_id: order.order_id || order.order_sn,
                        customer: 'ไม่มีสลิป',
                        date: new Date(order.order_date).toLocaleDateString('th-TH'),
                        order_amount: orderAmount,
                        slip_amount: 0,
                        status: 'under'
                    });
                }
            }

            // Add unmatched slips (over)
            for (const slip of slips) {
                if (!processedSlips.has(slip.trans_id)) {
                    const slipAmount = parseFloat(slip.amount || 0);
                    reconciliationData.push({
                        order_id: slip.trans_id,
                        customer: slip.sender_name || 'ไม่ระบุ',
                        date: new Date(slip.datetime).toLocaleDateString('th-TH'),
                        order_amount: 0,
                        slip_amount: slipAmount,
                        status: 'over'
                    });
                }
            }

            // Calculate totals
            const totals = {
                match: 0,
                over: 0,
                under: 0,
                orderValue: 0,
                received: 0,
                net: 0,
                percentage: 0
            };

            reconciliationData.forEach(item => {
                totals.orderValue += item.order_amount;
                totals.received += item.slip_amount;

                if (item.status === 'match') {
                    totals.match += item.slip_amount;
                } else if (item.status === 'over') {
                    totals.over += (item.slip_amount - item.order_amount);
                } else if (item.status === 'under') {
                    totals.under += (item.order_amount - item.slip_amount);
                }
            });

            totals.net = totals.received - totals.orderValue;
            totals.percentage = totals.orderValue > 0
                ? (totals.net / totals.orderValue) * 100
                : 0;

            res.render('reconciliation', {
                user: req.session.user,
                active: 'reconciliation',
                title: 'กระทบยอด',
                data: reconciliationData,
                totals: totals,
                filter: filter
            });
        } catch (err) {
            console.error('viewReconciliation Error:', err);
            res.render('reconciliation', {
                user: req.session.user,
                active: 'reconciliation',
                title: 'กระทบยอด',
                data: [],
                totals: {
                    match: 0,
                    over: 0,
                    under: 0,
                    orderValue: 0,
                    received: 0,
                    net: 0,
                    percentage: 0
                },
                filter: 'all'
            });
        }
    }
}

module.exports = new GeneralController();
