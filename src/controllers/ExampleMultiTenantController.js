/**
 * ตัวอย่างการใช้งาน Multi-tenant System
 * แสดงวิธีการแก้ไข Controller เดิมให้รองรับ Multi-tenant
 */

const pool = require('../config/db');
const { addTenantScope } = require('../middleware/tenant');

class ExampleController {
    /**
     * ตัวอย่าง 1: ดึงข้อมูลทั้งหมด (แบบง่าย)
     */
    static async getAllSimple(req, res) {
        try {
            const tenantId = req.tenantId; // จาก loadTenant middleware

            // วิธีที่ 1: เขียน query เอง
            const [bills] = await pool.query(
                `SELECT * FROM bills WHERE tenant_id = ? ORDER BY created_at DESC`,
                [tenantId]
            );

            res.json({
                success: true,
                data: bills
            });
        } catch (error) {
            console.error('Get All Bills Error:', error);
            res.status(500).json({
                success: false,
                message: 'เกิดข้อผิดพลาด'
            });
        }
    }

    /**
     * ตัวอย่าง 2: ดึงข้อมูลด้วย Helper Function
     */
    static async getAllWithHelper(req, res) {
        try {
            const tenantId = req.tenantId;

            // วิธีที่ 2: ใช้ helper function
            let query = `SELECT * FROM bills ORDER BY created_at DESC`;
            let params = [];

            // เพิ่ม tenant scope อัตโนมัติ
            const scoped = addTenantScope(query, params, tenantId);

            const [bills] = await pool.query(scoped.query, scoped.params);

            res.json({
                success: true,
                data: bills
            });
        } catch (error) {
            console.error('Get All Bills Error:', error);
            res.status(500).json({
                success: false,
                message: 'เกิดข้อผิดพลาด'
            });
        }
    }

    /**
     * ตัวอย่าง 3: ดึงข้อมูลตาม ID
     */
    static async getById(req, res) {
        try {
            const tenantId = req.tenantId;
            const billId = req.params.id;

            // ต้องมี tenant_id ในเงื่อนไขด้วยเสมอ
            const [bills] = await pool.query(
                `SELECT * FROM bills WHERE id = ? AND tenant_id = ?`,
                [billId, tenantId]
            );

            if (bills.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'ไม่พบข้อมูล'
                });
            }

