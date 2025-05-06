const request = require('supertest');
const app = require('../../app');
const Patient = require('../../models/Patient');
const Appointment = require('../../models/Appointment');
const Waitlist = require('../../models/Waitlist');
const { createTestUser, generateToken } = require('../testUtils');
const moment = require('moment-timezone');

describe('Statistics Controller Test', () => {
  let authToken;
  let testPatient;
  const today = moment().startOf('day');

  const testUser = {
    email: 'staff@example.com',
    password: 'password123',
    name: '직원',
    role: 'staff'
  };

  beforeEach(async () => {
    // 테스트 사용자 생성 및 토큰 발급
    const user = await createTestUser(testUser);
    authToken = generateToken(user);

    // 테스트 환자 생성
    testPatient = await Patient.create({
      name: '홍길동',
      birthDate: '1990-01-01',
      gender: 'male',
      contact: {
        phone: '010-1234-5678',
        email: 'hong@example.com'
      },
      registeredAt: today.toDate()
    });

    // 테스트 데이터 생성
    await createTestData();
  });

  const createTestData = async () => {
    // 예약 데이터 생성
    await Appointment.create([
      {
        patientId: testPatient._id,
        dateTime: today.clone().add(2, 'hours').toDate(),
        duration: 30,
        type: 'initial',
        status: 'completed',
        completedAt: today.clone().add(2.5, 'hours').toDate()
      },
      {
        patientId: testPatient._id,
        dateTime: today.clone().add(4, 'hours').toDate(),
        duration: 30,
        type: 'follow_up',
        status: 'cancelled'
      },
      {
        patientId: testPatient._id,
        dateTime: today.clone().add(6, 'hours').toDate(),
        duration: 30,
        type: 'consultation',
        status: 'no_show'
      }
    ]);

    // 대기자 데이터 생성
    await Waitlist.create([
      {
        patientId: testPatient._id,
        priority: 1,
        status: 'completed',
        registeredAt: today.clone().add(1, 'hour').toDate(),
        completedAt: today.clone().add(2, 'hours').toDate()
      },
      {
        patientId: testPatient._id,
        priority: 2,
        status: 'cancelled',
        registeredAt: today.clone().add(3, 'hours').toDate()
      }
    ]);
  };

  describe('GET /api/statistics/daily', () => {
    it('should get daily statistics', async () => {
      const response = await request(app)
        .get('/api/statistics/daily')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ date: today.format('YYYY-MM-DD') });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const stats = response.body.data;
      expect(stats.appointments).toBeDefined();
      expect(stats.appointments.total).toBe(3);
      expect(stats.appointments.completed).toBe(1);
      expect(stats.appointments.cancelled).toBe(1);
      expect(stats.appointments.noShow).toBe(1);

      expect(stats.waitlist).toBeDefined();
      expect(stats.waitlist.total).toBe(2);
      expect(stats.waitlist.completed).toBe(1);
      expect(stats.waitlist.cancelled).toBe(1);
      expect(stats.waitlist.averageWaitTime).toBeGreaterThan(0);

      expect(stats.patients).toBeDefined();
      expect(stats.patients.new).toBe(1);
      expect(stats.patients.revisit).toBe(0);
    });

    it('should return empty statistics for future date', async () => {
      const futureDate = moment().add(1, 'month').format('YYYY-MM-DD');
      
      const response = await request(app)
        .get('/api/statistics/daily')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ date: futureDate });

      expect(response.status).toBe(200);
      const stats = response.body.data;
      
      expect(stats.appointments.total).toBe(0);
      expect(stats.waitlist.total).toBe(0);
      expect(stats.patients.new).toBe(0);
    });

    it('should fail with invalid date format', async () => {
      const response = await request(app)
        .get('/api/statistics/daily')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ date: 'invalid-date' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/statistics/monthly', () => {
    beforeEach(async () => {
      // 이전 달과 다음 달 데이터 생성
      const lastMonth = moment().subtract(1, 'month');
      const nextMonth = moment().add(1, 'month');

      await Patient.create({
        ...testPatient.toObject(),
        _id: new mongoose.Types.ObjectId(),
        registeredAt: lastMonth.toDate()
      });

      await Appointment.create([
        {
          patientId: testPatient._id,
          dateTime: lastMonth.clone().add(1, 'day').toDate(),
          duration: 30,
          type: 'initial',
          status: 'completed'
        },
        {
          patientId: testPatient._id,
          dateTime: nextMonth.clone().add(1, 'day').toDate(),
          duration: 30,
          type: 'follow_up',
          status: 'scheduled'
        }
      ]);
    });

    it('should get monthly statistics', async () => {
      const response = await request(app)
        .get('/api/statistics/monthly')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ month: today.format('YYYY-MM') });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const stats = response.body.data;
      expect(stats.appointments).toBeDefined();
      expect(stats.appointments.total).toBeGreaterThan(0);
      expect(stats.patients).toBeDefined();
      expect(stats.patients.new).toBeGreaterThan(0);
    });

    it('should compare with previous month', async () => {
      const response = await request(app)
        .get('/api/statistics/monthly')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ 
          month: today.format('YYYY-MM'),
          compare: true 
        });

      expect(response.status).toBe(200);
      const stats = response.body.data;
      
      expect(stats.comparison).toBeDefined();
      expect(stats.comparison.appointments).toBeDefined();
      expect(stats.comparison.patients).toBeDefined();
    });

    it('should fail with invalid month format', async () => {
      const response = await request(app)
        .get('/api/statistics/monthly')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ month: 'invalid-month' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/statistics/trends', () => {
    it('should get appointment trends', async () => {
      const response = await request(app)
        .get('/api/statistics/trends')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ 
          type: 'appointments',
          period: 'week'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.trends)).toBe(true);
    });

    it('should get patient trends', async () => {
      const response = await request(app)
        .get('/api/statistics/trends')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ 
          type: 'patients',
          period: 'month'
        });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data.trends)).toBe(true);
    });

    it('should fail with invalid trend type', async () => {
      const response = await request(app)
        .get('/api/statistics/trends')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ 
          type: 'invalid',
          period: 'week'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Authorization Tests', () => {
    it('should require authentication for all routes', async () => {
      const routes = [
        { 
          method: 'get', 
          path: '/api/statistics/daily',
          query: { date: today.format('YYYY-MM-DD') }
        },
        { 
          method: 'get', 
          path: '/api/statistics/monthly',
          query: { month: today.format('YYYY-MM') }
        },
        { 
          method: 'get', 
          path: '/api/statistics/trends',
          query: { type: 'appointments', period: 'week' }
        }
      ];

      for (const route of routes) {
        const response = await request(app)[route.method](route.path).query(route.query);
        expect(response.status).toBe(401);
      }
    });

    it('should require admin role for certain statistics', async () => {
      // 일반 직원 권한으로 테스트
      const staffUser = await createTestUser({ ...testUser, role: 'staff' });
      const staffToken = generateToken(staffUser);

      const response = await request(app)
        .get('/api/statistics/trends')
        .set('Authorization', `Bearer ${staffToken}`)
        .query({ 
          type: 'financial',
          period: 'month'
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });
}); 