-- ตารางรายการ Module ในระบบ
CREATE TABLE IF NOT EXISTS system_modules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    module_code VARCHAR(50) UNIQUE NOT NULL COMMENT 'รหัสโมดูล',
    module_name VARCHAR(100) NOT NULL COMMENT 'ชื่อโมดูล',
    description TEXT COMMENT 'รายละเอียด',
    icon VARCHAR(50) DEFAULT 'fas fa-cube' COMMENT 'ไอคอนประจำโมดูล',
    is_active BOOLEAN DEFAULT TRUE COMMENT 'สถานะการทำงานระดับระบบ',
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ข้อมูล Module เริ่มต้น
INSERT IGNORE INTO system_modules (module_code, module_name, description, icon, sort_order) VALUES
('dashboard', 'แผงควบคุม (Dashboard)', 'ระบบแสดงผลสรุปและสถิติภาพรวม', 'fas fa-th-large', 1),
('bills', 'ใบเสร็จและรายจ่าย (OCR)', 'ระบบสแกนใบเสร็จและบันทึกรายจ่ายอัตโนมัติ', 'fas fa-file-invoice-dollar', 2),
('slips', 'สลิปโอนเงิน (Slip Verification)', 'ระบบตรวจสอบความถูกต้องของสลิปโอนเงิน', 'fas fa-exchange-alt', 3),
('inventory', 'ระบบคลังสินค้า (Inventory)', 'ระบบจัดการสต็อกสินค้าและยอดคงเหลือ', 'fas fa-warehouse', 4),
('fulfillment', 'ระบบจัดการสินค้า (Fulfillment)', 'ระบบบริหารจัดการสินค้าและการแพ็กของ', 'fas fa-box', 5),
('multichannel', 'เชื่อมต่อร้านค้า (Marketplace)', 'ระบบซิงค์ข้อมูลจาก Shopee, Lazada, TikTok', 'fas fa-plug', 6),
('reports', 'รายงาน (Reports)', 'ระบบออกรายงานและวิเคราะห์ข้อมูล', 'fas fa-chart-bar', 7),
('api_access', 'การเชื่อมต่อ API', 'สิทธิ์การเข้าถึงข้อมูลผ่าน API', 'fas fa-code', 8),
('ai_audit', 'AI Audit', 'ระบบตรวจสอบความถูกต้องด้วย AI ขั้นสูง', 'fas fa-robot', 9);
