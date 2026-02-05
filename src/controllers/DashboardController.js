const db = require('../config/db');

class DashboardController {
    async viewDashboard(req, res) {
        try {
            const companyId = req.session.user.company_id || 1;

            const [[summary]] = await db.execute(`
        SELECT 
          (SELECT COUNT(*) FROM bills WHERE company_id=?) AS bill_count,
          (SELECT IFNULL(SUM(total_amount), 0) FROM bills WHERE company_id=?) AS total_sales,
          (SELECT IFNULL(SUM(vat), 0) FROM bills WHERE company_id=?) AS total_vat,
          (SELECT COUNT(*) FROM payment_slips WHERE company_id=?) AS slip_count
      `, [companyId, companyId, companyId, companyId]);

            const [slipStatsRaw] = await db.execute(`
        SELECT source, IFNULL(SUM(amount), 0) as total_amount
        FROM payment_slips 
        WHERE company_id = ? AND status = 'success'
        GROUP BY source
      `, [companyId]);

            const slipStats = { BROWSER: 0, MOBILE: 0, LINE: 0, TOTAL: 0 };
            slipStatsRaw.forEach(row => {
                const amount = Number(row.total_amount) || 0;
                if (slipStats.hasOwnProperty(row.source)) slipStats[row.source] = amount;
                slipStats.TOTAL += amount;
            });

            const [bills] = await db.execute(`SELECT * FROM bills WHERE company_id=? ORDER BY id DESC LIMIT 10`, [companyId]);
            const [slips] = await db.execute(`SELECT * FROM payment_slips WHERE company_id=? ORDER BY id DESC LIMIT 10`, [companyId]);

            res.render('dashboard', {
                summary, bills, slips, slipStats,
                user: req.session.user, active: 'dashboard', title: 'แผงควบคุมหลัก',
                _csrf: req.csrfToken ? req.csrfToken() : ''
            });
        } catch (err) {
            res.status(500).send(err.message);
        }
    }

    // API for Mobile Dashboard
    async getApiDashboardData(req, res) {
        try {
            const companyId = req.session.user.company_id || 1;

            const [summaryRows] = await db.execute(`
        SELECT 
          (SELECT COUNT(*) FROM bills WHERE company_id=?) AS bill_count,
          (SELECT IFNULL(SUM(total_amount), 0) FROM bills WHERE company_id=?) AS total_sales,
          (SELECT IFNULL(SUM(vat), 0) FROM bills WHERE company_id=?) AS total_vat,
          (SELECT COUNT(*) FROM payment_slips WHERE company_id=?) AS slip_count
      `, [companyId, companyId, companyId, companyId]);

            const summary = summaryRows[0] || { bill_count: 0, total_sales: 0, total_vat: 0, slip_count: 0 };

            const [slipStatsRaw] = await db.execute(`
        SELECT source, IFNULL(SUM(amount), 0) as total_amount
        FROM payment_slips 
        WHERE company_id = ? AND status = 'success'
        GROUP BY source
      `, [companyId]);

            const slipStats = { BROWSER: 0, MOBILE: 0, LINE: 0, TOTAL: 0 };
            slipStatsRaw.forEach(row => {
                const amount = Number(row.total_amount) || 0;
                if (slipStats.hasOwnProperty(row.source)) slipStats[row.source] = amount;
                slipStats.TOTAL += amount;
            });

            const [latestBills] = await db.execute(`SELECT id, store_name, total_amount, date FROM bills WHERE company_id=? ORDER BY id DESC LIMIT 5`, [companyId]);
            const [latestSlips] = await db.execute(`SELECT id, trans_id, amount, datetime, source FROM payment_slips WHERE company_id=? ORDER BY id DESC LIMIT 5`, [companyId]);

            res.json({
                success: true,
                summary: {
                    bill_count: Number(summary.bill_count),
                    total_sales: Number(summary.total_sales),
                    total_vat: Number(summary.total_vat),
                    slip_count: Number(summary.slip_count)
                },
                slipStats,
                latestBills: latestBills.map(b => ({ ...b, total_amount: Number(b.total_amount) })),
                latestSlips: latestSlips.map(s => ({ ...s, amount: Number(s.amount) }))
            });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }

    async getStats(req, res) {
        try {
            const companyId = req.session.user.company_id || 1;
            const [rows] = await db.execute(`
        SELECT 
          DATE_FORMAT(datetime, '%d/%m') as date_label, 
          DATE(datetime) as date_val,
          source,
          SUM(amount) as value
        FROM payment_slips
        WHERE company_id = ? 
          AND status = 'success'
          AND datetime >= DATE_SUB(CURRENT_DATE(), INTERVAL 6 DAY)
        GROUP BY date_val, source
        ORDER BY date_val ASC
      `, [companyId]);
            res.json(rows);
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }
}

module.exports = new DashboardController();
