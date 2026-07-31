<?php

declare(strict_types=1);

$database = $argv[1] ?? dirname(__DIR__).'/database/database.sqlite';
$pdo = new PDO('sqlite:'.$database, null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

$objects = $pdo->query(<<<'SQL'
    SELECT type, name, tbl_name, sql
    FROM sqlite_master
    WHERE name NOT LIKE 'sqlite_%'
    ORDER BY CASE type WHEN 'table' THEN 1 WHEN 'index' THEN 2 WHEN 'view' THEN 3 ELSE 4 END, name
SQL)->fetchAll(PDO::FETCH_ASSOC);

$result = ['database' => realpath($database), 'integrity' => null, 'foreign_key_violations' => [], 'tables' => [], 'views' => [], 'triggers' => []];
$result['integrity'] = $pdo->query('PRAGMA integrity_check')->fetchColumn();
$result['foreign_key_violations'] = $pdo->query('PRAGMA foreign_key_check')->fetchAll(PDO::FETCH_ASSOC);

foreach ($objects as $object) {
    if ($object['type'] === 'view') {
        $result['views'][] = $object;

        continue;
    }

    if ($object['type'] === 'trigger') {
        $result['triggers'][] = $object;

        continue;
    }

    if ($object['type'] !== 'table') {
        continue;
    }

    $table = $object['name'];
    $quoted = '"'.str_replace('"', '""', $table).'"';
    $result['tables'][$table] = [
        'rows' => (int) $pdo->query("SELECT COUNT(*) FROM {$quoted}")->fetchColumn(),
        'columns' => $pdo->query("PRAGMA table_info({$quoted})")->fetchAll(PDO::FETCH_ASSOC),
        'foreign_keys' => $pdo->query("PRAGMA foreign_key_list({$quoted})")->fetchAll(PDO::FETCH_ASSOC),
        'indexes' => $pdo->query("PRAGMA index_list({$quoted})")->fetchAll(PDO::FETCH_ASSOC),
        'sql' => $object['sql'],
    ];
}

echo json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR), PHP_EOL;
