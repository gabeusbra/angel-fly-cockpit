<?php
/**
 * Angel Fly Cockpit — Generic Entity CRUD
 * Handles list, filter, create, update, delete for all tables.
 */

class Entity {
    // Allowed tables (whitelist to prevent SQL injection)
    private const TABLES = [
        'users', 'projects', 'tasks', 'tickets',
        'payments_incoming', 'payments_outgoing', 'quotes',
    ];

    // Fields to never expose
    private const HIDDEN = ['password_hash'];
    private static array $columnsCache = [];

    public static function isValidTable(string $table): bool {
        return in_array($table, self::TABLES);
    }

    /**
     * Return current table columns from database (cached).
     */
    private static function getTableColumns(string $table): array {
        if (isset(self::$columnsCache[$table])) return self::$columnsCache[$table];
        $rows = Database::query("SHOW COLUMNS FROM `$table`");
        $cols = array_map(fn($r) => $r['Field'] ?? '', $rows);
        $cols = array_values(array_filter($cols));
        self::$columnsCache[$table] = $cols;
        return $cols;
    }

    /**
     * Ensure quotes table exists in production before any quote operation.
     * This prevents runtime 500 when /api/quotes is called before migrate.
     */
    private static function ensureQuotesTable(): void {
        static $checked = false;
        if ($checked) return;
        $checked = true;

        $sql = "
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

        Database::get()->exec($sql);
    }

    /**
     * GET /api/{entity} — List all or filter
     * Query params: filter[field]=value, sort=-field (desc) or field (asc), limit=N
     */
    public static function handleList(string $table): void {
        Auth::requireAuth();
        if ($table === 'quotes') self::ensureQuotesTable();

        $where = [];
        $params = [];
        $sort = 'id DESC';
        $limit = '';

        // Filters: ?filter[role]=admin&filter[status]=active
        if (isset($_GET['filter']) && is_array($_GET['filter'])) {
            foreach ($_GET['filter'] as $field => $value) {
                $safeField = preg_replace('/[^a-zA-Z0-9_]/', '', $field);
                $where[] = "`$safeField` = :f_$safeField";
                $params["f_$safeField"] = $value;
            }
        }

        // Sort: ?sort=-created_date or ?sort=name
        if (!empty($_GET['sort'])) {
            $s = $_GET['sort'];
            $dir = 'ASC';
            if (str_starts_with($s, '-')) {
                $dir = 'DESC';
                $s = substr($s, 1);
            }
            $safeSort = preg_replace('/[^a-zA-Z0-9_]/', '', $s);
            $sort = "`$safeSort` $dir";
        }

        // Limit
        if (!empty($_GET['limit']) && is_numeric($_GET['limit'])) {
            $limit = 'LIMIT ' . intval($_GET['limit']);
        }

        $sql = "SELECT * FROM `$table`";
        if ($where) $sql .= ' WHERE ' . implode(' AND ', $where);
        $sql .= " ORDER BY $sort $limit";

        $rows = Database::query($sql, $params);

        // Strip hidden fields
        $rows = array_map(function($row) {
            foreach (self::HIDDEN as $h) unset($row[$h]);
            return $row;
        }, $rows);

        json_response($rows);
    }

    /**
     * GET /api/{entity}/{id} — Get one
     */
    public static function handleGet(string $table, int $id): void {
        Auth::requireAuth();
        if ($table === 'quotes') self::ensureQuotesTable();
        $row = Database::queryOne("SELECT * FROM `$table` WHERE id = :id", ['id' => $id]);
        if (!$row) json_error('Not found', 404);
        foreach (self::HIDDEN as $h) unset($row[$h]);
        json_response($row);
    }

    /**
     * POST /api/{entity} — Create
     */
    public static function handleCreate(string $table): void {
        Auth::requireAuth();
        if ($table === 'quotes') self::ensureQuotesTable();
        $body = get_json_body();
        if (empty($body)) json_error('Request body is empty');

        // Remove fields that shouldn't be set manually
        unset($body['id'], $body['created_date'], $body['updated_date']);

        // For users, hash the password
        if ($table === 'users' && isset($body['password'])) {
            $body['password_hash'] = password_hash($body['password'], PASSWORD_BCRYPT);
            unset($body['password']);
        }

        // Keep only real columns from current table schema (prevents unknown-column 500s)
        $allowedCols = array_flip(self::getTableColumns($table));
        $body = array_intersect_key($body, $allowedCols);
        if (empty($body)) json_error('No valid fields provided for this entity', 400);

        // Convert empty string FK fields to NULL (prevents FK constraint violations)
        foreach ($body as $key => &$value) {
            if ((str_ends_with($key, '_id') || $key === 'id') && $value === '') {
                $value = null;
            }
        }
        unset($value);

        // Convert arrays/objects to JSON strings for JSON columns
        foreach ($body as $key => &$value) {
            if (is_array($value) || is_object($value)) {
                $value = json_encode($value, JSON_UNESCAPED_UNICODE);
            }
        }

        try {
            $id = Database::insert($table, $body);
            $row = Database::queryOne("SELECT * FROM `$table` WHERE id = :id", ['id' => $id]);
            foreach (self::HIDDEN as $h) unset($row[$h]);
            json_response($row, 201);
        } catch (PDOException $e) {
            json_error('Failed to create: ' . $e->getMessage(), 500);
        }
    }

    /**
     * PUT /api/{entity}/{id} — Update
     */
    public static function handleUpdate(string $table, int $id): void {
        Auth::requireAuth();
        if ($table === 'quotes') self::ensureQuotesTable();
        $body = get_json_body();
        if (empty($body)) json_error('Request body is empty');

        // Remove protected fields
        unset($body['id'], $body['created_date']);

        // Convert empty string FK fields to NULL
        foreach ($body as $key => &$value) {
            if (str_ends_with($key, '_id') && $value === '') {
                $value = null;
            }
        }
        unset($value);
        // Hash password if updating
        if ($table === 'users' && isset($body['password'])) {
            $body['password_hash'] = password_hash($body['password'], PASSWORD_BCRYPT);
            unset($body['password']);
        }

        // Keep only real columns from current table schema (prevents unknown-column 500s)
        $allowedCols = array_flip(self::getTableColumns($table));
        $body = array_intersect_key($body, $allowedCols);
        if (empty($body)) json_error('No valid fields provided for update', 400);

        // Convert arrays/objects to JSON
        foreach ($body as $key => &$value) {
            if (is_array($value) || is_object($value)) {
                $value = json_encode($value, JSON_UNESCAPED_UNICODE);
            }
        }

        try {
            Database::update($table, $id, $body);
            $row = Database::queryOne("SELECT * FROM `$table` WHERE id = :id", ['id' => $id]);
            if (!$row) json_error('Not found', 404);
            foreach (self::HIDDEN as $h) unset($row[$h]);
            json_response($row);
        } catch (PDOException $e) {
            json_error('Failed to update: ' . $e->getMessage(), 500);
        }
    }

    /**
     * DELETE /api/{entity}/{id} — Delete
     */
    public static function handleDelete(string $table, int $id): void {
        Auth::requireAuth();
        if ($table === 'quotes') self::ensureQuotesTable();
        $affected = Database::delete($table, $id);
        if ($affected === 0) json_error('Not found', 404);
        json_response(['message' => 'Deleted', 'id' => $id]);
    }
}
