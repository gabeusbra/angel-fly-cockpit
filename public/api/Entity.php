<?php
/**
 * Angel Fly Cockpit — Generic Entity CRUD
 * Handles list, filter, create, update, delete for all tables.
 */

class Entity {
    // Allowed tables (whitelist to prevent SQL injection)
    private const TABLES = [
        'users', 'projects', 'tasks', 'tickets',
        'payments_incoming', 'payments_outgoing',
    ];

    // Fields to never expose
    private const HIDDEN = ['password_hash'];

    public static function isValidTable(string $table): bool {
        return in_array($table, self::TABLES);
    }

    /**
     * GET /api/{entity} — List all or filter
     * Query params: filter[field]=value, sort=-field (desc) or field (asc), limit=N
     */
    public static function handleList(string $table): void {
        Auth::requireAuth();

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
        $body = get_json_body();
        if (empty($body)) json_error('Request body is empty');

        // Remove fields that shouldn't be set manually
        unset($body['id'], $body['created_date'], $body['updated_date']);

        // For users, hash the password
        if ($table === 'users' && isset($body['password'])) {
            $body['password_hash'] = password_hash($body['password'], PASSWORD_BCRYPT);
            unset($body['password']);
        }

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
        $body = get_json_body();
        if (empty($body)) json_error('Request body is empty');

        // Remove protected fields
        unset($body['id'], $body['created_date']);

        // Hash password if updating
        if ($table === 'users' && isset($body['password'])) {
            $body['password_hash'] = password_hash($body['password'], PASSWORD_BCRYPT);
            unset($body['password']);
        }

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
        $affected = Database::delete($table, $id);
        if ($affected === 0) json_error('Not found', 404);
        json_response(['message' => 'Deleted', 'id' => $id]);
    }
}
