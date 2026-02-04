# 🚀 ขั้นตอนการติดตั้งระบบ Multi-tenant SaaS

## ✅ สิ่งที่ต้องทำตอนนี้

### 1. สร้างตารางในฐานข้อมูล (สำคัญมาก!)

เปิด MySQL และรันคำสั่งตามลำดับ:

```sql
-- 1. สร้างตาราง tenants
SOURCE d:/NodeJs_Project/billora/database/migrations/001_create_tenants_table.sql;

-- 2. สร้างตาราง users (multi-tenant version)
SOURCE d:/NodeJs_Project/billora/database/migrations/002_create_users_table.sql;

-- 3. สร้างตาราง subscription
SOURCE d:/NodeJs_Project/billora/database/migrations/004_create_tenant_subscriptions_table.sql;
```

**หมายเหตุ**: ไฟล์ `003_add_tenant_to_existing_tables.sql` ต้องแก้ไขข้อมูลเดิมก่อน (ดูขั้นตอนที่ 3)

### 2. ตรวจสอบว่า Dependencies ครบหรือไม่

```bash
# ตรวจสอบ package.json
# ✅ bcryptjs - มีแล้ว
# ✅ jsonwebtoken - มีแล้ว
# ✅ mysql2 - มีแล้ว
# ✅ express-session - มีแล้ว

# ไม่ต้องติดตั้งอะไรเพิ่ม!
```

### 3. Migration ข้อมูลเดิม (ถ้ามี)

ถ้ามีข้อมูลในตาราง `bills`, `payment_slips`, `users` อยู่แล้ว:

```sql
-- 3.1 สร้าง tenant เริ่มต้น
INSERT INTO tenants (
    tenant_code, 
    company_name, 
    subscription_plan, 
    subscription_status,
    subscription_start_date,
    max_users,
    max_storage_mb,
    max_transactions_per_month
) VALUES (
    'DEFAULT', 
    'Default Company', 
    'enterprise',  -- ให้ unlimited
    'active',
    NOW(),
    100,
    51200,
    999999
);

-- 3.2 เก็บ tenant_id
SET @default_tenant_id = LAST_INSERT_ID();

-- 3.3 เพิ่มคอลัมน์ tenant_id ให้ตารางเดิม
ALTER TABLE bills 
ADD COLUMN tenant_id INT NOT NULL DEFAULT @default_tenant_id AFTER id,
ADD INDEX idx_tenant_id (tenant_id);

ALTER TABLE payment_slips 
ADD COLUMN tenant_id INT NOT NULL DEFAULT @default_tenant_id AFTER id,
ADD INDEX idx_tenant_id (tenant_id);

-- 3.4 ถ้ามีตาราง users เดิม ให้เปลี่ยนชื่อก่อน
RENAME TABLE users TO users_old;

-- 3.5 สร้างตาราง users ใหม่ (รัน migration 002)
-- แล้วย้ายข้อมูลจาก users_old มา (ถ้าต้องการ)

-- 3.6 เพิ่ม Foreign Keys
ALTER TABLE bills 
ADD CONSTRAINT fk_bills_tenant 
FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

ALTER TABLE payment_slips 
ADD CONSTRAINT fk_payment_slips_tenant 
FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
```

### 4. ทดสอบระบบ

#### 4.1 ลงทะเบียนองค์กรใหม่

ใช้ Postman หรือ curl:

```bash
curl -X POST http://localhost:5000/api/tenants/register \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "บริษัท ทดสอบ จำกัด",
    "owner_email": "owner@test.com",
    "owner_password": "password123",
    "owner_first_name": "สมชาย",
    "owner_last_name": "ทดสอบ"
  }'
```

ควรได้ response:
```json
{
  "success": true,
  "message": "ลงทะเบียนสำเร็จ",
  "data": {
    "tenant_id": 1,
    "tenant_code": "TEST123456",
    "user_id": 1
  }
}
```

#### 4.2 Login

```bash
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "owner@test.com",
    "password": "password123"
  }'
```

ควรได้ token กลับมา

#### 4.3 ดูข้อมูล Tenant

