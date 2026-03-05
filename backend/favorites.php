<?php
// backend/favorites.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

require_once 'config.php';

// Handle Preflight Requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Ensure user_id is provided in headers or body for all operations
$headers = apache_request_headers();
// For simplicity in this vanilla JS app, we expect user_id to be sent directly.
// In production, this should be verified via a JWT Token in the Authorization header.

$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'GET') {
        // GET /favorites.php?user_id=1&type=live
        if (!isset($_GET['user_id'])) {
            http_response_code(401);
            echo json_encode(["message" => "Unauthorized"]);
            exit();
        }
        $user_id = $_GET['user_id'];
        $type = $_GET['type'] ?? '';

        $sql = "SELECT stream_id, name, icon_url as stream_icon FROM favorites WHERE user_id = :user_id";
        if ($type) {
            $sql .= " AND type = :type";
        }

        $stmt = $pdo->prepare($sql);
        $stmt->bindParam(':user_id', $user_id);
        if ($type)
            $stmt->bindParam(':type', $type);

        $stmt->execute();
        $favorites = $stmt->fetchAll();

        http_response_code(200);
        echo json_encode($favorites);

    } elseif ($method === 'POST') {
        // Add to favorites
        $data = json_decode(file_get_contents("php://input"));
        if (!isset($data->user_id) || !isset($data->type) || !isset($data->stream_id)) {
            http_response_code(400);
            echo json_encode(["message" => "Missing required fields"]);
            exit();
        }

        $stmt = $pdo->prepare("INSERT INTO favorites (user_id, type, stream_id, name, icon_url) 
                               VALUES (:user_id, :type, :stream_id, :name, :icon_url)
                               ON DUPLICATE KEY UPDATE name=:name");

        $stmt->bindParam(':user_id', $data->user_id);
        $stmt->bindParam(':type', $data->type);
        $stmt->bindParam(':stream_id', $data->stream_id);
        $stmt->bindParam(':name', $data->name);
        $stmt->bindParam(':icon_url', $data->icon_url);

        if ($stmt->execute()) {
            http_response_code(201);
            echo json_encode(["message" => "Favorite added"]);
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Failed to add favorite"]);
        }

    } elseif ($method === 'DELETE') {
        // Remove from favorites
        // DELETE /favorites.php?user_id=1&type=live&stream_id=123
        if (!isset($_GET['user_id']) || !isset($_GET['type']) || !isset($_GET['stream_id'])) {
            http_response_code(400);
            echo json_encode(["message" => "Missing required fields"]);
            exit();
        }

        $stmt = $pdo->prepare("DELETE FROM favorites WHERE user_id = :user_id AND type = :type AND stream_id = :stream_id");
        $stmt->bindParam(':user_id', $_GET['user_id']);
        $stmt->bindParam(':type', $_GET['type']);
        $stmt->bindParam(':stream_id', $_GET['stream_id']);

        if ($stmt->execute()) {
            http_response_code(200);
            echo json_encode(["message" => "Favorite removed"]);
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Failed to remove favorite"]);
        }
    } else {
        http_response_code(405);
        echo json_encode(["message" => "Method not allowed"]);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Database error.", "error" => $e->getMessage()]);
}
?>