            res.json({
                success: true,
                data: bills[0]
            });
        } catch (error) {
            console.error('Get Bill By ID Error:', error);
            res.status(500).json({
                success: false,
                message: 'เกิดข้อผิดพลาด'
            });
        }
    }

    /**
     * ตัวอย่าง 4: สร้างข้อมูลใหม่
     */
    static async create(req, res) {
        try {
            const tenantId = req.tenantId;
            const { bill_number, amount, vendor_name } = req.body;

            // ต้องเพิ่ม tenant_id เข้าไปด้วยเสมอ
            const [result] = await pool.query(
                `INSERT INTO bills (tenant_id, bill_number, amount, vendor_name, created_at)
                 VALUES (?, ?, ?, ?, NOW())`,
                [tenantId, bill_number, amount, vendor_name]
            );

            res.status(201).json({
                success: true,
                message: 'สร้างข้อมูลสำเร็จ',
                data: { id: result.insertId }
            });
        } catch (error) {
            console.error('Create Bill Error:', error);
            res.status(500).json({
                success: false,
                message: 'เกิดข้อผิดพลาด'
            });
        }
    }

    /**
     * ตัวอย่าง 5: อัพเดทข้อมูล
     */
    static async update(req, res) {
        try {
            const tenantId = req.tenantId;
            const billId = req.params.id;
            const { amount, vendor_name } = req.body;

            // ต้องมี tenant_id ในเงื่อนไข WHERE เสมอ
            const [result] = await pool.query(
                `UPDATE bills 
                 SET amount = ?, vendor_name = ?, updated_at = NOW()
                 WHERE id = ? AND tenant_id = ?`,
                [amount, vendor_name, billId, tenantId]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'ไม่พบข้อมูลหรือไม่มีสิทธิ์แก้ไข'
                });
            }

            res.json({
                success: true,
                message: 'อัพเดทข้อมูลสำเร็จ'
            });
        } catch (error) {
            console.error('Update Bill Error:', error);
            res.status(500).json({
                success: false,
                message: 'เกิดข้อผิดพลาด'
            });
        }
    }

    /**
     * ตัวอย่าง 6: ลบข้อมูล (Soft Delete)
     */
    static async delete(req, res) {
        try {
            const tenantId = req.tenantId;
            const billId = req.params.id;

            // Soft delete - ใช้ deleted_at
            const [result] = await pool.query(
                `UPDATE bills 
                 SET deleted_at = NOW()
                 WHERE id = ? AND tenant_id = ? AND deleted_at IS NULL`,
                [billId, tenantId]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'ไม่พบข้อมูลหรือไม่มีสิทธิ์ลบ'
                });
            }

            res.json({
                success: true,
                message: 'ลบข้อมูลสำเร็จ'
            });
        } catch (error) {
            console.error('Delete Bill Error:', error);
            res.status(500).json({
                success: false,
                message: 'เกิดข้อผิดพลาด'
            });
        }
    }

    /**
     * ตัวอย่าง 7: ค้นหาด้วยเงื่อนไขหลายอย่าง
     */
    static async search(req, res) {
        try {
            const tenantId = req.tenantId;
            const { keyword, date_from, date_to, min_amount, max_amount } = req.query;

            let query = `SELECT * FROM bills WHERE tenant_id = ?`;
            const params = [tenantId];

            // เพิ่มเงื่อนไขตามที่มี
            if (keyword) {
                query += ` AND (bill_number LIKE ? OR vendor_name LIKE ?)`;
                params.push(`%${keyword}%`, `%${keyword}%`);
            }

            if (date_from) {
                query += ` AND created_at >= ?`;
                params.push(date_from);
            }

            if (date_to) {
                query += ` AND created_at <= ?`;
                params.push(date_to);
            }

            if (min_amount) {
                query += ` AND amount >= ?`;
                params.push(min_amount);
            }

            if (max_amount) {
                query += ` AND amount <= ?`;
                params.push(max_amount);
            }

            query += ` AND deleted_at IS NULL ORDER BY created_at DESC`;

            const [bills] = await pool.query(query, params);

            res.json({
                success: true,
                data: bills,
                count: bills.length
            });
        } catch (error) {
            console.error('Search Bills Error:', error);
            res.status(500).json({
                success: false,
                message: 'เกิดข้อผิดพลาด'
            });
        }
    }

    /**
     * ตัวอย่าง 8: JOIN กับตารางอื่น
     */
    static async getBillsWithDetails(req, res) {
        try {
            const tenantId = req.tenantId;

            // JOIN กับตารางอื่น - ต้องมี tenant_id ทุกตาราง
            const [bills] = await pool.query(
                `SELECT 
                    b.*,
                    u.first_name as created_by_name,
                    COUNT(bi.id) as item_count
                 FROM bills b
                 LEFT JOIN users u ON b.created_by = u.id AND u.tenant_id = ?
                 LEFT JOIN bill_items bi ON b.id = bi.bill_id AND bi.tenant_id = ?
                 WHERE b.tenant_id = ? AND b.deleted_at IS NULL
                 GROUP BY b.id
                 ORDER BY b.created_at DESC`,
                [tenantId, tenantId, tenantId]
            );

            res.json({
                success: true,
                data: bills
            });
        } catch (error) {
            console.error('Get Bills With Details Error:', error);
            res.status(500).json({
                success: false,
                message: 'เกิดข้อผิดพลาด'
            });
        }
    }

    /**
     * ตัวอย่าง 9: สถิติและรายงาน
     */
    static async getStatistics(req, res) {
        try {
            const tenantId = req.tenantId;

            // สถิติต่างๆ - ต้องมี tenant_id เสมอ
            const [stats] = await pool.query(
                `SELECT 
                    COUNT(*) as total_bills,
                    SUM(amount) as total_amount,
                    AVG(amount) as avg_amount,
                    MIN(amount) as min_amount,
                    MAX(amount) as max_amount
                 FROM bills
                 WHERE tenant_id = ? AND deleted_at IS NULL`,
                [tenantId]
            );

            // สถิติรายเดือน
            const [monthly] = await pool.query(
                `SELECT 
                    DATE_FORMAT(created_at, '%Y-%m') as month,
                    COUNT(*) as count,
                    SUM(amount) as total
                 FROM bills
                 WHERE tenant_id = ? AND deleted_at IS NULL
                 GROUP BY DATE_FORMAT(created_at, '%Y-%m')
                 ORDER BY month DESC
                 LIMIT 12`,
                [tenantId]
            );

            res.json({
                success: true,
                data: {
                    summary: stats[0],
                    monthly: monthly
                }
            });
        } catch (error) {
            console.error('Get Statistics Error:', error);
            res.status(500).json({
                success: false,
                message: 'เกิดข้อผิดพลาด'
            });
        }
    }

    /**
     * ตัวอย่าง 10: Transaction (สร้างหลายตารางพร้อมกัน)
     */
    static async createWithItems(req, res) {
        const connection = await pool.getConnection();

        try {
            const tenantId = req.tenantId;
            const { bill_number, amount, vendor_name, items } = req.body;

            await connection.beginTransaction();

            // 1. สร้าง bill
            const [billResult] = await connection.query(
                `INSERT INTO bills (tenant_id, bill_number, amount, vendor_name, created_at)
                 VALUES (?, ?, ?, ?, NOW())`,
                [tenantId, bill_number, amount, vendor_name]
            );

            const billId = billResult.insertId;

            // 2. สร้าง bill items
            if (items && items.length > 0) {
                const itemValues = items.map(item => [
                    tenantId,  // ต้องมี tenant_id ด้วย
                    billId,
                    item.product_name,
                    item.quantity,
                    item.price
                ]);

                await connection.query(
                    `INSERT INTO bill_items (tenant_id, bill_id, product_name, quantity, price)
                     VALUES ?`,
                    [itemValues]
                );
            }

            await connection.commit();

            res.status(201).json({
                success: true,
                message: 'สร้างข้อมูลสำเร็จ',
                data: { id: billId }
            });
        } catch (error) {
            await connection.rollback();
            console.error('Create Bill With Items Error:', error);
            res.status(500).json({
                success: false,
                message: 'เกิดข้อผิดพลาด'
            });
        } finally {
            connection.release();
        }
    }
}

module.exports = ExampleController;
