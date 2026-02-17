const db = require('../config/db');

class DashboardController {
    async viewDashboard(req, res) {
        try {
            const userTenantId = req.session.user.tenant_id;
            const isAdmin = userTenantId === 1;
            const filterTenantId = req.query.tenant_id;

            let scopeWhere = 'WHERE tenant_id = ?';
            let targetTenantId = userTenantId;

            if (isAdmin) {
                if (filterTenantId) {
                    scopeWhere = 'WHERE tenant_id = ?';
                    targetTenantId = filterTenantId;
                } else {
                    scopeWhere = 'WHERE 1=1'; // Show all
                    targetTenantId = null;
                }
            }

            // Prepare params for summary query (needs 6 repetitions if tenant specific)
            const summaryParams = targetTenantId ? [targetTenantId, targetTenantId, targetTenantId, targetTenantId, targetTenantId, targetTenantId] : [];

            // Fix SQL Error: Handle p. alias for products query
            let productScopeWhere = scopeWhere;
            if (scopeWhere.includes('tenant_id')) {
                productScopeWhere = scopeWhere.replace('tenant_id', 'p.tenant_id');
            }

            const [[summary]] = await db.execute(`
        SELECT 
          (SELECT COUNT(*) FROM bills ${scopeWhere}) AS bill_count,
          (SELECT IFNULL(SUM(total_amount), 0) FROM bills ${scopeWhere}) AS total_sales,
          (SELECT IFNULL(SUM(vat), 0) FROM bills ${scopeWhere}) AS total_vat,
          (SELECT COUNT(*) FROM payment_slips ${scopeWhere}) AS slip_count,
          (SELECT COUNT(*) FROM products ${scopeWhere}) AS product_count,
          (SELECT COUNT(*) FROM (
             SELECT p.id 
             FROM products p
             LEFT JOIN inventory_balances b ON p.id = b.product_id
             ${productScopeWhere} AND p.min_stock > 0
             GROUP BY p.id, p.min_stock
             HAVING IFNULL(SUM(b.quantity), 0) < p.min_stock
          ) AS low_stock) AS low_stock_count
      `, summaryParams);

            // Slip Stats Params
            const statParams = targetTenantId ? [targetTenantId] : [];
            const [slipStatsRaw] = await db.execute(`
        SELECT source, IFNULL(SUM(amount), 0) as total_amount
        FROM payment_slips 
        ${scopeWhere} AND status = 'success'
        GROUP BY source
      `, statParams);

            const slipStats = { BROWSER: 0, MOBILE: 0, LINE: 0, TOTAL: 0 };
            slipStatsRaw.forEach(row => {
                const amount = Number(row.total_amount) || 0;
                if (slipStats.hasOwnProperty(row.source)) slipStats[row.source] = amount;
                slipStats.TOTAL += amount;
            });

            const [bills] = await db.execute(`SELECT * FROM bills ${scopeWhere} ORDER BY id DESC LIMIT 10`, statParams);
            const [slips] = await db.execute(`SELECT * FROM payment_slips ${scopeWhere} ORDER BY id DESC LIMIT 10`, statParams);

            res.render('dashboard', {
                summary, bills, slips, slipStats,
                user: req.session.user, active: 'dashboard', title: 'แผงควบคุมหลัก',
                _csrf: req.csrfToken ? req.csrfToken() : ''
            });
        } catch (err) {
            console.error('viewDashboard Error:', err);
            res.status(500).send('Server Error');
        }
    }

