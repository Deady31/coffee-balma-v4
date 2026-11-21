@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Coffee Balma - demo

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo  Node.js n'est pas installe sur cet ordinateur.
  echo  Installe la version LTS depuis https://nodejs.org puis relance ce fichier.
  echo.
  pause
  exit /b 1
)

if not exist "dist\index.html" (
  echo  Le dossier dist est absent : construction du site...
  if not exist "node_modules" call npm install
  call npm run build
  if errorlevel 1 (
    echo.
    echo  La construction a echoue. Lis le message ci-dessus.
    pause
    exit /b 1
  )
)

echo.
echo  Lancement de Coffee Balma sur http://localhost:4173
echo  Ferme cette fenetre pour arreter la demo.
echo.
node scripts\serve-dist.mjs
pause
