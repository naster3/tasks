$ErrorActionPreference = "Stop"

$venvPath = ".venv"

if (-not (Test-Path $venvPath)) {
  python -m venv $venvPath
}

& "$venvPath\\Scripts\\Activate.ps1"

pip install -r requirements.txt
pip install pyinstaller

pyinstaller --onefile --name backend app.py

$targetDir = "..\\src-tauri\\binaries"
if (-not (Test-Path $targetDir)) {
  New-Item -ItemType Directory -Path $targetDir | Out-Null
}

$targetTriple = "x86_64-pc-windows-msvc"
$targetPath = "$targetDir\\backend-$targetTriple.exe"
Copy-Item "dist\\backend.exe" $targetPath -Force

Write-Host "Sidecar generado en $targetPath"
