-- Create security_logs table for audit and security monitoring
CREATE TABLE IF NOT EXISTS `security_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `event_type` varchar(50) NOT NULL COMMENT 'LOGIN_FAILURE, CSRF_ATTACK, UNKNOWN_IP, SUSPICIOUS_REQUEST, BRUTE_FORCE, UNAUTHORIZED_ACCESS',
  `tenant_id` int(11) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `ip_address` varchar(45) NOT NULL,
  `user_agent` text DEFAULT NULL,
  `severity` enum('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') DEFAULT 'LOW',
  `details` text DEFAULT NULL COMMENT 'JSON storage for flexible data',
  `path` varchar(255) DEFAULT NULL,
  `method` varchar(10) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_security_event` (`event_type`),
  KEY `idx_security_tenant` (`tenant_id`),
  KEY `idx_security_ip` (`ip_address`),
  KEY `idx_security_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
