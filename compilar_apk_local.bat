@echo off
title Adm Money — Compilar APK Local
cd /d "%~dp0AdmMoneyMovil\frontend\android"
echo ========================================================
echo   COMPILANDO APK NATIVO (Adm Money Mobile)
echo ========================================================
echo.
call gradlew assembleRelease
echo.
echo ========================================================
echo   LISTO! El APK actualizado se encuentra en:
echo   AdmMoneyMovil\frontend\android\app\build\outputs\apk\release\app-release.apk
echo ========================================================
pause
