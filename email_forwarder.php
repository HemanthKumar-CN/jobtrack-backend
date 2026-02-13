<?php
// Read the incoming email from STDIN (piped input)
$email = file_get_contents("php://stdin");

// Parse email headers and body
$lines = explode("\n", $email);
$from = '';
$body = '';
$isBody = false;

foreach ($lines as $line) {
    if (preg_match('/^From:\s*(.+)$/i', $line, $matches)) {
        $from = trim($matches[1]);
        // Extract email from "Name <email@domain.com>" format
        if (preg_match('/<(.+?)>/', $from, $emailMatch)) {
            $from = $emailMatch[1];
        }
    }
    
    // Body starts after empty line
    if (trim($line) === '' && !$isBody) {
        $isBody = true;
        continue;
    }
    
    if ($isBody) {
        $body .= $line . "\n";
    }
}

// Prepare data for webhook
$data = array(
    'from' => $from,
    'body' => trim($body),
    'email' => $from
);

// Send to your Node.js webhook
$webhook_url = 'https://app.schedyl.com/api/email/reply';

$ch = curl_init($webhook_url);
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type: application/json'));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

// Log the result (optional)
error_log("Email forwarded from: $from, Response code: $httpCode");

exit(0);
?>
