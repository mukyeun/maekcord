const request = require('supertest');
const app = require('../../app');
const User = require('../../models/User');
const { createTestUser, generateToken } = require('../testUtils');

describe('Auth Controller Test', () => {
  let testUser;
  const userCredentials = {
    email: 'test@example.com',
    password: 'password123',
    name: '테스트 사용자',
    role: 'staff'
  };

  beforeEach(async () => {
    // 테스트 사용자 생성
    testUser = await createTestUser(userCredentials);
  });

  describe('POST /api/auth/register', () => {
    const newUser = {
      email: 'new@example.com',
      password: 'newpassword123',
      name: '신규 사용자',
      role: 'staff'
    };

    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(newUser);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.email).toBe(newUser.email);
    });

    it('should fail registration with existing email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(userCredentials);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });

    it('should fail registration with invalid data', async () => {
      const invalidUser = {
        email: 'invalid-email',
        password: '123', // too short
        name: ''
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidUser);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: userCredentials.email,
          password: userCredentials.password
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
    });

    it('should fail login with wrong password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: userCredentials.email,
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should fail login with non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: userCredentials.password
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should lock account after max login attempts', async () => {
      // Max login attempts + 1 times
      for (let i = 0; i <= 5; i++) {
        await request(app)
          .post('/api/auth/login')
          .send({
            email: userCredentials.email,
            password: 'wrongpassword'
          });
      }

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: userCredentials.email,
          password: userCredentials.password // correct password
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toContain('locked');
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    it('should send reset password email for valid user', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: userCredentials.email });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      // 실제 이메일 전송은 모킹 처리 필요
    });

    it('should fail gracefully for non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/reset-password/:token', () => {
    let resetToken;

    beforeEach(async () => {
      // 비밀번호 재설정 토큰 생성
      const user = await User.findOne({ email: userCredentials.email });
      resetToken = user.createPasswordResetToken();
      await user.save();
    });

    it('should reset password with valid token', async () => {
      const response = await request(app)
        .post(`/api/auth/reset-password/${resetToken}`)
        .send({
          password: 'newpassword123',
          passwordConfirm: 'newpassword123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // 새 비밀번호로 로그인 확인
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: userCredentials.email,
          password: 'newpassword123'
        });

      expect(loginResponse.status).toBe(200);
    });

    it('should fail with invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password/invalidtoken')
        .send({
          password: 'newpassword123',
          passwordConfirm: 'newpassword123'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should fail with password mismatch', async () => {
      const response = await request(app)
        .post(`/api/auth/reset-password/${resetToken}`)
        .send({
          password: 'newpassword123',
          passwordConfirm: 'differentpassword'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user info with valid token', async () => {
      const token = generateToken(testUser);

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(userCredentials.email);
    });

    it('should fail with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalidtoken');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should fail without token', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
}); 