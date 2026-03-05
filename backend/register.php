<?php
// backend/register.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"));

    if (!empty($data->username) && !empty($data->email) && !empty($data->password)) {

        // Hash the password
        $password_hash = password_hash($data->password, PASSWORD_BCRYPT);

        try {
            $stmt = $pdo->prepare("INSERT INTO users (username, email, password_hash) VALUES (:username, :email, :password_hash)");
            $stmt->bindParam(':username', $data->username);
            $stmt->bindParam(':email', $data->email);
            $stmt->bindParam(':password_hash', $password_hash);

            if ($stmt->execute()) {
                http_response_code(201);
                echo json_encode(["message" => "تم إنشاء الحساب بنجاح."]);
            } else {
                http_response_code(503);
                echo json_encode(["message" => "حدث خطأ أثناء إنشاء الحساب."]);
            }
        } catch (PDOException $e) {
            http_response_code(400);
            if ($e->getCode() == 23000) { // Integrity constraint violation
                echo json_encode(["message" => "اسم المستخدم أو البريد الإلكتروني مستخدم بالفعل."]);
            } else {
                echo json_encode(["message" => "Database error.", "error" => $e->getMessage()]);
            }
        }
    } else {
        http_response_code(400);
        echo json_encode(["message" => "يرجى ملء جميع الحقول المطلوبة."]);
    }
} else {
    http_response_code(405);
    echo json_encode(["message" => "Method not allowed."]);
}
?>