const db = require('../models/db');

class StockService {
    /**
     * Move from available to reserved
     */
    static async reserveStock(userId, orderSn, sku, quantity) {
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
    static async deductStock(userId, orderSn, sku, quantity) {
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
    static async cancelReservation(userId, orderSn, sku, quantity) {
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
        } catch (error) {
            await connection.rollback();
            console.error(`[Stock] Cancel Error: ${error.message}`);
        } finally {
            connection.release();
        }
    }
}

module.exports = StockService;
