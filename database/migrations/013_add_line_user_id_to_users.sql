-- Migration: Add line_user_id to users table
ALTER TABLE `users` ADD COLUMN `line_user_id` VARCHAR(255) DEFAULT NULL AFTER `role`;
ALTER TABLE `users` ADD INDEX `idx_line_user_id` (`line_user_id`);
