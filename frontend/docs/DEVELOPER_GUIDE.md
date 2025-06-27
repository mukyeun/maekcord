# 개발자 가이드

## 📋 목차

1. [개발 환경 설정](#개발-환경-설정)
2. [프로젝트 구조](#프로젝트-구조)
3. [코딩 컨벤션](#코딩-컨벤션)
4. [상태 관리](#상태-관리)
5. [컴포넌트 개발](#컴포넌트-개발)
6. [테스트 작성](#테스트-작성)
7. [성능 최적화](#성능-최적화)
8. [보안 고려사항](#보안-고려사항)
9. [배포](#배포)

## 🛠 개발 환경 설정

### 필수 요구사항

- **Node.js**: 16.0 이상
- **npm**: 8.0 이상
- **Git**: 최신 버전

### 초기 설정

```bash
# 저장소 클론
git clone https://github.com/your-username/maekcord.git
cd maekcord/frontend

# 의존성 설치
npm install

# 개발 서버 시작
npm start
```

### 환경 변수 설정

`.env` 파일을 생성하고 다음 변수들을 설정하세요:

```env
# API 설정
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_WS_URL=ws://localhost:3000/ws

# 환경 설정
REACT_APP_ENV=development
REACT_APP_DEBUG=true

# 보안 설정
REACT_APP_JWT_SECRET=your_jwt_secret
REACT_APP_CSP_NONCE=your_csp_nonce
```

## 📁 프로젝트 구조

```
src/
├── api/                    # API 관련 파일
│   ├── axiosInstance.js   # Axios 인스턴스 설정
│   ├── authApi.js         # 인증 관련 API
│   ├── queueApi.js        # 대기열 관련 API
│   └── patientApi.js      # 환자 관련 API
├── components/             # React 컴포넌트
│   ├── Auth/              # 인증 관련 컴포넌트
│   ├── Common/            # 공통 컴포넌트
│   ├── DoctorView/        # 의사 상담 화면
│   ├── PatientForm/       # 환자 정보 입력
│   ├── QueueDisplay/      # 대기열 디스플레이
│   └── ReceptionDashboard/ # 접수실 대시보드
├── config/                # 설정 파일
│   ├── api.js             # API 설정
│   ├── routes.js          # 라우팅 설정
│   └── theme.js           # 테마 설정
├── contexts/              # React Context
│   ├── AuthContext.jsx    # 인증 컨텍스트
│   └── FormContext.jsx    # 폼 컨텍스트
├── hooks/                 # 커스텀 훅
│   ├── useAuth.js         # 인증 훅
│   ├── useRealtimeData.js # 실시간 데이터 훅
│   └── useKeyboardShortcuts.js # 키보드 단축키 훅
├── pages/                 # 페이지 컴포넌트
├── routes/                # 라우팅 설정
├── services/              # 서비스 로직
├── store/                 # Redux 스토어
│   ├── slices/            # Redux 슬라이스
│   └── thunks/            # Redux Thunk
├── styles/                # 스타일 파일
├── types/                 # TypeScript 타입
└── utils/                 # 유틸리티 함수
    ├── security.js        # 보안 관련 유틸
    ├── formatUtils.js     # 포맷팅 유틸
    └── validation.js      # 검증 유틸
```

## 📝 코딩 컨벤션

### JavaScript/React 컨벤션

#### 파일 명명 규칙
- **컴포넌트**: PascalCase (예: `ReceptionDashboard.jsx`)
- **훅**: camelCase (예: `useAuth.js`)
- **유틸리티**: camelCase (예: `formatUtils.js`)
- **상수**: UPPER_SNAKE_CASE (예: `API_ENDPOINTS.js`)

#### 컴포넌트 구조

```jsx
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';

// 컴포넌트 정의
const ComponentName = ({ prop1, prop2, children }) => {
  // 상태 정의
  const [localState, setLocalState] = useState(null);
  
  // Redux 훅
  const dispatch = useDispatch();
  const globalState = useSelector(state => state.someSlice);
  
  // 이벤트 핸들러
  const handleClick = () => {
    // 로직
  };
  
  // 사이드 이펙트
  useEffect(() => {
    // 초기화 로직
    return () => {
      // 정리 로직
    };
  }, []);
  
  // 렌더링
  return (
    <div className="component-name">
      {children}
    </div>
  );
};

// PropTypes 정의
ComponentName.propTypes = {
  prop1: PropTypes.string.isRequired,
  prop2: PropTypes.number,
  children: PropTypes.node
};

// 기본값 설정
ComponentName.defaultProps = {
  prop2: 0
};

export default ComponentName;
```

#### 함수 작성 규칙

```javascript
// 화살표 함수 사용
const handleSubmit = async (data) => {
  try {
    const response = await apiCall(data);
    return response;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

// 비동기 함수는 async/await 사용
const fetchData = async () => {
  const result = await fetch('/api/data');
  return result.json();
};
```

### CSS/스타일링 컨벤션

#### CSS 클래스 명명
- **BEM 방법론** 사용
- **kebab-case** 사용

```css
.component-name {
  /* 기본 스타일 */
}

.component-name__element {
  /* 요소 스타일 */
}

.component-name--modifier {
  /* 수정자 스타일 */
}
```

#### 인라인 스타일
```jsx
// 객체 형태로 작성
const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  }
};

// 사용
<div style={styles.container}>
  Content
</div>
```

## 🔄 상태 관리

### Redux Toolkit 사용

#### 슬라이스 정의

```javascript
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// 비동기 액션
export const fetchPatients = createAsyncThunk(
  'patients/fetchPatients',
  async (params) => {
    const response = await api.getPatients(params);
    return response.data;
  }
);

// 슬라이스 정의
const patientsSlice = createSlice({
  name: 'patients',
  initialState: {
    list: [],
    loading: false,
    error: null
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPatients.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPatients.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchPatients.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  }
});

export const { clearError } = patientsSlice.actions;
export default patientsSlice.reducer;
```

#### 컴포넌트에서 사용

```jsx
import { useDispatch, useSelector } from 'react-redux';
import { fetchPatients } from '../store/slices/patientsSlice';

const PatientList = () => {
  const dispatch = useDispatch();
  const { list, loading, error } = useSelector(state => state.patients);
  
  useEffect(() => {
    dispatch(fetchPatients());
  }, [dispatch]);
  
  if (loading) return <div>로딩 중...</div>;
  if (error) return <div>오류: {error}</div>;
  
  return (
    <div>
      {list.map(patient => (
        <PatientCard key={patient.id} patient={patient} />
      ))}
    </div>
  );
};
```

## 🧩 컴포넌트 개발

### 컴포넌트 설계 원칙

1. **단일 책임 원칙**: 하나의 컴포넌트는 하나의 책임만 가짐
2. **재사용성**: 가능한 한 재사용 가능하게 설계
3. **조합성**: 작은 컴포넌트들을 조합하여 큰 컴포넌트 구성
4. **테스트 가능성**: 테스트하기 쉽게 설계

### 컴포넌트 타입

#### 프레젠테이션 컴포넌트 (Presentational)
```jsx
// 상태나 로직이 없는 순수한 UI 컴포넌트
const Button = ({ children, onClick, variant = 'primary' }) => (
  <button 
    className={`btn btn-${variant}`}
    onClick={onClick}
  >
    {children}
  </button>
);
```

#### 컨테이너 컴포넌트 (Container)
```jsx
// 상태와 로직을 포함하는 컴포넌트
const PatientListContainer = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    fetchPatients();
  }, []);
  
  const fetchPatients = async () => {
    setLoading(true);
    try {
      const data = await api.getPatients();
      setPatients(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <PatientList 
      patients={patients}
      loading={loading}
      onRefresh={fetchPatients}
    />
  );
};
```

### 커스텀 훅 작성

```javascript
// usePatients.js
import { useState, useEffect } from 'react';
import { patientApi } from '../api/patientApi';

export const usePatients = (params = {}) => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const fetchPatients = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await patientApi.getPatients(params);
      setPatients(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchPatients();
  }, [JSON.stringify(params)]);
  
  return {
    patients,
    loading,
    error,
    refetch: fetchPatients
  };
};
```

## 🧪 테스트 작성

### 테스트 구조

```
src/
├── components/
│   └── __tests__/          # 컴포넌트 테스트
│       ├── ComponentName.test.jsx
│       └── ComponentName.integration.test.jsx
├── utils/
│   └── __tests__/          # 유틸리티 테스트
│       └── utilityName.test.js
└── setupTests.js           # 테스트 설정
```

### 컴포넌트 테스트 예시

```jsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import ComponentName from '../ComponentName';

// 테스트용 스토어 생성
const createTestStore = () => {
  return configureStore({
    reducer: {
      // 필요한 리듀서들
    },
    preloadedState: {
      // 초기 상태
    }
  });
};

describe('ComponentName', () => {
  it('renders correctly', () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <ComponentName />
      </Provider>
    );
    
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
  
  it('handles user interaction', async () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <ComponentName />
      </Provider>
    );
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText('Updated Text')).toBeInTheDocument();
    });
  });
});
```

### 유틸리티 테스트 예시

```javascript
import { formatDate, validateEmail } from '../utils';

describe('formatDate', () => {
  it('formats date correctly', () => {
    const date = new Date('2024-12-01');
    const formatted = formatDate(date);
    expect(formatted).toBe('2024-12-01');
  });
  
  it('handles invalid date', () => {
    const formatted = formatDate('invalid');
    expect(formatted).toBe('Invalid Date');
  });
});

describe('validateEmail', () => {
  it('validates correct email', () => {
    expect(validateEmail('test@example.com')).toBe(true);
  });
  
  it('rejects invalid email', () => {
    expect(validateEmail('invalid-email')).toBe(false);
  });
});
```

## ⚡ 성능 최적화

### React 최적화 기법

#### 메모이제이션
```jsx
import React, { useMemo, useCallback } from 'react';

const ExpensiveComponent = ({ data, onUpdate }) => {
  // 계산 비용이 큰 연산 메모이제이션
  const processedData = useMemo(() => {
    return data.map(item => ({
      ...item,
      processed: item.value * 2
    }));
  }, [data]);
  
  // 콜백 함수 메모이제이션
  const handleClick = useCallback((id) => {
    onUpdate(id);
  }, [onUpdate]);
  
  return (
    <div>
      {processedData.map(item => (
        <div key={item.id} onClick={() => handleClick(item.id)}>
          {item.processed}
        </div>
      ))}
    </div>
  );
};
```

#### 코드 분할
```jsx
import React, { lazy, Suspense } from 'react';

// 지연 로딩
const LazyComponent = lazy(() => import('./LazyComponent'));

const App = () => (
  <Suspense fallback={<div>로딩 중...</div>}>
    <LazyComponent />
  </Suspense>
);
```

#### 가상화
```jsx
import { FixedSizeList as List } from 'react-window';

const VirtualizedList = ({ items }) => (
  <List
    height={400}
    itemCount={items.length}
    itemSize={50}
  >
    {({ index, style }) => (
      <div style={style}>
        {items[index]}
      </div>
    )}
  </List>
);
```

### 번들 최적화

#### 웹팩 설정
```javascript
// webpack.config.js
module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      },
    },
  },
};
```

#### 동적 임포트
```javascript
// 라우트별 코드 분할
const Home = lazy(() => import('./pages/Home'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const PatientForm = lazy(() => import('./pages/PatientForm'));
```

## 🔐 보안 고려사항

### 입력 검증
```javascript
// 유틸리티 함수
export const sanitizeInput = (input) => {
  return DOMPurify.sanitize(input);
};

export const validatePatientData = (data) => {
  const errors = {};
  
  if (!data.name || data.name.trim().length < 2) {
    errors.name = '이름은 2자 이상이어야 합니다.';
  }
  
  if (!data.phone || !/^010-\d{4}-\d{4}$/.test(data.phone)) {
    errors.phone = '올바른 전화번호 형식이 아닙니다.';
  }
  
  return errors;
};
```

### XSS 방지
```jsx
// 컴포넌트에서 사용
const PatientInfo = ({ patient }) => {
  const sanitizedName = DOMPurify.sanitize(patient.name);
  
  return (
    <div>
      <h2 dangerouslySetInnerHTML={{ __html: sanitizedName }} />
    </div>
  );
};
```

### CSRF 보호
```javascript
// API 요청에 CSRF 토큰 포함
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  headers: {
    'X-CSRF-Token': getCSRFToken(),
  },
});
```

## 🚀 배포

### 빌드 최적화

```bash
# 프로덕션 빌드
npm run build

# 번들 분석
npm run analyze
```

### 환경별 설정

```javascript
// config/config.js
const config = {
  development: {
    apiUrl: 'http://localhost:3000/api',
    wsUrl: 'ws://localhost:3000/ws',
    debug: true,
  },
  production: {
    apiUrl: 'https://api.maekcord.com',
    wsUrl: 'wss://api.maekcord.com/ws',
    debug: false,
  },
};

export default config[process.env.NODE_ENV];
```

### CI/CD 파이프라인

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '16'
      - run: npm ci
      - run: npm test
      - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm ci
      - run: npm run build
      - name: Deploy to production
        # 배포 스크립트
```

## 📚 추가 리소스

### 문서
- [React 공식 문서](https://reactjs.org/docs/)
- [Redux Toolkit 문서](https://redux-toolkit.js.org/)
- [Ant Design 문서](https://ant.design/docs/react/introduce)

### 도구
- [React Developer Tools](https://chrome.google.com/webstore/detail/react-developer-tools)
- [Redux DevTools](https://chrome.google.com/webstore/detail/redux-devtools)
- [ESLint](https://eslint.org/)
- [Prettier](https://prettier.io/)

### 테스트
- [Jest 문서](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)

---

**최종 업데이트**: 2024년 12월 1일  
**버전**: 1.0.0 