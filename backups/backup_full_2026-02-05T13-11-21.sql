-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: bill_ocr
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `action_logs`
--

DROP TABLE IF EXISTS `action_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `action_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) DEFAULT NULL,
  `user_id` int(11) NOT NULL,
  `action` varchar(255) NOT NULL,
  `details` text DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_action_user` (`user_id`),
  KEY `idx_action_tenant` (`tenant_id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `action_logs`
--

LOCK TABLES `action_logs` WRITE;
/*!40000 ALTER TABLE `action_logs` DISABLE KEYS */;
INSERT INTO `action_logs` VALUES (1,NULL,1,'Login','เข้าสู่ระบบผ่าน Web Browser','::1','2026-02-05 10:15:37'),(2,NULL,1,'Login','เข้าสู่ระบบผ่าน Web Browser','::1','2026-02-05 10:21:17'),(3,NULL,1,'Login','เข้าสู่ระบบผ่าน Web Browser','::1','2026-02-05 10:24:15'),(4,NULL,1,'Delete Bill','ลบบิลรหัส 2','::1','2026-02-05 10:32:38'),(5,NULL,1,'Login','เข้าสู่ระบบผ่าน Web Browser','::1','2026-02-05 12:30:29'),(6,NULL,1,'Login','เข้าสู่ระบบผ่าน Web Browser','::1','2026-02-05 13:08:11'),(7,NULL,1,'Login','เข้าสู่ระบบผ่าน Web Browser','::ffff:127.0.0.1','2026-02-05 13:11:13');
/*!40000 ALTER TABLE `action_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `backup_history`
--

DROP TABLE IF EXISTS `backup_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `backup_history` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `schedule_id` int(11) NOT NULL,
  `filename` varchar(255) NOT NULL,
  `file_path` varchar(255) NOT NULL,
  `file_size` bigint(20) DEFAULT NULL,
  `status` enum('success','failed') DEFAULT 'success',
  `error_message` text DEFAULT NULL,
  `remote_storage` tinyint(1) DEFAULT 0,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_history_schedule` (`schedule_id`),
  CONSTRAINT `fk_history_schedule` FOREIGN KEY (`schedule_id`) REFERENCES `backup_schedules` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `backup_history`
--

LOCK TABLES `backup_history` WRITE;
/*!40000 ALTER TABLE `backup_history` DISABLE KEYS */;
/*!40000 ALTER TABLE `backup_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `backup_schedules`
--

DROP TABLE IF EXISTS `backup_schedules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
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
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_backup_user` (`created_by`),
  CONSTRAINT `fk_backup_user` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `backup_schedules`
--

LOCK TABLES `backup_schedules` WRITE;
/*!40000 ALTER TABLE `backup_schedules` DISABLE KEYS */;
INSERT INTO `backup_schedules` VALUES (1,NULL,'Daily backup','','0 2 * * *','full',7,10,'none','',22,'','','/',NULL,1,NULL,1,1,NULL,NULL,'2026-02-05 13:08:42','2026-02-05 13:08:42');
/*!40000 ALTER TABLE `backup_schedules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bill_items`
--

DROP TABLE IF EXISTS `bill_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `bill_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `bill_id` int(11) NOT NULL,
  `product_name` varchar(255) DEFAULT NULL,
  `quantity` decimal(15,2) DEFAULT 1.00,
  `price` decimal(15,2) DEFAULT 0.00,
  `total` decimal(15,2) DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_item_bill` (`bill_id`),
  KEY `idx_item_tenant` (`tenant_id`),
  CONSTRAINT `fk_items_bill` FOREIGN KEY (`bill_id`) REFERENCES `bills` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_items_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bill_items`
--

LOCK TABLES `bill_items` WRITE;
/*!40000 ALTER TABLE `bill_items` DISABLE KEYS */;
INSERT INTO `bill_items` VALUES (1,1,1,'ค่าชำระเงินบ้านเทวารักษ์ 1 งวดที่ 2',1.00,0.00,566000.00,'2026-02-05 10:18:25'),(2,1,3,'น้ำดื่ม 7-Select 600ml',1.00,7.00,7.00,'2026-02-05 10:32:53'),(3,1,3,'ข้าวผัดกระเพราหมู',1.00,45.00,45.00,'2026-02-05 10:32:53'),(4,1,3,'เลย์ มันฝรั่งทอด',1.00,20.00,20.00,'2026-02-05 10:32:53'),(5,1,3,'กาแฟเย็น All Café',1.00,35.00,35.00,'2026-02-05 10:32:53');
/*!40000 ALTER TABLE `bill_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bills`
--

DROP TABLE IF EXISTS `bills`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `bills` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `store_name` varchar(255) DEFAULT NULL,
  `date` date DEFAULT NULL,
  `total_amount` decimal(15,2) DEFAULT NULL,
  `vat` decimal(15,2) DEFAULT NULL,
  `items` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`items`)),
  `raw_text` text DEFAULT NULL,
  `image_path` varchar(255) DEFAULT NULL,
  `source` varchar(50) DEFAULT 'BROWSER',
  `ai_audit_result` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`ai_audit_result`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_bills_tenant` (`tenant_id`),
  KEY `idx_bills_user` (`user_id`),
  CONSTRAINT `fk_bills_tenant_info` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bills`
--

LOCK TABLES `bills` WRITE;
/*!40000 ALTER TABLE `bills` DISABLE KEYS */;
INSERT INTO `bills` VALUES (1,1,1,'บริษัท บ้านสักทองร้องแหย่ง จำกัด','2026-01-16',566000.00,37028.04,'[{\"name\":\"ค่าชำระเงินบ้านเทวารักษ์ 1 งวดที่ 2\",\"qty\":1,\"price\":null,\"total\":566000}]','บริษัด\nบ้านสัก อย\nเล่น\nด\nบ้านสักทอง\nร้องแหบ่ง\nBANSAKTHONG\nRONGYANG CO.LTD.\nรหัส : RY-001\nชื่อ : คุณแก้ว\nบริษัท บ้านสักทองร้องแหย่ง จำกัด\n53/1 หมู่ที่ 6 ต.ดอนมูล อ.สูงเม่น จ.แพร่ 54130\nโทร. 088-923-5426 ไลน์ OA= @ttgoldenteak\nเลขที่ประจำตัวผู้เสียภาษี 0545567000702\nที่อยู่ : บ้านเลขที่ 20 หมู่ที่ 25 ตำบลทุ่งมหาเจริญ อำเภอวังน้ำเย็น จังหวัดสระแก้ว\nใบรับสินค้า\nเลขที่ :\nเลขท : RR690126001\nวันที่รับสินค้า 16/1/2569\nเงื่อนไขการชำระ เงินสด/ โอนเงิน\nโทรศัพท์ :\nลำดับ\nหมายเหตุ :\nรายการ\n1 ค่าชำระเงินบ้านเทวารักษ์ 1 งวดที่ 2\nอีเมลล์ :\nรหัสผู้เสียภาษี :\nจํานวน\nหน่วยนับ\nราคา\nส่วนลด รวมเป็นเงิน\n1.00\nงวด\n566,000.00\nมูลค่ารวมก่อนเสียภาษี 528,971.96\nภาษีมูลค่าเพิ่ม(VAT) 37,028.04\nส่วนลด\nยอดเงินสุทธิ\n566,000.00\nเงื่อนไข :\n(ห้าแสนหกหมื่นหกพันบาทถ้วน)\n* ไลน์อีเมลล์ ฟอร์มใบรับสินค้า มาที่ Email: rongyanghome@gmail.com, หรือไลน์ OA= @ttgoldenteak\n* กรุณาชำระเงินโดยการโอนเข้าบัญชี ธ.กสิกรไทย สาขาแพร่ ออมทรัพย์ ชื่อบัญชี บจก.บ้านสักทองร้องแหย่ง เลขที่ 1971292055\nณ คุณออย โทร. 063-025-6535\nบ้านลักทองคุณภาพบ้านร้องแหน่ง\nผู้รับสินค้า\nผู้อนุมัติ\nล\nЭти\nกล\nЭти\nนางอัจฉริยาบถปก กรรมการบริษัท\nนางอัจฉริยา บณปก กรรมการบริษัท','uploads\\9ff8f88f1586ad7404b5896a7cf11c1d','BROWSER','{\"type\":\"RECEIPT\",\"confidence_score\":0.95,\"data\":{\"trans_id\":\"RR690126001\",\"datetime\":\"2026-01-16\",\"amount\":566000,\"sender\":null,\"receiver\":{\"name\":\"คุณแก้ว\",\"bank\":null,\"account_no\":null},\"vendor\":{\"name\":\"บริษัท บ้านสักทองร้องแหย่ง จำกัด\",\"tax_id\":\"0545567000702\",\"address\":\"53/1 หมู่ที่ 6 ต.ดอนมูล อ.สูงเม่น จ.แพร่ 54130\"},\"items\":[{\"name\":\"ค่าชำระเงินบ้านเทวารักษ์ 1 งวดที่ 2\",\"qty\":1,\"price\":null,\"total\":566000}],\"vat\":37028.04,\"total\":566000},\"audit_result\":{\"is_standard_structure\":true,\"is_valid_vendor_info\":true,\"forgery_detected\":false,\"forgery_reason\":null,\"audit_remark\":\"The document appears to be a standard receipt. Vendor information is present and seems valid. No immediate signs of forgery were detected.\"}}','2026-02-05 10:18:25'),(3,1,1,'7-Eleven','2023-11-09',114.00,7.00,'[{\"name\":\"น้ำดื่ม 7-Select 600ml\",\"qty\":1,\"price\":7,\"total\":7},{\"name\":\"ข้าวผัดกระเพราหมู\",\"qty\":1,\"price\":45,\"total\":45},{\"name\":\"เลย์ มันฝรั่งทอด\",\"qty\":1,\"price\":20,\"total\":20},{\"name\":\"กาแฟเย็น All Café\",\"qty\":1,\"price\":35,\"total\":35}]','ELEVEN\nใบกำกับภาษีอย่างย่อ (ABB)\n7-Eleven สาน แทนนมาก\nส้าน โดย ต๊อง 17333-800016\nร้านทนม รูปง 7-Eleven\nเพื่อมูลค่าพิ่ม:7% .1921000037011\nน้ำดื่ม 7-Select 600ml\n- 7.00 B\nข้าวผัดกระเพราหมู\n- 45.00 B\nเลย์ มันฝรั่งทอด\n- 20.00 B\nกาแฟเย็น All Café\n- 35.00 B\nรวมเงิน\n107.00 B\nภาษีมูลค่าเพิ่ม 7%\nยอดสุทธิ\n09/11/2023 14:30:22\n7.00 B\n114.00 B','uploads\\0bc96d4eb51f0464997b8292d22a78b5','BROWSER','{\"type\":\"RECEIPT\",\"confidence_score\":0.95,\"data\":{\"trans_id\":null,\"datetime\":\"2023-11-09T14:30:22\",\"amount\":114,\"sender\":null,\"receiver\":null,\"vendor\":{\"name\":\"7-Eleven\",\"tax_id\":\"1921000037011\",\"address\":\"7-Eleven ส้าน แถนนมาก ล้าน โลย ต๊อง 7333-300016 ร้านทนม รปง 7-Eleven\"},\"items\":[{\"name\":\"น้ำดื่ม 7-Select 600ml\",\"qty\":1,\"price\":7,\"total\":7},{\"name\":\"ข้าวผัดกระเพราหมู\",\"qty\":1,\"price\":45,\"total\":45},{\"name\":\"เลย์ มันฝรั่งทอด\",\"qty\":1,\"price\":20,\"total\":20},{\"name\":\"กาแฟเย็น All Café\",\"qty\":1,\"price\":35,\"total\":35}],\"vat\":7,\"total\":114},\"audit_result\":{\"is_standard_structure\":true,\"is_valid_vendor_info\":true,\"forgery_detected\":false,\"forgery_reason\":null,\"audit_remark\":\"The document appears to be a standard 7-Eleven receipt. Tax ID is present and VAT is correctly calculated.\"}}','2026-02-05 10:32:53');
/*!40000 ALTER TABLE `bills` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `companies`
--

DROP TABLE IF EXISTS `companies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `companies` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `plan` enum('free','pro','enterprise') DEFAULT 'free',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `companies`
--

LOCK TABLES `companies` WRITE;
/*!40000 ALTER TABLE `companies` DISABLE KEYS */;
INSERT INTO `companies` VALUES (1,'Default Company','pro','2026-01-31 01:14:24');
/*!40000 ALTER TABLE `companies` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fulfillment_orders`
--

DROP TABLE IF EXISTS `fulfillment_orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `fulfillment_orders` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `source_platform` varchar(50) DEFAULT 'DIRECT',
  `source_order_id` varchar(100) DEFAULT NULL,
  `payment_slip_id` int(11) DEFAULT NULL,
  `customer_name` varchar(255) DEFAULT NULL,
  `customer_phone` varchar(20) DEFAULT NULL,
  `shipping_address` text DEFAULT NULL,
  `status` varchar(50) DEFAULT 'PENDING',
  `tracking_number` varchar(100) DEFAULT NULL,
  `shipping_carrier` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `payment_slip_id` (`payment_slip_id`),
  KEY `user_id` (`user_id`),
  KEY `status` (`status`),
  CONSTRAINT `fulfillment_orders_ibfk_1` FOREIGN KEY (`payment_slip_id`) REFERENCES `payment_slips` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fulfillment_orders`
--

LOCK TABLES `fulfillment_orders` WRITE;
/*!40000 ALTER TABLE `fulfillment_orders` DISABLE KEYS */;
/*!40000 ALTER TABLE `fulfillment_orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventory`
--

DROP TABLE IF EXISTS `inventory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `inventory` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `product_id` int(11) NOT NULL,
  `warehouse_name` varchar(100) DEFAULT 'Main Warehouse',
  `quantity` int(11) DEFAULT 0,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `inventory_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory`
--

LOCK TABLES `inventory` WRITE;
/*!40000 ALTER TABLE `inventory` DISABLE KEYS */;
/*!40000 ALTER TABLE `inventory` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventory_balances`
--

DROP TABLE IF EXISTS `inventory_balances`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `inventory_balances` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `warehouse_id` int(11) NOT NULL,
  `location_id` int(11) DEFAULT NULL,
  `lot_id` int(11) DEFAULT NULL,
  `quantity` decimal(15,2) DEFAULT 0.00,
  `last_updated` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_balance_unique` (`warehouse_id`,`location_id`,`product_id`,`lot_id`),
  KEY `fk_bal_product` (`product_id`),
  CONSTRAINT `fk_bal_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_bal_warehouse` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory_balances`
--

LOCK TABLES `inventory_balances` WRITE;
/*!40000 ALTER TABLE `inventory_balances` DISABLE KEYS */;
/*!40000 ALTER TABLE `inventory_balances` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventory_lots`
--

DROP TABLE IF EXISTS `inventory_lots`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
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
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_lot_product` (`product_id`),
  CONSTRAINT `fk_lot_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory_lots`
--

LOCK TABLES `inventory_lots` WRITE;
/*!40000 ALTER TABLE `inventory_lots` DISABLE KEYS */;
/*!40000 ALTER TABLE `inventory_lots` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventory_transactions`
--

DROP TABLE IF EXISTS `inventory_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `inventory_transactions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `transaction_date` datetime DEFAULT current_timestamp(),
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
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_trans_product` (`product_id`),
  KEY `fk_trans_warehouse` (`warehouse_id`),
  CONSTRAINT `fk_trans_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_trans_warehouse` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory_transactions`
--

LOCK TABLES `inventory_transactions` WRITE;
/*!40000 ALTER TABLE `inventory_transactions` DISABLE KEYS */;
/*!40000 ALTER TABLE `inventory_transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `marketplace_product_mappings`
--

DROP TABLE IF EXISTS `marketplace_product_mappings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `marketplace_product_mappings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `product_id` int(11) NOT NULL,
  `tenant_id` int(11) NOT NULL,
  `platform` varchar(50) NOT NULL COMMENT 'Platform (shopee, lazada, tiktok)',
  `marketplace_sku` varchar(255) NOT NULL COMMENT 'SKU บน Marketplace',
  `marketplace_product_id` varchar(255) DEFAULT NULL COMMENT 'ID สินค้าบน Marketplace',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_mapping_product` (`product_id`),
  KEY `idx_mapping_sku` (`marketplace_sku`),
  CONSTRAINT `marketplace_product_mappings_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางจับคู่สินค้ากับ Marketplace';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `marketplace_product_mappings`
--

LOCK TABLES `marketplace_product_mappings` WRITE;
/*!40000 ALTER TABLE `marketplace_product_mappings` DISABLE KEYS */;
/*!40000 ALTER TABLE `marketplace_product_mappings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ocr_logs`
--

DROP TABLE IF EXISTS `ocr_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
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
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_logs_tenant` (`tenant_id`),
  KEY `idx_logs_user` (`user_id`),
  CONSTRAINT `fk_logs_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ocr_logs`
--

LOCK TABLES `ocr_logs` WRITE;
/*!40000 ALTER TABLE `ocr_logs` DISABLE KEYS */;
INSERT INTO `ocr_logs` VALUES (1,1,1,'RECEIPT','BROWSER','success',566000.00,NULL,'uploads\\9ff8f88f1586ad7404b5896a7cf11c1d',1,'2026-02-05 10:18:25'),(2,1,1,'RECEIPT','BROWSER','success',114.00,NULL,'uploads\\0170ee3e8e2f0202200d1252c4d55177',0,'2026-02-05 10:31:52'),(3,1,1,'RECEIPT','BROWSER','success',114.00,NULL,'uploads\\0bc96d4eb51f0464997b8292d22a78b5',1,'2026-02-05 10:32:53'),(4,1,1,'BANK_SLIP','BROWSER','success',98.00,'016016172549CPP05550','uploads\\8b50d2844cea8e7fba36dc7b8b5f76eb',1,'2026-02-05 12:30:45');
/*!40000 ALTER TABLE `ocr_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `online_channel`
--

DROP TABLE IF EXISTS `online_channel`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `online_channel` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `status` int(11) DEFAULT 1,
  `express_book_code` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `online_channel`
--

LOCK TABLES `online_channel` WRITE;
/*!40000 ALTER TABLE `online_channel` DISABLE KEYS */;
INSERT INTO `online_channel` VALUES (1,0,'Tiktok',1,NULL,'2026-02-02 03:24:09'),(2,0,'Shopee',1,NULL,'2026-02-02 03:24:09');
/*!40000 ALTER TABLE `online_channel` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `online_channels`
--

DROP TABLE IF EXISTS `online_channels`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `online_channels` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `platform` varchar(50) NOT NULL,
  `shop_name` varchar(255) DEFAULT NULL,
  `shop_id` varchar(100) DEFAULT NULL,
  `status` varchar(20) DEFAULT 'active',
  `access_token` text DEFAULT NULL,
  `express_book_code` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_tenant_platform` (`tenant_id`,`platform`),
  CONSTRAINT `fk_channels_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `online_channels`
--

LOCK TABLES `online_channels` WRITE;
/*!40000 ALTER TABLE `online_channels` DISABLE KEYS */;
/*!40000 ALTER TABLE `online_channels` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order`
--

DROP TABLE IF EXISTS `order`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `order` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `order_id` varchar(100) NOT NULL,
  `channel_id` int(11) DEFAULT NULL,
  `shop_id` varchar(50) DEFAULT NULL,
  `order_sn` varchar(50) DEFAULT NULL,
  `sku` varchar(100) DEFAULT NULL,
  `product_name` varchar(255) DEFAULT NULL,
  `quantity` int(11) DEFAULT 1,
  `price` decimal(15,4) DEFAULT NULL,
  `total_amount` decimal(15,4) DEFAULT NULL,
  `order_date` datetime DEFAULT NULL,
  `order_status` varchar(50) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_id` (`order_id`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_order_sn` (`order_sn`),
  KEY `idx_channel` (`channel_id`),
  KEY `idx_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order`
--

LOCK TABLES `order` WRITE;
/*!40000 ALTER TABLE `order` DISABLE KEYS */;
/*!40000 ALTER TABLE `order` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_items`
--

DROP TABLE IF EXISTS `order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `order_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `order_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  `price_at_sale` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `order_id` (`order_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `fulfillment_orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_items`
--

LOCK TABLES `order_items` WRITE;
/*!40000 ALTER TABLE `order_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `order_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payment_slips`
--

DROP TABLE IF EXISTS `payment_slips`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
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
  `forgery_reasons` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`forgery_reasons`)),
  `ai_audit_result` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`ai_audit_result`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_trans_id` (`trans_id`),
  KEY `idx_slips_tenant` (`tenant_id`),
  KEY `idx_slips_user` (`user_id`),
  CONSTRAINT `fk_slips_tenant_info` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payment_slips`
--

LOCK TABLES `payment_slips` WRITE;
/*!40000 ALTER TABLE `payment_slips` DISABLE KEYS */;
INSERT INTO `payment_slips` VALUES (1,1,1,'016016172549CPP05550','นาย นิรันดร์ ว','ธ.กสิกรไทย','นาง ลัดดาวัลย์ เถื่อนเก่า','Prompt Pay',98.00,'2069-01-16 17:25:00','success','โอนเงินสําเร็จ\n16 ม.ค. 69 17:25 น.\nนาย นิรันดร์ ว\nธ.กสิกรไทย\nxxx-x-x5153-x\nPrompt\nPay\nนาง ลัดดาวัลย์ เถื่อนเก่า\nรหัสพร้อมเพย์\nXXX-xxx-6378\nK+\nเลขที่รายการ:\n429\n016016172549CPP05550\nจํานวน:\n98.00 บาท\nค่าธรรมเนียม:\n0.00 บาท\nสแกนตรวจสอบสลิป','uploads\\8b50d2844cea8e7fba36dc7b8b5f76eb','BROWSER',95,'[\"The vendor information is incomplete; Tax ID and address are missing. Date is in the future.\"]','{\"type\":\"BANK_SLIP\",\"confidence_score\":0.95,\"data\":{\"trans_id\":\"016016172549CPP05550\",\"datetime\":\"2069-01-16T17:25:00\",\"amount\":98,\"sender\":{\"name\":\"นาย นิรันดร์ ว\",\"bank\":\"ธ.กสิกรไทย\",\"account_no\":\"xxx-x-x5153-x\"},\"receiver\":{\"name\":\"นาง ลัดดาวัลย์ เถื่อนเก่า\",\"bank\":\"Prompt Pay\",\"account_no\":\"xxx-xxx-6378\"},\"vendor\":{\"name\":\"K+\",\"tax_id\":null,\"address\":null},\"items\":[],\"vat\":null,\"total\":98},\"audit_result\":{\"is_standard_structure\":true,\"is_valid_vendor_info\":false,\"forgery_detected\":false,\"forgery_reason\":null,\"audit_remark\":\"The vendor information is incomplete; Tax ID and address are missing. Date is in the future.\"}}','2026-02-05 12:30:45');
/*!40000 ALTER TABLE `payment_slips` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product`
--

DROP TABLE IF EXISTS `product`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `product` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `product_group_id` int(11) DEFAULT 1,
  `sku` varchar(100) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `status` int(11) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product`
--

LOCK TABLES `product` WRITE;
/*!40000 ALTER TABLE `product` DISABLE KEYS */;
/*!40000 ALTER TABLE `product` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_units`
--

DROP TABLE IF EXISTS `product_units`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `product_units` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL COMMENT 'ชื่อหน่วยนับ (ชิ้น, อัน, กล่อง)',
  `code` varchar(50) DEFAULT NULL COMMENT 'รหัสหน่วยนับ',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_unit_tenant` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางหน่วยนับสินค้า';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_units`
--

LOCK TABLES `product_units` WRITE;
/*!40000 ALTER TABLE `product_units` DISABLE KEYS */;
/*!40000 ALTER TABLE `product_units` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
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
  `image_urls` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`image_urls`)),
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_prod_tenant` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `shopee_income_details`
--

DROP TABLE IF EXISTS `shopee_income_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `shopee_income_details` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `order_sn` varchar(100) DEFAULT NULL,
  `order_date` datetime DEFAULT NULL,
  `buyer_user_name` varchar(255) DEFAULT NULL,
  `buyer_total_amount` decimal(15,4) DEFAULT NULL,
  `original_price` decimal(15,4) DEFAULT NULL,
  `seller_return_refund_amount` decimal(15,4) DEFAULT NULL,
  `shipping_fee_discount_from_3pl` decimal(15,4) DEFAULT NULL,
  `seller_shipping_discount` decimal(15,4) DEFAULT NULL,
  `drc_adjustable_refund` decimal(15,4) DEFAULT NULL,
  `cost_of_goods_sold` decimal(15,4) DEFAULT NULL,
  `original_cost_of_goods_sold` decimal(15,4) DEFAULT NULL,
  `original_shopee_discount` decimal(15,4) DEFAULT NULL,
  `seller_coin_cash_back` decimal(15,4) DEFAULT NULL,
  `shopee_shipping_rebate` decimal(15,4) DEFAULT NULL,
  `commission_fee` decimal(15,4) DEFAULT NULL,
  `transaction_fee` decimal(15,4) DEFAULT NULL,
  `service_fee` decimal(15,4) DEFAULT NULL,
  `seller_voucher_code` decimal(15,4) DEFAULT NULL,
  `shopee_voucher_code` decimal(15,4) DEFAULT NULL,
  `escrow_amount` decimal(15,4) DEFAULT NULL,
  `exchange_rate` decimal(10,4) DEFAULT NULL,
  `reverse_shipping_fee` decimal(15,4) DEFAULT NULL,
  `final_shipping_fee` decimal(15,4) DEFAULT NULL,
  `actual_shipping_fee` decimal(15,4) DEFAULT NULL,
  `order_chargeable_weight` decimal(10,4) DEFAULT NULL,
  `payment_promotion_amount` decimal(15,4) DEFAULT NULL,
  `cross_border_tax` decimal(15,4) DEFAULT NULL,
  `shipping_fee_paid_by_buyer` decimal(15,4) DEFAULT NULL,
  `items` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`items`)),
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_sn` (`order_sn`),
  KEY `idx_sh_order` (`order_sn`),
  KEY `idx_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shopee_income_details`
--

LOCK TABLES `shopee_income_details` WRITE;
/*!40000 ALTER TABLE `shopee_income_details` DISABLE KEYS */;
/*!40000 ALTER TABLE `shopee_income_details` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `shopee_tokens`
--

DROP TABLE IF EXISTS `shopee_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `shopee_tokens` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `shop_id` varchar(50) DEFAULT NULL,
  `access_token` text DEFAULT NULL,
  `refresh_token` text DEFAULT NULL,
  `expires_at` datetime DEFAULT NULL,
  `status` varchar(20) DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shopee_tokens`
--

LOCK TABLES `shopee_tokens` WRITE;
/*!40000 ALTER TABLE `shopee_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `shopee_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `subscription_plans`
--

DROP TABLE IF EXISTS `subscription_plans`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `subscription_plans` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `plan_name` varchar(100) NOT NULL,
  `plan_code` varchar(50) NOT NULL,
  `price_monthly` decimal(15,2) DEFAULT 0.00,
  `max_users` int(11) DEFAULT 5,
  `max_transactions_per_month` int(11) DEFAULT 1000,
  `features` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`features`)),
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_plan_code` (`plan_code`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subscription_plans`
--

LOCK TABLES `subscription_plans` WRITE;
/*!40000 ALTER TABLE `subscription_plans` DISABLE KEYS */;
INSERT INTO `subscription_plans` VALUES (1,'ฟรี','free',0.00,5,100,'{\"ocr\": true, \"ai_audit\": false, \"dashboard\": true, \"multichannel\": false}',1,'2026-02-05 10:15:18'),(2,'เบสิก','basic',290.00,10,500,'{\"ocr\": true, \"ai_audit\": false, \"dashboard\": true, \"multichannel\": true}',1,'2026-02-05 10:15:18'),(3,'โปร','professional',590.00,20,2000,'{\"ocr\": true, \"ai_audit\": true, \"dashboard\": true, \"multichannel\": true}',1,'2026-02-05 10:15:18'),(4,'องค์กร','enterprise',1290.00,100,10000,'{\"ocr\": true, \"ai_audit\": true, \"dashboard\": true, \"multichannel\": true, \"custom_features\": true}',1,'2026-02-05 10:15:18');
/*!40000 ALTER TABLE `subscription_plans` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sync_log`
--

DROP TABLE IF EXISTS `sync_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sync_log` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `type` varchar(50) DEFAULT NULL,
  `platform` varchar(50) DEFAULT NULL,
  `start_time` datetime DEFAULT NULL,
  `end_time` datetime DEFAULT NULL,
  `status` varchar(20) DEFAULT NULL,
  `total_records` int(11) DEFAULT 0,
  `message` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sync_log`
--

LOCK TABLES `sync_log` WRITE;
/*!40000 ALTER TABLE `sync_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `sync_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tenant_subscriptions`
--

DROP TABLE IF EXISTS `tenant_subscriptions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tenant_subscriptions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `plan_id` int(11) NOT NULL,
  `status` enum('active','expired','cancelled','suspended') DEFAULT 'active',
  `start_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `end_date` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `tenant_id` (`tenant_id`),
  KEY `plan_id` (`plan_id`),
  CONSTRAINT `tenant_subscriptions_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `tenant_subscriptions_ibfk_2` FOREIGN KEY (`plan_id`) REFERENCES `subscription_plans` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tenant_subscriptions`
--

LOCK TABLES `tenant_subscriptions` WRITE;
/*!40000 ALTER TABLE `tenant_subscriptions` DISABLE KEYS */;
INSERT INTO `tenant_subscriptions` VALUES (1,1,3,'expired','2026-02-05 10:15:18','2027-02-05 10:15:18','2026-02-05 10:15:18'),(2,1,1,'expired','2026-02-05 10:30:27','2027-02-05 10:30:27','2026-02-05 10:30:27'),(3,1,3,'active','2026-02-05 10:32:22','2027-02-05 10:32:22','2026-02-05 10:32:22');
/*!40000 ALTER TABLE `tenant_subscriptions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tenants`
--

DROP TABLE IF EXISTS `tenants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
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
  `features` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`features`)),
  `settings` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`settings`)),
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_tenant_code` (`tenant_code`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tenants`
--

LOCK TABLES `tenants` WRITE;
/*!40000 ALTER TABLE `tenants` DISABLE KEYS */;
INSERT INTO `tenants` VALUES (1,'BILLORA001','Default Organization',NULL,NULL,NULL,NULL,NULL,NULL,'professional','active',NULL,'2027-02-05 17:32:22',20,1024,2000,'{\"ocr\":true,\"ai_audit\":true,\"dashboard\":true,\"multichannel\":true}',NULL,1,'2026-02-05 10:15:18','2026-02-05 10:32:22',NULL);
/*!40000 ALTER TABLE `tenants` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tiktok_income_details`
--

DROP TABLE IF EXISTS `tiktok_income_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tiktok_income_details` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `order_id` varchar(100) DEFAULT NULL,
  `order_date` datetime DEFAULT NULL,
  `settlement_amount` decimal(15,4) DEFAULT NULL,
  `revenue_amount` decimal(15,4) DEFAULT NULL,
  `shipping_cost_amount` decimal(15,4) DEFAULT NULL,
  `fee_and_tax_amount` decimal(15,4) DEFAULT NULL,
  `adjustment_amount` decimal(15,4) DEFAULT NULL,
  `actual_shipping_fee_amount` decimal(15,4) DEFAULT NULL,
  `affiliate_commission_amount` decimal(15,4) DEFAULT NULL,
  `customer_payment_amount` decimal(15,4) DEFAULT NULL,
  `customer_refund_amount` decimal(15,4) DEFAULT NULL,
  `gross_sales_amount` decimal(15,4) DEFAULT NULL,
  `gross_sales_refund_amount` decimal(15,4) DEFAULT NULL,
  `net_sales_amount` decimal(15,4) DEFAULT NULL,
  `platform_commission_amount` decimal(15,4) DEFAULT NULL,
  `platform_discount_amount` decimal(15,4) DEFAULT NULL,
  `platform_discount_refund_amount` decimal(15,4) DEFAULT NULL,
  `platform_shipping_fee_discount_amount` decimal(15,4) DEFAULT NULL,
  `sales_tax_amount` decimal(15,4) DEFAULT NULL,
  `sales_tax_payment_amount` decimal(15,4) DEFAULT NULL,
  `sales_tax_refund_amount` decimal(15,4) DEFAULT NULL,
  `shipping_fee_amount` decimal(15,4) DEFAULT NULL,
  `shipping_fee_subsidy_amount` decimal(15,4) DEFAULT NULL,
  `transaction_fee_amount` decimal(15,4) DEFAULT NULL,
  `currency` varchar(10) DEFAULT 'THB',
  `statement_transactions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`statement_transactions`)),
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_id` (`order_id`),
  KEY `idx_tk_order` (`order_id`),
  KEY `idx_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tiktok_income_details`
--

LOCK TABLES `tiktok_income_details` WRITE;
/*!40000 ALTER TABLE `tiktok_income_details` DISABLE KEYS */;
/*!40000 ALTER TABLE `tiktok_income_details` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tiktok_tokens`
--

DROP TABLE IF EXISTS `tiktok_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tiktok_tokens` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `access_token` text DEFAULT NULL,
  `refresh_token` text DEFAULT NULL,
  `expires_at` datetime DEFAULT NULL,
  `shop_cipher` varchar(100) DEFAULT NULL,
  `shop_name` varchar(100) DEFAULT NULL,
  `status` varchar(20) DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tiktok_tokens`
--

LOCK TABLES `tiktok_tokens` WRITE;
/*!40000 ALTER TABLE `tiktok_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `tiktok_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `username` varchar(100) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('admin','owner','member') DEFAULT 'member',
  `line_user_id` varchar(100) DEFAULT NULL,
  `permissions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`permissions`)),
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_user_tenant` (`tenant_id`),
  KEY `idx_username` (`username`),
  CONSTRAINT `fk_users_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,1,'admin','admin@billora.ai','$2b$10$KrukT75i0Gla5l10SUgvLe/BRE4f0pYclOJtpRQC/F2Z0JdnC14.C','admin',NULL,'{\"dashboard\": true, \"bills\": true, \"slips\": true, \"users\": true, \"inventory\": true}',1,'2026-02-05 10:15:18','2026-02-05 10:15:18',NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `warehouse_locations`
--

DROP TABLE IF EXISTS `warehouse_locations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `warehouse_locations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `warehouse_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `code` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_loc_warehouse` (`warehouse_id`),
  CONSTRAINT `fk_loc_warehouse` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `warehouse_locations`
--

LOCK TABLES `warehouse_locations` WRITE;
/*!40000 ALTER TABLE `warehouse_locations` DISABLE KEYS */;
/*!40000 ALTER TABLE `warehouse_locations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `warehouses`
--

DROP TABLE IF EXISTS `warehouses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `warehouses` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `code` varchar(50) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `warehouses`
--

LOCK TABLES `warehouses` WRITE;
/*!40000 ALTER TABLE `warehouses` DISABLE KEYS */;
/*!40000 ALTER TABLE `warehouses` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-02-05 13:11:21
