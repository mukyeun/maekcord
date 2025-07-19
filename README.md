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

## 🎨 반응형 디자인

### 주요 개선사항

- **성능 최적화된 반응형 훅**: `useResponsive` 훅으로 브레이크포인트 관리
- **터치 제스처 지원**: 스와이프, 탭 등 모바일 제스처 지원
- **접근성 개선**: 키보드 네비게이션, 스크린 리더 지원
- **다크모드/고대비 모드**: 시스템 설정에 따른 자동 테마 적용
- **모바일 최적화**: 터치 친화적 UI, 최소 44px 터치 영역

### 반응형 컴포넌트

```javascript
import { useResponsive, ResponsiveContainer, ResponsiveGrid } from './components/Common/ResponsiveWrapper';
import ResponsiveLayout from './components/Common/ResponsiveLayout';

// 반응형 레이아웃 사용
const App = () => (
  <ResponsiveLayout
    header={<Header />}
    sidebar={<Sidebar />}
  >
    <ResponsiveContainer>
      <ResponsiveGrid mobileCols={1} tabletCols={2} desktopCols={3}>
        <Card1 />
        <Card2 />
        <Card3 />
      </ResponsiveGrid>
    </ResponsiveContainer>
  </ResponsiveLayout>
);
```

### 브레이크포인트

- **모바일**: 0px - 767px
- **태블릿**: 768px - 1023px  
- **데스크톱**: 1024px - 1439px
- **대형 화면**: 1440px+

### 자세한 가이드

반응형 디자인 사용법과 모범 사례는 [반응형 디자인 가이드](docs/RESPONSIVE_DESIGN_GUIDE.md)를 참조하세요.

## 🛠️ 개발 가이드

### 프로젝트 구조
```
maekcord/
├── backend/          # 백엔드 API 서버
├── frontend/         # React 프론트엔드
│   ├── src/
│   │   ├── components/
│   │   │   └── Common/
│   │   │       ├── ResponsiveWrapper.jsx    # 반응형 유틸리티
│   │   │       └── ResponsiveLayout.jsx     # 반응형 레이아웃
│   │   └── styles/
│   │       └── responsive.css               # 반응형 CSS
├── docs/            # 문서
│   └── RESPONSIVE_DESIGN_GUIDE.md          # 반응형 디자인 가이드
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
