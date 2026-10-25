@echo off
title Adm Money — Compilar APK Local
cd /d "%~dp0AdmMoneyMovil\frontend\android"
echo ========================================================
echo   COMPILANDO APK NATIVO (Adm Money Mobile)
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
  echo   %~dp0Adm_Monet.apk
  echo   %~dp0Adm_Money.apk
  echo ========================================================
) else (
  echo.
  echo [ERROR] La compilacion de Gradle fallo.
)
pause
