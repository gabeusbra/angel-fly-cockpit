<?php
/**
 * Angel Fly Cockpit — Database Connection (PDO)
 */

class Database {
    private static ?PDO $instance = null;

    public static function get(): PDO {
        if (self::$instance === null) {
            $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=' . DB_CHARSET;
            self::$instance = new PDO($dsn, DB_USER, DB_PASS, [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ]);
        }
        return self::$instance;
    }

    /**
     * Run a SELECT query and return all rows.
     */
    public static function query(string $sql, array $params = []): array {
        $stmt = self::get()->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    /**
     * Run a SELECT query and return one row.
     */
    public static function queryOne(string $sql, array $params = []): ?array {
        $stmt = self::get()->prepare($sql);
        $stmt->execute($params);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    /**
     * Run an INSERT/UPDATE/DELETE and return affected rows.
     */
    public static function execute(string $sql, array $params = []): int {
        $stmt = self::get()->prepare($sql);
        $stmt->execute($params);
        return $stmt->rowCount();
    }

    /**
     * Insert a row and return the last inserted ID.
     */
    public static function insert(string $table, array $data): int {
        $cols = array_keys($data);
        $placeholders = array_map(fn($c) => ":$c", $cols);
        $sql = "INSERT INTO `$table` (" . implode(',', array_map(fn($c) => "`$c`", $cols)) . ") VALUES (" . implode(',', $placeholders) . ")";
        $stmt = self::get()->prepare($sql);
        foreach ($data as $key => $value) {
            $stmt->bindValue(":$key", $value);
        }
        $stmt->execute();
        return (int) self::get()->lastInsertId();
    }

    /**
     * Update rows and return affected count.
     */
    public static function update(string $table, int $id, array $data): int {
        if (empty($data)) return 0;
        $sets = [];
        foreach (array_keys($data) as $col) {
            $sets[] = "`$col` = :$col";
        }
        $sql = "UPDATE `$table` SET " . implode(', ', $sets) . " WHERE id = :_id";
        $data['_id'] = $id;
        return self::execute($sql, $data);
    }

    /**
     * Delete a row by ID.
     */
    public static function delete(string $table, int $id): int {
        return self::execute("DELETE FROM `$table` WHERE id = :id", ['id' => $id]);
    }
}
