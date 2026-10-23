@echo off
title Adm Money — Exportar APK Nativo Android
cd /d "%~dp0AdmMoneyMovil\frontend"
echo ========================================================
echo   EXPORTAR APK NATIVO DE ANDROID (Adm Money Mobile)
echo ========================================================
echo.
echo Este proceso compila un archivo .apk independiente que podras
echo instalar directamente en cualquier celular Android (sin Play Store).
echo.
echo Si es tu primera vez, te pedira iniciar sesion con tu cuenta
echo gratuita de Expo (creala en https://expo.dev si aun no la tienes).
echo.
echo Presiona cualquier tecla para comenzar la compilacion...
pause >nul
npx eas build -p android --profile preview
pause
