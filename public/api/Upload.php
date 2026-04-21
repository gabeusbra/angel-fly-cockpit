<?php
/**
 * Angel Fly Cockpit — File Upload Handler
 */

class Upload {
    public static function handle(): void {
        Auth::requireAuth();

        if (empty($_FILES['file'])) {
            json_error('No file uploaded. Send as multipart/form-data with field name "file".');
        }

        $file = $_FILES['file'];

        if ($file['error'] !== UPLOAD_ERR_OK) {
            json_error('Upload error: ' . $file['error']);
        }

        if ($file['size'] > MAX_UPLOAD_SIZE) {
            json_error('File too large. Maximum: ' . (MAX_UPLOAD_SIZE / 1024 / 1024) . 'MB');
        }

        // Create uploads directory if needed
        if (!is_dir(UPLOAD_DIR)) {
            mkdir(UPLOAD_DIR, 0755, true);
        }

        // Generate unique filename
        $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
        $safeName = preg_replace('/[^a-zA-Z0-9._-]/', '', pathinfo($file['name'], PATHINFO_FILENAME));
        $uniqueName = $safeName . '_' . bin2hex(random_bytes(6)) . ($ext ? ".$ext" : '');

        // Organize by year/month
        $subDir = date('Y/m');
        $targetDir = UPLOAD_DIR . $subDir;
        if (!is_dir($targetDir)) {
            mkdir($targetDir, 0755, true);
        }

        $targetPath = $targetDir . '/' . $uniqueName;

        if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
            json_error('Failed to save uploaded file', 500);
        }

        // Build public URL
        $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
        $host = $_SERVER['HTTP_HOST'];
        $fileUrl = "$protocol://$host" . UPLOAD_URL . "$subDir/$uniqueName";

        json_response([
            'file_url' => $fileUrl,
            'file_name' => $file['name'],
            'file_size' => $file['size'],
            'file_type' => $file['type'],
        ]);
    }
}
