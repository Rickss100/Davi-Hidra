@echo off
REM Script para matar processo na porta 3002
REM Uso: kill-port-3002.bat

echo 🔍 Procurando processo na porta 3002...

for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3002') do (
    set PID=%%a
)

if defined PID (
    echo 💀 Matando processo PID: %PID%
    taskkill /PID %PID% /F
    echo ✅ Porta 3002 liberada!
) else (
    echo ✅ Porta 3002 já está livre!
)

echo.
echo Agora você pode executar: npm start
pause
