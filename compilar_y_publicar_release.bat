@echo off
title Adm Money — Compilar y Publicar Release en GitHub
cd /d "%~dp0"
python "%~dp0publicar_release.py"
if %ERRORLEVEL% NEQ 0 (
  pause
)
