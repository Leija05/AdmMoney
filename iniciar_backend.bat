@echo off
title Adm Money — Backend API
cd /d "%~dp0admmoney-backend"
echo ========================================================
echo   Iniciando Backend API de Adm Money en puerto 8000
echo ========================================================
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
pause
