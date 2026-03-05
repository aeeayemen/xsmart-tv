<?php
// backend/config.php
error_reporting(E_ALL);
ini_set('display_errors', 1);

$host = 'localhost';     // Change this when hosting on Hostinger
$db   = 'xsmart_tv_db';  // Change this to your DB name
$user = 'root';          // Change this to your DB user
$pass = '';              // Change this to your DB password
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
    throw new \PDOException($e->getMessage(), (int)$e->getCode());
}
?>
