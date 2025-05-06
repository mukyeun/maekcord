@echo off
REM 1. 작업 디렉터리로 이동
cd /d D:\Maekstation

REM 2. 기존 frontend 폴더 삭제
echo 기존 frontend 폴더 삭제 중...
rmdir /s /q frontend

REM 3. React 앱 생성
echo React 앱 생성 중...
npx create-react-app frontend

REM 4. 생성 완료 후 프로젝트 폴더로 이동
cd frontend

REM 5. 개발 서버 실행
echo 개발 서버 시작 중...
npm start
