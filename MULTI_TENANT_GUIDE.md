# ระบบ Multi-tenant SaaS สำหรับ Billora

## 📋 ภาพรวม

ระบบนี้เป็นการพัฒนา Billora ให้รองรับ **Multi-tenant SaaS** ที่สามารถให้บริการหลายองค์กร/บริษัทพร้อมกัน โดยมีการแยกข้อมูลอย่างชัดเจน ป้องกันข้อมูลปะปนกัน

## 🎯 คุณสมบัติหลัก

### 1. Tenant Isolation (แยกข้อมูลองค์กร)
- แต่ละองค์กรมี `tenant_id` เป็นของตัวเอง
- ข้อมูลทั้งหมดถูก filter ด้วย `tenant_id` อัตโนมัติ
- ไม่สามารถเข้าถึงข้อมูลข้ามองค์กรได้

### 2. User Management (จัดการผู้ใช้)
- แต่ละองค์กรมีผู้ใช้งานของตัวเอง
- รองรับ Role-Based Access Control (RBAC)
  - **Owner**: เจ้าขององค์กร มีสิทธิ์สูงสุด
  - **Admin**: ผู้ดูแลระบบ
  - **Manager**: ผู้จัดการ
  - **Accountant**: นักบัญชี
  - **User**: ผู้ใช้ทั่วไป

### 3. Subscription Management (จัดการแพ็กเกจ)
- **Free**: ทดลองใช้งาน (2 users, 512MB, 100 transactions/month)
- **Basic**: ธุรกิจขนาดเล็ก (5 users, 2GB, 1,000 transactions/month) - 499฿/เดือน
- **Professional**: ธุรกิจขนาดกลาง (20 users, 10GB, 5,000 transactions/month) - 1,499฿/เดือน
- **Enterprise**: องค์กรขนาดใหญ่ (100 users, 50GB, unlimited) - 4,999฿/เดือน

### 4. Quota & Limits (จำกัดการใช้งาน)
- จำนวนผู้ใช้สูงสุด
- พื้นที่จัดเก็บข้อมูล
- จำนวน transactions ต่อเดือน
- ตรวจสอบอัตโนมัติก่อนทำงาน

### 5. Security Features
- Account Locking (ล็อกบัญชีถ้า login ผิด 5 ครั้ง)
- Password Hashing (bcrypt)
- Session Management
- JWT Support (สำหรับ Mobile App)
- Soft Delete (ลบข้อมูลแบบ soft)

## 📁 โครงสร้างไฟล์

```
billora/
├── database/
│   └── migrations/
│       ├── 001_create_tenants_table.sql
│       ├── 002_create_users_table.sql
│       ├── 003_add_tenant_to_existing_tables.sql
│       └── 004_create_tenant_subscriptions_table.sql
├── src/
│   ├── controllers/
│   │   ├── TenantController.js
│   │   └── UserManagementController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── tenant.js (ใหม่)
│   ├── models/
│   │   ├── TenantModel.js
│   │   └── UserModel.js
│   └── routes/
│       ├── tenantRoutes.js
│       ├── userManagementRoutes.js
│       └── apiRoutes.js (อัพเดท)
```

## 🚀 การติดตั้ง

### 1. ติดตั้ง Dependencies

```bash
npm install bcrypt
```

### 2. สร้างตารางในฐานข้อมูล

รัน SQL migrations ตามลำดับ:

```bash
# 1. สร้างตาราง tenants
mysql -u root -p bill_ocr < database/migrations/001_create_tenants_table.sql

# 2. สร้างตาราง users (multi-tenant)
mysql -u root -p bill_ocr < database/migrations/002_create_users_table.sql

# 3. เพิ่ม tenant_id ให้ตารางเดิม
mysql -u root -p bill_ocr < database/migrations/003_add_tenant_to_existing_tables.sql

# 4. สร้างตาราง subscription
mysql -u root -p bill_ocr < database/migrations/004_create_tenant_subscriptions_table.sql
```

**หมายเหตุ**: ก่อนรัน migration 003 ต้องแก้ไขข้อมูลเดิมให้มี tenant_id ก่อน

### 3. อัพเดท Environment Variables

เพิ่มใน `.env`:

```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=bill_ocr

# JWT
JWT_SECRET=billora-jwt-secret-key-2026
```

## 📖 API Documentation

### Tenant APIs

#### 1. ลงทะเบียนองค์กรใหม่
```http
POST /api/tenants/register
Content-Type: application/json

{
  "company_name": "บริษัท ทดสอบ จำกัด",
  "company_name_en": "Test Company Ltd.",
  "tax_id": "0123456789012",
  "address": "123 ถนนทดสอบ",
  "phone": "021234567",
  "email": "info@test.com",
  "owner_email": "owner@test.com",
  "owner_password": "password123",
  "owner_first_name": "สมชาย",
  "owner_last_name": "ทดสอบ",
  "owner_phone": "0812345678"
}
```

