const db = require('../models/db');
const StockUpdateService = require('./StockUpdateService');

class StockService {
    /**
     * Move from available to reserved
     */
    static async reserveStock(userId, orderSn, sku, quantity, platform = 'web') {
        if (!sku || sku === 'N/A' || quantity <= 0) return;

        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // 1. Check if already reserved or deducted
            const [status] = await connection.execute(
                'SELECT movement_type FROM inventory_movement_status WHERE user_id = ? AND order_sn = ? AND sku = ?',
                [userId, orderSn, sku]
            );

            if (status.length > 0 && status[0].movement_type !== 'NONE') {
                await connection.rollback();
                return;
            }

            // CHECK: Prevent negative on_hand
            const [product] = await connection.execute(
                'SELECT qty_on_hand FROM product WHERE user_id = ? AND sku = ? FOR UPDATE',
                [userId, sku]
            );

            if (product.length === 0 || product[0].qty_on_hand < quantity) {
                console.log(`[Stock] Skip Reserve: Insufficient stock for ${sku} (Need ${quantity}, Have ${product[0]?.qty_on_hand || 0})`);
                await connection.rollback();
                return;
            }

            // Available -> Reserved
            await connection.execute(
                'UPDATE product SET qty_on_hand = qty_on_hand - ?, qty_reserved = qty_reserved + ? WHERE user_id = ? AND sku = ?',
                [quantity, quantity, userId, sku]
            );

            // 3. Update/Insert status
            await connection.execute(
                `INSERT INTO inventory_movement_status (user_id, order_sn, sku, movement_type) 
                 VALUES (?, ?, ?, 'RESERVED') 
                 ON DUPLICATE KEY UPDATE movement_type = 'RESERVED'`,
                [userId, orderSn, sku]
            );

            await connection.commit();
            console.log(`[Stock] Reserved ${quantity} of ${sku} for Order ${orderSn}`);

            // Record in NEW inventory system
            await this.recordNewInventoryTransaction(connection, userId, sku, -quantity, 'FULFILLMENT', orderSn, platform);

            // Update Marketplace
            const [newProd] = await db.execute('SELECT qty_on_hand FROM product WHERE user_id = ? AND sku = ?', [userId, sku]);
            if (newProd.length > 0) {
                await StockUpdateService.updateStockEverywhere(userId, sku, newProd[0].qty_on_hand);
            }
        } catch (error) {
            await connection.rollback();
            console.error(`[Stock] Reserve Error: ${error.message}`);
        } finally {
            connection.release();
        }
    }

    /**
     * Move from reserved to actual deduction (final cut)
     */
    static async deductStock(userId, orderSn, sku, quantity, platform = 'web') {
        if (!sku || sku === 'N/A' || quantity <= 0) return;

        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // 1. Check current status
            const [status] = await connection.execute(
                'SELECT movement_type FROM inventory_movement_status WHERE user_id = ? AND order_sn = ? AND sku = ?',
                [userId, orderSn, sku]
            );

            const currentType = status.length > 0 ? status[0].movement_type : 'NONE';
            if (currentType === 'DEDUCTED') {
                await connection.rollback();
                return;
            }

            if (currentType === 'RESERVED') {
                // Finalize deduction from Reserved
                const [product] = await connection.execute(
                    'SELECT qty_reserved FROM product WHERE user_id = ? AND sku = ? FOR UPDATE',
                    [userId, sku]
                );

                if (product.length > 0 && product[0].qty_reserved >= quantity) {
                    await connection.execute(
                        'UPDATE product SET qty_reserved = qty_reserved - ? WHERE user_id = ? AND sku = ?',
                        [quantity, userId, sku]
                    );
                }
            } else {
                // Direct deduction from OnHand (Check safety)
                const [product] = await connection.execute(
                    'SELECT qty_on_hand FROM product WHERE user_id = ? AND sku = ? FOR UPDATE',
                    [userId, sku]
                );

                if (product.length > 0 && product[0].qty_on_hand >= quantity) {
                    await connection.execute(
                        'UPDATE product SET qty_on_hand = qty_on_hand - ? WHERE user_id = ? AND sku = ?',
                        [quantity, userId, sku]
                    );
                } else {
                    console.log(`[Stock] Skip Deduct: Insufficient stock for ${sku}`);
                    await connection.rollback();
                    return;
                }
            }

            // 2. Update status
            await connection.execute(
                `INSERT INTO inventory_movement_status (user_id, order_sn, sku, movement_type) 
                 VALUES (?, ?, ?, 'DEDUCTED') 
                 ON DUPLICATE KEY UPDATE movement_type = 'DEDUCTED'`,
                [userId, orderSn, sku]
            );

            await connection.commit();
            console.log(`[Stock] Finalized deduction for Order ${orderSn}, SKU ${sku}`);

            // Note: If previously reserved, we don't necessarily need another transaction here 
            // if the transaction was already created during RESERVATION. 
            // But if it's a DIRECT deduction (not reserved), we should record it.
            if (currentType !== 'RESERVED') {
                await this.recordNewInventoryTransaction(connection, userId, sku, -quantity, 'FULFILLMENT', orderSn, platform);
            }

            // Update Marketplace
            const [newProd] = await db.execute('SELECT qty_on_hand FROM product WHERE user_id = ? AND sku = ?', [userId, sku]);
            if (newProd.length > 0) {
                await StockUpdateService.updateStockEverywhere(userId, sku, newProd[0].qty_on_hand);
            }
        } catch (error) {
            await connection.rollback();
            console.error(`[Stock] Deduct Error: ${error.message}`);
        } finally {
            connection.release();
        }
    }

    /**
     * For Cancelled orders, return reserved to available
     */
    static async cancelReservation(userId, orderSn, sku, quantity, platform = 'web') {
        if (!sku || sku === 'N/A' || quantity <= 0) return;

        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const [status] = await connection.execute(
                'SELECT movement_type FROM inventory_movement_status WHERE user_id = ? AND order_sn = ? AND sku = ?',
                [userId, orderSn, sku]
            );

            if (status.length > 0 && status[0].movement_type === 'RESERVED') {
                const [product] = await connection.execute(
                    'SELECT qty_reserved FROM product WHERE user_id = ? AND sku = ? FOR UPDATE',
                    [userId, sku]
                );

                if (product.length > 0 && product[0].qty_reserved >= quantity) {
                    await connection.execute(
                        'UPDATE product SET qty_on_hand = qty_on_hand + ?, qty_reserved = qty_reserved - ? WHERE user_id = ? AND sku = ?',
                        [quantity, quantity, userId, sku]
                    );
                }

                await connection.execute(
                    'UPDATE inventory_movement_status SET movement_type = "NONE" WHERE user_id = ? AND order_sn = ? AND sku = ?',
                    [userId, orderSn, sku]
                );
                console.log(`[Stock] Cancelled reservation for Order ${orderSn}, SKU ${sku}`);
            }

            await connection.commit();

            if (status.length > 0 && status[0].movement_type === 'RESERVED') {
                // Return to new inventory system
                await this.recordNewInventoryTransaction(connection, userId, sku, quantity, 'RETURN', orderSn, platform);
            }

            // Update Marketplace
            const [newProd] = await db.execute('SELECT qty_on_hand FROM product WHERE user_id = ? AND sku = ?', [userId, sku]);
            if (newProd.length > 0) {
                await StockUpdateService.updateStockEverywhere(userId, sku, newProd[0].qty_on_hand);
            }
        } catch (error) {
            await connection.rollback();
            console.error(`[Stock] Cancel Error: ${error.message}`);
        } finally {
            connection.release();
        }
    }

    /**
     * Bridge to new inventory system
     */
    static async recordNewInventoryTransaction(connection, userId, sku, quantity, type, referenceNo, platform) {
        try {
            // 1. Get tenant_id
            const [users] = await connection.execute('SELECT tenant_id FROM users WHERE id = ?', [userId]);
            if (users.length === 0) return;
            const tenantId = users[0].tenant_id;

            // 2. Get product_id from new products table
            const [products] = await connection.execute('SELECT id, cost FROM products WHERE tenant_id = ? AND sku = ?', [tenantId, sku]);
            if (products.length === 0) return;
            const productId = products[0].id;
            const unitCost = products[0].cost || 0;

            // 3. Get first warehouse
            const [warehouses] = await connection.execute('SELECT id FROM warehouses WHERE tenant_id = ? LIMIT 1', [tenantId]);
            if (warehouses.length === 0) return;
            const warehouseId = warehouses[0].id;

            const stockIn = quantity > 0 ? quantity : 0;
            const stockOut = quantity < 0 ? Math.abs(quantity) : 0;
            const valueAmount = Math.abs(quantity) * unitCost;

            await connection.execute(
                `INSERT INTO inventory_transactions 
                (tenant_id, type, product_id, warehouse_id, quantity, stock_in, stock_out, value_amount, reference_no, source_platform, created_by) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [tenantId, type, productId, warehouseId, quantity, stockIn, stockOut, valueAmount, referenceNo, platform, userId]
            );

            // 4. Update Balance in new system
            const [bals] = await connection.execute(
                'SELECT id, quantity FROM inventory_balances WHERE warehouse_id = ? AND product_id = ? AND IFNULL(location_id, 0) = 0 AND IFNULL(lot_id, 0) = 0',
                [warehouseId, productId]
            );

            if (bals.length > 0) {
                const newQty = parseFloat(bals[0].quantity) + quantity;
                await connection.execute('UPDATE inventory_balances SET quantity = ? WHERE id = ?', [newQty, bals[0].id]);
            } else {
                await connection.execute(
                    'INSERT INTO inventory_balances (tenant_id, warehouse_id, product_id, quantity) VALUES (?, ?, ?, ?)',
                    [tenantId, warehouseId, productId, quantity]
                );
            }
        } catch (e) {
            console.error('[Stock] Failed to record in new inventory system:', e.message);
        }
    }
}

module.exports = StockService;
