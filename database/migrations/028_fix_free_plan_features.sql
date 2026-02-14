-- Migration 028: Fix Free Plan Features
-- วัตถุประสงค์: ปรับปรุงข้อมูลฟีเจอร์สำหรับแพ็กเกจฟรีให้ถูกต้องเพื่อซ่อนเมนูที่ไม่ได้รับอนุญาต

-- 1. อัปเดตข้อมูลต้นแบบใน subscription_plans
UPDATE subscription_plans 
SET features = JSON_OBJECT(
    'ocr', true,
    'dashboard', true,
    'bills', true,
    'slips', true,
    'reports', false,
    'inventory', false,
    'fulfillment', false,
    'multichannel', false,
    'ai_audit', false,
    'api_access', false,
    'support', 'email'
)
WHERE plan_code = 'free';

-- 2. อัปเดตข้อมูลให้ลูกค้ารายเดิมที่ใช้แพ็กเกจฟรี
UPDATE tenants 
SET features = JSON_OBJECT(
    'ocr', true,
    'dashboard', true,
    'bills', true,
    'slips', true,
    'reports', false,
    'inventory', false,
    'fulfillment', false,
    'multichannel', false,
    'ai_audit', false,
    'api_access', false,
    'support', 'email'
)
WHERE subscription_plan = 'free';
