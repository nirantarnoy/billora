# 📘 คู่มือการใช้งาน: ลงทะเบียน Tenant และจัดการ Users

## 📋 สารบัญ
1. [ลงทะเบียน Tenant (องค์กร)](#1-ลงทะเบียน-tenant-องค์กร)
2. [Login เข้าสู่ระบบ](#2-login-เข้าสู่ระบบ)
3. [จัดการ Users](#3-จัดการ-users)
4. [ตัวอย่างการใช้งานจริง](#4-ตัวอย่างการใช้งานจริง)

---

## 1. ลงทะเบียน Tenant (องค์กร)

### 🎯 API Endpoint
```
POST /api/tenants/register
```

### 📝 ข้อมูลที่ต้องส่ง

```json
{
  // ข้อมูลองค์กร/บริษัท
  "company_name": "บริษัท ทดสอบ จำกัด",           // ชื่อบริษัท (จำเป็น)
  "company_name_en": "Test Company Ltd.",        // ชื่อภาษาอังกฤษ (ไม่จำเป็น)
  "tax_id": "0123456789012",                     // เลขประจำตัวผู้เสียภาษี (ไม่จำเป็น)
  "address": "123 ถนนทดสอบ กรุงเทพฯ 10100",      // ที่อยู่ (ไม่จำเป็น)
  "phone": "021234567",                          // เบอร์โทร (ไม่จำเป็น)
  "email": "info@testcompany.com",               // อีเมลบริษัท (ไม่จำเป็น)
  
  // ข้อมูลผู้ใช้คนแรก (Owner)
  "owner_email": "owner@testcompany.com",        // อีเมล Owner (จำเป็น)
  "owner_password": "Password123!",              // รหัสผ่าน (จำเป็น)
  "owner_first_name": "สมชาย",                   // ชื่อจริง (ไม่จำเป็น)
  "owner_last_name": "ทดสอบ",                    // นามสกุล (ไม่จำเป็น)
  "owner_phone": "0812345678",                   // เบอร์โทร (ไม่จำเป็น)
  "owner_username": "owner"                      // Username (ไม่จำเป็น, ถ้าไม่ใส่จะใช้ email)
}
```

### 💻 ตัวอย่างการใช้งาน

#### วิธีที่ 1: ใช้ curl (Command Line)
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

#### วิธีที่ 2: ใช้ PowerShell
```powershell
$body = @{
    company_name = "บริษัท ทดสอบ จำกัด"
    owner_email = "owner@test.com"
    owner_password = "password123"
    owner_first_name = "สมชาย"
    owner_last_name = "ทดสอบ"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/tenants/register" `
  -Method Post `
  -ContentType "application/json" `
  -Body $body
```

#### วิธีที่ 3: ใช้ JavaScript (Frontend)
```javascript
async function registerTenant() {
  const response = await fetch('http://localhost:5000/api/tenants/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      company_name: 'บริษัท ทดสอบ จำกัด',
      owner_email: 'owner@test.com',
      owner_password: 'password123',
      owner_first_name: 'สมชาย',
      owner_last_name: 'ทดสอบ'
    })
  });
  
  const data = await response.json();
  console.log(data);
  
  if (data.success) {
    alert('ลงทะเบียนสำเร็จ!');
    // เก็บ tenant_id และ user_id ไว้ใช้
  }
}
```

### ✅ Response ที่ได้รับ (สำเร็จ)
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

### ❌ Response ที่ได้รับ (ผิดพลาด)
```json
{
  "success": false,
  "message": "อีเมลหรือชื่อบริษัทนี้ถูกใช้งานแล้ว"
}
```

---

## 2. Login เข้าสู่ระบบ

### 🎯 API Endpoint
```
POST /api/login
```

### 📝 ข้อมูลที่ต้องส่ง
```json
{
  "email": "owner@test.com",      // อีเมลที่ลงทะเบียนไว้
  "password": "password123"       // รหัสผ่าน
}
```

### 💻 ตัวอย่างการใช้งาน

#### curl
```bash
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "owner@test.com",
    "password": "password123"
  }'
