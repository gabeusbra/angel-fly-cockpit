<?php
/**
 * Angel Fly Cockpit — API Configuration
 * All sensitive values come from environment variables (set in Hostinger or .env)
 */

// ── Database ──
define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_NAME', getenv('DB_NAME') ?: 'u681614277_cockpit');
define('DB_USER', getenv('DB_USER') ?: 'u681614277_cockpit');
define('DB_PASS', getenv('DB_PASS') ?: 'A7x9-b2q-r5mp');
define('DB_CHARSET', 'utf8mb4');

// ── JWT ──
define('JWT_SECRET', getenv('JWT_SECRET') ?: 'angel-fly-jwt-secret-change-me-in-production');
define('JWT_EXPIRY', 60 * 60 * 24 * 30); // 30 days

// ── Uploads ──
define('UPLOAD_DIR', __DIR__ . '/../uploads/');
define('UPLOAD_URL', '/uploads/');
define('MAX_UPLOAD_SIZE', 10 * 1024 * 1024); // 10MB

// ── CORS ──
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ── Helpers ──
function json_response($data, int $status = 200): void {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit();
}

function json_error(string $message, int $status = 400, ?array $extra = null): void {
    $body = ['error' => true, 'message' => $message];
    if ($extra) $body['extra_data'] = $extra;
    json_response($body, $status);
}

function get_json_body(): array {
    $raw = file_get_contents('php://input');
    return $raw ? (json_decode($raw, true) ?? []) : [];
}
