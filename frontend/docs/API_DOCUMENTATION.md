# API 문서

## 📋 개요

의료 대기열 관리 시스템의 프론트엔드 API 문서입니다. 백엔드 서버와의 통신을 위한 모든 엔드포인트와 데이터 구조를 설명합니다.

## 🔐 인증

### JWT 토큰 기반 인증

모든 API 요청에는 JWT 토큰이 필요합니다. 토큰은 Authorization 헤더에 Bearer 스키마로 포함됩니다.

```javascript
// 요청 예시
const response = await axios.get('/api/patients', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### 토큰 갱신

토큰이 만료되면 자동으로 갱신됩니다.

```javascript
// 토큰 갱신
const refreshToken = async () => {
  const response = await axios.post('/api/auth/refresh', {
    refreshToken: localStorage.getItem('refreshToken')
  });
  return response.data.accessToken;
};
```

## 📊 환자 관리 API

### 환자 목록 조회

```http
GET /api/patients
```

**Query Parameters:**
- `page` (number): 페이지 번호 (기본값: 1)
- `limit` (number): 페이지당 항목 수 (기본값: 10)
- `search` (string): 검색어 (환자명, 전화번호)
- `status` (string): 환자 상태 필터

**Response:**
```json
{
  "success": true,
  "data": {
    "patients": [
      {
        "_id": "patient_id",
        "basicInfo": {
          "name": "홍길동",
          "phone": "010-1234-5678",
          "birthDate": "1990-01-01",
          "gender": "male"
        },
        "medicalHistory": {
          "allergies": ["페니실린"],
          "medications": ["혈압약"]
        },
        "status": "waiting",
        "createdAt": "2024-12-01T09:00:00Z"
      }
    ],
    "total": 100,
    "page": 1,
    "limit": 10
  }
}
```

### 환자 상세 정보 조회

```http
GET /api/patients/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "patient_id",
    "basicInfo": {
      "name": "홍길동",
      "phone": "010-1234-5678",
      "birthDate": "1990-01-01",
      "gender": "male",
      "address": "서울시 강남구"
    },
    "medicalHistory": {
      "allergies": ["페니실린"],
      "medications": ["혈압약"],
      "conditions": ["고혈압"]
    },
    "pulseData": {
      "waveform": [...],
      "analysis": {
        "stressLevel": "medium",
        "heartRate": 75,
        "bloodPressure": "120/80"
      }
    },
    "consultations": [
      {
        "date": "2024-12-01",
        "doctor": "김의사",
        "diagnosis": "감기",
        "prescription": "해열제"
      }
    ]
  }
}
```

### 환자 정보 등록

```http
POST /api/patients
```

**Request Body:**
```json
{
  "basicInfo": {
    "name": "홍길동",
    "phone": "010-1234-5678",
    "birthDate": "1990-01-01",
    "gender": "male",
    "address": "서울시 강남구"
  },
  "medicalHistory": {
    "allergies": ["페니실린"],
    "medications": ["혈압약"],
    "conditions": ["고혈압"]
  },
  "symptoms": {
    "mainSymptom": "두통",
    "duration": "3일",
    "severity": "medium"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "new_patient_id",
    "queueNumber": 15,
    "message": "환자가 성공적으로 등록되었습니다."
  }
}
```

## 🏥 대기열 관리 API

### 오늘의 대기열 조회

```http
GET /api/queues/today
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "queue_id",
      "queueNumber": 1,
      "patientId": {
        "_id": "patient_id",
        "basicInfo": {
          "name": "홍길동",
          "phone": "010-1234-5678"
        }
      },
      "status": "waiting",
      "registeredAt": "2024-12-01T09:00:00Z",
      "estimatedTime": "2024-12-01T10:30:00Z"
    }
  ]
}
```

### 환자 호출

```http
POST /api/queues/:id/call
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "환자가 호출되었습니다.",
    "queueNumber": 1,
    "patientName": "홍길동"
  }
}
```

### 대기열 상태 업데이트

```http
PUT /api/queues/:id/status
```

**Request Body:**
```json
{
  "status": "consulting"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "대기열 상태가 업데이트되었습니다.",
    "status": "consulting"
  }
}
```

## 💓 맥박 분석 API

### 맥박파 업로드

```http
POST /api/pulse/upload
```

**Request Body:**
```javascript
// FormData 사용
const formData = new FormData();
formData.append('pulseData', file);
formData.append('patientId', patientId);
```

**Response:**
```json
{
  "success": true,
  "data": {
    "analysisId": "analysis_id",
    "waveform": [...],
    "analysis": {
      "stressLevel": "medium",
      "heartRate": 75,
      "bloodPressure": "120/80",
      "recommendations": ["휴식 필요", "스트레스 관리"]
    }
  }
}
```

### 맥박 분석 결과 조회

```http
GET /api/pulse/analysis/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "analysisId": "analysis_id",
    "patientId": "patient_id",
    "waveform": [...],
    "analysis": {
      "stressLevel": "medium",
      "heartRate": 75,
      "bloodPressure": "120/80",
      "pulseWaveVelocity": 8.5,
      "augmentationIndex": 25.3,
      "recommendations": ["휴식 필요", "스트레스 관리"]
    },
    "createdAt": "2024-12-01T09:00:00Z"
  }
}
```

## 🔐 인증 API

### 로그인

```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "username": "doctor123",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "jwt_access_token",
    "refreshToken": "jwt_refresh_token",
    "user": {
      "_id": "user_id",
      "username": "doctor123",
      "name": "김의사",
      "role": "doctor",
      "department": "내과"
    }
  }
}
```

### 로그아웃

```http
POST /api/auth/logout
```

**Response:**
```json
{
  "success": true,
  "message": "로그아웃되었습니다."
}
```

### 토큰 갱신

```http
POST /api/auth/refresh
```

**Request Body:**
```json
{
  "refreshToken": "jwt_refresh_token"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "new_jwt_access_token",
    "refreshToken": "new_jwt_refresh_token"
  }
}
```

## 📊 통계 API

### 대기열 통계

```http
GET /api/stats/queue
```

**Query Parameters:**
- `date` (string): 날짜 (YYYY-MM-DD 형식)

**Response:**
```json
{
  "success": true,
  "data": {
    "date": "2024-12-01",
    "totalPatients": 50,
    "waiting": 15,
    "consulting": 8,
    "completed": 27,
    "averageWaitTime": 45,
    "peakHours": ["09:00", "14:00"]
  }
}
```

### 의사별 통계

```http
GET /api/stats/doctor/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "doctorId": "doctor_id",
    "doctorName": "김의사",
    "totalPatients": 25,
    "averageConsultationTime": 15,
    "patientSatisfaction": 4.5,
    "monthlyStats": [
      {
        "month": "2024-12",
        "patients": 25,
        "consultations": 25
      }
    ]
  }
}
```

## 🔌 WebSocket API

### 연결

```javascript
const ws = new WebSocket('ws://localhost:3000/ws');

