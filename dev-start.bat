@echo off
chcp 65001 >nul
echo 🔧 Maekcord 개발 환경 시작...

REM MongoDB 상태 확인
echo 📊 MongoDB 상태 확인...
sc query MongoDB | find "RUNNING" >nul
if errorlevel 1 (
    echo ⚠️ MongoDB가 실행되지 않았습니다.
    echo    net start MongoDB 명령어로 MongoDB를 시작해주세요.
    pause
    exit /b 1
)

REM 백엔드 시작
echo 🚀 백엔드 서버 시작...
cd backend

REM 의존성 확인
if not exist "node_modules" (
    echo 📦 백엔드 의존성 설치 중...
    npm install
)

REM 환경 변수 파일 확인
if not exist ".env" (
    echo ⚠️ .env 파일이 없습니다. .env.example을 복사합니다.
    copy .env.example .env
)

REM 백엔드 서버 시작
echo 🔄 백엔드 서버 시작 중...
start "Backend Server" cmd /k "npm start"

REM 프론트엔드 시작
echo 🚀 프론트엔드 서버 시작...
cd ..\frontend

REM 의존성 확인
if not exist "node_modules" (
    echo 📦 프론트엔드 의존성 설치 중...
    npm install
)

REM 프론트엔드 서버 시작
echo 🔄 프론트엔드 서버 시작 중...
start "Frontend Server" cmd /k "npm start"

REM 서버 URL 출력
echo 🌐 서버 URL:
echo    백엔드: http://localhost:5000
echo    프론트엔드: http://localhost:3000
echo    API 문서: http://localhost:5000/api-docs

echo ✅ 개발 환경이 시작되었습니다!
pause 