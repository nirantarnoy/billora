-- Migration to fix subscription_plans table schema
-- 019_fix_subscription_plans_schema.sql

-- Add missing columns to subscription_plans 
-- Use a more compatible syntax (IF NOT EXISTS in ADD COLUMN is only for MariaDB 10.2.2+ or MySQL 8.0.19+)
-- For compatibility, we'll use simple ADD COLUMN or wrap it in a procedure/ignore errors in setup script
-- Since setup-database.js already handles errors, we should provide a script that works if columns don't exist.

ALTER TABLE subscription_plans ADD COLUMN max_storage_mb INT DEFAULT 1024 AFTER max_users;
ALTER TABLE subscription_plans ADD COLUMN sort_order INT DEFAULT 0 AFTER is_active;
ALTER TABLE subscription_plans ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at;