```

#### JavaScript
```javascript
async function login() {
  const response = await fetch('http://localhost:5000/api/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: 'owner@test.com',
      password: 'password123'
    })
  });
  
  const data = await response.json();
  
  if (data.success) {
    // เก็บ token ไว้ใช้
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
  }
}
```

### ✅ Response ที่ได้รับ
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "tenant_id": 1,
    "email": "owner@test.com",
    "first_name": "สมชาย",
    "last_name": "ทดสอบ",
    "role": "owner"
  }
}
```

**เก็บ token นี้ไว้!** ต้องใช้สำหรับเรียก API อื่นๆ

---

## 3. จัดการ Users

### 3.1 ดูรายการผู้ใช้ทั้งหมด

#### 🎯 API Endpoint
```
GET /api/users
```

#### 💻 ตัวอย่างการใช้งาน

```bash
# curl
curl -X GET http://localhost:5000/api/users \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

```javascript
// JavaScript
async function getUsers() {
  const token = localStorage.getItem('token');
  
  const response = await fetch('http://localhost:5000/api/users', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const data = await response.json();
  console.log(data.data); // รายการผู้ใช้
}
```

#### Query Parameters (ไม่จำเป็น)
```
GET /api/users?role=admin              # กรองตาม role
GET /api/users?is_active=true          # กรองตามสถานะ
GET /api/users?search=สมชาย            # ค้นหา
GET /api/users?limit=10                # จำกัดจำนวน
```

---

### 3.2 สร้างผู้ใช้ใหม่

#### 🎯 API Endpoint
```
POST /api/users
```

#### 📝 ข้อมูลที่ต้องส่ง
```json
{
  "email": "user@test.com",              // อีเมล (จำเป็น)
  "password": "password123",             // รหัสผ่าน (จำเป็น)
  "first_name": "สมหญิง",                // ชื่อจริง
  "last_name": "ทดสอบ",                  // นามสกุล
  "phone": "0823456789",                 // เบอร์โทร
  "role": "user",                        // บทบาท: owner, admin, manager, accountant, user
  "permissions": {                       // สิทธิ์การเข้าถึง
    "dashboard": true,
    "bills": true,
    "reports": false,
    "users": false,
    "settings": false
  }
}
```

#### 💻 ตัวอย่างการใช้งาน

```bash
# curl
curl -X POST http://localhost:5000/api/users \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@test.com",
    "password": "password123",
    "first_name": "สมหญิง",
    "last_name": "ทดสอบ",
    "role": "user"
  }'
```

```javascript
// JavaScript
async function createUser() {
  const token = localStorage.getItem('token');
  
  const response = await fetch('http://localhost:5000/api/users', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: 'user@test.com',
      password: 'password123',
      first_name: 'สมหญิง',
      last_name: 'ทดสอบ',
      role: 'user',
      permissions: {
        dashboard: true,
        bills: true,
        reports: false
      }
    })
  });
  
  const data = await response.json();
  if (data.success) {
    alert('สร้างผู้ใช้สำเร็จ!');
  }
}
```

#### ⚠️ ข้อจำกัด
- เฉพาะ **Owner** และ **Admin** เท่านั้นที่สร้างผู้ใช้ได้
- ต้องไม่เกิน quota ที่กำหนดในแพ็กเกจ

---

### 3.3 แก้ไขข้อมูลผู้ใช้

#### 🎯 API Endpoint
```
PUT /api/users/:id
```

#### 💻 ตัวอย่างการใช้งาน

```bash
# curl
curl -X PUT http://localhost:5000/api/users/2 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "สมหญิง",
    "last_name": "ทดสอบใหม่",
    "phone": "0823456780"
  }'
