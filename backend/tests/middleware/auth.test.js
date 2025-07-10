const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { protect, authorize } = require('../../middlewares/auth');
const User = require('../../models/User');
const config = require('../../config');
const { AuthenticationError, AuthorizationError } = require('../../utils/errors');

describe('Auth Middleware Test', () => {
  let mockReq;
  let mockRes;
  let nextFunction;
  let testUser;

  beforeEach(async () => {
    // 테스트 사용자 생성
    testUser = await User.create({
      email: 'test@example.com',
      password: 'password123',
      name: '테스트 사용자',
      role: 'staff'
    });

    // mock request 객체
    mockReq = {
      headers: {},
      cookies: {}
    };

    // mock response 객체
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    // mock next 함수
    nextFunction = jest.fn();
  });

  describe('protect Middleware', () => {
    it('should authenticate valid JWT token in Authorization header', async () => {
      const token = jwt.sign(
        { id: testUser._id, role: testUser.role },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );

      mockReq.headers.authorization = `Bearer ${token}`;

      await protect(mockReq, mockRes, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockReq.user).toBeDefined();
      expect(mockReq.user._id.toString()).toBe(testUser._id.toString());
    });

    it('should authenticate valid JWT token in cookie', async () => {
      const token = jwt.sign(
        { id: testUser._id, role: testUser.role },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );

      mockReq.cookies.token = token;

      await protect(mockReq, mockRes, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockReq.user).toBeDefined();
      expect(mockReq.user._id.toString()).toBe(testUser._id.toString());
    });

    it('should fail when no token is provided', async () => {
      await protect(mockReq, mockRes, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(
        expect.any(AuthenticationError)
      );
    });

    it('should fail with invalid token', async () => {
      mockReq.headers.authorization = 'Bearer invalid.token.here';

      await protect(mockReq, mockRes, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(
        expect.any(AuthenticationError)
      );
    });

    it('should fail with expired token', async () => {
      const token = jwt.sign(
        { id: testUser._id, role: testUser.role },
        config.jwt.secret,
        { expiresIn: '0s' }
      );

      mockReq.headers.authorization = `Bearer ${token}`;

      await protect(mockReq, mockRes, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(
        expect.any(AuthenticationError)
      );
    });

    it('should fail when user no longer exists', async () => {
      const token = jwt.sign(
        { id: new mongoose.Types.ObjectId(), role: 'staff' },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );

      mockReq.headers.authorization = `Bearer ${token}`;

      await protect(mockReq, mockRes, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(
        expect.any(AuthenticationError)
      );
    });

    it('should fail when user changed password after token was issued', async () => {
      const token = jwt.sign(
        { id: testUser._id, role: testUser.role },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );

      // 비밀번호 변경 시뮬레이션
      testUser.passwordChangedAt = new Date(Date.now() + 1000);
      await testUser.save();

      mockReq.headers.authorization = `Bearer ${token}`;

      await protect(mockReq, mockRes, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(
        expect.any(AuthenticationError)
      );
    });
  });

  describe('authorize Middleware', () => {
    beforeEach(() => {
      // protect 미들웨어가 실행된 후의 상태를 시뮬레이션
      mockReq.user = testUser;
    });

    it('should authorize user with correct role', () => {
      const middleware = authorize('staff', 'admin');
      middleware(mockReq, mockRes, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(nextFunction).not.toHaveBeenCalledWith(expect.any(Error));
    });

    it('should not authorize user with incorrect role', () => {
      const middleware = authorize('admin');
      middleware(mockReq, mockRes, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(
        expect.any(AuthorizationError)
      );
    });

    it('should authorize admin for all protected routes', async () => {
      // 관리자 사용자로 변경
      testUser.role = 'admin';
      await testUser.save();
      mockReq.user = testUser;

      const middleware = authorize('staff');
      middleware(mockReq, mockRes, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(nextFunction).not.toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle multiple roles correctly', () => {
      const middleware = authorize('staff', 'doctor', 'nurse');
      middleware(mockReq, mockRes, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(nextFunction).not.toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('Integration Tests', () => {
    it('should work with protect and authorize middleware chain', async () => {
      const token = jwt.sign(
        { id: testUser._id, role: testUser.role },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );

      mockReq.headers.authorization = `Bearer ${token}`;

      await protect(mockReq, mockRes, nextFunction);
      expect(nextFunction).toHaveBeenCalled();
      expect(mockReq.user).toBeDefined();

      const authorizeMiddleware = authorize('staff');
      authorizeMiddleware(mockReq, mockRes, nextFunction);
      expect(nextFunction).toHaveBeenCalledTimes(2);
      expect(nextFunction.mock.calls[1][0]).toBeUndefined();
    });
  });
}); 