    // API for Mobile Dashboard
    async getApiDashboardData(req, res) {
        try {
            const userTenantId = req.session.user.tenant_id;
            const isAdmin = userTenantId === 1;
            const filterTenantId = req.query.tenant_id;

            let scopeWhere = 'WHERE tenant_id = ?';
            let targetTenantId = userTenantId;

            if (isAdmin) {
                if (filterTenantId) {
                    scopeWhere = 'WHERE tenant_id = ?';
                    targetTenantId = filterTenantId;
                } else {
                    scopeWhere = 'WHERE 1=1';
                    targetTenantId = null;
                }
            }

            const summaryParams = targetTenantId ? [targetTenantId, targetTenantId, targetTenantId, targetTenantId, targetTenantId, targetTenantId] : [];

            // Fix SQL Error for API as well
            let productScopeWhere = scopeWhere;
            if (scopeWhere.includes('tenant_id')) {
                productScopeWhere = scopeWhere.replace('tenant_id', 'p.tenant_id');
            }

            const [summaryRows] = await db.execute(`
        SELECT 
          (SELECT COUNT(*) FROM bills ${scopeWhere}) AS bill_count,
          (SELECT IFNULL(SUM(total_amount), 0) FROM bills ${scopeWhere}) AS total_sales,
          (SELECT IFNULL(SUM(vat), 0) FROM bills ${scopeWhere}) AS total_vat,
          (SELECT COUNT(*) FROM payment_slips ${scopeWhere}) AS slip_count,
          (SELECT COUNT(*) FROM products ${scopeWhere}) AS product_count,
          (SELECT COUNT(*) FROM (
             SELECT p.id 
             FROM products p
             LEFT JOIN inventory_balances b ON p.id = b.product_id
             ${productScopeWhere} AND p.min_stock > 0
             GROUP BY p.id, p.min_stock
             HAVING IFNULL(SUM(b.quantity), 0) < p.min_stock
          ) AS low_stock) AS low_stock_count
      `, summaryParams);

            const summary = summaryRows[0] || { bill_count: 0, total_sales: 0, total_vat: 0, slip_count: 0, product_count: 0, low_stock_count: 0 };

            const statParams = targetTenantId ? [targetTenantId] : [];
            const [slipStatsRaw] = await db.execute(`
        SELECT source, IFNULL(SUM(amount), 0) as total_amount
        FROM payment_slips 
        ${scopeWhere} AND status = 'success'
        GROUP BY source
      `, statParams);

            const slipStats = { BROWSER: 0, MOBILE: 0, LINE: 0, TOTAL: 0 };
            slipStatsRaw.forEach(row => {
                const amount = Number(row.total_amount) || 0;
                if (slipStats.hasOwnProperty(row.source)) slipStats[row.source] = amount;
                slipStats.TOTAL += amount;
            });

            const [latestBills] = await db.execute(`SELECT id, store_name, total_amount, date FROM bills ${scopeWhere} ORDER BY id DESC LIMIT 5`, statParams);
            const [latestSlips] = await db.execute(`SELECT id, trans_id, amount, datetime, source FROM payment_slips ${scopeWhere} ORDER BY id DESC LIMIT 5`, statParams);

            res.json({
                success: true,
                summary: {
                    bill_count: Number(summary.bill_count),
                    total_sales: Number(summary.total_sales),
                    total_vat: Number(summary.total_vat),
                    slip_count: Number(summary.slip_count),
                    product_count: Number(summary.product_count),
                    low_stock_count: Number(summary.low_stock_count)
                },
                slipStats,
                latestBills: latestBills.map(b => ({ ...b, total_amount: Number(b.total_amount) })),
                latestSlips: latestSlips.map(s => ({ ...s, amount: Number(s.amount) }))
            });
        } catch (err) {
            console.error('getApiDashboardData Error:', err);
            res.status(500).json({ success: false, error: 'Server Error' });
        }
    }

    async getStats(req, res) {
        try {
            const userTenantId = req.session.user.tenant_id;
            const isAdmin = userTenantId === 1;
            const filterTenantId = req.query.tenant_id;

            let scopeWhere = 'WHERE tenant_id = ?';
            let targetTenantId = userTenantId;

            if (isAdmin) {
                if (filterTenantId) {
                    scopeWhere = 'WHERE tenant_id = ?';
                    targetTenantId = filterTenantId;
                } else {
                    scopeWhere = 'WHERE 1=1';
                    targetTenantId = null;
                }
            }

            const statParams = targetTenantId ? [targetTenantId] : [];

            const [rows] = await db.execute(`
        SELECT 
          DATE_FORMAT(datetime, '%d/%m') as date_label, 
          DATE(datetime) as date_val,
          source,
          SUM(amount) as value
        FROM payment_slips
        ${scopeWhere} 
          AND status = 'success'
          AND datetime >= DATE_SUB(CURRENT_DATE(), INTERVAL 6 DAY)
        GROUP BY 2, 1, 3
        ORDER BY 2 ASC
      `, statParams);
            res.json(rows);
        } catch (err) {
            console.error('getStats Error:', err);
            res.status(500).json({ success: false, error: 'Server Error' });
        }
    }

    async clearTestData(req, res) {
        try {
            const tenantId = req.session.user.tenant_id || 1;
            const role = req.session.user.role;

            if (role !== 'admin' && role !== 'owner') {
                return res.status(403).json({ success: false, message: 'สิทธิ์ไม่เพียงพอ' });
            }

            // ลบข้อมูลโดยอิงตาม tenant_id
            await db.execute(`DELETE FROM bill_items WHERE tenant_id = ?`, [tenantId]);
            await db.execute(`DELETE FROM bills WHERE tenant_id = ?`, [tenantId]);
            await db.execute(`DELETE FROM payment_slips WHERE tenant_id = ?`, [tenantId]);
            await db.execute(`DELETE FROM ocr_logs WHERE tenant_id = ?`, [tenantId]);

            res.json({ success: true, message: 'เคลียร์ข้อมูลทดสอบเรียบร้อยแล้ว' });
        } catch (err) {
            console.error('ClearTestData Error:', err);
            res.status(500).json({ success: false, error: 'Server Error' });
        }
    }
}

module.exports = new DashboardController();