```

```javascript
// JavaScript
async function updateUser(userId) {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`http://localhost:5000/api/users/${userId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      first_name: 'สมหญิง',
      last_name: 'ทดสอบใหม่',
      phone: '0823456780'
    })
  });
  
  const data = await response.json();
}
```

---

### 3.4 เปลี่ยนรหัสผ่าน

#### 🎯 API Endpoint
```
POST /api/users/:id/change-password
```

#### 📝 ข้อมูลที่ต้องส่ง
```json
{
  "old_password": "password123",
  "new_password": "newpassword456"
}
```

#### 💻 ตัวอย่างการใช้งาน

```javascript
async function changePassword(userId) {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`http://localhost:5000/api/users/${userId}/change-password`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      old_password: 'password123',
      new_password: 'newpassword456'
    })
  });
  
  const data = await response.json();
}
```

---

### 3.5 เปลี่ยน Role

#### 🎯 API Endpoint
```
PUT /api/users/:id/role
```

#### 📝 ข้อมูลที่ต้องส่ง
```json
{
  "role": "admin"  // owner, admin, manager, accountant, user
}
```

#### ⚠️ ข้อจำกัด
- เฉพาะ **Owner** และ **Admin** เท่านั้น
- ไม่สามารถเปลี่ยน role ของตัวเองได้

---

### 3.6 ระงับ/เปิดใช้งานผู้ใช้

#### 🎯 API Endpoint
```
PUT /api/users/:id/toggle-active
```

#### 📝 ข้อมูลที่ต้องส่ง
```json
{
  "is_active": false  // true = เปิดใช้งาน, false = ระงับ
}
```

#### 💻 ตัวอย่างการใช้งาน

```javascript
async function toggleUserActive(userId, isActive) {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`http://localhost:5000/api/users/${userId}/toggle-active`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      is_active: isActive
    })
  });
  
  const data = await response.json();
}
```

---

### 3.7 ลบผู้ใช้

#### 🎯 API Endpoint
```
DELETE /api/users/:id
```

#### 💻 ตัวอย่างการใช้งาน

```bash
# curl
curl -X DELETE http://localhost:5000/api/users/2 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

```javascript
// JavaScript
async function deleteUser(userId) {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`http://localhost:5000/api/users/${userId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const data = await response.json();
}
```

#### ⚠️ ข้อจำกัด
- เฉพาะ **Owner** และ **Admin** เท่านั้น
- ไม่สามารถลบตัวเองได้
- เป็น **Soft Delete** (ข้อมูลยังอยู่ในฐานข้อมูล)

---

## 4. ตัวอย่างการใช้งานจริง

### 📱 Scenario 1: ลงทะเบียนบริษัทใหม่

```javascript
// 1. ลงทะเบียนบริษัท
const registerResponse = await fetch('http://localhost:5000/api/tenants/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    company_name: 'บริษัท ABC จำกัด',
    owner_email: 'owner@abc.com',
    owner_password: 'SecurePass123!',
    owner_first_name: 'สมชาย',
    owner_last_name: 'ผู้ประกอบการ'
  })
});

const registerData = await registerResponse.json();
console.log('ลงทะเบียนสำเร็จ:', registerData);
// { success: true, data: { tenant_id: 1, tenant_code: 'ABC123456', user_id: 1 } }
```

---

### 📱 Scenario 2: Login และสร้างผู้ใช้ใหม่

```javascript
// 1. Login
const loginResponse = await fetch('http://localhost:5000/api/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'owner@abc.com',
    password: 'SecurePass123!'
  })
});

const loginData = await loginResponse.json();
const token = loginData.token;

// 2. สร้างผู้ใช้ใหม่ (Admin)
const createUserResponse = await fetch('http://localhost:5000/api/users', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'admin@abc.com',
    password: 'AdminPass123!',
    first_name: 'สมหญิง',
    last_name: 'ผู้ดูแล',
    role: 'admin',
    permissions: {
      dashboard: true,
      users: true,
      bills: true,
      reports: true,
      settings: true
    }
  })
});

