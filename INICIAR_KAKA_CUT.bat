@echo off
setlocal
cd /d "%~dp0"

where node.exe >nul 2>nul
if errorlevel 1 goto :missing_node

where npm.cmd >nul 2>nul
if errorlevel 1 goto :missing_npm

for /f "delims=" %%V in ('node -p "process.versions.node.split('.')[0]"') do set "KC_NODE_MAJOR=%%V"
if not "%KC_NODE_MAJOR%"=="24" goto :wrong_node

if not exist "node_modules\electron\dist\electron.exe" (
  echo Instalando dependencias do Kaka Cut...
  call npm install
  if errorlevel 1 goto :error
)

echo Preparando a versao mais recente do Kaka Cut...
call npm run build
if errorlevel 1 goto :error

echo Abrindo o Kaka Cut...
call npm run desktop:dev:shared
exit /b %errorlevel%

:missing_node
echo Node.js nao foi encontrado. Instale o Node.js 24 e tente novamente.
exit /b 1

:missing_npm
echo npm nao foi encontrado. Reinstale o Node.js 24 e tente novamente.
exit /b 1

:wrong_node
echo O Kaka Cut requer Node.js 24. Versao encontrada: %KC_NODE_MAJOR%.
exit /b 1

:error
echo.
echo Nao foi possivel iniciar o Kaka Cut.
echo Consulte o arquivo KAKA_CUT_INICIO.log para ver o erro.
exit /b 1
