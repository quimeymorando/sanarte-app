@echo off
color 4f
echo ===================================================
echo      SANARTE - BOTON DE PANICO (REVERTIR)
echo ===================================================
echo.
echo ATENCION: Esto deshara el ULTIMO cambio que subiste.
echo Usalo solo si la aplicacion se rompio recien.
echo.
pause
echo.
echo 1. Deshaciendo el ultimo cambio...
git revert HEAD --no-edit
echo.

echo 2. Subiendo correccion a la nube...
git push origin main
echo.
echo ===================================================
echo      REVERSION COMPLETADA
echo      La app deberia volver a funcionar en unos minutos.
echo ===================================================
pause
