# 🎯 ระบบ Multi-tenant SaaS สำหรับ Billora

## ✅ สิ่งที่สร้างเสร็จแล้ว

### 📁 Database Migrations
- ✅ `001_create_tenants_table.sql` - ตารางองค์กร/บริษัท
- ✅ `002_create_users_table.sql` - ตารางผู้ใช้ (Multi-tenant)
- ✅ `003_add_tenant_to_existing_tables.sql` - เพิ่ม tenant_id ให้ตารางเดิม
- ✅ `004_create_tenant_subscriptions_table.sql` - ตารางแพ็กเกจและการชำระเงิน

### 🔧 Middleware
- ✅ `src/middleware/tenant.js` - Tenant middleware
  - `loadTenant()` - โหลดและตรวจสอบ tenant
  - `checkTenantLimits()` - ตรวจสอบ quota
  - `checkFeatureAccess()` - ตรวจสอบ feature access
  - `addTenantScope()` - Helper สำหรับ query scoping

### 📦 Models
- ✅ `src/models/TenantModel.js` - จัดการข้อมูล Tenant
- ✅ `src/models/UserModel.js` - จัดการข้อมูล User (Multi-tenant)

### 🎮 Controllers
- ✅ `src/controllers/TenantController.js` - จัดการ Tenant
- ✅ `src/controllers/UserManagementController.js` - จัดการ User
- ✅ `src/controllers/ExampleMultiTenantController.js` - ตัวอย่างการใช้งาน

### 🛣️ Routes
- ✅ `src/routes/tenantRoutes.js` - Tenant API routes
- ✅ `src/routes/userManagementRoutes.js` - User Management API routes
- ✅ `src/routes/apiRoutes.js` - อัพเดทให้รองรับ Multi-tenant

### 📚 Documentation
- ✅ `MULTI_TENANT_GUIDE.md` - คู่มือการใช้งานฉบับสมบูรณ์
- ✅ `README_MULTI_TENANT.md` - สรุปสั้นๆ (ไฟล์นี้)

## 🚀 วิธีการติดตั้ง

### 1. ติดตั้ง Dependencies
```bash
npm install bcrypt
```

### 2. สร้างตารางในฐานข้อมูล
```bash
# Windows PowerShell
Get-Content database/migrations/001_create_tenants_table.sql | mysql -u root -p bill_ocr
Get-Content database/migrations/002_create_users_table.sql | mysql -u root -p bill_ocr
Get-Content database/migrations/004_create_tenant_subscriptions_table.sql | mysql -u root -p bill_ocr

# หมายเหตุ: ไฟล์ 003 ต้องแก้ไขข้อมูลเดิมก่อนรัน
```

