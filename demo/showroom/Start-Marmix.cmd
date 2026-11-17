@echo off
setlocal
cd /d "%~dp0"
where node.exe >nul 2>nul
if errorlevel 1 (
  echo Node.js 24 or newer is required.
  pause
  exit /b 1
)
powershell.exe -NoLogo -NoProfile -Command "$p = Read-Host 'Enter an admin password (at least 12 characters)' -AsSecureString; $env:ADMIN_PASSWORD = [System.Net.NetworkCredential]::new('', $p).Password; node.exe server.mjs; exit $LASTEXITCODE"
if errorlevel 1 pause