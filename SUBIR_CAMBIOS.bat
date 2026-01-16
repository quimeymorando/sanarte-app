@echo off
echo ===================================================
echo      SANARTE - DESPLEGANDO CAMBIOS A LA NUBE
echo ===================================================
echo.
echo 1. Guardando archivos locales...
git add .
echo.

echo 2. Creando punto de restauracion (Commit)...
set /p commit_msg="Describe el cambio (ej. Arregle el boton): "
if "%commit_msg%"=="" set commit_msg="Actualizacion general"
git commit -m "%commit_msg%"
echo.

echo 3. Subiendo a GitHub y Vercel...
git push origin main
echo.
echo ===================================================
echo      LISTO! TU CAMBIO ESTA EN CAMINO
echo      Verifica en: https://sanarte.vercel.app
echo ===================================================
pause
