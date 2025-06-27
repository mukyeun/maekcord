# 의료 대기열 관리 시스템 - 프론트엔드

## 📋 프로젝트 개요

의료 대기열 관리 시스템의 프론트엔드 애플리케이션입니다. 환자 접수, 대기열 관리, 의사 상담, 실시간 모니터링 등의 기능을 제공합니다.

## ✨ 주요 기능

### 🏥 접수실 대시보드
- 실시간 환자 대기열 관리
- 환자 검색 및 필터링
- 키보드 단축키 지원
- 오프라인 모드 지원
- 성능 모니터링

### 👨‍⚕️ 의사 상담 화면
- 환자 정보 조회
- 맥박파 분석 및 시각화
- 스트레스 평가
- 진료 기록 작성
- 실시간 데이터 동기화

### 📊 대기열 디스플레이
- 실시간 대기열 표시
- 환자 호출 기능
- 음성 안내 지원
- 반응형 디자인

### 🔐 보안 기능
- JWT 토큰 기반 인증
- 역할 기반 접근 제어 (RBAC)
- XSS 방지
- CSRF 보호
- 입력 데이터 검증

## 🛠 기술 스택

### Frontend
- **React 18** - 사용자 인터페이스
- **Redux Toolkit** - 상태 관리
- **Ant Design** - UI 컴포넌트 라이브러리
- **React Router** - 라우팅
- **Axios** - HTTP 클라이언트
- **WebSocket** - 실시간 통신

### 개발 도구
- **Create React App** - 프로젝트 설정
- **Jest** - 테스트 프레임워크
- **React Testing Library** - 컴포넌트 테스트
- **ESLint** - 코드 품질 관리
- **Prettier** - 코드 포맷팅

### 보안
- **DOMPurify** - XSS 방지
- **JWT** - 토큰 기반 인증
- **CSP** - 콘텐츠 보안 정책

## 🚀 설치 및 실행

### 필수 요구사항
- Node.js 16.0 이상
- npm 8.0 이상

### 설치
```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm start

# 테스트 실행
npm test

# 프로덕션 빌드
npm run build
```

### 환경 변수 설정
```bash
# .env 파일 생성
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_WS_URL=ws://localhost:3000/ws
REACT_APP_ENV=development
```

## 📁 프로젝트 구조

```
src/
├── api/                    # API 관련 파일
├── components/             # React 컴포넌트
│   ├── Auth/              # 인증 관련 컴포넌트
│   ├── Common/            # 공통 컴포넌트
│   ├── DoctorView/        # 의사 상담 화면
│   ├── PatientForm/       # 환자 정보 입력
│   ├── QueueDisplay/      # 대기열 디스플레이
│   └── ReceptionDashboard/ # 접수실 대시보드
├── config/                # 설정 파일
├── contexts/              # React Context
├── hooks/                 # 커스텀 훅
├── pages/                 # 페이지 컴포넌트
├── routes/                # 라우팅 설정
├── services/              # 서비스 로직
├── store/                 # Redux 스토어
├── styles/                # 스타일 파일
├── types/                 # TypeScript 타입
└── utils/                 # 유틸리티 함수
```

## 🧪 테스트

### 테스트 실행
```bash
# 전체 테스트 실행
npm test

# 커버리지와 함께 실행
npm test -- --coverage

# 특정 테스트 파일 실행
npm test -- --testPathPattern=ReceptionDashboard

# 통합 테스트 실행
npm test -- --testPathPattern=integration
```

### 테스트 커버리지
- **전체 커버리지**: 9.82%
- **주요 컴포넌트**:
  - ReceptionDashboard: 37.19%
  - QueueDisplay: 37.93%
  - Security Utils: 84.44%

## 🔧 개발 가이드

### 코드 스타일
- ESLint 규칙 준수
- Prettier 자동 포맷팅
- 컴포넌트별 파일 분리
- TypeScript 타입 정의

### 컴포넌트 작성 규칙
```jsx
// 컴포넌트 구조
import React from 'react';
import PropTypes from 'prop-types';

const ComponentName = ({ prop1, prop2 }) => {
  // 로직
  return (
    <div>
      {/* JSX */}
    </div>
  );
};

ComponentName.propTypes = {
  prop1: PropTypes.string.isRequired,
  prop2: PropTypes.number
};

export default ComponentName;
```

### 상태 관리
- Redux Toolkit 사용
- 슬라이스별 상태 분리
- 비동기 작업은 thunk 사용

## 🔐 보안 고려사항

### 인증 및 권한
- JWT 토큰 기반 인증
- 토큰 자동 갱신
- 역할 기반 접근 제어

### 데이터 보안
- 입력 데이터 검증
- XSS 방지 (DOMPurify)
- HTTPS 통신

### 오류 처리
- 전역 오류 바운더리
- 사용자 친화적 오류 메시지
- 로깅 및 모니터링

## 📱 반응형 디자인

- 모바일 우선 접근법
- 브레이크포인트별 최적화
- 터치 친화적 인터페이스

## 🚀 배포

### 빌드
```bash
npm run build
```

### 환경별 설정
- Development: 개발용 설정
- Production: 프로덕션 최적화
- Staging: 스테이징 환경

## 🤝 기여 가이드

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 📞 지원

- 이슈 리포트: GitHub Issues
- 기술 지원: 개발팀 문의
- 문서: 프로젝트 Wiki

## 🔄 업데이트 로그

### v1.0.0 (2024-12-01)
- 초기 릴리즈
- 기본 대기열 관리 기능
- 의사 상담 화면
- 실시간 통신
- 보안 기능 구현
