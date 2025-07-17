# 멀티스테이지 빌드 - 프론트엔드
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# 프론트엔드 의존성 설치
COPY frontend/package*.json ./
RUN npm ci --only=production

# 프론트엔드 소스 복사 및 빌드
COPY frontend/ ./
RUN npm run build

# 백엔드 빌드
FROM node:18-alpine AS backend-builder

WORKDIR /app/backend

# 백엔드 의존성 설치
COPY backend/package*.json ./
RUN npm ci --only=production

# 백엔드 소스 복사
COPY backend/ ./

# 프로덕션 이미지
FROM node:18-alpine AS production

# 필요한 패키지 설치
RUN apk add --no-cache dumb-init

# 애플리케이션 사용자 생성
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# 작업 디렉토리 설정
WORKDIR /app

# 백엔드 파일 복사
COPY --from=backend-builder --chown=nodejs:nodejs /app/backend ./backend

# 프론트엔드 빌드 결과 복사
COPY --from=frontend-builder --chown=nodejs:nodejs /app/frontend/build ./frontend/build

# 환경변수 설정
ENV NODE_ENV=production
ENV PORT=5000

# 포트 노출
EXPOSE 5000

# 사용자 변경
USER nodejs

# 헬스체크
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# 애플리케이션 시작
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "backend/server.js"] 