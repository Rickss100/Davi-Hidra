# Script para matar processo na porta 3002
# Uso: powershell .\kill-port-3002.ps1

Write-Host "🔍 Procurando processo na porta 3002..." -ForegroundColor Cyan

# Encontrar o processo usando a porta 3002
$connection = Get-NetTCPConnection -LocalPort 3002 -ErrorAction SilentlyContinue

if ($connection) {
    $processId = $connection.OwningProcess
    $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
    
    if ($process) {
        Write-Host "🎯 Encontrado: $($process.ProcessName) (PID: $processId)" -ForegroundColor Yellow
        Write-Host "💀 Matando processo..." -ForegroundColor Red
        
        Stop-Process -Id $processId -Force
        Start-Sleep -Milliseconds 500
        
        Write-Host "✅ Porta 3002 liberada!" -ForegroundColor Green
    }
} else {
    Write-Host "✅ Porta 3002 já está livre!" -ForegroundColor Green
}

Write-Host ""
Write-Host "Agora você pode executar: npm start" -ForegroundColor White
