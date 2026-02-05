const db = require('../config/db');

class FulfillmentController {
    // === Warehouse Management ===

    async viewWarehouses(req, res) {
        try {
            const tenantId = req.session.user.tenant_id;
            // Pagination & Search
            const page = parseInt(req.query.page) || 1;
            const limit = req.query.limit === 'all' ? 'all' : (parseInt(req.query.limit) || 20);
            const limitVal = limit === 'all' ? 1000000 : limit;
            const offsetVal = (page - 1) * limitVal;
            const search = req.query.q || '';

            // Base Query
            let sql = 'SELECT * FROM warehouses WHERE tenant_id = ?';
            let params = [tenantId];

            let countSql = 'SELECT COUNT(*) as total FROM warehouses WHERE tenant_id = ?';
            let countParams = [tenantId];

            if (search) {
                const searchTerm = `%${search}%`;
                const searchClause = ' AND (name LIKE ? OR code LIKE ?)';
                sql += searchClause;
                params.push(searchTerm, searchTerm);
                countSql += searchClause;
                countParams.push(searchTerm, searchTerm);
            }

            sql += ` ORDER BY created_at DESC LIMIT ${Number(limitVal)} OFFSET ${Number(offsetVal)}`;
            // params.push(Number(limitVal), Number(offsetVal));

            // Execute
            const [warehouses] = await db.execute(sql, params);
            const [countRows] = await db.execute(countSql, countParams);
            const totalItems = countRows[0].total;
            const totalPages = Math.ceil(totalItems / limitVal);

            // Fetch locations count for each warehouse (Ideally should be a JOIN/Subquery for performance, but loop is fine for small limits)
            for (let wh of warehouses) {
                const [locs] = await db.execute(
                    'SELECT COUNT(*) as count FROM warehouse_locations WHERE warehouse_id = ? AND status = "active"',
                    [wh.id]
                );
                wh.location_count = locs[0].count;
            }

            res.render('fulfillment/warehouses', {
                user: req.session.user,
                active: 'inventory',
                title: 'จัดการคลังสินค้า',
                warehouses: warehouses || [],
                pagination: {
                    page,
                    page,
                    limit: limit,
                    totalItems,
                    totalPages,
                    search
                }
            });
        } catch (err) {
            console.error('viewWarehouses Error:', err);
            res.status(500).render('error', { message: 'เกิดข้อผิดพลาดในการโหลดคลังสินค้า' });
        }
    }

    // ... create/delete methods ...

    // Same for Products
    async viewProducts(req, res) {
        try {
            const tenantId = req.session.user.tenant_id;

            // Pagination & Search
            const page = parseInt(req.query.page) || 1;
            const limit = req.query.limit === 'all' ? 'all' : (parseInt(req.query.limit) || 20);
            const limitVal = limit === 'all' ? 1000000 : limit;
            const offsetVal = (page - 1) * limitVal;
            const search = req.query.q || '';

            let sql = `
                SELECT p.*, 
                (SELECT SUM(quantity) FROM inventory_balances b WHERE b.product_id = p.id AND b.tenant_id = p.tenant_id) as total_quantity 
                FROM products p 
                WHERE p.tenant_id = ?
            `;
            let params = [tenantId];

            let countSql = 'SELECT COUNT(*) as total FROM products WHERE tenant_id = ?';
            let countParams = [tenantId];

            if (search) {
                const searchTerm = `%${search}%`;
                const searchClause = ' AND (p.name LIKE ? OR p.sku LIKE ? OR p.code LIKE ?)';
                sql += searchClause;
                params.push(searchTerm, searchTerm, searchTerm);
                countSql += searchClause;
                countParams.push(searchTerm, searchTerm, searchTerm);
            }

            sql += ` ORDER BY p.created_at DESC LIMIT ${Number(limitVal)} OFFSET ${Number(offsetVal)}`;
            // params.push(Number(limitVal), Number(offsetVal));

            const [products] = await db.execute(sql, params);
            const [countRows] = await db.execute(countSql, countParams);
            const totalItems = countRows[0].total;
            const totalPages = Math.ceil(totalItems / limitVal);

            res.render('fulfillment/products', {
                user: req.session.user,
                active: 'inventory',
                title: 'จัดการสินค้า',
                products: products || [],
                pagination: {
                    page,
                    page,
                    limit: limit,
                    totalItems,
                    totalPages,
                    search
                }
            });
        } catch (err) {
            console.error('viewProducts Error:', err);
            res.status(500).render('error', { message: 'เกิดข้อผิดพลาดในการโหลดสินค้า' });
        }
    }

