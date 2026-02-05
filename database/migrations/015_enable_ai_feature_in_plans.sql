-- Migration: Enable AI Audit feature for Professional and Enterprise plans
UPDATE subscription_plans 
SET features = JSON_SET(features, '$.ai_audit', true) 
WHERE plan_code IN ('professional', 'enterprise');

-- Also enable for existing users (optional, but good for testing)
UPDATE subscription_plans 
SET features = JSON_SET(features, '$.ai_audit', false) 
WHERE plan_code IN ('free', 'basic');
