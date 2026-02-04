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
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL COMMENT 'รหัสองค์กรที่สังกัด',
  `username` varchar(100) NOT NULL COMMENT 'ชื่อผู้ใช้',
  `email` varchar(100) NOT NULL COMMENT 'อีเมล',
  `password_hash` varchar(255) NOT NULL COMMENT 'รหัสผ่านที่เข้ารหัส',
  `first_name` varchar(100) DEFAULT NULL COMMENT 'ชื่อจริง',
  `last_name` varchar(100) DEFAULT NULL COMMENT 'นามสกุล',
  `phone` varchar(20) DEFAULT NULL COMMENT 'เบอร์โทรศัพท์',
  `avatar_url` varchar(255) DEFAULT NULL COMMENT 'รูปโปรไฟล์',
  `role` enum('owner','admin','manager','accountant','user') DEFAULT 'user' COMMENT 'บทบาท',
  `permissions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'สิทธิ์การเข้าถึงแต่ละโมดูล' CHECK (json_valid(`permissions`)),
  `is_active` tinyint(1) DEFAULT 1 COMMENT 'สถานะการใช้งาน',
  `email_verified` tinyint(1) DEFAULT 0 COMMENT 'ยืนยันอีเมลแล้ว',
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `last_login_at` timestamp NULL DEFAULT NULL COMMENT 'เข้าสู่ระบบล่าสุด',
  `last_login_ip` varchar(45) DEFAULT NULL COMMENT 'IP ที่เข้าสู่ระบบล่าสุด',
  `failed_login_attempts` int(11) DEFAULT 0 COMMENT 'จำนวนครั้งที่ล็อกอินผิด',
  `locked_until` timestamp NULL DEFAULT NULL COMMENT 'ล็อกบัญชีจนถึง',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL COMMENT 'Soft delete',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_email_per_tenant` (`tenant_id`,`email`),
  UNIQUE KEY `unique_username_per_tenant` (`tenant_id`,`username`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_email` (`email`),
  KEY `idx_role` (`role`),
  KEY `idx_is_active` (`is_active`),
  CONSTRAINT `fk_users_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางผู้ใช้งาน (Multi-tenant)';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--
-- WHERE:  tenant_id=null

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bills`
--

DROP TABLE IF EXISTS `bills`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `bills` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `company_id` int(11) DEFAULT 1,
  `store_name` varchar(255) DEFAULT NULL,
  `date` date DEFAULT NULL,
  `total_amount` decimal(10,2) DEFAULT NULL,
  `vat` decimal(10,2) DEFAULT NULL,
  `items` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`items`)),
  `raw_text` text DEFAULT NULL,
  `image_path` varchar(255) DEFAULT NULL,
  `source` enum('BROWSER','MOBILE','LINE') DEFAULT 'BROWSER',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_bills_tenant_id` (`tenant_id`),
  CONSTRAINT `fk_bills_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bills`
--
-- WHERE:  tenant_id=null

LOCK TABLES `bills` WRITE;
/*!40000 ALTER TABLE `bills` DISABLE KEYS */;
/*!40000 ALTER TABLE `bills` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payment_slips`
--

DROP TABLE IF EXISTS `payment_slips`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `payment_slips` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `company_id` int(11) DEFAULT 1,
  `trans_id` varchar(100) DEFAULT NULL,
  `sender_name` varchar(255) DEFAULT NULL,
  `sender_bank` varchar(100) DEFAULT NULL,
  `receiver_name` varchar(255) DEFAULT NULL,
  `receiver_bank` varchar(100) DEFAULT NULL,
  `amount` decimal(10,2) DEFAULT NULL,
  `datetime` datetime DEFAULT NULL,
  `status` varchar(50) DEFAULT 'success',
  `raw_text` text DEFAULT NULL,
  `image_path` varchar(255) DEFAULT NULL,
  `source` enum('BROWSER','MOBILE','LINE') DEFAULT 'BROWSER',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `forgery_score` int(11) DEFAULT 0,
  `forgery_reasons` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `trans_id` (`trans_id`),
  KEY `idx_payment_slips_tenant_id` (`tenant_id`),
  CONSTRAINT `fk_payment_slips_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=56 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payment_slips`
--
-- WHERE:  tenant_id=null

LOCK TABLES `payment_slips` WRITE;
/*!40000 ALTER TABLE `payment_slips` DISABLE KEYS */;
/*!40000 ALTER TABLE `payment_slips` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `backup_schedules`
--

DROP TABLE IF EXISTS `backup_schedules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `backup_schedules` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) DEFAULT NULL COMMENT 'NULL = Full backup, มีค่า = Tenant backup',
  `name` varchar(255) NOT NULL COMMENT 'ชื่อ Schedule',
  `description` text DEFAULT NULL COMMENT 'คำอธิบาย',
  `cron_expression` varchar(100) NOT NULL COMMENT 'Cron expression (e.g., 0 2 * * * = ทุกวัน 2:00 AM)',
  `backup_type` enum('full','tenant') DEFAULT 'full' COMMENT 'ประเภท Backup',
  `retention_days` int(11) DEFAULT 7 COMMENT 'เก็บไฟล์ Backup กี่วัน',
  `max_backups` int(11) DEFAULT 10 COMMENT 'เก็บไฟล์สูงสุดกี่ไฟล์',
  `is_active` tinyint(1) DEFAULT 1 COMMENT 'เปิดใช้งาน',
  `last_run_at` timestamp NULL DEFAULT NULL COMMENT 'รันครั้งล่าสุดเมื่อไหร่',
  `next_run_at` timestamp NULL DEFAULT NULL COMMENT 'รันครั้งถัดไปเมื่อไหร่',
  `notify_on_success` tinyint(1) DEFAULT 0 COMMENT 'แจ้งเตือนเมื่อสำเร็จ',
  `notify_on_failure` tinyint(1) DEFAULT 1 COMMENT 'แจ้งเตือนเมื่อล้มเหลว',
  `notification_email` varchar(255) DEFAULT NULL COMMENT 'อีเมลสำหรับแจ้งเตือน',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_by` int(11) DEFAULT NULL COMMENT 'ผู้สร้าง',
  PRIMARY KEY (`id`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_is_active` (`is_active`),
  KEY `idx_next_run` (`next_run_at`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `backup_schedules_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `backup_schedules_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางกำหนดการ Backup อัตโนมัติ';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `backup_schedules`
--
-- WHERE:  tenant_id=null

LOCK TABLES `backup_schedules` WRITE;
/*!40000 ALTER TABLE `backup_schedules` DISABLE KEYS */;
/*!40000 ALTER TABLE `backup_schedules` ENABLE KEYS */;
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
  `start_date` datetime NOT NULL,
  `end_date` datetime NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `currency` varchar(3) DEFAULT 'THB',
  `payment_method` enum('credit_card','bank_transfer','promptpay','other') DEFAULT NULL COMMENT 'วิธีการชำระเงิน',
  `payment_status` enum('pending','paid','failed','refunded') DEFAULT 'pending',
  `payment_date` datetime DEFAULT NULL,
  `payment_reference` varchar(100) DEFAULT NULL COMMENT 'เลขที่อ้างอิง',
  `invoice_number` varchar(50) DEFAULT NULL COMMENT 'เลขที่ใบแจ้งหนี้',
  `invoice_url` varchar(255) DEFAULT NULL COMMENT 'ลิงก์ใบแจ้งหนี้',
  `status` enum('active','expired','cancelled') DEFAULT 'active',
  `auto_renew` tinyint(1) DEFAULT 0 COMMENT 'ต่ออายุอัตโนมัติ',
  `notes` text DEFAULT NULL COMMENT 'หมายเหตุ',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_plan_id` (`plan_id`),
  KEY `idx_status` (`status`),
  KEY `idx_payment_status` (`payment_status`),
  CONSTRAINT `fk_tenant_subscriptions_plan` FOREIGN KEY (`plan_id`) REFERENCES `subscription_plans` (`id`),
  CONSTRAINT `fk_tenant_subscriptions_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tenant_subscriptions`
--
-- WHERE:  tenant_id=null

LOCK TABLES `tenant_subscriptions` WRITE;
/*!40000 ALTER TABLE `tenant_subscriptions` DISABLE KEYS */;
/*!40000 ALTER TABLE `tenant_subscriptions` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-02-03  4:14:25
