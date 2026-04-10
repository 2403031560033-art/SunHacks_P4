@echo off
echo Installing OrgMemory backend dependencies...
cd /d "%~dp0"
python -m pip install PyJWT==2.8.0 bcrypt==4.1.3 flask flask-cors chromadb==0.4.22 PyPDF2 posthog==3.3.1
echo.
echo Done! Now starting the backend server...
python app.py
pause
