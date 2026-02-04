# 🔄 Auto Backup System

ระบบสำรองข้อมูลอัตโนมัติสำหรับ Billora

## 📋 สารบัญ

1. [ภาพรวม](#ภาพรวม)
2. [การตั้งค่า](#การตั้งค่า)
3. [Cron Expression](#cron-expression)
4. [ตัวอย่างการใช้งาน](#ตัวอย่างการใช้งาน)
5. [API Reference](#api-reference)

---

## ภาพรวม

ระบบ Auto Backup ช่วยให้คุณสามารถ:
- ✅ ตั้งเวลาสำรองข้อมูลอัตโนมัติ
- ✅ เลือกประเภท Backup (Full/Tenant)
- ✅ กำหนด Retention Policy
- ✅ รับการแจ้งเตือนผ่านอีเมล
- ✅ ดูประวัติการ Backup

---

## การตั้งค่า

### 1. รัน Migration

```bash
node database/setup-database.js
```

### 2. เริ่มต้น Scheduler ใน app.js

```javascript
const backupScheduler = require('./src/services/BackupScheduler');

// เริ่มต้น Backup Scheduler
backupScheduler.init().then(() => {
    console.log('✓ Backup Scheduler initialized');
});
```

### 3. เพิ่ม Routes

```javascript
const backupScheduleController = require('./src/controllers/BackupScheduleController');

// Backup Schedules
router.get('/backup/schedules', isAuthenticated, isAdmin, backupScheduleController.index);
router.post('/backup/schedules', isAuthenticated, isAdmin, backupScheduleController.create);
router.put('/backup/schedules/:id', isAuthenticated, isAdmin, backupScheduleController.update);
router.delete('/backup/schedules/:id', isAuthenticated, isAdmin, backupScheduleController.delete);
router.post('/backup/schedules/:id/toggle', isAuthenticated, isAdmin, backupScheduleController.toggle);
router.post('/backup/schedules/:id/run', isAuthenticated, isAdmin, backupScheduleController.runNow);
router.get('/backup/history', isAuthenticated, isAdmin, backupScheduleController.history);
```

---

## Cron Expression

### รูปแบบ

```
* * * * *
│ │ │ │ │
│ │ │ │ └─── วันในสัปดาห์ (0-7, 0 และ 7 = อาทิตย์)
│ │ │ └───── เดือน (1-12)
│ │ └─────── วันที่ (1-31)
│ └───────── ชั่วโมง (0-23)
└─────────── นาที (0-59)
```

### ตัวอย่าง

| Cron Expression | คำอธิบาย |
|----------------|----------|
| `0 2 * * *` | ทุกวันเวลา 02:00 AM |
| `0 */6 * * *` | ทุก 6 ชั่วโมง |
| `0 0 * * 0` | ทุกวันอาทิตย์เวลา 00:00 |
| `0 3 1 * *` | วันที่ 1 ของทุกเดือนเวลา 03:00 AM |
| `*/30 * * * *` | ทุก 30 นาที |
| `0 0,12 * * *` | เวลา 00:00 และ 12:00 ทุกวัน |
| `0 9-17 * * 1-5` | 9:00-17:00 วันจันทร์-ศุกร์ |

### เครื่องมือช่วย

- [Crontab Guru](https://crontab.guru/) - ตรวจสอบ Cron Expression
- [Cron Expression Generator](https://www.freeformatter.com/cron-expression-generator-quartz.html)

---

## ตัวอย่างการใช้งาน

### 1. สร้าง Daily Backup

```javascript
POST /backup/schedules

{
  "name": "Daily Full Backup",
  "description": "สำรองข้อมูลทั้งหมดทุกวัน",
  "cron_expression": "0 2 * * *",
  "backup_type": "full",
  "retention_days": 7,
  "max_backups": 10,
  "notify_on_failure": true,
  "notification_email": "admin@example.com"
}
```

### 2. สร้าง Weekly Backup

```javascript
POST /backup/schedules

{
  "name": "Weekly Full Backup",
  "description": "สำรองข้อมูลทุกวันอาทิตย์",
  "cron_expression": "0 3 * * 0",
  "backup_type": "full",
  "retention_days": 30,
  "max_backups": 4,
  "notify_on_success": true,
  "notify_on_failure": true,
  "notification_email": "admin@example.com"
}
```

### 3. สร้าง Tenant Backup

```javascript
POST /backup/schedules

{
  "name": "Tenant XYZ Backup",
  "description": "สำรองข้อมูล Tenant XYZ ทุกวัน",
  "cron_expression": "0 4 * * *",
  "backup_type": "tenant",
  "tenant_id": 5,
  "retention_days": 14,
  "max_backups": 14
}
```

### 4. รัน Backup ทันที

```javascript
POST /backup/schedules/1/run
```

### 5. เปิด/ปิด Schedule

```javascript
POST /backup/schedules/1/toggle
```

---

## API Reference

### GET /backup/schedules

แสดงรายการ Backup Schedules ทั้งหมด

**Response:**
```json
{
  "schedules": [
    {
      "id": 1,
      "name": "Daily Full Backup",
      "cron_expression": "0 2 * * *",
      "backup_type": "full",
      "is_active": true,
      "last_run_at": "2026-02-03 02:00:00",
      "next_run_at": "2026-02-04 02:00:00",
      "success_count": 30,
      "failed_count": 0
    }
  ]
}
```

### POST /backup/schedules

สร้าง Schedule ใหม่

**Body:**
```json
{
  "name": "Schedule Name",
  "description": "Description",
  "cron_expression": "0 2 * * *",
  "backup_type": "full",
  "tenant_id": null,
  "retention_days": 7,
  "max_backups": 10,
  "notify_on_success": false,
  "notify_on_failure": true,
  "notification_email": "admin@example.com"
}
```

### PUT /backup/schedules/:id

อัพเดท Schedule

### DELETE /backup/schedules/:id

ลบ Schedule

### POST /backup/schedules/:id/toggle

เปิด/ปิด Schedule

### POST /backup/schedules/:id/run

รัน Backup ทันที

### GET /backup/history

ดูประวัติ Backup

**Query Parameters:**
- `schedule_id` (optional) - กรองตาม Schedule ID

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "schedule_id": 1,
      "filename": "backup_full_2026-02-03T02-00-00.sql",
      "file_size": 1048576,
      "status": "success",
      "duration_seconds": 15,
      "created_at": "2026-02-03 02:00:00"
    }
  ]
}
```

---

## 🔒 Retention Policy

ระบบจะลบไฟล์ Backup เก่าอัตโนมัติตาม:

1. **retention_days**: ลบไฟล์ที่เก่ากว่า X วัน
2. **max_backups**: เก็บไฟล์สูงสุด X ไฟล์

---

## 📧 Email Notification

ตั้งค่าการแจ้งเตือนผ่านอีเมล:

```javascript
{
  "notify_on_success": true,  // แจ้งเตือนเมื่อสำเร็จ
  "notify_on_failure": true,  // แจ้งเตือนเมื่อล้มเหลว
  "notification_email": "admin@example.com"
}
```

---

## 🛠️ Troubleshooting

### Backup ไม่ทำงาน

1. ตรวจสอบ Cron Expression ว่าถูกต้อง
2. ตรวจสอบว่า Schedule เปิดใช้งาน (`is_active = TRUE`)
3. ตรวจสอบ Log ใน Console
4. ตรวจสอบว่า mysqldump อยู่ใน PATH

### ไฟล์ Backup ไม่ถูกลบ

1. ตรวจสอบ `retention_days` และ `max_backups`
2. ตรวจสอบสิทธิ์การเข้าถึงโฟลเดอร์ `backups/`

---

## 📝 Best Practices

1. **ตั้ง Backup ในเวลาที่ระบบไม่ยุ่ง** (เช่น 02:00-04:00 AM)
2. **ใช้ Retention Policy ที่เหมาะสม** (7-30 วัน)
3. **เก็บ Backup ไว้หลายที่** (Local + Cloud)
4. **ทดสอบ Restore เป็นประจำ**
5. **ตั้งการแจ้งเตือนเมื่อล้มเหลว**

---

## 🚀 Next Steps

1. เพิ่มการ Upload ไป Cloud Storage (S3, Google Drive)
2. เพิ่มการ Compress ไฟล์ Backup
3. เพิ่มการ Encrypt ไฟล์ Backup
4. เพิ่ม Restore UI
