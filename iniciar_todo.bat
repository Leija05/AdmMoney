@echo off
title Adm Money — Lanzador Completo
echo ========================================================
echo   Iniciando Suite Completa de Adm Money
echo   1. Backend API (FastAPI) -> http://localhost:8000
echo   2. Pagina Web (Vite + React) -> http://localhost:5173
echo   3. App Movil (Expo React Native) -> http://localhost:8081
echo ========================================================

start "Adm Money - Backend" cmd /k "cd /d "%~dp0admmoney-backend" && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
timeout /t 2 /nobreak >nul
start "Adm Money - Web" cmd /k "cd /d "%~dp0AdmMoneyPage\frontend" && npm run dev"
timeout /t 2 /nobreak >nul
start "Adm Money - Movil" cmd /k "cd /d "%~dp0AdmMoneyMovil\frontend" && npx expo start"

echo.
echo Todo iniciado correctamente.
echo - Web: http://localhost:5173
echo - Backend API Docs: http://localhost:8000/docs
echo - App Movil: Escanea el codigo QR de Expo en tu celular
pause
