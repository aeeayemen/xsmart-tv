<?php
// backend/login.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"));

    if (!empty($data->username) && !empty($data->password)) {

        try {
            $stmt = $pdo->prepare("SELECT id, username, password_hash, exp_date FROM users WHERE username = :username OR email = :username LIMIT 1");
            $stmt->bindParam(':username', $data->username);
            $stmt->execute();

            if ($stmt->rowCount() > 0) {
                $user = $stmt->fetch();

                // Verify Password
                if (password_verify($data->password, $user['password_hash'])) {

                    // Simple Token Generation (In production, use JWT)
                    $token = bin2hex(random_bytes(16));

                    // Convert date to timestamp for frontend compatibility
                    $exp_timestamp = strtotime($user['exp_date']);

                    http_response_code(200);
                    echo json_encode([
                        "message" => "تم تسجيل الدخول بنجاح.",
                        "token" => $token,
                        "user_info" => [
                            "id" => $user['id'],
                            "username" => $user['username'],
                            "exp_date" => $exp_timestamp
                        ]
                    ]);
                } else {
                    http_response_code(401);
                    echo json_encode(["message" => "كلمة المرور غير صحيحة."]);
                }
            } else {
                http_response_code(404);
                echo json_encode(["message" => "المستخدم غير موجود."]);
            }
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["message" => "Database error.", "error" => $e->getMessage()]);
        }
    } else {
        http_response_code(400);
        echo json_encode(["message" => "يرجى إدخال اسم المستخدم وكلمة المرور."]);
    }
} else {
    http_response_code(405);
    echo json_encode(["message" => "Method not allowed."]);
}
?>