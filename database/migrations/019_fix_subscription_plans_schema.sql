-- Migration to fix subscription_plans table schema
-- 019_fix_subscription_plans_schema.sql

-- Add missing columns to subscription_plans
ALTER TABLE subscription_plans 
ADD COLUMN IF NOT EXISTS max_storage_mb INT DEFAULT 1024 AFTER max_users,
ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0 AFTER is_active,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at;
