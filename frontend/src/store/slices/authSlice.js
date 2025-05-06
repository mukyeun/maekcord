import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Mock login API
const mockLoginAPI = async (credentials) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  if (credentials.username === 'admin' && credentials.password === '1234') {
    const userData = {
      id: 1,
      username: 'admin',
      name: '관리자',
      role: 'admin'
    };
    // 로그인 성공 시 로컬 스토리지에 저장
    localStorage.setItem('token', 'mock-jwt-token');
    localStorage.setItem('user', JSON.stringify(userData));
    
    return {
      user: userData,
      token: 'mock-jwt-token'
    };
  }
  throw new Error('아이디 또는 비밀번호가 올바르지 않습니다.');
};

// Async thunk action
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await mockLoginAPI(credentials);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  isAuthenticated: Boolean(localStorage.getItem('token')),
  user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null,
  loading: false,
  error: null
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess: (state, action) => {
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.loading = false;
      state.error = null;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.loading = false;
      state.error = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.loading = false;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isAuthenticated = false;
        state.user = null;
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { loginSuccess, logout } = authSlice.actions;
export default authSlice.reducer; 