#!/bin/bash

# 개발 환경 시작 스크립트
echo "🔧 Maekcord 개발 환경 시작..."

# MongoDB 시작 확인
echo "📊 MongoDB 상태 확인..."
if ! pgrep -x "mongod" > /dev/null; then
    echo "⚠️ MongoDB가 실행되지 않았습니다. MongoDB를 시작해주세요."
    echo "   Windows: net start MongoDB"
    echo "   macOS: brew services start mongodb-community"
    echo "   Linux: sudo systemctl start mongod"
fi

# 백엔드 시작
echo "🚀 백엔드 서버 시작..."
cd backend

# 의존성 확인
if [ ! -d "node_modules" ]; then
    echo "📦 백엔드 의존성 설치 중..."
    npm install
fi

# 환경 변수 파일 확인
if [ ! -f .env ]; then
    echo "⚠️ .env 파일이 없습니다. .env.example을 복사합니다."
    cp .env.example .env
fi

# 백엔드 서버 시작 (백그라운드)
echo "🔄 백엔드 서버 시작 중..."
npm start &
BACKEND_PID=$!

# 프론트엔드 시작
echo "🚀 프론트엔드 서버 시작..."
cd ../frontend

# 의존성 확인
if [ ! -d "node_modules" ]; then
    echo "📦 프론트엔드 의존성 설치 중..."
    npm install
fi

# 프론트엔드 서버 시작
echo "🔄 프론트엔드 서버 시작 중..."
npm start &
FRONTEND_PID=$!

# 서버 상태 확인
sleep 5
echo "📊 서버 상태 확인..."
echo "백엔드 PID: $BACKEND_PID"
echo "프론트엔드 PID: $FRONTEND_PID"

# 서버 URL 출력
echo "🌐 서버 URL:"
echo "   백엔드: http://localhost:5000"
echo "   프론트엔드: http://localhost:3000"
echo "   API 문서: http://localhost:5000/api-docs"

# 프로세스 종료 처리
trap "echo '🛑 서버 종료 중...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT

# 대기
echo "⏳ 서버가 실행 중입니다. Ctrl+C로 종료하세요."
wait 