const userData = await createUserResponse.json();
console.log('สร้างผู้ใช้สำเร็จ:', userData);
```

---

### 📱 Scenario 3: จัดการทีมงาน

```javascript
// 1. Login
const token = 'YOUR_TOKEN_HERE';

// 2. ดูรายการผู้ใช้ทั้งหมด
const usersResponse = await fetch('http://localhost:5000/api/users', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const users = await usersResponse.json();
console.log('ผู้ใช้ทั้งหมด:', users.data);

// 3. สร้างพนักงานบัญชี
await fetch('http://localhost:5000/api/users', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'accountant@abc.com',
    password: 'AccPass123!',
    first_name: 'สมศรี',
    last_name: 'นักบัญชี',
    role: 'accountant',
    permissions: {
      dashboard: true,
      bills: true,
      reports: true,
      users: false,
      settings: false
    }
  })
});

// 4. สร้างพนักงานทั่วไป
await fetch('http://localhost:5000/api/users', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'user@abc.com',
    password: 'UserPass123!',
    first_name: 'สมปอง',
    last_name: 'พนักงาน',
    role: 'user',
    permissions: {
      dashboard: true,
      bills: true,
      reports: false,
      users: false,
      settings: false
    }
  })
});
```

---

## 📊 สรุป API ทั้งหมด

| API | Method | Endpoint | สิทธิ์ | คำอธิบาย |
|-----|--------|----------|--------|----------|
| ลงทะเบียน Tenant | POST | `/api/tenants/register` | Public | ลงทะเบียนองค์กรใหม่ |
| Login | POST | `/api/login` | Public | เข้าสู่ระบบ |
| ดูรายการ Users | GET | `/api/users` | ✓ | ดูผู้ใช้ทั้งหมด |
| ดูข้อมูล User | GET | `/api/users/:id` | ✓ | ดูข้อมูลผู้ใช้ |
| สร้าง User | POST | `/api/users` | Owner, Admin | สร้างผู้ใช้ใหม่ |
| แก้ไข User | PUT | `/api/users/:id` | Owner, Admin, Self | แก้ไขข้อมูล |
| เปลี่ยนรหัสผ่าน | POST | `/api/users/:id/change-password` | Self | เปลี่ยนรหัสผ่าน |
| เปลี่ยน Role | PUT | `/api/users/:id/role` | Owner, Admin | เปลี่ยนบทบาท |
| ระงับ/เปิดใช้งาน | PUT | `/api/users/:id/toggle-active` | Owner, Admin | ระงับหรือเปิดใช้งาน |
| ลบ User | DELETE | `/api/users/:id` | Owner, Admin | ลบผู้ใช้ |

---

## 🎓 Tips & Best Practices

### ✅ ควรทำ
- เก็บ token ใน localStorage หรือ sessionStorage
- ตรวจสอบ token หมดอายุหรือไม่
- ใช้ HTTPS ในการส่งข้อมูล (production)
- ตั้งรหัสผ่านที่แข็งแรง

### ❌ ไม่ควรทำ
- เก็บ token ใน cookie ที่ไม่มี httpOnly
- ส่งรหัสผ่านแบบ plain text
- ให้สิทธิ์ admin กับทุกคน
- ลืมตรวจสอบ response status

---

## 🔗 เอกสารเพิ่มเติม

- `API_TESTING.http` - ตัวอย่างการทดสอบ API ทั้งหมด
- `MULTI_TENANT_GUIDE.md` - คู่มือฉบับสมบูรณ์
- `START_HERE.md` - เริ่มต้นใช้งาน

---

**พร้อมใช้งานแล้ว!** 🚀  
**ลองทดสอบ API ได้เลยตอนนี้!**
