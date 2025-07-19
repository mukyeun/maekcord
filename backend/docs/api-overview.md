# Maekcord API 문서 개요

## 📋 API 서버 정보

- **기본 URL**: `http://localhost:5000`
- **API 문서**: `http://localhost:5000/api-docs`
- **헬스 체크**: `http://localhost:5000/health`
- **WebSocket**: `ws://localhost:5000/`

## 🔐 인증

모든 API는 JWT 토큰 기반 인증을 사용합니다.

### 토큰 사용법
```bash
# 헤더에 토큰 포함
Authorization: Bearer <your-jwt-token>
```

### 토큰 획득
```bash
POST /api/auth/login
{
  "email": "admin@test.com",
  "password": "123456"
}
```

## 📚 API 카테고리

### 1. 인증 (Authentication)
- **로그인**: `POST /api/auth/login`
- **토큰 갱신**: `POST /api/auth/refresh`
- **사용자 정보**: `GET /api/auth/me`

### 2. 환자 관리 (Patients)
- **환자 목록**: `GET /api/patients`
- **환자 등록**: `POST /api/patients`
- **환자 상세**: `GET /api/patients/:id`
- **환자 수정**: `PUT /api/patients/:id`
- **환자 삭제**: `DELETE /api/patients/:id`

### 3. 대기열 관리 (Queue)
- **대기열 목록**: `GET /api/queues`
- **대기 등록**: `POST /api/queues`
- **환자 호출**: `POST /api/queues/call/:id`
- **다음 환자**: `POST /api/queues/call/next`

### 4. 예약 관리 (Appointments)
- **예약 목록**: `GET /api/appointments`
- **예약 등록**: `POST /api/appointments`
- **예약 수정**: `PUT /api/appointments/:id`
- **예약 취소**: `DELETE /api/appointments/:id`

### 5. 대기자 관리 (Waitlist)
- **대기자 목록**: `GET /api/waitlist`
- **대기자 등록**: `POST /api/waitlist`
- **상태 변경**: `PUT /api/waitlist/:id`

### 6. 통계 (Statistics)
- **일일 통계**: `GET /api/statistics/daily`
- **월간 통계**: `GET /api/statistics/monthly`

### 7. 맥진 관련 (Pulse)
- **맥상 정보**: `GET /api/pulse/info/:pulseType`
- **맥상 목록**: `GET /api/pulse/list`
- **맥상 매핑**: `POST /api/pulse-map/map`

## 🔄 응답 형식

### 성공 응답
```json
{
  "success": true,
  "data": { ... },
  "message": "작업이 성공했습니다."
}
```

### 에러 응답
```json
{
  "success": false,
  "message": "에러 메시지",
  "error": "상세 에러 정보 (개발 환경에서만)"
}
```

## 📊 상태 코드

- **200**: 성공
- **201**: 생성 성공
- **400**: 잘못된 요청
- **401**: 인증 실패
- **403**: 권한 없음
- **404**: 리소스 없음
- **409**: 충돌 (중복 등)
- **500**: 서버 오류

## 🔧 개발 환경 설정

### 환경 변수
```bash
# .env 파일
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/maekcord
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h
```

### 테스트 계정
- **관리자**: admin@test.com / 123456
- **의사**: doctor@test.com / 123456
- **직원**: staff@test.com / 123456

## 🚀 배포 정보

### PM2 설정
```bash
# 프로덕션 시작
pm2 start ecosystem.config.js --env production

# 개발 환경 시작
pm2 start ecosystem.config.js --env development
```

### Docker (선택사항)
```bash
# 이미지 빌드
docker build -t maekcord-backend .

# 컨테이너 실행
docker run -p 5000:5000 maekcord-backend
```

## 📞 지원

API 사용 중 문제가 발생하면 다음을 확인하세요:

1. **토큰 유효성**: JWT 토큰이 만료되지 않았는지 확인
2. **권한 확인**: 해당 API에 접근 권한이 있는지 확인
3. **요청 형식**: 요청 본문이 올바른 JSON 형식인지 확인
4. **서버 상태**: `/health` 엔드포인트로 서버 상태 확인

## 🔄 버전 관리

현재 API 버전: **v1.0.0**

향후 버전 변경 시 URL에 버전을 포함할 예정입니다:
- `http://localhost:5000/api/v1/...`
- `http://localhost:5000/api/v2/...` 