<?php
/**
 * Angel Fly Cockpit — API Router
 * All requests to /api/* are routed here via .htaccess
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/Database.php';
require_once __DIR__ . '/Auth.php';
require_once __DIR__ . '/Entity.php';
require_once __DIR__ . '/Upload.php';

// Parse the request path
$requestUri = $_SERVER['REQUEST_URI'] ?? '';
$path = parse_url($requestUri, PHP_URL_PATH);
$path = preg_replace('#^/api/?#', '', $path);     // Remove /api/ prefix
$path = rtrim($path, '/');                          // Remove trailing slash
$method = $_SERVER['REQUEST_METHOD'];
$segments = $path ? explode('/', $path) : [];

// ── Route Matching ──

try {
    // POST /api/auth/login
    if ($method === 'POST' && $path === 'auth/login') {
        Auth::handleLogin();
    }
    // POST /api/auth/google
    elseif ($method === 'POST' && $path === 'auth/google') {
        Auth::handleGoogleLogin();
    }
    // POST /api/auth/register
    elseif ($method === 'POST' && $path === 'auth/register') {
        Auth::handleRegister();
    }
    // GET /api/auth/me
    elseif ($method === 'GET' && $path === 'auth/me') {
        Auth::handleMe();
    }
    // POST /api/auth/invite
    elseif ($method === 'POST' && $path === 'auth/invite') {
        Auth::handleInvite();
    }
    // POST /api/upload
    elseif ($method === 'POST' && $path === 'upload') {
        Upload::handle();
    }
    // GET /api/health — Public health check
    elseif ($method === 'GET' && $path === 'health') {
        json_response(['status' => 'ok', 'timestamp' => date('c')]);
    }
    // ── Entity CRUD ──
    elseif (count($segments) >= 1 && Entity::isValidTable($segments[0])) {
        $table = $segments[0];
        $id = isset($segments[1]) && is_numeric($segments[1]) ? intval($segments[1]) : null;

        switch ($method) {
            case 'GET':
                $id ? Entity::handleGet($table, $id) : Entity::handleList($table);
                break;
            case 'POST':
                Entity::handleCreate($table);
                break;
            case 'PUT':
            case 'PATCH':
                if (!$id) json_error('ID is required for update', 400);
                Entity::handleUpdate($table, $id);
                break;
            case 'DELETE':
                if (!$id) json_error('ID is required for delete', 400);
                Entity::handleDelete($table, $id);
                break;
            default:
                json_error('Method not allowed', 405);
        }
    }
    else {
        json_error('Not found: /api/' . $path, 404);
    }
} catch (PDOException $e) {
    json_error('Database error: ' . $e->getMessage(), 500);
} catch (Exception $e) {
    json_error('Server error: ' . $e->getMessage(), 500);
}
