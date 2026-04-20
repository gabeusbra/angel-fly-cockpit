<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS");
header("Access-Control-Allow-Headers: *");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$request = $_GET['request'] ?? '';
$target_url = "https://api.base44.com/api/" . $request;

// Append query parameters normally
$query_string = $_SERVER['QUERY_STRING'] ?? '';
$query_string = preg_replace('/^request=[^&]*&?/', '', $query_string);
if (!empty($query_string)) {
    $target_url .= "?" . $query_string;
}

if (!function_exists('getallheaders')) {
    function getallheaders() {
        $headers = [];
        foreach ($_SERVER as $name => $value) {
            if (substr($name, 0, 5) == 'HTTP_') {
                $headers[str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))))] = $value;
            }
        }
        return $headers;
    }
}

$ch = curl_init($target_url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $_SERVER['REQUEST_METHOD']);

$headers = [];
foreach (getallheaders() as $name => $value) {
    if (strtolower($name) != 'host' && strtolower($name) != 'origin' && strtolower($name) != 'content-length') {
        $headers[] = "$name: $value";
    }
}
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

$input = file_get_contents('php://input');
if ($input) {
    curl_setopt($ch, CURLOPT_POSTFIELDS, $input);
}

curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);

$response = curl_exec($ch);
$httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
if(curl_errno($ch)){
    http_response_code(500);
    echo json_encode(["error" => curl_error($ch)]);
    exit();
}
curl_close($ch);

header("Content-Type: application/json");
http_response_code($httpcode);
echo $response;
?>
