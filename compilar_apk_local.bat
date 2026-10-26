@echo off
title Adm Money — Compilar APK Local
cd /d "%~dp0"

echo ========================================================
echo   ADM MONEY — COMPILADOR DE APK NATIVO ANDROID
echo ========================================================
echo.
echo   [1] Compilar localmente Y publicar Release a GitHub (Recomendado)
echo   [2] Compilar localmente solamente (sin subir a GitHub)
echo.
set /p OPCION="Selecciona una opcion [1 o 2] (Por defecto 1): "

if "%OPCION%"=="" set OPCION=1
if "%OPCION%"=="1" (
  python "%~dp0publicar_release.py"
  exit /b
)

cd /d "%~dp0AdmMoneyMovil\frontend\android"
echo.
echo ========================================================
echo   COMPILANDO APK NATIVO LOCALMENTE...
echo ========================================================
echo.
call gradlew assembleRelease
if %ERRORLEVEL% EQU 0 (
  if exist "app\build\outputs\apk\release\Adm_Monet.apk" (
    copy /Y "app\build\outputs\apk\release\Adm_Monet.apk" "%~dp0Adm_Monet.apk" >nul
    copy /Y "app\build\outputs\apk\release\Adm_Monet.apk" "%~dp0Adm_Money.apk" >nul
  ) else if exist "app\build\outputs\apk\release\app-release.apk" (
    copy /Y "app\build\outputs\apk\release\app-release.apk" "%~dp0Adm_Monet.apk" >nul
    copy /Y "app\build\outputs\apk\release\app-release.apk" "%~dp0Adm_Money.apk" >nul
  )
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
