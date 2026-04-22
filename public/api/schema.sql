-- Angel Fly Cockpit — MySQL Schema
-- Run this once to create all tables

CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(255) UNIQUE NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(255) DEFAULT '',
  `role` VARCHAR(50) DEFAULT 'client',
  `status` VARCHAR(50) DEFAULT 'active',
  `specialty` VARCHAR(255) DEFAULT '',
  `hourly_rate` DECIMAL(10,2) DEFAULT NULL,
  `company` VARCHAR(255) DEFAULT '',
  `phone` VARCHAR(50) DEFAULT '',
  `avatar_url` TEXT,
  `created_date` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_date` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `projects` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `client_id` INT DEFAULT NULL,
  `client_name` VARCHAR(255) DEFAULT '',
  `scope_description` TEXT,
  `status` VARCHAR(50) DEFAULT 'active',
  `start_date` DATE DEFAULT NULL,
  `end_date` DATE DEFAULT NULL,
  `total_budget` DECIMAL(12,2) DEFAULT 0,
  `payment_type` VARCHAR(50) DEFAULT 'one-time',
  `recurrence_interval` VARCHAR(50) DEFAULT 'none',
  `docs` TEXT,
  `created_date` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`client_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tasks` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `project_id` INT DEFAULT NULL,
  `project_name` VARCHAR(255) DEFAULT '',
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `assigned_to` INT DEFAULT NULL,
  `assigned_to_name` VARCHAR(255) DEFAULT '',
  `client_name` VARCHAR(255) DEFAULT '',
  `status` VARCHAR(50) DEFAULT 'backlog',
  `priority` VARCHAR(20) DEFAULT 'medium',
  `deadline` DATE DEFAULT NULL,
  `estimated_hours` DECIMAL(6,2) DEFAULT 0,
  `milestone` VARCHAR(255) DEFAULT '',
  `tags` VARCHAR(500) DEFAULT '',
  `subtasks` JSON,
  `comments` JSON,
  `deliverable_url` TEXT,
  `created_date` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`assigned_to`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tickets` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `subject` VARCHAR(255) DEFAULT '',
  `description` TEXT,
  `category` VARCHAR(100) DEFAULT '',
  `status` VARCHAR(50) DEFAULT 'open',
  `priority` VARCHAR(20) DEFAULT 'medium',
  `client_id` INT DEFAULT NULL,
  `client_name` VARCHAR(255) DEFAULT '',
  `assigned_to` INT DEFAULT NULL,
  `assigned_to_name` VARCHAR(255) DEFAULT '',
  `attachments` JSON,
  `created_date` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`client_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`assigned_to`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `payments_incoming` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `client_id` INT DEFAULT NULL,
  `client_name` VARCHAR(255) DEFAULT '',
  `project_id` INT DEFAULT NULL,
  `project_name` VARCHAR(255) DEFAULT '',
  `amount` DECIMAL(12,2) DEFAULT 0,
  `status` VARCHAR(50) DEFAULT 'pending',
  `due_date` DATE DEFAULT NULL,
  `paid_date` DATE DEFAULT NULL,
  `description` TEXT,
  `created_date` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`client_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `payments_outgoing` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `professional_id` INT DEFAULT NULL,
  `professional_name` VARCHAR(255) DEFAULT '',
  `task_id` INT DEFAULT NULL,
  `task_name` VARCHAR(255) DEFAULT '',
  `amount` DECIMAL(12,2) DEFAULT 0,
  `status` VARCHAR(50) DEFAULT 'pending',
  `admin_notes` TEXT,
  `description` TEXT,
  `created_date` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`professional_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `quotes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `project_id` INT DEFAULT NULL,
  `project_name` VARCHAR(255) DEFAULT '',
  `client_name` VARCHAR(255) DEFAULT '',
  `title` VARCHAR(255) DEFAULT '',
  `description` TEXT,
  `amount` DECIMAL(12,2) DEFAULT 0,
  `status` VARCHAR(50) DEFAULT 'pending',
  `valid_until` DATE DEFAULT NULL,
  `metadata` JSON,
  `created_date` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_date` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create default admin user (password: admin123 — CHANGE IMMEDIATELY)
INSERT IGNORE INTO `users` (`email`, `password_hash`, `full_name`, `role`, `status`)
VALUES ('admin@angelfly.io', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin', 'admin', 'active');
