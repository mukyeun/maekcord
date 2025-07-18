#!/bin/bash

# 배포 스크립트
echo "🚀 Maekcord 배포 시작..."

# 환경 변수 설정
export NODE_ENV=production

# 백엔드 배포
echo "📦 백엔드 배포 중..."
cd backend

# 의존성 설치
npm ci --only=production

# 환경 변수 파일 확인
if [ ! -f .env ]; then
    echo "⚠️ .env 파일이 없습니다. .env.example을 복사합니다."
    cp .env.example .env
fi

# PM2로 애플리케이션 시작
pm2 start ecosystem.config.js --env production

# PM2 상태 확인
pm2 status

echo "✅ 백엔드 배포 완료"

# 프론트엔드 배포
echo "📦 프론트엔드 배포 중..."
cd ../frontend

# 의존성 설치
npm ci --only=production

# 빌드
npm run build

echo "✅ 프론트엔드 배포 완료"

# 전체 상태 확인
echo "📊 배포 상태 확인..."
pm2 status
pm2 logs --lines 10

echo "🎉 배포 완료!" 