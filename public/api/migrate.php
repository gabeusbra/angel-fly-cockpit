<?php
/**
 * Angel Fly Cockpit — Schema Migration
 * GET /api/migrate — Adds missing columns to existing tables.
 * Protected by JARVIS_BOT_TOKEN. Run once after deploy.
 * Compatible with MySQL 5.7+.
 */

// JARVIS_BOT_TOKEN, Database already loaded by index.php

$authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
$token = str_replace('Bearer ', '', trim($authHeader));

if ($token !== JARVIS_BOT_TOKEN) {
    http_response_code(403);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$pdo = Database::get();
$results = [];

// Columns to add: [table, column, definition]
$columns = [
    ['tickets', 'project_id',           'INT DEFAULT NULL'],
    ['tickets', 'project_name',         "VARCHAR(255) DEFAULT ''"],
    ['tickets', 'satisfaction_rating',  'TINYINT DEFAULT NULL'],
    ['tickets', 'estimated_resolution', 'DATE DEFAULT NULL'],
    ['tasks',   'client_name',          "VARCHAR(255) DEFAULT ''"],
    ['projects','payment_type',         "VARCHAR(50) DEFAULT 'one-time'"],
    ['projects','scope_description',    'TEXT'],
    ['projects','start_date',           'DATE DEFAULT NULL'],
    ['projects','end_date',             'DATE DEFAULT NULL'],
    ['projects','total_budget',         'DECIMAL(12,2) DEFAULT 0'],
];

// Create quotes table if missing
$createQuotesSql = "
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
";

try {
    $pdo->exec($createQuotesSql);
    $results[] = ['ok' => true, 'msg' => "Ensured table quotes exists"];
} catch (PDOException $e) {
    $results[] = ['ok' => false, 'msg' => "Failed creating quotes table: " . $e->getMessage()];
}

foreach ($columns as [$table, $col, $def]) {
    // Check if column already exists via INFORMATION_SCHEMA
    $stmt = $pdo->prepare(
        "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME   = :tbl
           AND COLUMN_NAME  = :col"
    );
    $stmt->execute([':tbl' => $table, ':col' => $col]);
    $exists = (int) $stmt->fetchColumn();

    if ($exists) {
        $results[] = ['ok' => true, 'skip' => true, 'msg' => "$table.$col already exists"];
        continue;
    }

    // Column does not exist — add it
    try {
        $pdo->exec("ALTER TABLE `$table` ADD COLUMN `$col` $def");
        $results[] = ['ok' => true, 'msg' => "Added $table.$col"];
    } catch (PDOException $e) {
        $results[] = ['ok' => false, 'msg' => "Failed $table.$col: " . $e->getMessage()];
    }
}

http_response_code(200);
header('Content-Type: application/json');
echo json_encode(['migrations' => $results, 'done' => true], JSON_PRETTY_PRINT);
exit;
