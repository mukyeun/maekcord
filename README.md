# Maekcord - 맥진 진단 시스템

의료진을 위한 맥진 진단 및 환자 관리 시스템입니다.

## 🚀 빠른 시작

### 개발 환경 시작

**Windows:**
```bash
dev-start.bat
```

**Linux/macOS:**
```bash
chmod +x dev-start.sh
./dev-start.sh
```

### 수동 시작

1. **MongoDB 시작**
   ```bash
   # Windows
   net start MongoDB
   
   # macOS
   brew services start mongodb-community
   
   # Linux
   sudo systemctl start mongod
   ```

2. **백엔드 시작**
   ```bash
   cd backend
   npm install
   npm start
   ```

3. **프론트엔드 시작**
   ```bash
   cd frontend
   npm install
   npm start
   ```

## 📋 시스템 요구사항

- Node.js 18+
- MongoDB 6+
- npm 또는 yarn

## 🔧 환경 설정

### 백엔드 환경변수
```bash
# backend/.env
MONGODB_URI=mongodb://localhost:27017/maekcode
PORT=5000
JWT_SECRET=your-secret-key
```

### 프론트엔드 환경변수
```bash
# frontend/.env
REACT_APP_API_URL=http://localhost:5000
```

## 📚 주요 기능

- **환자 관리**: 환자 정보 등록 및 관리
- **예약 시스템**: 진료 예약 및 일정 관리
- **대기열 관리**: 실시간 대기 환자 관리
- **맥진 진단**: 맥진 데이터 분석 및 진단
- **진료 기록**: 환자별 진료 이력 관리

## 🛠️ 개발 가이드

### 프로젝트 구조
```
maekcord/
├── backend/          # 백엔드 API 서버
├── frontend/         # React 프론트엔드
├── docs/            # 문서
└── scripts/         # 유틸리티 스크립트
```

### API 문서
- Swagger UI: http://localhost:5000/api-docs

### 테스트
```bash
# 백엔드 테스트
cd backend
npm test

# 프론트엔드 테스트
cd frontend
npm test
```

## 🚀 배포

### PM2를 사용한 배포
```bash
# PM2 설치
npm install -g pm2

# 배포 스크립트 실행
chmod +x deploy.sh
./deploy.sh
```

### 수동 배포
```bash
# 백엔드 배포
cd backend
npm ci --only=production
pm2 start ecosystem.config.js --env production

# 프론트엔드 빌드
cd frontend
npm ci --only=production
npm run build
```

## 🔒 보안

- JWT 기반 인증
- API 요청 검증
- 입력 데이터 정제
- CORS 설정

## 📊 모니터링

- PM2 프로세스 관리
- 로그 파일 관리
- 헬스 체크 엔드포인트

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 📞 지원

문제가 발생하면 이슈를 등록해주세요.