    async createWarehouse(req, res) {
        try {
            const tenantId = req.session.user.tenant_id;
            const { name, code, address } = req.body;

            await db.execute(
                'INSERT INTO warehouses (tenant_id, name, code, address, status) VALUES (?, ?, ?, ?, "active")',
                [tenantId, name, code, address]
            );

            res.redirect('/fulfillment/warehouses');
        } catch (err) {
            console.error('createWarehouse Error:', err);
            res.redirect('/fulfillment/warehouses?error=create_failed');
        }
    }

    async deleteWarehouse(req, res) {
        try {
            const tenantId = req.session.user.tenant_id;
            const { id } = req.body; // Or req.params if using DELETE method link

            await db.execute('DELETE FROM warehouses WHERE id = ? AND tenant_id = ?', [id, tenantId]);
            res.redirect('/fulfillment/warehouses');
        } catch (err) {
            console.error('deleteWarehouse Error:', err);
            res.redirect('/fulfillment/warehouses?error=delete_failed');
        }
    }

    // === Location Management ===

    async viewLocations(req, res) {
        try {
            const tenantId = req.session.user.tenant_id;
            const warehouseId = req.params.warehouseId;

            // Pagination & Search
            const page = parseInt(req.query.page) || 1;
            const limit = req.query.limit === 'all' ? 'all' : (parseInt(req.query.limit) || 20);
            const limitVal = limit === 'all' ? 1000000 : limit;
            const offsetVal = (page - 1) * limitVal;
            const search = req.query.q || '';

            const [warehouse] = await db.execute(
                'SELECT * FROM warehouses WHERE id = ? AND tenant_id = ?',
                [warehouseId, tenantId]
            );

            if (!warehouse.length) {
                return res.redirect('/fulfillment/warehouses');
            }

            // Query
            let sql = 'SELECT * FROM warehouse_locations WHERE warehouse_id = ?';
            let params = [warehouseId];

            let countSql = 'SELECT COUNT(*) as total FROM warehouse_locations WHERE warehouse_id = ?';
            let countParams = [warehouseId];

            if (search) {
                const searchTerm = `%${search}%`;
                const searchClause = ' AND (name LIKE ? OR description LIKE ?)';
                sql += searchClause;
                params.push(searchTerm, searchTerm);
                countSql += searchClause;
                countParams.push(searchTerm, searchTerm);
            }

            sql += ` ORDER BY name ASC LIMIT ${Number(limitVal)} OFFSET ${Number(offsetVal)}`;
            // params.push(Number(limitVal), Number(offsetVal));

            const [locations] = await db.execute(sql, params);
            const [countRows] = await db.execute(countSql, countParams);
            const totalItems = countRows[0].total;
            const totalPages = Math.ceil(totalItems / limitVal);

            res.render('fulfillment/locations', {
                user: req.session.user,
                active: 'inventory',
                title: `จุดจัดเก็บ - ${warehouse[0].name}`,
                warehouse: warehouse[0],
                locations: locations || [],
                pagination: {
                    page,
                    page,
                    limit: limit,
                    totalItems,
                    totalPages,
                    search
                }
            });
        } catch (err) {
            console.error('viewLocations Error:', err);
            res.redirect('/fulfillment/warehouses');
        }
    }

    async createLocation(req, res) {
        try {
            const tenantId = req.session.user.tenant_id;
            const warehouseId = req.params.warehouseId;
            const { name, description } = req.body;

            await db.execute(
                'INSERT INTO warehouse_locations (warehouse_id, tenant_id, name, description, status) VALUES (?, ?, ?, ?, "active")',
                [warehouseId, tenantId, name, description]
            );

            res.redirect(`/fulfillment/warehouses/${warehouseId}/locations`);
        } catch (err) {
            console.error('createLocation Error:', err);
            const warehouseId = req.params.warehouseId;
            res.redirect(`/fulfillment/warehouses/${warehouseId}/locations?error=create_failed`);
        }
    }


