const db = require('../config/db');

class InventoryController {

    // === 0. Transactions / Stock Card ===
    async viewTransactions(req, res) {
        try {
            const tenantId = req.session.user.tenant_id;
            const { page = 1, product, type, startDate, endDate } = req.query;
            const limit = 20;
            const offset = (page - 1) * limit;

            let sql = `
                SELECT 
                    t.*,
                    p.name as product_name, p.sku,
                    w.name as warehouse_name,
                    l.name as location_name,
                    lot.lot_no,
                    u.username as created_by_name
                FROM inventory_transactions t
                JOIN products p ON t.product_id = p.id
                JOIN warehouses w ON t.warehouse_id = w.id
                LEFT JOIN warehouse_locations l ON t.location_id = l.id
                LEFT JOIN inventory_lots lot ON t.lot_id = lot.id
                LEFT JOIN users u ON t.created_by = u.id
                WHERE t.tenant_id = ?
            `;
            const params = [tenantId];

            if (product) {
                sql += ' AND (p.name LIKE ? OR p.sku LIKE ?)';
                params.push(`%${product}%`, `%${product}%`);
            }
            if (type) {
                sql += ' AND t.type = ?';
                params.push(type);
            }
            if (startDate) {
                sql += ' AND DATE(t.transaction_date) >= ?';
                params.push(startDate);
            }
            if (endDate) {
                sql += ' AND DATE(t.transaction_date) <= ?';
                params.push(endDate);
            }

            // Count total
            const countSql = `SELECT COUNT(*) as total FROM (${sql.replace('t.*,', '1,')}) as sub`;
            // Note: Simple replacement might fail if subqueries exist, but here it's fine. 
            // Better to rebuild count query properly if complex.
            // Let's just use the same WHERE clauses on a fresh COUNT query
            let countQuery = `
                SELECT COUNT(*) as total 
                FROM inventory_transactions t 
                JOIN products p ON t.product_id = p.id
                JOIN warehouses w ON t.warehouse_id = w.id
                WHERE t.tenant_id = ?
            `;
            if (product) countQuery += ' AND (p.name LIKE ? OR p.sku LIKE ?)';
            if (type) countQuery += ' AND t.type = ?';
            if (startDate) countQuery += ' AND DATE(t.transaction_date) >= ?';
            if (endDate) countQuery += ' AND DATE(t.transaction_date) <= ?';

            const [countRows] = await db.execute(countQuery, params);
            const totalItems = countRows[0].total;
            const totalPages = Math.ceil(totalItems / limit);

            // Fetch Data
            sql += ' ORDER BY t.transaction_date DESC LIMIT ? OFFSET ?';
            params.push(Number(limit), Number(offset));

            const [transactions] = await db.execute(sql, params);

            res.render('inventory/transactions', {
                user: req.session.user,
                active: 'inventory-transactions',
                title: 'ประวัติความเคลื่อนไหว (Stock Card)',
                transactions,
                filters: req.query,
                currentPage: parseInt(page),
                totalPages
            });

        } catch (err) {
            console.error('viewTransactions Error:', err);
            res.status(500).render('error', { message: 'Failed to load transactions' });
        }
    }

    // === 1. Dashboard / Balances ===
    async viewBalances(req, res) {
        try {
            const tenantId = req.session.user.tenant_id;
            const { warehouse, product, exact } = req.query;

            let sql = `
                SELECT 
                    b.id,
                    p.name as product_name, p.sku, p.code,
                    w.name as warehouse_name,
                    l.name as location_name,
                    lot.lot_no, lot.exp_date,
                    b.quantity
                FROM inventory_balances b
                JOIN products p ON b.product_id = p.id
                JOIN warehouses w ON b.warehouse_id = w.id
                LEFT JOIN warehouse_locations l ON b.location_id = l.id
                LEFT JOIN inventory_lots lot ON b.lot_id = lot.id
                WHERE b.tenant_id = ? AND b.quantity > 0
            `;
            const params = [tenantId];

            if (warehouse) {
                sql += ' AND b.warehouse_id = ?';
                params.push(warehouse);
            }
            if (product) {
                sql += ' AND (p.name LIKE ? OR p.sku LIKE ?)';
                params.push(`%${product}%`, `%${product}%`);
            }

            sql += ' ORDER BY p.name ASC, w.name ASC, lot.exp_date ASC';

            const [balances] = await db.execute(sql, params);

            // Get Warehouses for filter
            const [warehouses] = await db.execute('SELECT id, name FROM warehouses WHERE tenant_id = ?', [tenantId]);

            res.render('inventory/balances', {
                user: req.session.user,
                active: 'inventory-balance',
                title: 'ยอดคงเหลือสินค้า (Inventory Balance)',
                balances: balances,
                warehouses: warehouses,
                filters: req.query
            });
        } catch (err) {
            console.error('viewBalances Error:', err);
            res.status(500).render('error', { message: 'Failed to load balances' });
        }
    }