```bash
curl -X GET http://localhost:5000/api/tenants/current \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 5. แก้ไข Controllers เดิม

ต้องแก้ไขทุก Controller ที่เกี่ยวข้องกับข้อมูล ให้เพิ่ม `tenant_id`:

#### ตัวอย่าง: BillController

**ก่อน:**
```javascript
async getAll(req, res) {
  const [bills] = await pool.query('SELECT * FROM bills');
  res.json({ data: bills });
}
```

**หลัง:**
```javascript
async getAll(req, res) {
  const tenantId = req.tenantId; // จาก loadTenant middleware
  const [bills] = await pool.query(
    'SELECT * FROM bills WHERE tenant_id = ?',
    [tenantId]
  );
  res.json({ data: bills });
}
```

#### Controllers ที่ต้องแก้ไข:
- ✅ `BillController.js` - เพิ่ม tenant_id ทุก query
- ✅ `SlipController.js` - เพิ่ม tenant_id ทุก query
- ✅ `DashboardController.js` - เพิ่ม tenant_id ทุก query
- ✅ `ChannelController.js` - เพิ่ม tenant_id ทุก query
- ✅ Controllers อื่นๆ ที่เกี่ยวข้อง

### 6. อัพเดท Routes

เพิ่ม middleware `loadTenant` ให้กับ routes ที่ต้องการ:

**ก่อน:**
```javascript
router.get('/bills', isAuthenticated, BillController.getAll);
```

**หลัง:**
```javascript
const { loadTenant } = require('../middleware/tenant');

router.get('/bills', isAuthenticated, loadTenant, BillController.getAll);
```

### 7. ทดสอบให้แน่ใจ

- [ ] ลงทะเบียนองค์กรใหม่ได้
- [ ] Login ได้
- [ ] สร้างผู้ใช้ใหม่ได้
- [ ] ข้อมูลแต่ละองค์กรแยกกัน
- [ ] ไม่สามารถเข้าถึงข้อมูลข้ามองค์กร
- [ ] Quota ทำงานถูกต้อง
- [ ] Account locking ทำงาน

## 📝 Checklist

### Database
- [ ] รัน migration 001 (tenants)
- [ ] รัน migration 002 (users)
- [ ] รัน migration 004 (subscriptions)
- [ ] Migration ข้อมูลเดิม (ถ้ามี)

### Code
- [ ] แก้ไข BillController
- [ ] แก้ไข SlipController
- [ ] แก้ไข DashboardController
- [ ] แก้ไข ChannelController
- [ ] เพิ่ม loadTenant middleware ใน routes

### Testing
- [ ] ทดสอบ Registration
- [ ] ทดสอบ Login
- [ ] ทดสอบ User Management
- [ ] ทดสอบ Tenant Isolation
- [ ] ทดสอบ Quota Limits

### UI (ถ้าต้องการ)
- [ ] สร้างหน้า Registration
- [ ] สร้างหน้า Tenant Settings
- [ ] สร้างหน้า User Management
- [ ] สร้างหน้า Subscription

## 🎯 ขั้นตอนถัดไป (Optional)

1. **Payment Gateway** - ระบบชำระเงิน
2. **Email Notification** - แจ้งเตือนทาง email
3. **Audit Log** - บันทึกการทำงาน
4. **Super Admin Panel** - จัดการทุก tenant
5. **API Documentation** - Swagger/OpenAPI
6. **Unit Tests** - ทดสอบอัตโนมัติ

## 📚 เอกสารอ้างอิง

- `README_MULTI_TENANT.md` - สรุประบบ
- `MULTI_TENANT_GUIDE.md` - คู่มือฉบับสมบูรณ์
- `API_TESTING.http` - ตัวอย่างการทดสอบ API
- `src/controllers/ExampleMultiTenantController.js` - ตัวอย่าง code

## ❓ คำถามที่พบบ่อย

**Q: ต้องแก้ไข code เดิมทั้งหมดหรือไม่?**  
A: ใช่ ต้องเพิ่ม `tenant_id` ให้ทุก query ที่เกี่ยวข้องกับข้อมูล

**Q: ข้อมูลเดิมจะหายไหม?**  
A: ไม่หาย ถ้าทำตามขั้นตอน Migration ข้อมูลเดิม

**Q: ต้องสร้าง UI ใหม่หรือไม่?**  
A: ไม่จำเป็น API ทำงานได้เลย แต่ควรมี UI สำหรับจัดการ

**Q: รองรับ Mobile App ไหม?**  
A: รองรับ ผ่าน JWT authentication

**Q: Quota ทำงานอัตโนมัติไหม?**  
A: ใช่ ถ้าใส่ middleware `checkTenantLimits`

## 🆘 ถ้าเจอปัญหา

1. ตรวจสอบ error log ใน console
2. ตรวจสอบว่ารัน migrations ครบหรือไม่
3. ตรวจสอบว่า middleware ครบหรือไม่
4. ตรวจสอบว่า tenant_id มีในทุก query หรือไม่
5. ดูตัวอย่างใน `ExampleMultiTenantController.js`

---

**หมายเหตุ**: อย่าลืม restart server หลังแก้ไข code!

```bash
# หยุด server (Ctrl+C)
# แล้วรันใหม่
nodemon .\server.js
```
