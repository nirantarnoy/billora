const db = require('../config/db');
const ExcelJS = require('exceljs');

class ExportController {
    async exportExpress(req, res) {
        try {
            const workbook = new ExcelJS.Workbook();

            // 1. Slips Sheet (Income)
            const slipSheet = workbook.addWorksheet('รายรับ (สลิป)');
            slipSheet.columns = [
                { header: 'วันที่', key: 'date', width: 15 },
                { header: 'เลขที่เอกสาร', key: 'doc_no', width: 20 },
                { header: 'รหัสสมุดเงินฝาก', key: 'book_code', width: 15 },
                { header: 'ชื่อผู้โอน/ลูกค้า', key: 'customer', width: 30 },
                { header: 'จำนวนเงิน', key: 'amount', width: 15 },
                { header: 'หมายเหตุ', key: 'remark', width: 30 }
            ];

            const [slips] = await db.execute(`
        SELECT s.*, c.express_book_code 
        FROM payment_slips s 
        LEFT JOIN online_channels c ON s.source = UPPER(c.platform)
        WHERE s.status = 'success'
        ORDER BY s.datetime DESC
      `);

            slips.forEach(s => {
                const date = new Date(s.datetime);
                const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
                slipSheet.addRow({
                    date: formattedDate,
                    doc_no: s.trans_id,
                    book_code: s.express_book_code || 'CASH',
                    customer: s.sender_name,
                    amount: Number(s.amount),
                    remark: `โอนผ่าน ${s.source}`
                });
            });

            // 2. Bills Sheet (Expenses)
            const billSheet = workbook.addWorksheet('รายจ่าย (บิล)');
            billSheet.columns = [
                { header: 'วันที่', key: 'date', width: 15 },
                { header: 'เลขที่บิล', key: 'doc_no', width: 20 },
                { header: 'ชื่อผู้จำหน่าย', key: 'vendor', width: 30 },
                { header: 'ยอดก่อนภาษี', key: 'before_vat', width: 15 },
                { header: 'ภาษี (7%)', key: 'vat', width: 15 },
                { header: 'ยอดรวมสุทธิ', key: 'total', width: 15 },
                { header: 'หมายเหตุ', key: 'remark', width: 30 }
            ];

            const [bills] = await db.execute('SELECT * FROM bills ORDER BY date DESC');
            bills.forEach(b => {
                const date = new Date(b.date);
                const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;

                const total = Number(b.total_amount);
                const vat = b.vat ? Number(b.vat) : Number((total * 7 / 107).toFixed(2));
                const beforeVat = Number((total - vat).toFixed(2));

                billSheet.addRow({
                    date: formattedDate,
                    doc_no: `EXP-${b.id}`,
                    vendor: b.store_name,
                    before_vat: beforeVat,
                    vat: vat,
                    total: total,
                    remark: `ซื้อจาก ${b.store_name}`
                });
            });

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=Express_Format_${Date.now()}.xlsx`);

            await workbook.xlsx.write(res);
            res.end();
        } catch (err) {
            res.status(500).send(err.message);
        }
    }

    async exportCustom(req, res) {
        try {
            const { type, columns } = req.query;
            const selectedCols = columns ? columns.split(',') : [];

            if (selectedCols.length === 0) return res.status(400).send('No columns selected');

            const workbook = new ExcelJS.Workbook();
            const sheet = workbook.addWorksheet('Export');

            let query = '';
            if (type === 'bills') {
                query = `SELECT ${selectedCols.join(',')} FROM bills ORDER BY id DESC`;
            } else {
                query = `SELECT ${selectedCols.join(',')} FROM payment_slips ORDER BY id DESC`;
            }

            const [data] = await db.execute(query);

            sheet.columns = selectedCols.map(col => ({ header: col.toUpperCase(), key: col, width: 20 }));
            data.forEach(row => sheet.addRow(row));

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=Export_${type}_${Date.now()}.xlsx`);

            await workbook.xlsx.write(res);
            res.end();
        } catch (err) {
            res.status(500).send(err.message);
        }
    }
}

module.exports = new ExportController();
