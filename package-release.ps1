Write-Host "Packaging Billora Standalone..." -ForegroundColor Cyan

# Define variables
$version = "v1.0"
$target = "billora_standalone_$version"
$distExe = "dist/billora.exe"
$canvasNode = "node_modules/canvas/build/Release/canvas.node"

# 1. Clean and Create Target Folder
if (Test-Path $target) { 
    Write-Host "Cleaning old release folder..."
    Remove-Item $target -Recurse -Force 
}
New-Item -ItemType Directory -Force -Path $target | Out-Null

# 2. Check and Copy Executable
if (Test-Path $distExe) {
    Copy-Item $distExe -Destination "$target/"
} else {
    Write-Error "billora.exe not found! Please run 'npm run build' first."
    Exit
}

# 3. Create .env Config
Write-Host "Creating configuration file..."
if (Test-Path ".env") {
    $envLines = Get-Content ".env"
    $newEnvContent = @()
    $hasAppMode = $false
    
    foreach ($line in $envLines) {
        if ($line -match "^APP_MODE=") {
            $newEnvContent += "APP_MODE=standalone"
            $hasAppMode = $true
        } else {
            $newEnvContent += $line
        }
    }
    
    if (-not $hasAppMode) {
        $newEnvContent += "APP_MODE=standalone"
    }
    
    $newEnvContent | Out-File "$target/.env" -Encoding utf8
} else {
    Write-Warning ".env file not found, creating default."
    "APP_MODE=standalone`nPORT=5000`nDB_HOST=localhost`nDB_USER=root" | Out-File "$target/.env" -Encoding utf8
}

# 4. Create Necessary Directories
Write-Host "Creating data directories..."
New-Item -ItemType Directory -Force -Path "$target/backups" | Out-Null
New-Item -ItemType Directory -Force -Path "$target/public/uploads" | Out-Null
New-Item -ItemType Directory -Force -Path "$target/logs" | Out-Null

# 5. Handle Native Modules (Canvas)
if (Test-Path $canvasNode) {
    Write-Host "Copying canvas.node native module..."
    Copy-Item $canvasNode -Destination "$target/"
} else {
    Write-Warning "canvas.node not found. Some image features might fail if not resolved."
}

# 6. Create README
$readmeContent = @(
    "=== Billora Standalone Installation Guide ===",
    "",
    "1. Database Setup:",
    "   - Ensure MySQL is installed and running.",
    "   - Create a database named 'bill_ocr' (or match the name in .env).",
    "   - Import the provided SQL schema (if any).",
    "",
    "2. Configuration:",
    "   - Open .env file with Notepad.",
    "   - Update DB_USER and DB_PASSWORD to match your MySQL credentials.",
    "   - Adjust PORT if needed (Default: 5000).",
    "",
    "3. Start Application:",
    "   - Double-click 'billora.exe'.",
    "   - A console window will appear showing the server status.",
    "   - Keep this window open while using the program.",
    "",
    "4. Access:",
    "   - Open your web browser (Chrome/Edge).",
    "   - Go to: http://localhost:5000 (or the port you configured).",
    "",
    "Troubleshooting:",
    "- If image processing fails, ensure 'canvas.node' is in the same folder as 'billora.exe'.",
    "- If database errors occur, check .env credentials."
)
$readmeContent | Out-File "$target/README.txt" -Encoding utf8

Write-Host "Done! Release Package Ready at: $target" -ForegroundColor Green
Write-Host "You can now Zip this folder and deliver it to the customer." -ForegroundColor Green
