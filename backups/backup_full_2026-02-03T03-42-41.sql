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
  `user_id` int(11) NOT NULL,
  `action` varchar(255) NOT NULL,
  `details` text DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `created_at` (`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=71 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `action_logs`
--

LOCK TABLES `action_logs` WRITE;
/*!40000 ALTER TABLE `action_logs` DISABLE KEYS */;
INSERT INTO `action_logs` VALUES (1,1,'Login','เข้าสู่ระบบผ่าน Web Browser','::1','2026-02-02 06:47:31'),(2,1,'Login','เข้าสู่ระบบผ่าน Web Browser','::ffff:127.0.0.1','2026-02-02 06:51:34'),(3,1,'Upload Receipt','อัปโหลดใบเสร็จ ยอด 114 บาท จากร้าน ELEVEN','::1','2026-02-02 06:51:54'),(4,1,'Login','เข้าสู่ระบบผ่าน Web Browser','::1','2026-02-02 07:07:11'),(5,1,'Login','เข้าสู่ระบบผ่าน Web Browser','::1','2026-02-02 07:14:02'),(6,1,'Login','เข้าสู่ระบบผ่าน Web Browser','::1','2026-02-02 07:23:30'),(7,1,'Login','เข้าสู่ระบบผ่าน Web Browser','::ffff:127.0.0.1','2026-02-02 07:29:14'),(8,1,'Login','เข้าสู่ระบบผ่าน Web Browser','::1','2026-02-02 07:29:46'),(9,1,'Login','เข้าสู่ระบบผ่าน Web Browser','::1','2026-02-02 07:30:34'),(10,1,'Login','เข้าสู่ระบบผ่าน Web Browser','::1','2026-02-02 07:30:54'),(11,1,'Login','เข้าสู่ระบบผ่าน Web Browser','::1','2026-02-02 07:32:18'),(12,1,'Login','เข้าสู่ระบบผ่าน Web Browser','::1','2026-02-02 07:42:15'),(13,1,'Login','เข้าสู่ระบบผ่าน Web Browser','::1','2026-02-02 07:47:28'),(14,1,'Login','เข้าสู่ระบบผ่าน Web Browser','::1','2026-02-02 07:58:47'),(15,1,'Login','เข้าสู่ระบบผ่าน Web Browser','::1','2026-02-02 08:02:54'),(16,1,'Login','เข้าสู่ระบบผ่าน Web Browser','::1','2026-02-02 08:07:04'),(17,1,'Login','เข้าสู่ระบบผ่าน Web Browser','::1','2026-02-02 08:12:17'),(18,1,'Login','เข้าสู่ระบบผ่าน Web Browser','::1','2026-02-02 08:19:33'),(19,1,'Login','เข้าสู่ระบบผ่าน Web Browser','::1','2026-02-02 08:19:45'),(20,1,'Login','เข้าสู่ระบบผ่าน Web Browser','::1','2026-02-02 08:49:40'),(21,1,'Login','เข้าสู่ระบบผ่าน Web Browser','::1','2026-02-02 08:56:27'),(22,1,'Login','เข้าสู่ระบบผ่าน Web Browser','::1','2026-02-02 09:00:27'),(23,1,'Upload Bank Slip','อัปโหลดสลิปเงินโอน ยอด 218 บาท (จาก: นาย นิรันดร์ว)','::ffff:192.168.60.27','2026-02-02 09:13:48'),(24,1,'Upload Duplicate Slip','พยายามอัปโหลดสลิปซ้ำ (เลขที่: 014197143034)','::ffff:192.168.60.27','2026-02-02 09:14:03'),(25,1,'Upload Duplicate Slip','พยายามอัปโหลดสลิปซ้ำ (เลขที่: 64039703000126013710)','::ffff:192.168.60.27','2026-02-02 09:15:59'),(26,1,'Upload Duplicate Slip','พยายามอัปโหลดสลิปซ้ำ (เลขที่: 016016172549CPP05550)','::ffff:192.168.60.27','2026-02-02 09:16:27'),(27,1,'Upload Bank Slip','อัปโหลดสลิปเงินโอน ยอด 218 บาท (จาก: นาย นิรันดร์ ว)','::ffff:192.168.60.27','2026-02-02 09:17:23'),(28,1,'Login','เข้าสู่ระบบผ่าน Web Browser','::1','2026-02-02 09:18:03'),(29,1,'Upload Receipt','อัปโหลดใบเสร็จ ยอด 114 บาท จากร้าน ELEVEN','::1','2026-02-02 09:25:47'),(30,1,'Upload Bank Slip','อัปโหลดสลิปเงินโอน ยอด 98 บาท (จาก: นาย นิรันดร์ ว)','::1','2026-02-02 09:26:17'),(31,1,'Login','เข้าสู่ระบบผ่าน Web Browser','::ffff:127.0.0.1','2026-02-02 09:29:44'),(32,1,'Login','เข้าสู่ระบบผ่าน Web Browser','::1','2026-02-02 09:34:04'),(33,1,'Login','เข้าสู่ระบบผ่าน Web Browser','::1','2026-02-02 09:37:13'),(34,1,'Login','เข้าสู่ระบบผ่าน Web Browser','::1','2026-02-02 09:41:55'),(35,1,'Login','เข้าสู่ระบบผ่าน Web Browser','::1','2026-02-02 09:47:42'),(36,1,'Login','เข้าสู่ระบบผ่าน Web Browser','::1','2026-02-02 10:18:18'),(37,1,'Login','เข้าสู่ระบบผ่าน Web Browser','::1','2026-02-02 10:27:09'),(38,1,'Create Backup','สร้างไฟล์สำรอง backup-2026-02-02T10-27-35-234Z.sql','::1','2026-02-02 10:27:35'),(39,1,'Login','เข้าสู่ระบบผ่าน Web Browser','::1','2026-02-02 10:29:19'),(40,1,'Delete Backup','ลบไฟล์สำรอง backup-2026-02-02T10-19-56-817Z.sql','::1','2026-02-02 10:29:26'),(41,1,'Login','เข้าสู่ระบบผ่าน Web Browser','::1','2026-02-02 13:50:34'),(42,1,'Create Backup','สร้างไฟล์สำรอง backup-2026-02-02T13-59-48-319Z.sql','::1','2026-02-02 13:59:48'),(43,1,'Login','เข้าสู่ระบบผ่าน Web Browser','::1','2026-02-03 01:28:46'),(44,1,'Login','เข้าสู่ระบบผ่าน Web Browser','::1','2026-02-03 01:51:24'),(45,1,'Login','เข้าสู่ระบบผ่าน Web Browser','::1','2026-02-03 02:01:18'),(46,1,'Login','เข้าสู่ระบบผ่าน Web Browser','::1','2026-02-03 02:16:03'),(47,1,'Login','เข้าสู่ระบบผ่าน Web Browser','::1','2026-02-03 02:23:22'),(48,1,'Login','เข้าสู่ระบบผ่าน Web Browser','::1','2026-02-03 02:26:42'),(49,1,'Login','เข้าสู่ระบบผ่าน Web Browser','::1','2026-02-03 02:29:59'),(50,2,'Login','เข้าสู่ระบบผ่าน Web Browser','::1','2026-02-03 02:55:42'),(51,1,'Login','เข้าสู่ระบบผ่าน Web Browser','::1','2026-02-03 02:56:12'),(52,2,'Login','เข้าสู่ระบบผ่าน Web Browser','::1','2026-02-03 02:59:01'),(53,1,'Login','เข้าสู่ระบบผ่าน Web Browser','::1','2026-02-03 03:01:50'),(54,1,'Login','เข้าสู่ระบบผ่าน Web Browser','::1','2026-02-03 03:01:57'),(55,1,'Login','เข้าสู่ระบบผ่าน Web Browser','::1','2026-02-03 03:03:07'),(56,1,'Login','เข้าสู่ระบบผ่าน Web Browser','::1','2026-02-03 03:04:41'),(57,2,'Login','เข้าสู่ระบบผ่าน Web Browser','::1','2026-02-03 03:06:04'),(58,1,'Login','เข้าสู่ระบบผ่าน Web Browser','::1','2026-02-03 03:09:21'),(59,2,'Login','เข้าสู่ระบบผ่าน Web Browser','::1','2026-02-03 03:09:49'),(60,2,'Create Backup','สร้างไฟล์สำรอง backup-2026-02-03T03-18-38-113Z.sql','::1','2026-02-03 03:18:38'),(61,1,'Login','เข้าสู่ระบบผ่าน Web Browser','::1','2026-02-03 03:29:32'),(62,1,'Create Backup','สร้างไฟล์สำรอง backup-2026-02-03T03-29-55-899Z.sql','::1','2026-02-03 03:29:56'),(63,1,'Delete Backup','ลบไฟล์สำรอง backup_2026-02-02T06-36-42-111Z.sql','::1','2026-02-03 03:30:03'),(64,1,'Delete Backup','ลบไฟล์สำรอง backup-2026-02-02T10-27-35-234Z.sql','::1','2026-02-03 03:30:05'),(65,1,'Delete Backup','ลบไฟล์สำรอง backup-2026-02-02T13-59-48-319Z.sql','::1','2026-02-03 03:30:08'),(66,1,'Login','เข้าสู่ระบบผ่าน Web Browser','::1','2026-02-03 03:33:49'),(67,1,'Create Backup','สร้างไฟล์สำรอง backup-2026-02-03T03-34-02-922Z.sql','::1','2026-02-03 03:34:03'),(68,1,'Login','เข้าสู่ระบบผ่าน Web Browser','::1','2026-02-03 03:37:33'),(69,1,'Login','เข้าสู่ระบบผ่าน Web Browser','::1','2026-02-03 03:38:22'),(70,1,'Login','เข้าสู่ระบบผ่าน Web Browser','::1','2026-02-03 03:42:33');
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
  `schedule_id` int(11) DEFAULT NULL COMMENT 'อ้างอิงจาก backup_schedules (NULL = Manual backup)',
  `filename` varchar(255) NOT NULL COMMENT 'ชื่อไฟล์',
  `filepath` varchar(500) NOT NULL COMMENT 'ที่อยู่ไฟล์',
  `file_size` bigint(20) DEFAULT NULL COMMENT 'ขนาดไฟล์ (bytes)',
  `backup_type` enum('full','tenant','manual') DEFAULT 'manual',
  `status` enum('pending','running','success','failed') DEFAULT 'pending',
  `error_message` text DEFAULT NULL COMMENT 'ข้อความ Error (ถ้ามี)',
  `started_at` timestamp NULL DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  `duration_seconds` int(11) DEFAULT NULL COMMENT 'ระยะเวลาที่ใช้ (วินาที)',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `created_by` int(11) DEFAULT NULL COMMENT 'ผู้ทำ Backup (NULL = Auto)',
  PRIMARY KEY (`id`),
  KEY `idx_schedule_id` (`schedule_id`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `backup_history_ibfk_1` FOREIGN KEY (`schedule_id`) REFERENCES `backup_schedules` (`id`) ON DELETE SET NULL,
  CONSTRAINT `backup_history_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางประวัติการ Backup';
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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางกำหนดการ Backup อัตโนมัติ';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `backup_schedules`
--

LOCK TABLES `backup_schedules` WRITE;
/*!40000 ALTER TABLE `backup_schedules` DISABLE KEYS */;
INSERT INTO `backup_schedules` VALUES (1,NULL,'Daily Full Backup','สำรองข้อมูลทั้งหมดทุกวันเวลา 02:00 AM','0 2 * * *','full',7,10,1,NULL,NULL,0,1,NULL,'2026-02-03 03:37:14','2026-02-03 03:37:14',NULL),(2,NULL,'Weekly Full Backup','สำรองข้อมูลทั้งหมดทุกวันอาทิตย์เวลา 03:00 AM','0 3 * * 0','full',30,10,0,NULL,NULL,0,1,NULL,'2026-02-03 03:37:14','2026-02-03 03:37:14',NULL);
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
  `bill_id` int(11) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `qty` int(11) DEFAULT NULL,
  `price` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `bill_id` (`bill_id`),
  CONSTRAINT `bill_items_ibfk_1` FOREIGN KEY (`bill_id`) REFERENCES `bills` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bill_items`
--

LOCK TABLES `bill_items` WRITE;
/*!40000 ALTER TABLE `bill_items` DISABLE KEYS */;
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

LOCK TABLES `bills` WRITE;
/*!40000 ALTER TABLE `bills` DISABLE KEYS */;
INSERT INTO `bills` VALUES (13,NULL,1,1,'ELEVEN','2023-11-09',114.00,0.00,'[]','ELEVEN\nใบกำกับภาษีอย่างย่อ (ABB)\n7-Eleven สาน แทนนมาก\nส้าน โดย ต๊อง 17333-800016\nร้านทนม รูปง 7-Eleven\nเพื่อมูลค่าพิ่ม:7% .1921000037011\nน้ำดื่ม 7-Select 600ml\n- 7.00 B\nข้าวผัดกระเพราหมู\n- 45.00 B\nเลย์ มันฝรั่งทอด\n- 20.00 B\nกาแฟเย็น All Café\n- 35.00 B\nรวมเงิน\n107.00 B\nภาษีมูลค่าเพิ่ม 7%\nยอดสุทธิ\n09/11/2023 14:30:22\n7.00 B\n114.00 B','uploads\\71650dc746d497e179cbd25734b59c45','BROWSER','2026-02-02 04:09:10'),(14,NULL,1,1,'ELEVEN','2023-11-09',114.00,0.00,'[]','ELEVEN\nใบกำกับภาษีอย่างย่อ (ABB)\n7-Eleven สาน แทนนมาก\nส้าน โดย ต๊อง 17333-800016\nร้านทนม รูปง 7-Eleven\nเพื่อมูลค่าพิ่ม:7% .1921000037011\nน้ำดื่ม 7-Select 600ml\n- 7.00 B\nข้าวผัดกระเพราหมู\n- 45.00 B\nเลย์ มันฝรั่งทอด\n- 20.00 B\nกาแฟเย็น All Café\n- 35.00 B\nรวมเงิน\n107.00 B\nภาษีมูลค่าเพิ่ม 7%\nยอดสุทธิ\n09/11/2023 14:30:22\n7.00 B\n114.00 B','uploads\\048fa7e6a7493d52ca1c72cd13ab9305','BROWSER','2026-02-02 06:49:15'),(15,NULL,1,1,'ELEVEN','2023-11-09',114.00,0.00,'[]','ELEVEN\nใบกำกับภาษีอย่างย่อ (ABB)\n7-Eleven สาน แทนนมาก\nส้าน โดย ต๊อง 17333-800016\nร้านทนม รูปง 7-Eleven\nเพื่อมูลค่าพิ่ม:7% .1921000037011\nน้ำดื่ม 7-Select 600ml\n- 7.00 B\nข้าวผัดกระเพราหมู\n- 45.00 B\nเลย์ มันฝรั่งทอด\n- 20.00 B\nกาแฟเย็น All Café\n- 35.00 B\nรวมเงิน\n107.00 B\nภาษีมูลค่าเพิ่ม 7%\nยอดสุทธิ\n09/11/2023 14:30:22\n7.00 B\n114.00 B','uploads\\994f14630bb9274412befccf398d864c','BROWSER','2026-02-02 06:51:54'),(16,NULL,1,1,'ELEVEN','2023-11-09',114.00,0.00,'[]','ELEVEN\nใบกำกับภาษีอย่างย่อ (ABB)\n7-Eleven สาน แทนนมาก\nส้าน โดย ต๊อง 17333-800016\nร้านทนม รูปง 7-Eleven\nเพื่อมูลค่าพิ่ม:7% .1921000037011\nน้ำดื่ม 7-Select 600ml\n- 7.00 B\nข้าวผัดกระเพราหมู\n- 45.00 B\nเลย์ มันฝรั่งทอด\n- 20.00 B\nกาแฟเย็น All Café\n- 35.00 B\nรวมเงิน\n107.00 B\nภาษีมูลค่าเพิ่ม 7%\nยอดสุทธิ\n09/11/2023 14:30:22\n7.00 B\n114.00 B','uploads\\69c32ff6bb26ba0069921998b6cac639','BROWSER','2026-02-02 09:25:47');
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
-- Table structure for table `ocr_logs`
--

DROP TABLE IF EXISTS `ocr_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ocr_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `type` enum('BANK_SLIP','RECEIPT','UNKNOWN') NOT NULL,
  `source` enum('BROWSER','MOBILE','LINE') NOT NULL,
  `status` varchar(50) NOT NULL,
  `amount` decimal(15,2) DEFAULT 0.00,
  `trans_id` varchar(100) DEFAULT NULL,
  `image_path` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `ocr_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ocr_logs`
--

LOCK TABLES `ocr_logs` WRITE;
/*!40000 ALTER TABLE `ocr_logs` DISABLE KEYS */;
INSERT INTO `ocr_logs` VALUES (1,1,'BANK_SLIP','LINE','duplicate',200.00,'016031061247143771','uploads/line_598938642610389609.jpg','2026-01-31 02:29:17'),(2,1,'BANK_SLIP','LINE','warning',10000.00,'TEMP_1769826733380','uploads/line_598938938057162941.jpg','2026-01-31 02:32:13'),(3,1,'BANK_SLIP','LINE','warning',5000.00,'TEMP_1769826734955','uploads/line_598938938308035119.jpg','2026-01-31 02:32:14'),(4,1,'BANK_SLIP','LINE','success',630.95,'016029165610BPM12831','uploads/line_598938939332231747.jpg','2026-01-31 02:32:15'),(5,1,'BANK_SLIP','LINE','success',1000.00,'016029181016BQR05750','uploads/line_598938938946355456.jpg','2026-01-31 02:32:15'),(6,1,'BANK_SLIP','BROWSER','success',98.00,'016016172549CPP05550','uploads\\2f8c4d115043f08fd2a2c616609cb8fd','2026-01-31 03:05:56'),(7,1,'BANK_SLIP','LINE','success',220.00,'016026133435BORO0499','uploads/line_598943360245301319.jpg','2026-01-31 03:16:09'),(8,1,'BANK_SLIP','BROWSER','duplicate',98.00,'016016172549CPP05550','uploads\\95d1c3877fdac7036d898b65d269ffef','2026-01-31 03:21:23'),(9,1,'BANK_SLIP','BROWSER','success',3000.00,'64039703000126013710','uploads\\0f28ea031383e7cfd1444adfe27bb297','2026-01-31 03:21:58'),(10,1,'BANK_SLIP','BROWSER','duplicate',98.00,'016016172549CPP05550','uploads\\d249344cf462b3573c9f9a4088565109','2026-01-31 03:26:06'),(11,1,'BANK_SLIP','BROWSER','warning',20000.00,'TEMP_1769829987796','uploads\\4ca1e4bd4a3c409e795120ea4d560805','2026-01-31 03:26:27'),(12,1,'BANK_SLIP','BROWSER','success',98.00,'016016172549CPP05550','uploads\\705eaab9e989aa822459b90886a35344','2026-01-31 03:27:24'),(13,1,'BANK_SLIP','MOBILE','success',98.00,'016016172549CPP05550','uploads\\7045a77a6d6010a4a97fb39c617d48ae','2026-01-31 03:31:08'),(14,1,'BANK_SLIP','MOBILE','success',218.00,'014197143034AOR05219','uploads\\85e43e4fc2dba12f332f13a15728687d','2026-01-31 04:38:16'),(15,1,'BANK_SLIP','LINE','success',225.00,'016032112333BOR00880','uploads/line_599236066662679112.jpg','2026-02-02 03:43:55'),(16,1,'RECEIPT','BROWSER','success',7.00,NULL,'uploads\\fc0fe93fdf8f5f4d78f2f14de9b31350','2026-02-02 04:00:43'),(17,1,'RECEIPT','BROWSER','success',114.00,NULL,'uploads\\c3d7b6de78e87e3d5938cc5c7524e0ba','2026-02-02 04:06:20'),(18,1,'RECEIPT','BROWSER','success',114.00,NULL,'uploads\\71650dc746d497e179cbd25734b59c45','2026-02-02 04:09:10'),(19,1,'BANK_SLIP','LINE','success',93.00,'016033113739APP07500','uploads/line_599251407631810853.jpg','2026-02-02 06:16:20'),(20,1,'BANK_SLIP','LINE','success',200.00,'016022062816718485','uploads/line_599254674524864972.jpg','2026-02-02 06:48:46'),(21,1,'RECEIPT','BROWSER','success',114.00,NULL,'uploads\\048fa7e6a7493d52ca1c72cd13ab9305','2026-02-02 06:49:15'),(22,1,'RECEIPT','BROWSER','success',114.00,NULL,'uploads\\994f14630bb9274412befccf398d864c','2026-02-02 06:51:54'),(23,1,'BANK_SLIP','MOBILE','success',218.00,'014197143034','uploads\\28e9b45a540af03fb17a49e169fe8abb','2026-02-02 09:13:48'),(24,1,'BANK_SLIP','MOBILE','duplicate',218.00,'014197143034','uploads\\4216b2e4ee1feadab1ad3fc9c2c1dc3e','2026-02-02 09:14:03'),(25,1,'BANK_SLIP','MOBILE','duplicate',3000.00,'64039703000126013710','uploads\\a114f51a80e47490075a4d0648025227','2026-02-02 09:15:59'),(26,1,'BANK_SLIP','MOBILE','duplicate',98.00,'016016172549CPP05550','uploads\\33e209bf1dbb1bb873d4b91cb0b936c1','2026-02-02 09:16:27'),(27,1,'BANK_SLIP','MOBILE','success',218.00,'014197143034AOR05219','uploads\\7f4aa3b0f04bee8d7e3f48fdf2368298','2026-02-02 09:17:23'),(28,1,'RECEIPT','BROWSER','success',114.00,NULL,'uploads\\69c32ff6bb26ba0069921998b6cac639','2026-02-02 09:25:47'),(29,1,'BANK_SLIP','BROWSER','success',98.00,'016016172549CPP05550','uploads\\4af90987ff5fb37579239e2d26e6ef2b','2026-02-02 09:26:17');
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
  `company_id` int(11) NOT NULL,
  `platform` enum('shopee','tiktok','lazada') NOT NULL,
  `shop_name` varchar(255) DEFAULT NULL,
  `shop_id` varchar(100) DEFAULT NULL,
  `access_token` text DEFAULT NULL,
  `refresh_token` text DEFAULT NULL,
  `expiry_date` datetime DEFAULT NULL,
  `status` enum('active','expired','disconnected') DEFAULT 'disconnected',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `express_book_code` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
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

LOCK TABLES `payment_slips` WRITE;
/*!40000 ALTER TABLE `payment_slips` DISABLE KEYS */;
INSERT INTO `payment_slips` VALUES (54,NULL,1,1,'014197143034AOR05219','นาย นิรันดร์ ว','กสิกรไทย','นาย พอยสัน ฝึกใจดี','ไทยพาณิชย์',218.00,'2026-02-02 16:17:23','success','โอนเงินสําเร็จ\n15 ก.ค. 67 14:30 น.\nนาย นิรันดร์ ว\nธ.กสิกรไทย\nxxx-x-x5153-x\nนาย พอยสัน ฝึกใจดี\nธ.ไทยพาณิชย์\nXxx-x-x6384-x\nเลขที่รายการ:\n014197143034AOR05219\nจํานวน:\n218.00 บาท\nค่าธรรมเนียม:\nK+\n0.00 บาท\nสแกนตรวจสอบสลิป\nบันทึกช่วยจำ: ค่าลิสแบรนด์ช่วยน้อง','uploads\\7f4aa3b0f04bee8d7e3f48fdf2368298','MOBILE','2026-02-02 09:17:23',20,'[\"รูปแบบเลขที่รายการไม่ตรงกับธนาคารกสิกรไทย\"]'),(55,NULL,1,1,'016016172549CPP05550','นาย นิรันดร์ ว','กสิกรไทย','นาง ลัดดาวัลย์ เถื่อนเก่า','ไม่ระบุ',98.00,'2026-02-02 16:26:17','success','โอนเงินสําเร็จ\n16 ม.ค. 69 17:25 น.\nนาย นิรันดร์ ว\nธ.กสิกรไทย\nxxx-x-x5153-x\nPrompt\nPay\nนาง ลัดดาวัลย์ เถื่อนเก่า\nรหัสพร้อมเพย์\nXXX-xxx-6378\nK+\nเลขที่รายการ:\n429\n016016172549CPP05550\nจํานวน:\n98.00 บาท\nค่าธรรมเนียม:\n0.00 บาท\nสแกนตรวจสอบสลิป','uploads\\4af90987ff5fb37579239e2d26e6ef2b','BROWSER','2026-02-02 09:26:17',20,'[\"รูปแบบเลขที่รายการไม่ตรงกับธนาคารกสิกรไทย\"]');
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
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `products` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `sku` varchar(50) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `price` decimal(10,2) DEFAULT 0.00,
  `cost` decimal(10,2) DEFAULT 0.00,
  `image_url` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id_2` (`user_id`,`sku`),
  KEY `user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
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
  `plan_code` varchar(50) NOT NULL COMMENT 'รหัสแพ็กเกจ',
  `plan_name` varchar(100) NOT NULL COMMENT 'ชื่อแพ็กเกจ',
  `plan_name_en` varchar(100) DEFAULT NULL COMMENT 'ชื่อแพ็กเกจภาษาอังกฤษ',
  `description` text DEFAULT NULL COMMENT 'รายละเอียด',
  `price_monthly` decimal(10,2) DEFAULT 0.00 COMMENT 'ราคาต่อเดือน',
  `price_yearly` decimal(10,2) DEFAULT 0.00 COMMENT 'ราคาต่อปี',
  `currency` varchar(3) DEFAULT 'THB' COMMENT 'สกุลเงิน',
  `max_users` int(11) DEFAULT 5,
  `max_storage_mb` int(11) DEFAULT 1024,
  `max_transactions_per_month` int(11) DEFAULT 1000,
  `features` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'ฟีเจอร์ที่รองรับ' CHECK (json_valid(`features`)),
  `is_active` tinyint(1) DEFAULT 1,
  `sort_order` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `plan_code` (`plan_code`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subscription_plans`
--

LOCK TABLES `subscription_plans` WRITE;
/*!40000 ALTER TABLE `subscription_plans` DISABLE KEYS */;
INSERT INTO `subscription_plans` VALUES (1,'free','ฟรี','Free','แพ็กเกจทดลองใช้งาน',0.00,0.00,'THB',2,512,100,'{\"ocr\": true, \"dashboard\": true, \"reports\": false, \"api_access\": false, \"support\": \"email\"}',1,0,'2026-02-03 02:00:39','2026-02-03 02:00:39'),(2,'basic','เบสิค','Basic','แพ็กเกจสำหรับธุรกิจขนาดเล็ก',499.00,4990.00,'THB',5,2048,1000,'{\"ocr\": true, \"dashboard\": true, \"reports\": true, \"api_access\": false, \"support\": \"email\"}',1,0,'2026-02-03 02:00:39','2026-02-03 02:00:39'),(3,'professional','โปร','Professional','แพ็กเกจสำหรับธุรกิจขนาดกลาง',1499.00,14990.00,'THB',20,10240,5000,'{\"ocr\": true, \"dashboard\": true, \"reports\": true, \"api_access\": true, \"support\": \"priority\"}',1,0,'2026-02-03 02:00:39','2026-02-03 02:00:39'),(4,'enterprise','องค์กร','Enterprise','แพ็กเกจสำหรับองค์กรขนาดใหญ่',4999.00,49990.00,'THB',100,51200,999999,'{\"ocr\": true, \"dashboard\": true, \"reports\": true, \"api_access\": true, \"support\": \"dedicated\", \"custom_features\": true}',1,0,'2026-02-03 02:00:39','2026-02-03 02:00:39');
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

LOCK TABLES `tenant_subscriptions` WRITE;
/*!40000 ALTER TABLE `tenant_subscriptions` DISABLE KEYS */;
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
  `tenant_code` varchar(50) NOT NULL COMMENT 'รหัสองค์กรที่ไม่ซ้ำ',
  `company_name` varchar(255) NOT NULL COMMENT 'ชื่อบริษัท/องค์กร',
  `company_name_en` varchar(255) DEFAULT NULL COMMENT 'ชื่อบริษัทภาษาอังกฤษ',
  `tax_id` varchar(20) DEFAULT NULL COMMENT 'เลขประจำตัวผู้เสียภาษี',
  `address` text DEFAULT NULL COMMENT 'ที่อยู่',
  `phone` varchar(20) DEFAULT NULL COMMENT 'เบอร์โทรศัพท์',
  `email` varchar(100) DEFAULT NULL COMMENT 'อีเมล',
  `logo_url` varchar(255) DEFAULT NULL COMMENT 'โลโก้บริษัท',
  `subscription_plan` enum('free','basic','professional','enterprise') DEFAULT 'free' COMMENT 'แพ็กเกจที่ใช้',
  `subscription_status` enum('active','suspended','cancelled','expired') DEFAULT 'active' COMMENT 'สถานะการใช้งาน',
  `subscription_start_date` datetime DEFAULT NULL COMMENT 'วันที่เริ่มใช้งาน',
  `subscription_end_date` datetime DEFAULT NULL COMMENT 'วันที่หมดอายุ',
  `max_users` int(11) DEFAULT 5 COMMENT 'จำนวนผู้ใช้สูงสุด',
  `max_storage_mb` int(11) DEFAULT 1024 COMMENT 'พื้นที่จัดเก็บสูงสุด (MB)',
  `max_transactions_per_month` int(11) DEFAULT 1000 COMMENT 'จำนวน transaction สูงสุดต่อเดือน',
  `settings` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'การตั้งค่าเพิ่มเติม' CHECK (json_valid(`settings`)),
  `features` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'ฟีเจอร์ที่เปิดใช้งาน' CHECK (json_valid(`features`)),
  `is_active` tinyint(1) DEFAULT 1 COMMENT 'สถานะการใช้งาน',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL COMMENT 'Soft delete',
  PRIMARY KEY (`id`),
  UNIQUE KEY `tenant_code` (`tenant_code`),
  KEY `idx_tenant_code` (`tenant_code`),
  KEY `idx_subscription_status` (`subscription_status`),
  KEY `idx_is_active` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางข้อมูลองค์กร/บริษัท (Tenants)';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tenants`
--

LOCK TABLES `tenants` WRITE;
/*!40000 ALTER TABLE `tenants` DISABLE KEYS */;
INSERT INTO `tenants` VALUES (1,'242456','ตาเล็ก','Tarlek','14567896542','69/71 หมู่ 2 ถนนเพชรเกษม','0860063601','nirantarnoy@gmail.com',NULL,'free','active','2026-02-03 09:37:22',NULL,5,1024,1000,NULL,NULL,1,'2026-02-03 02:37:22','2026-02-03 02:37:22',NULL),(2,'523434','ตาเล็ก','Tarlek','14567896542','69/71 หมู่ 2 ถนนเพชรเกษม','0860063601','nirantarnoy@gmail.com',NULL,'free','active','2026-02-03 09:42:03',NULL,5,1024,1000,NULL,NULL,1,'2026-02-03 02:42:03','2026-02-03 02:42:03',NULL),(3,'694272','ตาเล็ก','Tarlek','14567896542','69/71 หมู่ 2 ถนนเพชรเกษม','0860063601','nirantarnoy@gmail.com',NULL,'free','active','2026-02-03 09:44:54',NULL,5,1024,1000,NULL,NULL,1,'2026-02-03 02:44:54','2026-02-03 02:44:54',NULL),(4,'724624','ตาเล็ก','Tarlek','14567896542','69/71 หมู่ 2 ถนนเพชรเกษม','0860063601','nirantarnoy@gmail.com',NULL,'free','active','2026-02-03 09:45:24',NULL,5,1024,1000,NULL,NULL,1,'2026-02-03 02:45:24','2026-02-03 02:45:24',NULL),(5,'845653','ตาเล็ก','Tarlek','14567896542','69/71 หมู่ 2 ถนนเพชรเกษม','0860063601','nirantarnoy@gmail.com',NULL,'free','active','2026-02-03 09:47:25',NULL,5,1024,1000,NULL,NULL,1,'2026-02-03 02:47:25','2026-02-03 02:47:25',NULL),(6,'110108','ตาเล็ก','Tarlek','14567896542','69/71 หมู่ 2 ถนนเพชรเกษม','0860063601','nirantarnoy@gmail.com',NULL,'free','active','2026-02-03 09:51:50',NULL,5,1024,1000,NULL,NULL,1,'2026-02-03 02:51:50','2026-02-03 02:51:50',NULL);
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

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,1,'admin','admin@system.local','$2b$10$Qf9p4c/5wndT/oZvtILDIuwOd5UL9hZOQArm6pzlcphT8PeDkw9We','System','Administrator',NULL,NULL,'admin','{\"dashboard\":true,\"users\":true,\"tenants\":true,\"bills\":true,\"reports\":true,\"settings\":true,\"system\":true}',1,0,NULL,NULL,NULL,0,NULL,'2026-02-03 02:51:19','2026-02-03 02:51:19',NULL),(2,6,'nirantarnoy@gmail.com','nirantarnoy@gmail.com','$2b$10$x7FS8dhgyEScOwQR./DodeTqBju478xlO8gQ6bbmfUrDs6faGHD9W','นิรันดร์','วังญาติ','0860063601',NULL,'owner','{\"dashboard\":true,\"users\":true,\"bills\":true,\"reports\":true,\"settings\":true}',1,0,NULL,NULL,NULL,0,NULL,'2026-02-03 02:51:50','2026-02-03 02:51:50',NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-02-03  3:42:42
