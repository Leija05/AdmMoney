@echo off
title Adm Money — Compilar APK Local
cd /d "%~dp0AdmMoneyMovil\frontend\android"
echo ========================================================
echo   COMPILANDO APK NATIVO (Adm Money Mobile)
echo ========================================================
echo.
call gradlew assembleRelease
if %ERRORLEVEL% EQU 0 (
  copy /Y "app\build\outputs\apk\release\app-release.apk" "%~dp0Adm_Money.apk"
  echo.
  echo ========================================================
  echo   EXITO TOTAL! APK actualizado y copiado a:
  echo   %~dp0Adm_Money.apk
  echo ========================================================
) else (
  echo.
  echo [ERROR] La compilacion de Gradle fallo.
)
pause