### 3. อัพเดท .env
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=bill_ocr
JWT_SECRET=billora-jwt-secret-key-2026
```

## 📖 API Endpoints

### Tenant APIs
```
POST   /api/tenants/register          - ลงทะเบียนองค์กรใหม่
GET    /api/tenants/current           - ดูข้อมูลองค์กรปัจจุบัน
PUT    /api/tenants/current           - อัพเดทข้อมูลองค์กร
GET    /api/tenants/subscription      - ดูข้อมูล subscription
GET    /api/tenants/quota/:type       - ตรวจสอบ quota
```

### User Management APIs
```
GET    /api/users                     - ดูรายการผู้ใช้ทั้งหมด
GET    /api/users/:id                 - ดูข้อมูลผู้ใช้
POST   /api/users                     - สร้างผู้ใช้ใหม่
PUT    /api/users/:id                 - อัพเดทข้อมูลผู้ใช้
DELETE /api/users/:id                 - ลบผู้ใช้
POST   /api/users/:id/change-password - เปลี่ยนรหัสผ่าน
PUT    /api/users/:id/role            - เปลี่ยน role
PUT    /api/users/:id/toggle-active   - ระงับ/เปิดใช้งาน
```

## 🎯 คุณสมบัติหลัก

### 1. Tenant Isolation
- ข้อมูลแต่ละองค์กรแยกกันอย่างสมบูรณ์
- ไม่สามารถเข้าถึงข้อมูลข้ามองค์กรได้

### 2. User Management
- แต่ละองค์กรมีผู้ใช้ของตัวเอง
- รองรับ 5 roles: owner, admin, manager, accountant, user

### 3. Subscription Plans
- **Free**: 2 users, 512MB, 100 trans/month
- **Basic**: 5 users, 2GB, 1K trans/month - 499฿/เดือน
- **Professional**: 20 users, 10GB, 5K trans/month - 1,499฿/เดือน
- **Enterprise**: 100 users, 50GB, unlimited - 4,999฿/เดือน

### 4. Quota Management
- จำกัดจำนวนผู้ใช้
- จำกัดพื้นที่จัดเก็บ
- จำกัดจำนวน transactions

### 5. Security
- Account locking (5 ครั้ง)
- Password hashing (bcrypt)
- JWT support
- Soft delete

## 💡 ตัวอย่างการใช้งาน

### สร้าง Tenant ใหม่
```javascript
const result = await TenantModel.create({
  tenant_code: 'TEST123',
  company_name: 'บริษัท ทดสอบ จำกัด',
  subscription_plan: 'free'
});
```

### สร้าง User ใหม่
```javascript
const userId = await UserModel.create(tenantId, {
  email: 'user@test.com',
  password: 'password123',
  role: 'user'
});
```

### ดึงข้อมูลพร้อม Tenant Scope
```javascript
// ❌ ไม่ดี
const [bills] = await pool.query('SELECT * FROM bills');

// ✅ ดี
const [bills] = await pool.query(
  'SELECT * FROM bills WHERE tenant_id = ?',
  [req.tenantId]
);
```

## 🔒 Security Best Practices

1. **ใช้ Middleware เสมอ**
```javascript
router.get('/bills', isAuthenticated, loadTenant, BillController.getAll);
```

2. **Filter ด้วย tenant_id**
```javascript
WHERE tenant_id = ? AND deleted_at IS NULL
```

3. **ตรวจสอบ Quota**
```javascript
router.post('/users', checkTenantLimits('users'), UserController.create);
```

## 📝 สิ่งที่ต้องทำต่อ

### ขั้นตอนถัดไป:
1. **รัน Migrations** - สร้างตารางในฐานข้อมูล
2. **ทดสอบ API** - ใช้ Postman หรือ curl ทดสอบ
3. **แก้ไข Controllers เดิม** - เพิ่ม tenant_id ให้ทุก query
4. **สร้าง UI** - หน้าจัดการ Tenant และ Users
5. **เพิ่ม Payment Gateway** - ระบบชำระเงิน

### TODO List:
- [ ] สร้างหน้า Registration
- [ ] สร้างหน้า Tenant Settings
- [ ] สร้างหน้า User Management
- [ ] สร้างระบบ Payment
- [ ] สร้างระบบ Email Notification
- [ ] เพิ่ม Audit Log
- [ ] สร้าง Super Admin Panel
- [ ] เขียน Unit Tests

## 📞 การทดสอบ

### 1. ลงทะเบียนองค์กรใหม่
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

### 2. Login
```bash
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "owner@test.com",
    "password": "password123"
  }'
```

### 3. ดูข้อมูล Tenant
```bash
curl -X GET http://localhost:5000/api/tenants/current \
  -H "Authorization: Bearer {token}"
```

## 📚 เอกสารเพิ่มเติม

อ่านคู่มือฉบับสมบูรณ์ที่: `MULTI_TENANT_GUIDE.md`

## 🎓 หมายเหตุสำคัญ

1. **ทุก query ต้องมี `tenant_id`** - ป้องกันข้อมูลปะปนกัน
2. **ใช้ Middleware ทุกครั้ง** - `isAuthenticated` + `loadTenant`
3. **ตรวจสอบ Quota** - ก่อนสร้างข้อมูลใหม่
4. **Soft Delete** - ใช้ `deleted_at` แทนการลบจริง
5. **ตรวจสอบสิทธิ์** - ก่อนทำงานทุกครั้ง

---

**สร้างโดย**: Antigravity AI  
**วันที่**: 2026-02-03  
**Version**: 1.0.0
