-- Migration to fix subscription_plans table schema - part 2
-- 020_add_more_columns_to_plans.sql

-- Add missing columns that are required by AdminModel
ALTER TABLE subscription_plans 
ADD COLUMN description TEXT AFTER plan_name_en,
ADD COLUMN price_yearly DECIMAL(10,2) DEFAULT 0 AFTER price_monthly,
ADD COLUMN currency VARCHAR(3) DEFAULT 'THB' AFTER price_yearly;
