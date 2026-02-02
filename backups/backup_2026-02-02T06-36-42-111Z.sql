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
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bills`
--

LOCK TABLES `bills` WRITE;
/*!40000 ALTER TABLE `bills` DISABLE KEYS */;
INSERT INTO `bills` VALUES (13,1,1,'ELEVEN','2023-11-09',114.00,0.00,'[]','ELEVEN\nใบกำกับภาษีอย่างย่อ (ABB)\n7-Eleven สาน แทนนมาก\nส้าน โดย ต๊อง 17333-800016\nร้านทนม รูปง 7-Eleven\nเพื่อมูลค่าพิ่ม:7% .1921000037011\nน้ำดื่ม 7-Select 600ml\n- 7.00 B\nข้าวผัดกระเพราหมู\n- 45.00 B\nเลย์ มันฝรั่งทอด\n- 20.00 B\nกาแฟเย็น All Café\n- 35.00 B\nรวมเงิน\n107.00 B\nภาษีมูลค่าเพิ่ม 7%\nยอดสุทธิ\n09/11/2023 14:30:22\n7.00 B\n114.00 B','uploads\\71650dc746d497e179cbd25734b59c45','BROWSER','2026-02-02 04:09:10');
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
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ocr_logs`
--

LOCK TABLES `ocr_logs` WRITE;
/*!40000 ALTER TABLE `ocr_logs` DISABLE KEYS */;
INSERT INTO `ocr_logs` VALUES (1,1,'BANK_SLIP','LINE','duplicate',200.00,'016031061247143771','uploads/line_598938642610389609.jpg','2026-01-31 02:29:17'),(2,1,'BANK_SLIP','LINE','warning',10000.00,'TEMP_1769826733380','uploads/line_598938938057162941.jpg','2026-01-31 02:32:13'),(3,1,'BANK_SLIP','LINE','warning',5000.00,'TEMP_1769826734955','uploads/line_598938938308035119.jpg','2026-01-31 02:32:14'),(4,1,'BANK_SLIP','LINE','success',630.95,'016029165610BPM12831','uploads/line_598938939332231747.jpg','2026-01-31 02:32:15'),(5,1,'BANK_SLIP','LINE','success',1000.00,'016029181016BQR05750','uploads/line_598938938946355456.jpg','2026-01-31 02:32:15'),(6,1,'BANK_SLIP','BROWSER','success',98.00,'016016172549CPP05550','uploads\\2f8c4d115043f08fd2a2c616609cb8fd','2026-01-31 03:05:56'),(7,1,'BANK_SLIP','LINE','success',220.00,'016026133435BORO0499','uploads/line_598943360245301319.jpg','2026-01-31 03:16:09'),(8,1,'BANK_SLIP','BROWSER','duplicate',98.00,'016016172549CPP05550','uploads\\95d1c3877fdac7036d898b65d269ffef','2026-01-31 03:21:23'),(9,1,'BANK_SLIP','BROWSER','success',3000.00,'64039703000126013710','uploads\\0f28ea031383e7cfd1444adfe27bb297','2026-01-31 03:21:58'),(10,1,'BANK_SLIP','BROWSER','duplicate',98.00,'016016172549CPP05550','uploads\\d249344cf462b3573c9f9a4088565109','2026-01-31 03:26:06'),(11,1,'BANK_SLIP','BROWSER','warning',20000.00,'TEMP_1769829987796','uploads\\4ca1e4bd4a3c409e795120ea4d560805','2026-01-31 03:26:27'),(12,1,'BANK_SLIP','BROWSER','success',98.00,'016016172549CPP05550','uploads\\705eaab9e989aa822459b90886a35344','2026-01-31 03:27:24'),(13,1,'BANK_SLIP','MOBILE','success',98.00,'016016172549CPP05550','uploads\\7045a77a6d6010a4a97fb39c617d48ae','2026-01-31 03:31:08'),(14,1,'BANK_SLIP','MOBILE','success',218.00,'014197143034AOR05219','uploads\\85e43e4fc2dba12f332f13a15728687d','2026-01-31 04:38:16'),(15,1,'BANK_SLIP','LINE','success',225.00,'016032112333BOR00880','uploads/line_599236066662679112.jpg','2026-02-02 03:43:55'),(16,1,'RECEIPT','BROWSER','success',7.00,NULL,'uploads\\fc0fe93fdf8f5f4d78f2f14de9b31350','2026-02-02 04:00:43'),(17,1,'RECEIPT','BROWSER','success',114.00,NULL,'uploads\\c3d7b6de78e87e3d5938cc5c7524e0ba','2026-02-02 04:06:20'),(18,1,'RECEIPT','BROWSER','success',114.00,NULL,'uploads\\71650dc746d497e179cbd25734b59c45','2026-02-02 04:09:10'),(19,1,'BANK_SLIP','LINE','success',93.00,'016033113739APP07500','uploads/line_599251407631810853.jpg','2026-02-02 06:16:20');
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
-- Table structure for table `payment_slips`
--

