<?php
// This is a simple PHP proxy to bypass CORS issues with Google Sheets
header('Content-Type: text/plain');
header('Access-Control-Allow-Origin: *');

// Validate the URL parameter to ensure it's a Google Sheets URL
$url = isset($_GET['url']) ? $_GET['url'] : '';

if (empty($url)) {
    http_response_code(400);
    echo "Error: No URL provided";
    exit;
}

// Verify this is a Google Sheets URL for security
if (!preg_match('#^https://docs\.google\.com/spreadsheets/d/e/.*?/pub\?output=csv$#', $url)) {
    http_response_code(403);
    echo "Error: URL must be a Google Sheets CSV publish link";
    exit;
}

// Fetch the content from Google Sheets
$options = [
    'http' => [
        'method' => 'GET',
        'header' => [
            'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept: text/csv,text/plain'
        ],
        'timeout' => 15
    ]
];

$context = stream_context_create($options);
$content = @file_get_contents($url, false, $context);

if ($content === false) {
    http_response_code(500);
    echo "Error: Could not retrieve data from Google Sheets";
    exit;
}

// Return the CSV data
echo $content;
?>