<?php
/**
 * Angel Fly Cockpit — Schema Migration
 * GET /api/migrate — Adds missing columns to existing tables.
 * Protected by JARVIS_BOT_TOKEN (admin-only, run once).
 */

// Only allow authorized requests
$authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
$token = str_replace('Bearer ', '', $authHeader);
require_once __DIR__ . '/config.php';
if ($token !== JARVIS_BOT_TOKEN) {
    http_response_code(403);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

require_once __DIR__ . '/Database.php';

$migrations = [
    // tickets: add missing columns
    "ALTER TABLE `tickets` ADD COLUMN IF NOT EXISTS `project_id` INT DEFAULT NULL" ,
    "ALTER TABLE `tickets` ADD COLUMN IF NOT EXISTS `project_name` VARCHAR(255) DEFAULT ''" ,
    "ALTER TABLE `tickets` ADD COLUMN IF NOT EXISTS `satisfaction_rating` TINYINT DEFAULT NULL" ,
    "ALTER TABLE `tickets` ADD COLUMN IF NOT EXISTS `estimated_resolution` DATE DEFAULT NULL" ,
    // tasks: add client_name if missing
    "ALTER TABLE `tasks` ADD COLUMN IF NOT EXISTS `client_name` VARCHAR(255) DEFAULT ''" ,
    // projects: add client_name and missing fields
    "ALTER TABLE `projects` ADD COLUMN IF NOT EXISTS `client_name` VARCHAR(255) DEFAULT ''" ,
    "ALTER TABLE `projects` ADD COLUMN IF NOT EXISTS `payment_type` VARCHAR(50) DEFAULT 'one-time'" ,
    "ALTER TABLE `projects` ADD COLUMN IF NOT EXISTS `scope_description` TEXT" ,
    "ALTER TABLE `projects` ADD COLUMN IF NOT EXISTS `start_date` DATE DEFAULT NULL" ,
    "ALTER TABLE `projects` ADD COLUMN IF NOT EXISTS `end_date` DATE DEFAULT NULL" ,
    "ALTER TABLE `projects` ADD COLUMN IF NOT EXISTS `total_budget` DECIMAL(12,2) DEFAULT 0" ,
    "ALTER TABLE `projects` ADD COLUMN IF NOT EXISTS `status` VARCHAR(50) DEFAULT 'active'" ,
];

$results = [];
$pdo = Database::getConnection();

foreach ($migrations as $sql) {
    try {
        $pdo->exec($sql);
        $results[] = ['ok' => true, 'sql' => $sql];
    } catch (PDOException $e) {
        $results[] = ['ok' => false, 'sql' => $sql, 'error' => $e->getMessage()];
    }
}

http_response_code(200);
header('Content-Type: application/json');
echo json_encode(['migrations' => $results, 'done' => true]);
