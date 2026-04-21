<?php
/**
 * Angel Fly Cockpit — JWT Authentication
 */

class Auth {
    // ── JWT Encode / Decode ──

    public static function createToken(array $payload): string {
        $header = self::base64url(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
        $payload['iat'] = time();
        $payload['exp'] = time() + JWT_EXPIRY;
        $payloadEncoded = self::base64url(json_encode($payload));
        $signature = self::base64url(hash_hmac('sha256', "$header.$payloadEncoded", JWT_SECRET, true));
        return "$header.$payloadEncoded.$signature";
    }

    public static function verifyToken(string $token): ?array {
        $parts = explode('.', $token);
        if (count($parts) !== 3) return null;
        [$header, $payload, $signature] = $parts;
        $expectedSig = self::base64url(hash_hmac('sha256', "$header.$payload", JWT_SECRET, true));
        if (!hash_equals($expectedSig, $signature)) return null;
        $data = json_decode(self::base64urlDecode($payload), true);
        if (!$data || ($data['exp'] ?? 0) < time()) return null;
        return $data;
    }

    // ── Get current user from Authorization header ──

    public static function getCurrentUser(): ?array {
        $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        if (!preg_match('/^Bearer\s+(.+)$/i', $header, $m)) return null;
        $payload = self::verifyToken($m[1]);
        if (!$payload || !isset($payload['user_id'])) return null;
        return Database::queryOne("SELECT * FROM users WHERE id = :id", ['id' => $payload['user_id']]);
    }

    public static function requireAuth(): array {
        $user = self::getCurrentUser();
        if (!$user) json_error('Authentication required', 401);
        return $user;
    }

    // ── Auth Endpoints ──

    public static function handleLogin(): void {
        $body = get_json_body();
        $email = strtolower(trim($body['email'] ?? ''));
        $password = $body['password'] ?? '';
        if (!$email || !$password) json_error('Email and password are required');

        $user = Database::queryOne("SELECT * FROM users WHERE email = :email", ['email' => $email]);
        if (!$user || !password_verify($password, $user['password_hash'])) {
            json_error('Invalid email or password', 401);
        }
        if ($user['status'] === 'inactive') {
            json_error('Account is deactivated', 403);
        }

        $token = self::createToken(['user_id' => $user['id'], 'email' => $user['email'], 'role' => $user['role']]);
        unset($user['password_hash']);
        json_response(['token' => $token, 'user' => $user]);
    }

    public static function handleGoogleLogin(): void {
        $body = get_json_body();
        $token = $body['token'] ?? '';
        if (!$token) json_error('Google token is required');

        // Verify token via Google API
        $url = 'https://oauth2.googleapis.com/tokeninfo?id_token=' . urlencode($token);
        $context = stream_context_create(['http' => ['ignore_errors' => true]]);
        $response = @file_get_contents($url, false, $context);
        $googleData = $response ? json_decode($response, true) : null;

        if (!$googleData || isset($googleData['error']) || empty($googleData['email'])) {
            json_error('Invalid Google token', 401);
        }

        $email = strtolower(trim($googleData['email']));
        $fullName = $googleData['name'] ?? '';
        $avatar = $googleData['picture'] ?? null;

        $user = Database::queryOne("SELECT * FROM users WHERE email = :email", ['email' => $email]);

        // "Superadmin" special rule for admin@angelfly.io
        $role = ($email === 'admin@angelfly.io') ? 'admin' : 'client';

        if (!$user) {
            $id = Database::insert('users', [
                'email' => $email,
                'password_hash' => password_hash(bin2hex(random_bytes(16)), PASSWORD_BCRYPT),
                'full_name' => $fullName,
                'avatar_url' => $avatar,
                'role' => $role,
                'status' => 'active',
            ]);
            $user = Database::queryOne("SELECT * FROM users WHERE id = :id", ['id' => $id]);
        } else {
            // Elevate to admin automatically if admin@angelfly.io
            $updates = [];
            if ($avatar && empty($user['avatar_url'])) {
                $updates['avatar_url'] = $avatar;
                $user['avatar_url'] = $avatar;
            }
            if ($email === 'admin@angelfly.io' && $user['role'] !== 'admin') {
                $updates['role'] = 'admin';
                $user['role'] = 'admin';
            }
            if (!empty($updates)) {
                Database::update('users', $user['id'], $updates);
            }
        }

        if ($user['status'] === 'inactive') {
            json_error('Account is deactivated', 403);
        }

        $afToken = self::createToken(['user_id' => $user['id'], 'email' => $user['email'], 'role' => $user['role']]);
        unset($user['password_hash']);
        json_response(['token' => $afToken, 'user' => $user]);
    }

    public static function handleRegister(): void {
        $body = get_json_body();
        $email = strtolower(trim($body['email'] ?? ''));
        $password = $body['password'] ?? '';
        $fullName = trim($body['full_name'] ?? $body['name'] ?? '');

        if (!$email || !$password) json_error('Email and password are required');
        if (strlen($password) < 6) json_error('Password must be at least 6 characters');

        $existing = Database::queryOne("SELECT id FROM users WHERE email = :email", ['email' => $email]);
        if ($existing) json_error('Email already registered', 409);

        $id = Database::insert('users', [
            'email' => $email,
            'password_hash' => password_hash($password, PASSWORD_BCRYPT),
            'full_name' => $fullName,
            'role' => $body['role'] ?? 'client',
            'status' => 'active',
        ]);

        $user = Database::queryOne("SELECT * FROM users WHERE id = :id", ['id' => $id]);
        unset($user['password_hash']);
        $token = self::createToken(['user_id' => $id, 'email' => $email, 'role' => $user['role']]);
        json_response(['token' => $token, 'user' => $user], 201);
    }

    public static function handleMe(): void {
        $user = self::requireAuth();
        unset($user['password_hash']);
        json_response($user);
    }

    public static function handleInvite(): void {
        self::requireAuth();
        $body = get_json_body();
        $email = strtolower(trim($body['email'] ?? ''));
        $role = $body['role'] ?? 'client';
        if (!$email) json_error('Email is required');

        // Check if already exists
        $existing = Database::queryOne("SELECT id FROM users WHERE email = :email", ['email' => $email]);
        if ($existing) {
            json_response(['message' => 'User already exists', 'user_id' => $existing['id']]);
            return;
        }

        // Create user with temporary password (they'll need to reset)
        $tempPassword = bin2hex(random_bytes(8));
        $id = Database::insert('users', [
            'email' => $email,
            'password_hash' => password_hash($tempPassword, PASSWORD_BCRYPT),
            'full_name' => $body['name'] ?? '',
            'role' => $role,
            'status' => 'active',
        ]);

        json_response([
            'message' => 'User invited successfully',
            'user_id' => $id,
            'temp_password' => $tempPassword, // Admin can share this
        ], 201);
    }

    // ── Helpers ──

    private static function base64url(string $data): string {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private static function base64urlDecode(string $data): string {
        return base64_decode(strtr($data, '-_', '+/') . str_repeat('=', 3 - (3 + strlen($data)) % 4));
    }
}
