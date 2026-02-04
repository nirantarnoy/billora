# ===================================
# Billora Database Setup Script (PowerShell)
# ===================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Billora Multi-tenant Database Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ตรวจสอบว่ามี Node.js หรือไม่
$nodeExists = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeExists) {
    Write-Host "[ERROR] ไม่พบ Node.js กรุณาติดตั้ง Node.js ก่อน" -ForegroundColor Red
    Read-Host "กด Enter เพื่อออก"
    exit 1
}

# รัน setup script
Write-Host "[INFO] กำลังติดตั้งฐานข้อมูล..." -ForegroundColor Blue
Write-Host ""

node database\setup-database.js

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "[SUCCESS] ติดตั้งฐานข้อมูลสำเร็จ!" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "[ERROR] เกิดข้อผิดพลาดในการติดตั้ง" -ForegroundColor Red
    Write-Host ""
}

Read-Host "กด Enter เพื่อออก"
