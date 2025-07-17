# Maekcord API 참조 문서

## 📋 목차
1. [개요](#개요)
2. [인증](#인증)
3. [환자 관리 API](#환자-관리-api)
4. [대기열 관리 API](#대기열-관리-api)
5. [예약 관리 API](#예약-관리-api)
6. [사용자 관리 API](#사용자-관리-api)
7. [모니터링 API](#모니터링-api)
8. [에러 코드](#에러-코드)

## 🎯 개요

Maekcord API는 의료 대기열 관리 시스템의 백엔드 API입니다.

### 기본 정보
- **Base URL**: `http://localhost:5000/api`
- **Content-Type**: `application/json`
- **인증 방식**: JWT Bearer Token

### 공통 응답 형식
```json
{
  "success": true,
  "message": "성공 메시지",
  "data": { /* 응답 데이터 */ }
}
```

## 🔐 인증

### 로그인
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@maekstation.com",
  "password": "admin1234"
}
```

**응답:**
```json
{
  "success": true,
  "message": "로그인되었습니다.",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "admin@maekstation.com",
      "name": "시스템 관리자",
      "role": "admin"
    }
  }
}
```

### 토큰 사용
```http
GET /api/patients
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 👥 환자 관리 API

### 환자 목록 조회
```http
GET /api/patients?page=1&limit=10&search=홍길동
Authorization: Bearer {token}
```

**쿼리 파라미터:**
- `page`: 페이지 번호 (기본값: 1)
- `limit`: 페이지당 항목 수 (기본값: 10)
- `search`: 검색어 (환자명, 전화번호)

### 환자 상세 조회
```http
GET /api/patients/{patientId}
Authorization: Bearer {token}
```

### 환자 등록
```http
POST /api/patients
Authorization: Bearer {token}
Content-Type: application/json

{
  "basicInfo": {
    "name": "홍길동",
    "phone": "010-1234-5678",
    "gender": "male",
    "birthDate": "1990-01-01",
    "visitType": "초진"
  },
  "symptoms": ["두통", "어깨 통증"],
  "memo": "추가 메모"
}
```

### 환자 정보 수정
```http
PUT /api/patients/{patientId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "basicInfo": {
    "name": "홍길동",
    "phone": "010-1234-5678"
  }
}
```

## 📊 대기열 관리 API

### 오늘 대기열 조회
```http
GET /api/queues/today
Authorization: Bearer {token}
```

### 대기열 추가
```http
POST /api/queues
Authorization: Bearer {token}
Content-Type: application/json

{
  "patientId": "507f1f77bcf86cd799439011",
  "visitType": "초진",
  "symptoms": "두통",
  "priority": "normal"
}
```

### 환자 호출
```http
POST /api/queues/{queueId}/call
Authorization: Bearer {token}
```

### 대기열 상태 변경
```http
PUT /api/queues/{queueId}/status
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "called"
}
```

## 📅 예약 관리 API

### 예약 목록 조회
```http
GET /api/appointments?date=2024-12-01
Authorization: Bearer {token}
```

### 예약 생성
```http
POST /api/appointments
Authorization: Bearer {token}
Content-Type: application/json

{
  "patientId": "507f1f77bcf86cd799439011",
  "appointmentDate": "2024-12-01",
  "appointmentTime": "09:00",
  "visitType": "재진",
  "memo": "예약 메모"
}
```

### 예약 수정
```http
PUT /api/appointments/{appointmentId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "appointmentTime": "10:00",
  "memo": "시간 변경"
}
```

### 예약 취소
```http
DELETE /api/appointments/{appointmentId}
Authorization: Bearer {token}
```

## 👤 사용자 관리 API

### 사용자 목록 조회
```http
GET /api/users
Authorization: Bearer {token}
```

### 사용자 생성
```http
POST /api/users
Authorization: Bearer {token}
Content-Type: application/json

{
  "username": "doctor1",
  "email": "doctor1@maekstation.com",
  "password": "doctor1234",
  "name": "김의사",
  "role": "doctor",
  "department": "내과"
}
```

### 사용자 정보 수정
```http
PUT /api/users/{userId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "김의사",
  "department": "소화기내과"
}
```

## 📈 모니터링 API

### 시스템 상태 조회
```http
GET /api/monitoring/status
Authorization: Bearer {token}
```

### 성능 메트릭 조회
```http
GET /api/monitoring/metrics
Authorization: Bearer {token}
```

### 로그 조회
```http
GET /api/monitoring/logs?level=error&limit=50
Authorization: Bearer {token}
```

## ❌ 에러 코드

### HTTP 상태 코드
- `200`: 성공
- `201`: 생성됨
- `400`: 잘못된 요청
- `401`: 인증 실패
- `403`: 권한 없음
- `404`: 리소스 없음
- `409`: 충돌
- `500`: 서버 오류

### 에러 응답 형식
```json
{
  "success": false,
  "message": "에러 메시지",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "field": "email",
        "message": "유효한 이메일 주소를 입력하세요"
      }
    ]
  }
}
```

### 에러 코드 목록
- `VALIDATION_ERROR`: 입력값 검증 실패
- `AUTHENTICATION_ERROR`: 인증 실패
- `AUTHORIZATION_ERROR`: 권한 없음
- `NOT_FOUND_ERROR`: 리소스 없음
- `DUPLICATE_ERROR`: 중복 데이터
- `DATABASE_ERROR`: 데이터베이스 오류
- `INTERNAL_ERROR`: 서버 내부 오류

## 🔧 개발 도구

### Swagger 문서
개발 환경에서 Swagger UI를 통해 API 문서를 확인할 수 있습니다:
```
http://localhost:5000/api-docs
```

### API 테스트
```bash
# 테스트 실행
npm test

# 통합 테스트
npm run test:integration

# 커버리지 확인
npm run test:coverage
```

---

**마지막 업데이트**: 2024년 12월 1일  
**버전**: 1.0.0 