    // === Product Management ===



    async viewProductForm(req, res) {
        try {
            const tenantId = req.session.user.tenant_id;
            const productId = req.params.id; // Optional, if editing

            let product = null;
            let mappings = [];

            if (productId) {
                const [rows] = await db.execute('SELECT * FROM products WHERE id = ? AND tenant_id = ?', [productId, tenantId]);
                if (rows.length) {
                    product = rows[0];
                    // Parse image_urls if string (though JSON type returns object usually, check driver behavior)
                    if (typeof product.image_urls === 'string') {
                        try { product.image_urls = JSON.parse(product.image_urls); } catch (e) { product.image_urls = []; }
                    }

                    // Get Mappings
                    const [mapRows] = await db.execute('SELECT * FROM marketplace_product_mappings WHERE product_id = ?', [productId]);
                    mappings = mapRows;
                }
            }

            res.render('fulfillment/product_form', {
                user: req.session.user,
                active: 'inventory',
                title: productId ? 'แก้ไขสินค้า' : 'เพิ่มสินค้าใหม่',
                product: product,
                mappings: mappings
            });
        } catch (err) {
            console.error('viewProductForm Error:', err);
            res.redirect('/fulfillment/products');
        }
    }

    async saveProduct(req, res) {
        try {
            const tenantId = req.session.user.tenant_id;
            const { id, code, name, sku, description, unit_id, cost, sale_price, avg_cost,
                min_stock, max_stock, multiple_qty, image_urls_json, marketplace_mappings_json } = req.body;

            // Handle images
            let imageUrls = [];
            if (image_urls_json) {
                try {
                    imageUrls = JSON.parse(image_urls_json);
                } catch (e) { console.error('JSON Parse Error', e); }
            }
            if (imageUrls.length > 4) imageUrls = imageUrls.slice(0, 4);

            let productId = id;

            if (id) {
                // Update
                await db.execute(
                    `UPDATE products SET 
                        code=?, name=?, sku=?, description=?, unit_id=?, cost=?, sale_price=?, avg_cost=?, 
                        min_stock=?, max_stock=?, multiple_qty=?, image_urls=?, updated_at=NOW() 
                        WHERE id=? AND tenant_id=?`,
                    [
                        code, name, sku, description, unit_id || null, cost || 0, sale_price || 0, avg_cost || 0,
                        min_stock || 0, max_stock || 0, multiple_qty || 1, JSON.stringify(imageUrls),
                        id, tenantId
                    ]
                );
            } else {
                // Insert
                const [result] = await db.execute(
                    `INSERT INTO products (tenant_id, code, name, sku, description, unit_id, cost, sale_price, avg_cost, min_stock, max_stock, multiple_qty, image_urls, status) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
                    [
                        tenantId, code, name, sku, description, unit_id || null, cost || 0, sale_price || 0, avg_cost || 0,
                        min_stock || 0, max_stock || 0, multiple_qty || 1, JSON.stringify(imageUrls)
                    ]
                );
                productId = result.insertId;
            }

            // Save Marketplace Mappings
            if (marketplace_mappings_json && productId) {
                const mappings = JSON.parse(marketplace_mappings_json); // Expect Array of {platform, sku, id}

                // Clear old mappings (Strategically simple: delete all and re-insert)
                await db.execute('DELETE FROM marketplace_product_mappings WHERE product_id = ?', [productId]);

                for (let map of mappings) {
                    if (map.platform && map.sku) {
                        await db.execute(
                            'INSERT INTO marketplace_product_mappings (product_id, tenant_id, platform, marketplace_sku, marketplace_product_id) VALUES (?, ?, ?, ?, ?)',
                            [productId, tenantId, map.platform, map.sku, map.product_id || '']
                        );
                    }
                }
            }

            res.redirect('/fulfillment/products');
        } catch (err) {
            console.error('saveProduct Error:', err);
            res.redirect('/fulfillment/products?error=save_failed');
        }
    }
}

module.exports = new FulfillmentController();
