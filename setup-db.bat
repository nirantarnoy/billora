@echo off
REM ===================================
REM Billora Database Setup Script
REM ===================================

echo.
echo ========================================
echo   Billora Multi-tenant Database Setup
echo ========================================
echo.

REM ตรวจสอบว่ามี Node.js หรือไม่
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] ไม่พบ Node.js กรุณาติดตั้ง Node.js ก่อน
    pause
    exit /b 1
)

REM รัน setup script
echo [INFO] กำลังติดตั้งฐานข้อมูล...
echo.

node database\setup-database.js

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [SUCCESS] ติดตั้งฐานข้อมูลสำเร็จ!
    echo.
) else (
    echo.
    echo [ERROR] เกิดข้อผิดพลาดในการติดตั้ง
    echo.
)

pause
