@echo off
cd /d "%~dp0"
echo Starting rezi.lol config editor...
python app.py
if errorlevel 1 pause
