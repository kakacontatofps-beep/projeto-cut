@echo off
setlocal
cd /d "%~dp0"

set "KC_NODE=C:\Users\kaina\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
set "KC_NPM=C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js"

if not exist "%KC_NODE%" (
  echo O runtime Node.js 24 do Kaka Cut nao foi encontrado.
  echo Consulte README_EDITOR_DOCUMENTAL.md.
  pause
  exit /b 1
)

if not exist "%KC_NPM%" (
  echo O npm nao foi encontrado em %KC_NPM%.
  pause
  exit /b 1
)

set "PATH=C:\Users\kaina\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;%PATH%"

if not exist "node_modules\electron\dist\electron.exe" (
  echo Instalando dependencias do Kaka Cut...
  "%KC_NODE%" "%KC_NPM%" install
  if errorlevel 1 goto :error
)

if not exist "dist\index.html" (
  echo Preparando a interface do Kaka Cut...
  "%KC_NODE%" "%KC_NPM%" run build
  if errorlevel 1 goto :error
)

"%KC_NODE%" "%KC_NPM%" run desktop:dev:shared
exit /b %errorlevel%

:error
echo.
echo Nao foi possivel iniciar o Kaka Cut.
echo Consulte README_EDITOR_DOCUMENTAL.md.
pause
exit /b 1
