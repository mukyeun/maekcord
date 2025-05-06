const request = require('supertest');
const app = require('../../app');
const Patient = require('../../models/Patient');
const Waitlist = require('../../models/Waitlist');
const { createTestUser, generateToken } = require('../testUtils');
const moment = require('moment-timezone');

describe('Waitlist Controller Test', () => {
  let authToken;
  let testPatient;
  let testWaitlist;

  const testUser = {
    email: 'staff@example.com',
    password: 'password123',
    name: '직원',
    role: 'staff'
  };

  const validPatientData = {
    name: '홍길동',
    birthDate: '1990-01-01',
    gender: 'male',
    contact: {
      phone: '010-1234-5678',
      email: 'hong@example.com'
    }
  };

  beforeEach(async () => {
    // 테스트 사용자 생성 및 토큰 발급
    const user = await createTestUser(testUser);
    authToken = generateToken(user);

    // 테스트 환자 생성
    testPatient = await Patient.create(validPatientData);

    // 테스트 대기자 생성
    testWaitlist = await Waitlist.create({
      patientId: testPatient._id,
      priority: 1,
      estimatedTime: moment().add(1, 'hour').toDate(),
      status: 'waiting',
      note: '초진 환자'
    });
  });

  describe('GET /api/waitlist', () => {
    beforeEach(async () => {
      // 추가 테스트 대기자들 생성
      await Waitlist.create([
        {
          patientId: testPatient._id,
          priority: 2,
          estimatedTime: moment().add(30, 'minutes').toDate(),
          status: 'waiting'
        },
        {
          patientId: testPatient._id,
          priority: 3,
          estimatedTime: moment().add(15, 'minutes').toDate(),
          status: 'waiting'
        }
      ]);
    });

    it('should get current waitlist ordered by priority', async () => {
      const response = await request(app)
        .get('/api/waitlist')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.waitlist).toHaveLength(3);
      
      // 우선순위 순서 확인
      const priorities = response.body.data.waitlist.map(w => w.priority);
      expect(priorities).toEqual([3, 2, 1]);
    });

    it('should filter waitlist by status', async () => {
      // 한 대기자의 상태를 변경
      await Waitlist.findByIdAndUpdate(testWaitlist._id, { status: 'called' });

      const response = await request(app)
        .get('/api/waitlist')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ status: 'waiting' });

      expect(response.status).toBe(200);
      expect(response.body.data.waitlist).toHaveLength(2);
      expect(response.body.data.waitlist.every(w => w.status === 'waiting')).toBe(true);
    });

    it('should get waitlist for specific date', async () => {
      const today = moment().format('YYYY-MM-DD');
      
      const response = await request(app)
        .get('/api/waitlist')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ date: today });

      expect(response.status).toBe(200);
      expect(response.body.data.waitlist.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/waitlist', () => {
    it('should add patient to waitlist', async () => {
      const newWaitlistData = {
        patientId: testPatient._id,
        priority: 4,
        estimatedTime: moment().add(2, 'hours').toDate(),
        note: '긴급 환자'
      };

      const response = await request(app)
        .post('/api/waitlist')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newWaitlistData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.priority).toBe(newWaitlistData.priority);
      expect(response.body.data.note).toBe(newWaitlistData.note);
    });

    it('should fail if patient is already in waitlist', async () => {
      const duplicateWaitlistData = {
        patientId: testPatient._id,
        priority: 1
      };

      const response = await request(app)
        .post('/api/waitlist')
        .set('Authorization', `Bearer ${authToken}`)
        .send(duplicateWaitlistData);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });

    it('should fail with invalid data', async () => {
      const invalidWaitlistData = {
        patientId: 'invalid-id',
        priority: -1
      };

      const response = await request(app)
        .post('/api/waitlist')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidWaitlistData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/waitlist/:id', () => {
    it('should update waitlist status', async () => {
      const statusUpdate = {
        status: 'called',
        note: '진료실 1로 호출'
      };

      const response = await request(app)
        .put(`/api/waitlist/${testWaitlist._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(statusUpdate);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe(statusUpdate.status);
      expect(response.body.data.calledAt).toBeDefined();
    });

    it('should update priority', async () => {
      const priorityUpdate = {
        priority: 5,
        note: '우선순위 상향'
      };

      const response = await request(app)
        .put(`/api/waitlist/${testWaitlist._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(priorityUpdate);

      expect(response.status).toBe(200);
      expect(response.body.data.priority).toBe(priorityUpdate.priority);
    });

    it('should fail with invalid status transition', async () => {
      // completed 상태로 변경 후 waiting으로 되돌리기 시도
      await Waitlist.findByIdAndUpdate(testWaitlist._id, { status: 'completed' });

      const invalidStatusUpdate = {
        status: 'waiting'
      };

      const response = await request(app)
        .put(`/api/waitlist/${testWaitlist._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidStatusUpdate);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/waitlist/:id', () => {
    it('should remove patient from waitlist', async () => {
      const response = await request(app)
        .delete(`/api/waitlist/${testWaitlist._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ reason: '환자 요청' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // 실제로 삭제되었는지 확인
      const deletedWaitlist = await Waitlist.findById(testWaitlist._id);
      expect(deletedWaitlist).toBeNull();
    });

    it('should fail with non-existent id', async () => {
      const nonExistentId = '507f1f77bcf86cd799439011';
      
      const response = await request(app)
        .delete(`/api/waitlist/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Authorization Tests', () => {
    it('should require authentication for all routes', async () => {
      const routes = [
        { method: 'get', path: '/api/waitlist' },
        { method: 'post', path: '/api/waitlist' },
        { method: 'put', path: `/api/waitlist/${testWaitlist._id}` },
        { method: 'delete', path: `/api/waitlist/${testWaitlist._id}` }
      ];

      for (const route of routes) {
        const response = await request(app)[route.method](route.path);
        expect(response.status).toBe(401);
      }
    });
  });
}); 