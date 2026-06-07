# Load environment variables from .env file
if (Test-Path ".env") {
    Get-Content ".env" | ForEach-Object {
        if ($_ -match "^([a-zA-Z0-9_]+)=(.*)$") {
            Set-Item -Force -Path "env:$($matches[1])" -Value $matches[2]
        }
    }
} else {
    Write-Warning ".env file not found. Please create it with your certificate details."
    exit 1
}

# Verify variables are set
if (-not $env:TAURI_CERTIFICATE_PASSWORD) {
    Write-Error "TAURI_CERTIFICATE_PASSWORD is not set."
    exit 1
}

npm run tauri build