ws.onopen = () => {
  console.log('WebSocket 연결됨');
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('메시지 수신:', data);
};
```

### 메시지 형식

#### 대기열 업데이트
```json
{
  "type": "QUEUE_UPDATE",
  "data": {
    "queueId": "queue_id",
    "status": "called",
    "queueNumber": 1,
    "patientName": "홍길동"
  }
}
```

#### 환자 호출
```json
{
  "type": "PATIENT_CALL",
  "data": {
    "queueNumber": 1,
    "patientName": "홍길동",
    "doctorName": "김의사",
    "roomNumber": "101"
  }
}
```

#### 시스템 알림
```json
{
  "type": "SYSTEM_NOTIFICATION",
  "data": {
    "message": "시스템 점검이 예정되어 있습니다.",
    "level": "warning",
    "timestamp": "2024-12-01T10:00:00Z"
  }
}
```

## ❌ 오류 응답

### 일반적인 오류 형식

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "입력 데이터가 유효하지 않습니다.",
    "details": {
      "field": "phone",
      "message": "전화번호 형식이 올바르지 않습니다."
    }
  }
}
```

### 오류 코드

| 코드 | 설명 |
|------|------|
| `UNAUTHORIZED` | 인증 실패 |
| `FORBIDDEN` | 권한 없음 |
| `NOT_FOUND` | 리소스를 찾을 수 없음 |
| `VALIDATION_ERROR` | 입력 데이터 검증 실패 |
| `INTERNAL_ERROR` | 서버 내부 오류 |
| `RATE_LIMIT_EXCEEDED` | 요청 한도 초과 |

## 📝 사용 예시

### 환자 등록 및 대기열 관리

```javascript
// 1. 환자 등록
const registerPatient = async (patientData) => {
  try {
    const response = await axios.post('/api/patients', patientData);
    return response.data;
  } catch (error) {
    console.error('환자 등록 실패:', error);
    throw error;
  }
};

// 2. 대기열 조회
const getTodayQueues = async () => {
  try {
    const response = await axios.get('/api/queues/today');
    return response.data.data;
  } catch (error) {
    console.error('대기열 조회 실패:', error);
    throw error;
  }
};

// 3. 환자 호출
const callPatient = async (queueId) => {
  try {
    const response = await axios.post(`/api/queues/${queueId}/call`);
    return response.data;
  } catch (error) {
    console.error('환자 호출 실패:', error);
    throw error;
  }
};
```

### 실시간 업데이트 처리

```javascript
// WebSocket 연결 및 메시지 처리
const setupWebSocket = () => {
  const ws = new WebSocket('ws://localhost:3000/ws');
  
  ws.onopen = () => {
    console.log('WebSocket 연결됨');
  };
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    
    switch (data.type) {
      case 'QUEUE_UPDATE':
        handleQueueUpdate(data.data);
        break;
      case 'PATIENT_CALL':
        handlePatientCall(data.data);
        break;
      case 'SYSTEM_NOTIFICATION':
        handleSystemNotification(data.data);
        break;
      default:
        console.log('알 수 없는 메시지 타입:', data.type);
    }
  };
  
  ws.onerror = (error) => {
    console.error('WebSocket 오류:', error);
  };
  
  ws.onclose = () => {
    console.log('WebSocket 연결 종료');
    // 재연결 로직
    setTimeout(setupWebSocket, 5000);
  };
  
  return ws;
};
```

## 🔄 버전 관리

API 버전은 URL 경로에 포함됩니다.

- **v1**: `/api/v1/patients`
- **v2**: `/api/v2/patients` (향후 버전)

현재 버전: **v1**

## 📞 지원

API 관련 문의사항이 있으시면 다음으로 연락해주세요:

- **이메일**: api-support@maekcord.com
- **문서**: 이 문서의 GitHub 저장소
- **이슈**: GitHub Issues

---

**최종 업데이트**: 2024년 12월 1일  
**버전**: 1.0.0 