DROP TABLE IF EXISTS `payment_slips`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `payment_slips` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
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
  UNIQUE KEY `trans_id` (`trans_id`)
) ENGINE=InnoDB AUTO_INCREMENT=52 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payment_slips`
--

LOCK TABLES `payment_slips` WRITE;
/*!40000 ALTER TABLE `payment_slips` DISABLE KEYS */;
INSERT INTO `payment_slips` VALUES (38,1,1,'016031061247143771','นาย นิรันดร์ ว','กสิกรไทย','ไม่ระบุ','ไม่ระบุ',200.00,'2026-01-31 09:17:30','success','ชำระเงินสําเร็จ\n31 ม.ค. 69 06:12 น.\nนาย นิรันดร์ ว\nธ.กสิกรไทย\nxxx-x-x5153-x\nTRUE MONEY COMPANY LIMITED\n019c112e0da57fd8918d\n26013106123685376831\nเลขที่รายการ:\n016031061247143771\nจำนวน:\n200.00 บาท\nค่าธรรมเนียม:\n0 บาท\nK+\nสแกนตรวจสอบสลิป','uploads/line_598937455504392697.jpg','BROWSER','2026-01-31 02:17:30',0,NULL),(39,1,1,'TEMP_1769826733380','นาย นิรันดร์ วังญาติ','ไทยพาณิชย์','นาย นิรันดร์ วังญาติ','ออมสิน',10000.00,'2026-01-31 09:32:13','warning','SCB\nจาก\nโอนเงินสําเร็จ\n30 ม.ค. 2569 - 09:19\nรหัสอ้างอิง: 202601301gJu3u0V8DtMolBQS\n@ นาย นิรันดร์ วังญาติ\nไปยัง\nออมสิน\nxxx-xxx368-7\nนาย นิรันดร์ วังญาติ\nx-1069\nจํานวนเงิน\nบันทึกช่วยจํา\nฝากออมสิน\nผู้รับเงินสามารถสแกนคิวอาร์โค้ดนี้เพื่อ\nตรวจสอบสถานะการโอนเงิน\n10,000.00','uploads/line_598938938057162941.jpg','LINE','2026-01-31 02:32:13',0,NULL),(40,1,1,'TEMP_1769826734955','นาย นิรันดร์ วังญาติ','ไม่ระบุ','บริษัท ลลิล พร็อพเพอร์ตี้ จำกัด(มหาชน)','ไทยพาณิชย์',5000.00,'2026-01-31 09:32:14','warning','จาก\nไปยัง\nจํานวนเงิน\nSCB\nโอนเงินสําเร็จ\n30 ม.ค. 2569 - 09:16\nรหัสอ้างอิง: 202601307QpidX9sGVts359Z1\n๗ นาย นิรันดร์ วังญาติ\nxxx-xxx368-7\n• บริษัท ลลิล พร็อพเพอร์ตี้ จำกัด(มหาชน)\nบันทึกช่วยจํา\nผ่อนดาวน์บ้านลลิล งวด 4\nผู้รับเงินสามารถสแกนคิวอาร์โค้ดนี้เพื่อ\nตรวจสอบสถานะการโอนเงิน\nx-7556\n5,000.00','uploads/line_598938938308035119.jpg','LINE','2026-01-31 02:32:14',0,NULL),(41,1,1,'016029165610BPM12831','นาย นิรันดร์ ว','กสิกรไทย','ไม่ระบุ','ไม่ระบุ',630.95,'2026-01-31 09:32:15','success','จ่ายบิลสําเร็จ\n29 ม.ค. 69 16:56 น.\nนาย นิรันดร์ ว\nธ.กสิกรไทย\nxxx-x-x5153-x\nK+\n3BB\nBROADBAND\n3BB ทริปเปิลที บรอดแบนด์\n600348017\nเลขที่รายการ:\n016029165610BPM12831\nจํานวน:\nค่าธรรมเนียม:\n630.95 บาท\n0.00 บาท\nสแกนตรวจสอบสลิป','uploads/line_598938939332231747.jpg','LINE','2026-01-31 02:32:15',0,NULL),(42,1,1,'016029181016BQR05750','นาย นิรันดร์ ว','กสิกรไทย','บจก. สุวรรณ เอนเนอร์ยี่ แอนด์ เทรด','ไม่ระบุ',1000.00,'2026-01-31 09:32:15','success','ชำระเงินสำเร็จ\n29 ม.ค. 69 18:10 น.\nนาย นิรันดร์ ว\nธ.กสิกรไทย\nxxx-x-x5153-x\nK+\npttstation\nปตท.สุวรรณ เอนเนอร์ยี่ แอนด์ เ\nบจก. สุวรรณ เอนเนอร์ยี่ แอนด์ เทรด\n202601296134668\nเลขที่รายการ:\n016029181016BQR05750\nจำนวน:\n1,000.00 บาท\nค่าธรรมเนียม:\n0.00 บาท\nสแกนตรวจสอบสลิป','uploads/line_598938938946355456.jpg','LINE','2026-01-31 02:32:15',0,NULL),(44,1,1,'016026133435BORO0499','นาย นิรันดร์ ว','กสิกรไทย','น.ส. สุกัญญา บุญพูน','ไทยพาณิชย์',220.00,'2026-01-31 10:16:09','success','โอนเงินสําเร็จ\n26 ม.ค. 69 13:34 น.\nนาย นิรันดร์ ว\nธ.กสิกรไทย\nXXX-X-X5153-x\nK+\nน.ส. สุกัญญา บุญพูน\nธ.ไทยพาณิชย์\nxxx-x-x0402-x\n016026133435BORO0499\nเลขที่รายการ:\nจํานวน:\nค่าธรรมเนียม:\n220.00 บาท\n0.00 บาท\nสแกนตรวจสอบสลิป','uploads/line_598943360245301319.jpg','LINE','2026-01-31 03:16:09',0,NULL),(45,1,1,'64039703000126013710','นาย นิรันดร์ ว','กสิกรไทย','ไม่ระบุ','ไม่ระบุ',3000.00,'2026-01-31 10:21:58','success','จ่ายบิลสําเร็จ\n15 ม.ค. 69 14:20 น.\nนาย นิรันดร์ ว\nธ.กสิกรไทย\nxxx-x-x5153-x\nK+\nทีคิวเอ็ม อินชัวร์รันส์\n64039703000126013710\n300031918048\n016015142000CPM17288\nเลขที่รายการ:\nจำนวน:\nค่าธรรมเนียม:\n3,000.00 บาท\n0.00 บาท\nสแกนตรวจสอบสลิป','uploads\\0f28ea031383e7cfd1444adfe27bb297','BROWSER','2026-01-31 03:21:58',0,NULL),(46,1,1,'TEMP_1769829987796','นาย นิรันดร์ วังญาติ','ไม่ระบุ','นาย นิรันดร์ วังญาติ','ไทยพาณิชย์',20000.00,'2026-01-31 10:26:27','warning','จาก\nไปยัง\nจํานวนเงิน\nSCB\nโอนเงินสําเร็จ\n25 ม.ค. 2569 - 15:35\nรหัสอ้างอิง: 202601259uJDo24cZ2dQtlZv9\n๗ นาย นิรันดร์ วังญาติ\nxxx-xxx368-7\n2 นาย นิรันดร์ วังญาติ\nผู้รับเงินสามารถสแกนคิวอาร์โค้ดนี้เพื่อ\nตรวจสอบสถานะการโอนเงิน\nx-1534\n20,000.00','uploads\\4ca1e4bd4a3c409e795120ea4d560805','BROWSER','2026-01-31 03:26:27',0,NULL),(48,1,1,'016016172549CPP05550','นาย นิรันดร์ ว','กสิกรไทย','นาง ลัดดาวัลย์ เถื่อนเก่า','ไม่ระบุ',98.00,'2026-01-31 10:31:08','success','โอนเงินสําเร็จ\n16 ม.ค. 69 17:25 น.\nนาย นิรันดร์ ว\nธ.กสิกรไทย\nxxx-x-x5153-x\nPrompt\nPay\nนาง ลัดดาวัลย์ เถื่อนเก่า\nรหัสพร้อมเพย์\nXXX-xxx-6378\nK+\nเลขที่รายการ:\n0229\n016016172549CPP05550\nจํานวน:\n98.00 บาท\nค่าธรรมเนียม:\n0.00 บาท\nสแกนตรวจสอบสลิป','uploads\\7045a77a6d6010a4a97fb39c617d48ae','MOBILE','2026-01-31 03:31:08',0,NULL),(49,1,1,'014197143034AOR05219','นาย นิรันดร์ ว','กสิกรไทย','นาย พอยสัน ฝึกใจดี','ไทยพาณิชย์',218.00,'2026-01-31 11:38:16','success','โอนเงินสําเร็จ\n15 ก.ค. 67 14:30 น.\nนาย นิรันดร์ ว\nธ.กสิกรไทย\nxxx-x-x5153-x\nนาย พอยสัน ฝึกใจดี\nธ.ไทยพาณิชย์\nXxx-x-x6384-x\nเลขที่รายการ:\n014197143034AOR05219\nจํานวน:\n218.00 บาท\nค่าธรรมเนียม:\nK+\n0.00 บาท\nสแกนตรวจสอบสลิป\nบันทึกช่วยจำ: ค่าลิสแบรนด์ช่วยน้อง','uploads\\85e43e4fc2dba12f332f13a15728687d','MOBILE','2026-01-31 04:38:16',0,NULL),(50,1,1,'016032112333BOR00880','นาย นิรันดร์ ว','กสิกรไทย','นาย ประดิษฐ์ คงสมมาต','ออมสิน',225.00,'2026-02-02 10:43:55','success','โอนเงินสําเร็จ\n1 ก.พ. 69 11:23 น.\nนาย นิรันดร์ ว\nธ.กสิกรไทย\nXXX-X-X5153-x\nBUNAIS\nออมสิน\nนาย ประดิษฐ์ คงสมมาต\nธ.ออมสิน\nxxx-x-x0617-xxx\nเลขที่รายการ:\n020\nจํานวน:\n016032112333BOR00880\nค่าธรรมเนียม:\n225.00 บาท\nK+\n0.00 บาท\nสแกนตรวจสอบสลิป','uploads/line_599236066662679112.jpg','LINE','2026-02-02 03:43:55',0,NULL),(51,1,1,'016033113739APP07500','นาย นิรันดร์ ว','กสิกรไทย','นาย สุเม','ไม่ระบุ',93.00,'2026-02-02 13:16:20','success','โอนเงินสําเร็จ\n2 ก.พ. 69 11:37 น.\nนาย นิรันดร์ ว\nธ.กสิกรไทย\nXXX-X-X5153-x\nK+\nPrompt\nPay\nนาย สุเมธ ลุยพิมพ์\nรหัสพร้อมเพย์\nXXX-xxx-7460\nเลขที่รายการ:\n429\n016033113739APP07500\nจํานวน:\n93.00 บาท\nค่าธรรมเนียม:\n0.00 บาท\nสแกนตรวจสอบสลิป','uploads/line_599251407631810853.jpg','LINE','2026-02-02 06:16:20',20,'[\"รูปแบบเลขที่รายการไม่ตรงกับธนาคารกสิกรไทย\"]');
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
  `company_id` int(11) DEFAULT 1,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','user') DEFAULT 'user',
  `permissions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`permissions`)),
  `line_user_id` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `line_user_id` (`line_user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,1,'admin','$2b$10$.uzBly15xEk9pKsiHBtIEeJ5jverqonUXVpMJMmEl4mp7fKCp1Ch2','admin','{\"dashboard\":true,\"bills\":true,\"slips\":true,\"users\":true}','Uc3ed1bec7698030988e52a8a130eadbb','2026-01-30 06:17:18');
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

-- Dump completed on 2026-02-02  6:36:42