#### 2. ดูข้อมูลองค์กรปัจจุบัน
```http
GET /api/tenants/current
Authorization: Bearer {token}
```

#### 3. อัพเดทข้อมูลองค์กร
```http
PUT /api/tenants/current
Authorization: Bearer {token}
Content-Type: application/json

{
  "company_name": "บริษัท ทดสอบใหม่ จำกัด",
  "phone": "021234568"
}
```

#### 4. ดูข้อมูล Subscription
```http
GET /api/tenants/subscription
Authorization: Bearer {token}
```

#### 5. ตรวจสอบ Quota
```http
GET /api/tenants/quota/:type
Authorization: Bearer {token}

# type: users, transactions, storage
```

### User Management APIs

#### 1. ดูรายการผู้ใช้ทั้งหมด
```http
GET /api/users
Authorization: Bearer {token}

# Query Parameters:
# - role: owner, admin, manager, accountant, user
# - is_active: true, false
# - search: ค้นหาจาก username, email, name
# - limit: จำนวนสูงสุด
```

#### 2. ดูข้อมูลผู้ใช้ตาม ID
```http
GET /api/users/:id
Authorization: Bearer {token}
```

#### 3. สร้างผู้ใช้ใหม่
```http
POST /api/users
Authorization: Bearer {token}
Content-Type: application/json

{
  "email": "user@test.com",
  "password": "password123",
  "first_name": "สมหญิง",
  "last_name": "ทดสอบ",
  "phone": "0823456789",
  "role": "user",
  "permissions": {
    "dashboard": true,
    "bills": true,
    "reports": false
  }
}
```

#### 4. อัพเดทข้อมูลผู้ใช้
```http
PUT /api/users/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "first_name": "สมหญิง",
  "last_name": "ทดสอบใหม่",
  "phone": "0823456780"
}
```

#### 5. เปลี่ยนรหัสผ่าน
```http
POST /api/users/:id/change-password
Authorization: Bearer {token}
Content-Type: application/json

{
  "old_password": "password123",
  "new_password": "newpassword456"
}
```

#### 6. เปลี่ยน Role
```http
PUT /api/users/:id/role
Authorization: Bearer {token}
Content-Type: application/json

{
  "role": "admin"
}
```

#### 7. ระงับ/เปิดใช้งานผู้ใช้
```http
PUT /api/users/:id/toggle-active
Authorization: Bearer {token}
Content-Type: application/json

{
  "is_active": false
}
```

#### 8. ลบผู้ใช้
```http
DELETE /api/users/:id
Authorization: Bearer {token}
```

## 🔒 Middleware

### 1. loadTenant
ใช้กับทุก route ที่ต้องการ tenant context
```javascript
router.use(loadTenant);
```

**ทำงาน:**
- โหลดข้อมูล tenant จาก `user.tenant_id`
- ตรวจสอบสถานะ tenant (active, suspended, expired)
- ตรวจสอบ subscription
- เก็บข้อมูล tenant ใน `req.tenant` และ `req.tenantId`

### 2. checkTenantLimits
ตรวจสอบ quota ก่อนทำงาน
```javascript
router.post('/users', checkTenantLimits('users'), UserController.create);
```

**ประเภท:**
- `users`: ตรวจสอบจำนวนผู้ใช้
- `transactions`: ตรวจสอบจำนวน transactions
- `storage`: ตรวจสอบพื้นที่จัดเก็บ

### 3. checkFeatureAccess
ตรวจสอบว่า tenant มีสิทธิ์ใช้ feature นี้หรือไม่
```javascript
router.get('/reports', checkFeatureAccess('reports'), ReportController.index);
```

## 💡 การใช้งาน Models

### TenantModel

```javascript
const TenantModel = require('../models/TenantModel');

// สร้าง tenant ใหม่
const tenantId = await TenantModel.create({
  tenant_code: 'TEST123',
  company_name: 'บริษัท ทดสอบ จำกัด',
  subscription_plan: 'free'
});

// ค้นหา tenant
const tenant = await TenantModel.findById(tenantId);
const tenant = await TenantModel.findByCode('TEST123');

// อัพเดท tenant
await TenantModel.update(tenantId, {
  company_name: 'บริษัท ทดสอบใหม่ จำกัด'
});

// ตรวจสอบ quota
const quota = await TenantModel.checkQuota(tenantId, 'users');
// { allowed: true, current: 3, limit: 5 }

// สร้าง tenant_code อัตโนมัติ
const code = await TenantModel.generateTenantCode('บริษัท ทดสอบ');
```

### UserModel

```javascript
const UserModel = require('../models/UserModel');

// สร้างผู้ใช้ใหม่
const userId = await UserModel.create(tenantId, {
  email: 'user@test.com',
  password: 'password123',
  role: 'user'
});

// ค้นหาผู้ใช้
const user = await UserModel.findById(tenantId, userId);
const user = await UserModel.findByEmail(tenantId, 'user@test.com');

// Login
const result = await UserModel.login(tenantId, 'user@test.com', 'password123');
// { success: true, user: {...} }

// เปลี่ยนรหัสผ่าน
await UserModel.changePassword(tenantId, userId, 'oldpass', 'newpass');

// นับจำนวนผู้ใช้
const count = await UserModel.countByTenant(tenantId);
```

