const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrate() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'bill_ocr'
    });

    console.log(`Connected to database: ${process.env.DB_NAME}. Starting SaaS Migration (Revised)...`);

    // 1. Online Channels (Per User)
    await connection.query(`
        CREATE TABLE IF NOT EXISTS online_channel (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            name ENUM('Tiktok', 'Shopee', 'Lazada') NOT NULL,
            status INT DEFAULT 1,
            express_book_code VARCHAR(50),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_user (user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 2. Tokens (Per User)
    await connection.query(`
        CREATE TABLE IF NOT EXISTS tiktok_tokens (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            access_token TEXT,
            refresh_token TEXT,
            expires_at DATETIME,
            shop_cipher VARCHAR(100),
            shop_name VARCHAR(100),
            status VARCHAR(20) DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME,
            INDEX idx_user (user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await connection.query(`
        CREATE TABLE IF NOT EXISTS shopee_tokens (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            shop_id VARCHAR(50),
            access_token TEXT,
            refresh_token TEXT,
            expires_at DATETIME,
            status VARCHAR(20) DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME,
            INDEX idx_user (user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 3. Orders (Per User)
    await connection.query(`
        CREATE TABLE IF NOT EXISTS \`order\` (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            order_id VARCHAR(100) NOT NULL,
            channel_id INT,
            shop_id VARCHAR(50),
            order_sn VARCHAR(50),
            sku VARCHAR(100),
            product_name VARCHAR(255),
            quantity INT DEFAULT 1,
            price DECIMAL(15,4),
            total_amount DECIMAL(15,4),
            order_date DATETIME,
            order_status VARCHAR(50),
            created_at DATETIME,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uq_user_order (user_id, order_id),
            INDEX idx_user_id (user_id),
            INDEX idx_order_sn (order_sn)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 4. Products (Per User)
    await connection.query(`
        CREATE TABLE IF NOT EXISTS product (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            product_group_id INT DEFAULT 1,
            sku VARCHAR(100),
            name VARCHAR(255),
            status INT DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uq_user_sku (user_id, sku),
            INDEX idx_user (user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 5. Income Details (Per User)
    await connection.query(`
        CREATE TABLE IF NOT EXISTS tiktok_income_details (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            order_id VARCHAR(100) NOT NULL,
            order_date DATETIME,
            settlement_amount DECIMAL(15,4),
            revenue_amount DECIMAL(15,4),
            fee_and_tax_amount DECIMAL(15,4),
            actual_shipping_fee_amount DECIMAL(15,4),
            currency VARCHAR(10) DEFAULT 'THB',
            statement_transactions JSON,
            created_at DATETIME,
            updated_at DATETIME,
            UNIQUE KEY uq_user_tk_order (user_id, order_id),
            INDEX idx_user (user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await connection.query(`
        CREATE TABLE IF NOT EXISTS shopee_income_details (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            order_sn VARCHAR(100) NOT NULL,
            order_date DATETIME,
            buyer_total_amount DECIMAL(15,4),
            commission_fee DECIMAL(15,4),
            transaction_fee DECIMAL(15,4),
            service_fee DECIMAL(15,4),
            escrow_amount DECIMAL(15,4),
            actual_shipping_fee DECIMAL(15,4),
            created_at DATETIME,
            updated_at DATETIME,
            UNIQUE KEY uq_user_sh_order (user_id, order_sn),
            INDEX idx_user (user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 6. Sync Log (Per User)
    await connection.query(`
        CREATE TABLE IF NOT EXISTS sync_log (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            type VARCHAR(50),
            platform VARCHAR(50),
            start_time DATETIME,
            end_time DATETIME,
            status VARCHAR(20),
            total_records INT DEFAULT 0,
            message TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_user (user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    console.log('SaaS-ready Migration (Revised) completed successfully!');
    await connection.end();
}

migrate().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});
