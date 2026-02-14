-- Billora Initial Setup SQL
-- Updated: 2026-02-05
-- Combined all migrations into a single file for fresh installation

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for tenants
-- ----------------------------
DROP TABLE IF EXISTS `tenants`;
CREATE TABLE `tenants` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_code` varchar(50) NOT NULL,
  `company_name` varchar(255) NOT NULL,
  `company_name_en` varchar(255) DEFAULT NULL,
  `tax_id` varchar(20) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `logo_url` varchar(255) DEFAULT NULL,
  `subscription_plan` varchar(50) DEFAULT 'free',
  `subscription_status` varchar(20) DEFAULT 'active',
  `subscription_start_date` datetime DEFAULT NULL,
  `subscription_end_date` datetime DEFAULT NULL,
  `max_users` int(11) DEFAULT 5,
  `max_storage_mb` int(11) DEFAULT 1024,
  `max_transactions_per_month` int(11) DEFAULT 1000,
  `features` json DEFAULT NULL,
  `settings` json DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_tenant_code` (`tenant_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `username` varchar(100) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('admin','owner','member') DEFAULT 'member',
  `line_user_id` varchar(100) DEFAULT NULL,
  `permissions` json DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_user_tenant` (`tenant_id`),
  KEY `idx_username` (`username`),
  CONSTRAINT `fk_users_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table structure for online_channels
-- ----------------------------
DROP TABLE IF EXISTS `online_channels`;
CREATE TABLE `online_channels` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `platform` varchar(50) NOT NULL,
  `shop_name` varchar(255) DEFAULT NULL,
  `shop_id` varchar(100) DEFAULT NULL,
  `status` varchar(20) DEFAULT 'active',
  `access_token` text DEFAULT NULL,
  `express_book_code` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_tenant_platform` (`tenant_id`,`platform`),
  CONSTRAINT `fk_channels_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table structure for subscription_plans
-- ----------------------------
DROP TABLE IF EXISTS `subscription_plans`;
CREATE TABLE `subscription_plans` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `plan_name` varchar(100) NOT NULL,
  `plan_code` varchar(50) NOT NULL,
  `price_monthly` decimal(15,2) DEFAULT 0.00,
  `max_users` int(11) DEFAULT 5,
  `max_transactions_per_month` int(11) DEFAULT 1000,
  `features` json DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_plan_code` (`plan_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table structure for tenant_subscriptions
-- ----------------------------
DROP TABLE IF EXISTS `tenant_subscriptions`;
CREATE TABLE `tenant_subscriptions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `plan_id` int(11) NOT NULL,
  `status` enum('active','expired','cancelled','suspended') DEFAULT 'active',
  `start_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `end_date` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `tenant_id` (`tenant_id`),
  KEY `plan_id` (`plan_id`),
  CONSTRAINT `tenant_subscriptions_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `tenant_subscriptions_ibfk_2` FOREIGN KEY (`plan_id`) REFERENCES `subscription_plans` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table structure for bills (Receipts)
-- ----------------------------
DROP TABLE IF EXISTS `bills`;
CREATE TABLE `bills` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `store_name` varchar(255) DEFAULT NULL,
  `date` date DEFAULT NULL,
  `total_amount` decimal(15,2) DEFAULT NULL,
  `vat` decimal(15,2) DEFAULT NULL,
  `items` json DEFAULT NULL,
  `raw_text` text DEFAULT NULL,
  `image_path` varchar(255) DEFAULT NULL,
  `source` varchar(50) DEFAULT 'BROWSER',
  `ai_audit_result` json DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_bills_tenant` (`tenant_id`),
  KEY `idx_bills_user` (`user_id`),
  CONSTRAINT `fk_bills_tenant_info` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table structure for bill_items
-- ----------------------------
DROP TABLE IF EXISTS `bill_items`;
CREATE TABLE `bill_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `bill_id` int(11) NOT NULL,
  `product_name` varchar(255) DEFAULT NULL,
  `quantity` decimal(15,2) DEFAULT 1.00,
  `price` decimal(15,2) DEFAULT 0.00,
  `total` decimal(15,2) DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_item_bill` (`bill_id`),
  KEY `idx_item_tenant` (`tenant_id`),
  CONSTRAINT `fk_items_bill` FOREIGN KEY (`bill_id`) REFERENCES `bills` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_items_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table structure for payment_slips (Bank Slips)
-- ----------------------------
DROP TABLE IF EXISTS `payment_slips`;
CREATE TABLE `payment_slips` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `trans_id` varchar(100) DEFAULT NULL,
  `sender_name` varchar(255) DEFAULT NULL,
  `sender_bank` varchar(100) DEFAULT NULL,
  `receiver_name` varchar(255) DEFAULT NULL,
  `receiver_bank` varchar(100) DEFAULT NULL,
  `amount` decimal(15,2) DEFAULT NULL,
  `datetime` datetime DEFAULT NULL,
  `status` varchar(50) DEFAULT 'success',
  `raw_text` text DEFAULT NULL,
  `image_path` varchar(255) DEFAULT NULL,
  `source` varchar(50) DEFAULT 'BROWSER',
  `forgery_score` int(11) DEFAULT 0,
  `forgery_reasons` json DEFAULT NULL,
  `ai_audit_result` json DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_trans_id` (`trans_id`),
  KEY `idx_slips_tenant` (`tenant_id`),
  KEY `idx_slips_user` (`user_id`),
  CONSTRAINT `fk_slips_tenant_info` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table structure for ocr_logs
-- ----------------------------
DROP TABLE IF EXISTS `ocr_logs`;
CREATE TABLE `ocr_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `type` enum('BANK_SLIP','RECEIPT','UNKNOWN') NOT NULL,
  `source` varchar(50) NOT NULL,
  `status` varchar(50) NOT NULL,
  `amount` decimal(15,2) DEFAULT 0.00,
  `trans_id` varchar(100) DEFAULT NULL,
  `image_path` varchar(255) DEFAULT NULL,
  `ai_processed` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_logs_tenant` (`tenant_id`),
  KEY `idx_logs_user` (`user_id`),
  CONSTRAINT `fk_logs_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table structure for action_logs
-- ----------------------------
DROP TABLE IF EXISTS `action_logs`;
CREATE TABLE `action_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) DEFAULT NULL,
  `user_id` int(11) NOT NULL,
  `action` varchar(255) NOT NULL,
  `details` text DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_action_user` (`user_id`),
  KEY `idx_action_tenant` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table structure for marketplace_product_mappings
-- ----------------------------
DROP TABLE IF EXISTS `marketplace_product_mappings`;
CREATE TABLE `marketplace_product_mappings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `online_channel_id` int(11) NOT NULL,
  `marketplace_sku` varchar(255) NOT NULL COMMENT 'SKU บน Marketplace',
  `marketplace_product_id` varchar(255) DEFAULT NULL COMMENT 'ID สินค้าบน Marketplace',
  `marketplace_model_id` varchar(255) DEFAULT NULL,
  `marketplace_sku_id` varchar(255) DEFAULT NULL,
  `marketplace_warehouse_id` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_marketplace_mapping` (`tenant_id`,`online_channel_id`,`marketplace_sku`),
  KEY `fk_mapping_product` (`product_id`),
  KEY `fk_mapping_channel` (`online_channel_id`),
  CONSTRAINT `fk_mapping_channel` FOREIGN KEY (`online_channel_id`) REFERENCES `online_channels` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_mapping_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_mapping_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table structure for backup_schedules
-- ----------------------------
DROP TABLE IF EXISTS `backup_schedules`;
CREATE TABLE `backup_schedules` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) DEFAULT NULL COMMENT 'NULL = Full backup',
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `cron_expression` varchar(100) NOT NULL,
  `backup_type` enum('full','tenant') DEFAULT 'full',
  `retention_days` int(11) DEFAULT 7,
  `max_backups` int(11) DEFAULT 10,
  `remote_storage_type` enum('none','sftp','ftp') DEFAULT 'none',
  `remote_host` varchar(255) DEFAULT NULL,
  `remote_port` int(11) DEFAULT 22,
  `remote_username` varchar(255) DEFAULT NULL,
  `remote_password` varchar(255) DEFAULT NULL,
  `remote_path` varchar(255) DEFAULT '/',
  `notify_on_success` tinyint(1) DEFAULT 0,
  `notify_on_failure` tinyint(1) DEFAULT 1,
  `notification_email` varchar(255) DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `last_run_at` timestamp NULL DEFAULT NULL,
  `next_run_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_backup_user` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table structure for backup_history
-- ----------------------------
DROP TABLE IF EXISTS `backup_history`;
CREATE TABLE `backup_history` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `schedule_id` int(11) NOT NULL,
  `filename` varchar(255) DEFAULT NULL,
  `file_path` varchar(255) DEFAULT NULL,

  `file_size` bigint(20) DEFAULT NULL,
  `status` enum('success','failed') DEFAULT 'success',
  `error_message` text DEFAULT NULL,
  `remote_storage` tinyint(1) DEFAULT 0,
  `remote_status` enum('success','failed') DEFAULT NULL,
  `remote_error_message` text DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  KEY `idx_history_schedule` (`schedule_id`),
  CONSTRAINT `fk_history_schedule` FOREIGN KEY (`schedule_id`) REFERENCES `backup_schedules` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table structure for products
-- ----------------------------
DROP TABLE IF EXISTS `products`;
CREATE TABLE `products` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `code` varchar(100) DEFAULT NULL,
  `sku` varchar(100) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `unit_id` int(11) DEFAULT NULL,
  `cost` decimal(15,2) DEFAULT 0.00,
  `sale_price` decimal(15,2) DEFAULT 0.00,
  `avg_cost` decimal(15,2) DEFAULT 0.00,
  `min_stock` decimal(15,2) DEFAULT 0.00,
  `max_stock` decimal(15,2) DEFAULT 0.00,
  `multiple_qty` decimal(15,2) DEFAULT 1.00,
  `image_urls` json DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `qty_on_hand` decimal(15,4) DEFAULT 0.0000,
  `qty_reserved` decimal(15,4) DEFAULT 0.0000,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_prod_tenant` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table structure for warehouses
-- ----------------------------
DROP TABLE IF EXISTS `warehouses`;
CREATE TABLE `warehouses` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `code` varchar(50) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table structure for warehouse_locations
-- ----------------------------
DROP TABLE IF EXISTS `warehouse_locations`;
CREATE TABLE `warehouse_locations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `warehouse_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `code` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_loc_warehouse` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table structure for inventory_lots
-- ----------------------------
DROP TABLE IF EXISTS `inventory_lots`;
CREATE TABLE `inventory_lots` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `lot_no` varchar(100) NOT NULL,
  `mfg_date` date DEFAULT NULL,
  `exp_date` date DEFAULT NULL,
  `cost` decimal(15,2) DEFAULT 0.00,
  `quantity_initial` decimal(15,2) DEFAULT 0.00,
  `quantity_remaining` decimal(15,2) DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_lot_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table structure for inventory_balances
-- ----------------------------
DROP TABLE IF EXISTS `inventory_balances`;
CREATE TABLE `inventory_balances` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `warehouse_id` int(11) NOT NULL,
  `location_id` int(11) DEFAULT NULL,
  `lot_id` int(11) DEFAULT NULL,
  `quantity` decimal(15,2) DEFAULT 0.00,
  `last_updated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_balance_unique` (`warehouse_id`,`location_id`,`product_id`,`lot_id`),
  CONSTRAINT `fk_bal_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_bal_warehouse` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table structure for inventory_transactions
-- ----------------------------
DROP TABLE IF EXISTS `inventory_transactions`;
CREATE TABLE `inventory_transactions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `transaction_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `type` enum('ADJUSTMENT','ISSUE','RETURN','RECEIVE','FULFILLMENT','TRANSFER') NOT NULL,
  `product_id` int(11) NOT NULL,
  `warehouse_id` int(11) NOT NULL,
  `location_id` int(11) DEFAULT NULL,
  `lot_id` int(11) DEFAULT NULL,
  `quantity` decimal(15,2) NOT NULL,
  `stock_in` decimal(15,2) DEFAULT 0.00,
  `stock_out` decimal(15,2) DEFAULT 0.00,
  `value_amount` decimal(15,2) DEFAULT 0.00,
  `reference_no` varchar(100) DEFAULT NULL,
  `reason` varchar(255) DEFAULT NULL,
  `note` text DEFAULT NULL,
  `source_platform` varchar(50) DEFAULT 'web',
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_trans_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_trans_warehouse` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- SEED DATA
-- ----------------------------

-- 1. Subscription Plans
INSERT INTO `subscription_plans` (`id`, `plan_name`, `plan_code`, `price_monthly`, `max_users`, `max_transactions_per_month`, `features`) VALUES
(1, 'ฟรี', 'free', 0.00, 5, 100, '{"ocr": true, "dashboard": true, "bills": true, "slips": true, "reports": false, "inventory": false, "fulfillment": false, "multichannel": false, "ai_audit": false, "api_access": false}'),
(2, 'เบสิก', 'basic', 290.00, 10, 500, '{"ocr": true, "ai_audit": false, "dashboard": true, "multichannel": true}'),
(3, 'โปร', 'professional', 590.00, 20, 2000, '{"ocr": true, "ai_audit": true, "dashboard": true, "multichannel": true}'),
(4, 'องค์กร', 'enterprise', 1290.00, 100, 10000, '{"ocr": true, "ai_audit": true, "dashboard": true, "multichannel": true, "custom_features": true}');

-- 2. Default Tenant
INSERT INTO `tenants` (`id`, `tenant_code`, `company_name`, `subscription_plan`, `is_active`) VALUES
(1, 'BILLORA001', 'Default Organization', 'professional', 1);

-- 3. Default Admin User (password: admin123)
INSERT INTO `users` (`id`, `tenant_id`, `username`, `email`, `password_hash`, `role`, `permissions`) VALUES
(1, 1, 'admin', 'admin@billora.ai', '$2b$10$KrukT75i0Gla5l10SUgvLe/BRE4f0pYclOJtpRQC/F2Z0JdnC14.C', 'admin', '{\"dashboard\": true, \"bills\": true, \"slips\": true, \"users\": true, \"inventory\": true}');

-- 4. Active Subscription for Default Tenant
INSERT INTO `tenant_subscriptions` (`tenant_id`, `plan_id`, `status`, `start_date`, `end_date`) VALUES
(1, 3, 'active', CURRENT_TIMESTAMP, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 1 YEAR));

SET FOREIGN_KEY_CHECKS = 1;