    // === 2. Transaction Form (Adjustment, Issue, Return) ===
    async viewTransactionForm(req, res) {
        try {
            const tenantId = req.session.user.tenant_id;
            const type = req.params.type; // adjustment, issue, return

            const [warehouses] = await db.execute('SELECT id, name FROM warehouses WHERE tenant_id = ?', [tenantId]);
            const [products] = await db.execute('SELECT id, name, sku FROM products WHERE tenant_id = ?', [tenantId]);

            let title = 'ทำรายการ';
            if (type === 'adjustment') title = 'ปรับยอดสินค้า (Adjustment)';
            if (type === 'issue') title = 'เบิกสินค้าออก (Issue/Out)';
            if (type === 'return') title = 'รับสินค้าคืน/เข้า (Return/In)';

            res.render('inventory/transaction_form', {
                user: req.session.user,
                active: `inventory-${type}`,
                title: title,
                type: type.toUpperCase(),
                warehouses,
                products
            });
        } catch (err) {
            console.error('viewTransactionForm Error:', err);
            res.status(500).render('error', { message: 'Failed to load form' });
        }
    }

    // === 3. Process Transaction ===
    async createTransaction(req, res) {
        const conn = await db.getConnection(); // Use transaction
        try {
            await conn.beginTransaction();

            const tenantId = req.session.user.tenant_id;
            const userId = req.session.user.id;
            const {
                type,           // ADJUSTMENT, ISSUE, RETURN
                product_id,
                warehouse_id,
                location_id,
                lot_no,         // String input for Lot
                mfg_date,
                exp_date,
                quantity,
                reason,
                note
            } = req.body;

            const qty = parseFloat(quantity);
            if (isNaN(qty) || qty <= 0) throw new Error('Invalid Quantity');

            // Get product cost
            const [prodCosts] = await conn.execute('SELECT cost FROM products WHERE id = ?', [product_id]);
            const unitCost = prodCosts.length > 0 ? parseFloat(prodCosts[0].cost || 0) : 0;

            // 1. Manage Lot 
            let lotId = null;
            if (lot_no) {
                // Check if lot exists
                const [lots] = await conn.execute(
                    'SELECT id FROM inventory_lots WHERE tenant_id = ? AND product_id = ? AND lot_no = ?',
                    [tenantId, product_id, lot_no]
                );

                if (lots.length > 0) {
                    lotId = lots[0].id;
                } else {
                    // Create new Lot if it's an 'IN' transaction or just create it anyway
                    const [resLot] = await conn.execute(
                        'INSERT INTO inventory_lots (tenant_id, product_id, lot_no, mfg_date, exp_date) VALUES (?, ?, ?, ?, ?)',
                        [tenantId, product_id, lot_no, mfg_date || null, exp_date || null]
                    );
                    lotId = resLot.insertId;
                }
            }

            // 2. Adjust Balance
            // Check existing balance
            const [bals] = await conn.execute(
                'SELECT id, quantity FROM inventory_balances WHERE warehouse_id = ? AND product_id = ? AND IFNULL(location_id, 0) = ? AND IFNULL(lot_id, 0) = ?',
                [warehouse_id, product_id, location_id || 0, lotId || 0]
            );

            let currentQty = 0;
            let balanceId = null;

            if (bals.length > 0) {
                currentQty = parseFloat(bals[0].quantity);
                balanceId = bals[0].id;
            }

            let newQty = currentQty;
            let transactionQty = 0; // Quantiy to record in transaction log (+/-)

            if (type === 'ISSUE') {
                if (currentQty < qty) throw new Error(`Stock not enough. Current: ${currentQty}, Request: ${qty}`);
                newQty = currentQty - qty;
                transactionQty = -qty;
            } else if (type === 'RETURN' || type === 'RECEIVE') {
                newQty = currentQty + qty;
                transactionQty = qty;
            } else if (type === 'ADJUSTMENT') {
                // If Adjustment, 'quantity' in form usually means 'correct quantity' or 'diff'. 
                // Let's assume user enters the *Quantity to Add/Remove* or *Actual Count*.
                // For simplicity + robustness: Let's assume input is the DIFF (+/-) automatically handled? 
                // Or user inputs "Absolute Count"?
                // Let's assume the form sends the ABSOLUTE NEW QUANTITY for Adjustment? 
                // Or typically Adjustment form asks "Add/Remove". 
                // Let's stick to standard: Issue (-), Return (+). 
                // For 'ADJUSTMENT', let's assume the user selects "Add" or "Reduce".
                // But here I'll assume req.body.adjust_mode determines sign.

                const adjustMode = req.body.adjust_mode; // 'add' or 'subtract' or 'set'
                if (adjustMode === 'set') {
                    transactionQty = qty - currentQty;
                    newQty = qty;
                } else if (adjustMode === 'subtract') {
                    newQty = currentQty - qty;
                    transactionQty = -qty;
                } else { // add
                    newQty = currentQty + qty;
                    transactionQty = qty;
                }
            }

            // Update/Insert Balance
            if (balanceId) {
                await conn.execute('UPDATE inventory_balances SET quantity = ? WHERE id = ?', [newQty, balanceId]);
            } else {
                await conn.execute(
                    'INSERT INTO inventory_balances (tenant_id, warehouse_id, product_id, location_id, lot_id, quantity) VALUES (?, ?, ?, ?, ?, ?)',
                    [tenantId, warehouse_id, product_id, location_id || null, lotId, newQty]
                );
            }

            // 3. Record Transaction
            const stockIn = transactionQty > 0 ? transactionQty : 0;
            const stockOut = transactionQty < 0 ? Math.abs(transactionQty) : 0;
            const valueAmount = Math.abs(transactionQty) * unitCost;

            await conn.execute(
                `INSERT INTO inventory_transactions 
                (tenant_id, type, product_id, warehouse_id, location_id, lot_id, quantity, stock_in, stock_out, value_amount, reason, note, created_by) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [tenantId, type, product_id, warehouse_id, location_id || null, lotId, transactionQty, stockIn, stockOut, valueAmount, reason, note, userId]
            );

            await conn.commit();
            res.redirect('/inventory/balances?success=1');

        } catch (err) {
            await conn.rollback();
            console.error('createTransaction Error:', err);
            res.redirect(`/inventory/transaction/${req.body.type.toLowerCase()}?error=` + encodeURIComponent(err.message));
        } finally {
            conn.release();
        }
    }

    // === 4. AJAX Get Locations / Lots ===
    async getLocations(req, res) {
        try {
            const { warehouseId } = req.params;
            const [locs] = await db.execute('SELECT id, name FROM warehouse_locations WHERE warehouse_id = ? AND status="active"', [warehouseId]);
            res.json(locs);
        } catch (e) { res.status(500).json([]); }
    }

    // === 5. AJAX Get Available Stock for Product ===
    async getStockForProduct(req, res) {
        try {
            const tenantId = req.session.user.tenant_id;
            const { productId } = req.params;

            const sql = `
                SELECT 
                    b.id as balance_id,
                    b.warehouse_id, w.name as warehouse_name,
                    b.location_id, l.name as location_name,
                    b.lot_id, lot.lot_no, lot.exp_date,
                    b.quantity
                FROM inventory_balances b
                JOIN warehouses w ON b.warehouse_id = w.id
                LEFT JOIN warehouse_locations l ON b.location_id = l.id
                LEFT JOIN inventory_lots lot ON b.lot_id = lot.id
                WHERE b.tenant_id = ? AND b.product_id = ? AND b.quantity > 0
                ORDER BY lot.exp_date ASC, b.quantity ASC
            `;
            const [stocks] = await db.execute(sql, [tenantId, productId]);
            res.json(stocks);
        } catch (err) {
            console.error('getStockForProduct Error:', err);
            res.status(500).json({ error: 'Failed to fetch stock' });
        }
    }

    // === 6. View Master-Detail Issue Form ===
    async viewIssueForm(req, res) {
        try {
            const tenantId = req.session.user.tenant_id;
            const [products] = await db.execute('SELECT id, name, sku, code, image_urls FROM products WHERE tenant_id = ? AND status="active" ORDER BY name ASC', [tenantId]);

            // Generate Reference No Preview (Simple)
            const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            const refNoPreview = `ISS-${dateStr}-XXXX`;

            res.render('inventory/issue_form_master', {
                user: req.session.user,
                active: 'inventory-issue',
                title: 'เบิกสินค้า (Issue Stock)',
                products,
                refNoPreview
            });
        } catch (err) {
            console.error(err);
            res.status(500).render('error', { message: 'Failed to load form' });
        }
    }

    // === 7. Process Bulk Transaction (Master-Detail) ===
    async createBulkTransaction(req, res) {
        const conn = await db.getConnection();
        try {
            await conn.beginTransaction();

            const tenantId = req.session.user.tenant_id;
            const userId = req.session.user.id;
            const {
                type,           // ISSUE
                transaction_date,
                reference_no,
                reason,
                note,
                items           // JSON string or array of objects
            } = req.body;

            // Generate Reference No if empty
            let finalRefNo = reference_no;
            if (!finalRefNo) {
                const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
                const [rows] = await conn.execute(
                    'SELECT COUNT(*) as count FROM inventory_transactions WHERE tenant_id = ? AND DATE(created_at) = CURDATE()',
                    [tenantId]
                );
                const count = rows[0].count + 1;
                finalRefNo = `${type.substring(0, 3).toUpperCase()}-${dateStr}-${String(count).padStart(4, '0')}`;
            }

            // Parse items if it's a JSON string (e.g. from hidden input) or use directly if array
            let itemList = items;
            if (typeof items === 'string') {
                itemList = JSON.parse(items);
            }

            if (!itemList || itemList.length === 0) throw new Error('No items to process');

            for (const item of itemList) {
                const { product_id, warehouse_id, location_id, lot_id, quantity } = item;
                const qty = parseFloat(quantity);

                if (qty <= 0) continue;

                // 1. Get Product Cost
                const [prodCosts] = await conn.execute('SELECT cost FROM products WHERE id = ?', [product_id]);
                const unitCost = prodCosts.length > 0 ? parseFloat(prodCosts[0].cost || 0) : 0;

                // 2. Validate & Update Balance (Specific logic for ISSUE)
                if (type === 'ISSUE') {
                    // Lock specific balance row
                    const [bals] = await conn.execute(
                        `SELECT id, quantity FROM inventory_balances 
                         WHERE tenant_id = ? AND product_id = ? AND warehouse_id = ? 
                         AND IFNULL(location_id, 0) = ? AND IFNULL(lot_id, 0) = ? 
                         FOR UPDATE`,
                        [tenantId, product_id, warehouse_id, location_id || 0, lot_id || 0]
                    );

                    if (bals.length === 0) {
                        throw new Error(`Stock not found for Product ID ${product_id} at selected location`);
                    }

                    const currentQty = parseFloat(bals[0].quantity);
                    if (currentQty < qty) {
                        throw new Error(`Insufficient stock for Product ID ${product_id}. Available: ${currentQty}, Request: ${qty}`);
                    }

                    const newQty = currentQty - qty;
                    await conn.execute('UPDATE inventory_balances SET quantity = ? WHERE id = ?', [newQty, bals[0].id]);
                }

                // 3. Record Transaction
                const transactionQty = (type === 'ISSUE') ? -qty : qty;
                const stockIn = transactionQty > 0 ? transactionQty : 0;
                const stockOut = transactionQty < 0 ? Math.abs(transactionQty) : 0;
                const valueAmount = Math.abs(transactionQty) * unitCost;

                await conn.execute(
                    `INSERT INTO inventory_transactions 
                    (tenant_id, transaction_date, type, product_id, warehouse_id, location_id, lot_id, quantity, stock_in, stock_out, value_amount, reference_no, reason, note, created_by) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        tenantId,
                        transaction_date || new Date(),
                        type,
                        product_id,
                        warehouse_id,
                        location_id || null,
                        lot_id || null,
                        transactionQty,
                        stockIn,
                        stockOut,
                        valueAmount,
                        finalRefNo,
                        reason,
                        note,
                        userId
                    ]
                );
            }

