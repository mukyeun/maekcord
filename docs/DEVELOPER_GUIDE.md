# Maekcord 개발자 가이드

## 📋 목차

1. [프로젝트 구조](#프로젝트-구조)
2. [개발 환경 설정](#개발-환경-설정)
3. [백엔드 개발](#백엔드-개발)
4. [프론트엔드 개발](#프론트엔드-개발)
5. [데이터베이스](#데이터베이스)
6. [API 개발](#api-개발)
7. [테스트](#테스트)
8. [배포](#배포)
9. [코딩 컨벤션](#코딩-컨벤션)

## 🏗️ 프로젝트 구조

```
maekcode/
├── backend/                 # 백엔드 서버
│   ├── controllers/        # 컨트롤러
│   ├── models/            # 데이터 모델
│   ├── routes/            # API 라우트
│   ├── middlewares/       # 미들웨어
│   ├── utils/             # 유틸리티
│   ├── docs/              # API 문서
│   └── server.js          # 서버 진입점
├── frontend/              # 프론트엔드
│   ├── src/
│   │   ├── components/    # React 컴포넌트
│   │   ├── pages/         # 페이지 컴포넌트
│   │   ├── hooks/         # 커스텀 훅
│   │   ├── utils/         # 유틸리티
│   │   └── App.js         # 메인 앱
│   └── public/            # 정적 파일
├── docs/                  # 문서
└── README.md              # 프로젝트 설명
```

## 🔧 개발 환경 설정

### 필수 요구사항

#### Node.js
```bash
# Node.js 18.x 이상 설치
node --version  # v18.0.0 이상
npm --version   # 9.0.0 이상
```

#### MongoDB
```bash
# MongoDB 6.x 설치
mongod --version  # 6.0.0 이상
```

#### Git
```bash
# Git 설치
git --version  # 2.30.0 이상
```

### 프로젝트 클론 및 설정

```bash
# 1. 프로젝트 클론
git clone https://github.com/your-username/maekcode.git
cd maekcode

# 2. 백엔드 의존성 설치
cd backend
npm install

# 3. 프론트엔드 의존성 설치
cd ../frontend
npm install

# 4. 환경 변수 설정
cd ../backend
cp .env.example .env
# .env 파일 편집
```

### 환경 변수 설정

#### Backend (.env)
```bash
# 서버 설정
NODE_ENV=development
PORT=5000

# 데이터베이스
MONGODB_URI=mongodb://localhost:27017/maekcord

# JWT 설정
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h

# 로깅
LOG_LEVEL=debug
LOG_FILE=logs/app.log

# CORS 설정
CORS_ORIGIN=http://localhost:3000
```

#### Frontend (.env)
```bash
# API 서버 URL
REACT_APP_API_URL=http://localhost:5000
REACT_APP_WS_URL=ws://localhost:5000

# 환경 설정
REACT_APP_ENV=development
REACT_APP_VERSION=1.0.0
```

## 🚀 백엔드 개발

### 서버 시작

```bash
# 개발 모드
cd backend
npm run dev

# 프로덕션 모드
npm start

# PM2 사용
pm2 start ecosystem.config.js --env development
```

### 주요 패키지

```json
{
  "express": "^4.18.2",        // 웹 프레임워크
  "mongoose": "^7.5.0",        // MongoDB ODM
  "jsonwebtoken": "^9.0.2",    // JWT 인증
  "bcryptjs": "^2.4.3",        // 비밀번호 해싱
  "cors": "^2.8.5",            // CORS 처리
  "helmet": "^7.0.0",          // 보안 헤더
  "express-rate-limit": "^6.10.0", // 요청 제한
  "socket.io": "^4.7.2",       // WebSocket
  "winston": "^3.10.0",        // 로깅
  "joi": "^17.9.2",            // 데이터 검증
  "swagger-jsdoc": "^6.2.8",   // API 문서
  "swagger-ui-express": "^5.0.0" // API 문서 UI
}
```

### 컨트롤러 작성 예시

```javascript
// controllers/patientController.js
const Patient = require('../models/Patient');
const logger = require('../utils/logger');

exports.getPatients = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    
    // 검색 조건 구성
    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { 'contact.phone': { $regex: search, $options: 'i' } }
      ];
    }
    
    // 페이지네이션
    const skip = (page - 1) * limit;
    const patients = await Patient.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
    
    const total = await Patient.countDocuments(query);
    
    logger.info(`환자 목록 조회 성공: ${patients.length}명`);
    
    res.json({
      success: true,
      data: patients,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('환자 목록 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '환자 목록 조회 중 오류가 발생했습니다.'
    });
  }
};
```

### 미들웨어 작성 예시

```javascript
// middlewares/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

exports.authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: '인증 토큰이 필요합니다.'
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '유효하지 않은 토큰입니다.'
      });
    }
    
    req.user = user;
    next();
  } catch (error) {
    logger.error('토큰 인증 실패:', error);
    res.status(401).json({
      success: false,
      message: '인증에 실패했습니다.'
    });
  }
};
```

## ⚛️ 프론트엔드 개발

### 개발 서버 시작

```bash
# 개발 모드
cd frontend
npm start

# 프로덕션 빌드
npm run build

# 테스트
npm test
```

### 주요 패키지

```json
{
  "react": "^18.2.0",           // React
  "react-dom": "^18.2.0",       // React DOM
  "react-router-dom": "^6.15.0", // 라우팅
  "axios": "^1.5.0",            // HTTP 클라이언트
  "antd": "^5.8.0",             // UI 컴포넌트
  "socket.io-client": "^4.7.2", // WebSocket 클라이언트
  "dayjs": "^1.11.9",           // 날짜 처리
  "recharts": "^2.8.0",         // 차트
  "react-query": "^3.39.3"      // 서버 상태 관리
}
```

### 컴포넌트 작성 예시

```jsx
// components/PatientList.jsx
import React, { useState, useEffect } from 'react';
import { Table, Input, Button, Space, message } from 'antd';
import { SearchOutlined, PlusOutlined } from '@ant-design/icons';
import { getPatients } from '../api/patientApi';
import { useAuth } from '../hooks/useAuth';

const PatientList = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const { user } = useAuth();

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await getPatients({ search: searchText });
      setPatients(response.data);
    } catch (error) {
      message.error('환자 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [searchText]);

  const columns = [
    {
      title: '환자명',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: '생년월일',
      dataIndex: 'birthDate',
      key: 'birthDate',
    },
    {
      title: '연락처',
      dataIndex: ['contact', 'phone'],
      key: 'phone',
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <span className={`status-${status}`}>
          {status === 'active' ? '활성' : '비활성'}
        </span>
      ),
    },
    {
      title: '작업',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button type="link" onClick={() => handleEdit(record)}>
            수정
          </Button>
          <Button type="link" danger onClick={() => handleDelete(record)}>
            삭제
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="patient-list">
      <div className="patient-list-header">
        <Input.Search
          placeholder="환자 검색"
          allowClear
          onSearch={setSearchText}
          style={{ width: 300 }}
        />
        <Button type="primary" icon={<PlusOutlined />}>
          새 환자 등록
        </Button>
      </div>
      
      <Table
        columns={columns}
        dataSource={patients}
        loading={loading}
        rowKey="_id"
        pagination={{
          total: patients.length,
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
      />
    </div>
  );
};

export default PatientList;
```

### 커스텀 훅 작성 예시

```javascript
// hooks/useAuth.js
import { useState, useEffect, createContext, useContext } from 'react';
import { login as loginApi, logout as logoutApi } from '../api/authApi';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 로컬 스토리지에서 사용자 정보 복원
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    
    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    try {
      const response = await loginApi(credentials);
      const { user, token } = response.data;
      
      setUser(user);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);
      
      return response;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await logoutApi();
    } catch (error) {
      console.error('로그아웃 API 호출 실패:', error);
    } finally {
      setUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
  };

  const value = {
    user,
    login,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

## 🗄️ 데이터베이스

### MongoDB 스키마 예시

```javascript
// models/Patient.js
const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  patientId: {
    type: String,
    required: true,
    unique: true,
    default: function() {
      return 'P' + new Date().getFullYear() + 
             String(new Date().getMonth() + 1).padStart(2, '0') +
             String(new Date().getDate()).padStart(2, '0') +
             String(Math.floor(Math.random() * 1000)).padStart(3, '0');
    }
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  birthDate: {
    type: Date,
    required: true
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: true
  },
  contact: {
    phone: {
      type: String,
      required: true
    },
    email: {
      type: String,
      lowercase: true
    },
    address: String
  },
  medicalInfo: {
    bloodType: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']
    },
    allergies: [String],
    medications: [String],
    conditions: [String]
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, {
  timestamps: true
});

// 인덱스 설정
patientSchema.index({ name: 1 });
patientSchema.index({ 'contact.phone': 1 });
patientSchema.index({ patientId: 1 });

// 가상 필드
patientSchema.virtual('age').get(function() {
  return Math.floor((Date.now() - this.birthDate) / (365.25 * 24 * 60 * 60 * 1000));
});

module.exports = mongoose.model('Patient', patientSchema);
```

### 데이터베이스 연결

```javascript
// utils/database.js
const mongoose = require('mongoose');
const logger = require('./logger');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    logger.info(`MongoDB 연결 성공: ${conn.connection.host}`);
  } catch (error) {
    logger.error('MongoDB 연결 실패:', error);
    process.exit(1);
  }
};

module.exports = connectDB;
```

## 🔌 API 개발

### API 라우트 작성 예시

```javascript
// routes/patientRoutes.js
const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth');
const { validatePatient } = require('../middlewares/validators');

/**
 * @swagger
 * /api/patients:
 *   get:
 *     summary: 환자 목록 조회
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: 페이지 번호
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: 페이지당 항목 수
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: 검색어
 *     responses:
 *       200:
 *         description: 성공
 */
router.get('/', authenticateToken, patientController.getPatients);

/**
 * @swagger
 * /api/patients:
 *   post:
 *     summary: 새 환자 등록
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Patient'
 *     responses:
 *       201:
 *         description: 환자 등록 성공
 */
router.post('/', authenticateToken, validatePatient, patientController.createPatient);

module.exports = router;
```

### API 클라이언트 작성 예시

```javascript
// api/patientApi.js
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// axios 인스턴스 생성
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// 요청 인터셉터
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// 환자 API 함수들
export const getPatients = async (params = {}) => {
  const response = await apiClient.get('/api/patients', { params });
  return response.data;
};

export const createPatient = async (patientData) => {
  const response = await apiClient.post('/api/patients', patientData);
  return response.data;
};

export const updatePatient = async (id, patientData) => {
  const response = await apiClient.put(`/api/patients/${id}`, patientData);
  return response.data;
};

export const deletePatient = async (id) => {
  const response = await apiClient.delete(`/api/patients/${id}`);
  return response.data;
};
```

## 🧪 테스트

### 백엔드 테스트

```javascript
// tests/patient.test.js
const request = require('supertest');
const app = require('../server');
const mongoose = require('mongoose');
const Patient = require('../models/Patient');

describe('Patient API', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI_TEST);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Patient.deleteMany({});
  });

  describe('GET /api/patients', () => {
    it('should return empty array when no patients exist', async () => {
      const response = await request(app)
        .get('/api/patients')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });

    it('should return patients when they exist', async () => {
      const patient = await Patient.create({
        name: '홍길동',
        birthDate: new Date('1990-01-01'),
        gender: 'male',
        contact: { phone: '010-1234-5678' }
      });

      const response = await request(app)
        .get('/api/patients')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('홍길동');
    });
  });
});
```

### 프론트엔드 테스트

```javascript
// tests/PatientList.test.jsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../hooks/useAuth';
import PatientList from '../components/PatientList';

const mockPatients = [
  {
    _id: '1',
    name: '홍길동',
    birthDate: '1990-01-01',
    contact: { phone: '010-1234-5678' },
    status: 'active'
  }
];

jest.mock('../api/patientApi', () => ({
  getPatients: jest.fn(() => Promise.resolve({ data: mockPatients }))
}));

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {component}
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('PatientList', () => {
  it('renders patient list correctly', async () => {
    renderWithProviders(<PatientList />);
    
    await waitFor(() => {
      expect(screen.getByText('홍길동')).toBeInTheDocument();
    });
  });

  it('filters patients when search is entered', async () => {
    renderWithProviders(<PatientList />);
    
    const searchInput = screen.getByPlaceholderText('환자 검색');
    fireEvent.change(searchInput, { target: { value: '홍' } });
    
    await waitFor(() => {
      expect(screen.getByText('홍길동')).toBeInTheDocument();
    });
  });
});
```

## 🚀 배포

### 프로덕션 빌드

```bash
# 백엔드 빌드
cd backend
npm run build

# 프론트엔드 빌드
cd ../frontend
npm run build
```

### PM2 설정

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'maekcord-backend',
      script: './server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: 5000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true
    }
  ]
};
```

### Docker 설정

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 5000

CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo:27017/maekcord
    depends_on:
      - mongo
    volumes:
      - ./logs:/app/logs

  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    depends_on:
      - backend

  mongo:
    image: mongo:6
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

volumes:
  mongo_data:
```

## 📝 코딩 컨벤션

### JavaScript/Node.js

#### 변수명
```javascript
// camelCase 사용
const patientName = '홍길동';
const birthDate = new Date();
const isActive = true;

// 상수는 UPPER_SNAKE_CASE
const API_BASE_URL = 'http://localhost:5000';
const MAX_RETRY_COUNT = 3;
```

#### 함수명
```javascript
// 동사로 시작하는 camelCase
function getPatientById(id) { }
function createNewPatient(patientData) { }
function updatePatientStatus(id, status) { }
function deletePatientRecord(id) { }
```

#### 클래스명
```javascript
// PascalCase 사용
class PatientController { }
class DatabaseConnection { }
class AuthenticationService { }
```

### React/JSX

#### 컴포넌트명
```jsx
// PascalCase 사용
const PatientList = () => { };
const UserProfile = () => { };
const NavigationBar = () => { };
```

#### Props명
```jsx
// camelCase 사용
<PatientCard 
  patientName="홍길동"
  birthDate="1990-01-01"
  isActive={true}
  onEdit={handleEdit}
/>
```

### 파일명

#### 백엔드
```
controllers/patientController.js
models/Patient.js
routes/patientRoutes.js
middlewares/auth.js
utils/logger.js
```

#### 프론트엔드
```
components/PatientList.jsx
pages/PatientDetail.jsx
hooks/useAuth.js
utils/apiClient.js
```

### 주석 작성

```javascript
/**
 * 환자 정보를 조회합니다.
 * @param {string} id - 환자 ID
 * @param {Object} options - 조회 옵션
 * @param {boolean} options.includeHistory - 진료 기록 포함 여부
 * @returns {Promise<Object>} 환자 정보
 */
async function getPatient(id, options = {}) {
  // 구현 내용
}

// 한 줄 주석
const patient = await getPatient(id); // 환자 정보 조회
```

### 에러 처리

```javascript
try {
  const result = await someAsyncOperation();
  return result;
} catch (error) {
  logger.error('작업 실패:', error);
  throw new Error('작업 중 오류가 발생했습니다.');
}
```

### 로깅

```javascript
// 로그 레벨별 사용
logger.debug('디버그 정보');
logger.info('정보 메시지');
logger.warn('경고 메시지');
logger.error('에러 메시지');

// 구조화된 로깅
logger.info('환자 등록 성공', {
  patientId: patient._id,
  name: patient.name,
  timestamp: new Date().toISOString()
});
```

---

**© 2024 Maekcord. All rights reserved.** 