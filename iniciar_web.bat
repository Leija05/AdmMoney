@echo off
title Adm Money — Web Frontend
cd /d "%~dp0AdmMoneyPage\frontend"
echo ========================================================
echo   Iniciando Web Frontend de Adm Money en puerto 5173
echo ========================================================
npm run dev
pause