            await conn.commit();
            res.json({ success: true, reference_no: finalRefNo });

        } catch (err) {
            await conn.rollback();
            console.error('createBulkTransaction Error:', err);
            res.status(500).json({ success: false, message: err.message });
        } finally {
            conn.release();
        }
    }
    // === 8. Purchase Plan (Reorder) ===
    async viewPurchasePlan(req, res) {
        try {
            const tenantId = req.session.user.tenant_id;

            // Query Product with Total Quantity and Reorder Point check
            // Logic: Total Qty < Min Stock AND Min Stock > 0
            const sql = `
                SELECT 
                    p.id, p.code, p.name, p.sku, p.cost, 
                    p.min_stock, p.max_stock, p.multiple_qty,
                    IFNULL(SUM(b.quantity), 0) as current_stock
                FROM products p
                LEFT JOIN inventory_balances b ON p.id = b.product_id AND b.tenant_id = p.tenant_id
                WHERE p.tenant_id = ? AND p.min_stock > 0
                GROUP BY p.id
                HAVING current_stock < p.min_stock
                ORDER BY p.name ASC
            `;

            const [products] = await db.execute(sql, [tenantId]);

            // Calculate Order Quantity
            const plans = products.map(p => {
                const deficit = (parseFloat(p.max_stock) || 0) - parseFloat(p.current_stock);
                const multiple = parseFloat(p.multiple_qty) || 1;

                // If max_stock is 0 or less than current, we still need to order because below min.
                // Usually order up to Max. If Max is not set, maybe just order multiple?
                // Let's assume standard: Fill up to MaxStock.
                // If MaxStock <= MinStock (config error?), let's at least order to reach MinStock + buffer?
                // Or simplistic: OrderQty = CEIL((MaxStock - Current) / Multiple) * Multiple.

                let orderQty = 0;
                if ((parseFloat(p.max_stock) || 0) > 0) {
                    // Target: Max Stock
                    const need = Math.max(0, (parseFloat(p.max_stock) - parseFloat(p.current_stock)));
                    orderQty = Math.ceil(need / multiple) * multiple;
                } else {
                    // Fallback if Max not set: Order enough to just pass Min? Or just 1 multiple?
                    // Let's assume order 1 multiple at least, or enough to reach Min.
                    // Let's set default logic: if Max=0, target = Min_Stock + Multiple
                    const target = parseFloat(p.min_stock) + multiple;
                    const need = Math.max(0, target - parseFloat(p.current_stock));
                    orderQty = Math.ceil(need / multiple) * multiple;
                }

                return {
                    ...p,
                    order_quantity: orderQty,
                    estimated_cost: orderQty * (parseFloat(p.cost) || 0)
                };
            });

            res.render('inventory/purchase_plan', {
                user: req.session.user,
                active: 'inventory-purchase-plan',
                title: 'แผนการสั่งซื้อ (Purchase Plan)',
                plans
            });

        } catch (err) {
            console.error('viewPurchasePlan Error:', err);
            res.status(500).render('error', { message: 'Failed to load purchase plan' });
        }
    }
}

module.exports = new InventoryController();