## 🛡️ Security Best Practices

### 1. ป้องกันข้อมูลปะปนกัน
```javascript
// ❌ ไม่ดี - ไม่มี tenant_id
const [bills] = await pool.query('SELECT * FROM bills');

// ✅ ดี - มี tenant_id
const [bills] = await pool.query(
  'SELECT * FROM bills WHERE tenant_id = ?',
  [req.tenantId]
);
```

### 2. ใช้ Middleware ทุกครั้ง
```javascript
// ❌ ไม่ดี
router.get('/bills', BillController.getAll);

// ✅ ดี
router.get('/bills', isAuthenticated, loadTenant, BillController.getAll);
```

### 3. ตรวจสอบ Quota
```javascript
// ✅ ดี
router.post('/bills', 
  isAuthenticated, 
  loadTenant, 
  checkTenantLimits('transactions'),
  BillController.create
);
```

## 📝 ตัวอย่างการแก้ไข Controller เดิม

### ก่อน (ไม่รองรับ Multi-tenant)
```javascript
async getAll(req, res) {
  const [bills] = await pool.query('SELECT * FROM bills');
  res.json({ data: bills });
}
```

### หลัง (รองรับ Multi-tenant)
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

## 🔄 Migration ข้อมูลเดิม

ถ้ามีข้อมูลเดิมอยู่แล้ว ต้อง migrate ดังนี้:

```sql
-- 1. สร้าง tenant เริ่มต้น
INSERT INTO tenants (tenant_code, company_name, subscription_plan, subscription_status)
VALUES ('DEFAULT', 'Default Company', 'free', 'active');

-- 2. เพิ่ม tenant_id ให้ข้อมูลเดิม
SET @default_tenant_id = LAST_INSERT_ID();

UPDATE bills SET tenant_id = @default_tenant_id WHERE tenant_id IS NULL;
UPDATE payment_slips SET tenant_id = @default_tenant_id WHERE tenant_id IS NULL;
UPDATE users SET tenant_id = @default_tenant_id WHERE tenant_id IS NULL;
```

## 🧪 การทดสอบ

### 1. ทดสอบ Registration
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

### 2. ทดสอบ Login
```bash
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "owner@test.com",
    "password": "password123"
  }'
```

### 3. ทดสอบ Tenant Info
```bash
curl -X GET http://localhost:5000/api/tenants/current \
  -H "Authorization: Bearer {token}"
```

## 📊 Database Schema

### tenants
- `id`: Primary Key
- `tenant_code`: รหัสองค์กรที่ไม่ซ้ำ
- `company_name`: ชื่อบริษัท
- `subscription_plan`: แพ็กเกจ (free, basic, professional, enterprise)
- `subscription_status`: สถานะ (active, suspended, cancelled, expired)
- `max_users`: จำนวนผู้ใช้สูงสุด
- `max_storage_mb`: พื้นที่จัดเก็บสูงสุด
- `max_transactions_per_month`: จำนวน transaction สูงสุดต่อเดือน

### users
- `id`: Primary Key
- `tenant_id`: Foreign Key → tenants(id)
- `email`: อีเมล (unique per tenant)
- `password_hash`: รหัสผ่านที่เข้ารหัส
- `role`: บทบาท (owner, admin, manager, accountant, user)
- `permissions`: สิทธิ์การเข้าถึง (JSON)
- `is_active`: สถานะการใช้งาน
- `failed_login_attempts`: จำนวนครั้งที่ login ผิด
- `locked_until`: ล็อกบัญชีจนถึง

## 🎓 Best Practices

1. **ใช้ Middleware เสมอ**: ทุก route ที่เกี่ยวข้องกับข้อมูล tenant ต้องมี `loadTenant`
2. **Filter ด้วย tenant_id**: ทุก query ต้องมี `WHERE tenant_id = ?`
3. **ตรวจสอบ Quota**: ก่อนสร้างข้อมูลใหม่ ต้องตรวจสอบ quota
4. **Soft Delete**: ใช้ `deleted_at` แทนการลบข้อมูลจริง
5. **Security**: ตรวจสอบสิทธิ์ก่อนทำงานทุกครั้ง

## 🚧 TODO

- [ ] สร้างหน้า UI สำหรับจัดการ Tenant
- [ ] สร้างหน้า UI สำหรับจัดการ Users
- [ ] สร้างระบบชำระเงิน (Payment Gateway)
- [ ] สร้างระบบ Email Notification
- [ ] สร้างระบบ Audit Log
- [ ] เพิ่ม Super Admin Panel
- [ ] สร้าง API Documentation (Swagger)
- [ ] เพิ่ม Unit Tests

## 📞 Support

หากมีปัญหาหรือข้อสงสัย กรุณาติดต่อทีมพัฒนา
