const request = require('supertest');
const app = require('../../app');
const Patient = require('../../models/Patient');
const Appointment = require('../../models/Appointment');
const { createTestUser, generateToken } = require('../testUtils');
const moment = require('moment-timezone');

describe('Appointment Controller Test', () => {
  let authToken;
  let testPatient;
  let testAppointment;

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

    // 테스트 예약 생성
    testAppointment = await Appointment.create({
      patientId: testPatient._id,
      dateTime: moment().add(1, 'day').toDate(),
      duration: 30,
      type: 'initial',
      status: 'scheduled'
    });
  });

  describe('GET /api/appointments', () => {
    beforeEach(async () => {
      // 추가 테스트 예약들 생성
      await Appointment.create([
        {
          patientId: testPatient._id,
          dateTime: moment().add(2, 'days').toDate(),
          duration: 30,
          type: 'follow_up',
          status: 'scheduled'
        },
        {
          patientId: testPatient._id,
          dateTime: moment().add(3, 'days').toDate(),
          duration: 45,
          type: 'consultation',
          status: 'scheduled'
        }
      ]);
    });

    it('should get appointments for a specific date', async () => {
      const targetDate = moment().add(1, 'day').format('YYYY-MM-DD');
      const response = await request(app)
        .get('/api/appointments')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ date: targetDate });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.appointments).toHaveLength(1);
    });

    it('should filter appointments by status', async () => {
      const response = await request(app)
        .get('/api/appointments')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ status: 'scheduled' });

      expect(response.status).toBe(200);
      expect(response.body.data.appointments).toHaveLength(3);
      expect(response.body.data.appointments[0].status).toBe('scheduled');
    });

    it('should paginate results', async () => {
      const response = await request(app)
        .get('/api/appointments')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 2 });

      expect(response.status).toBe(200);
      expect(response.body.data.appointments).toHaveLength(2);
      expect(response.body.data.total).toBe(3);
    });
  });

  describe('POST /api/appointments', () => {
    it('should create a new appointment', async () => {
      const newAppointmentData = {
        patientId: testPatient._id,
        dateTime: moment().add(4, 'days').toDate(),
        duration: 30,
        type: 'initial',
        notes: '초진 예약'
      };

      const response = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newAppointmentData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.patientId).toEqual(testPatient._id.toString());
    });

    it('should fail with time conflict', async () => {
      const conflictingAppointmentData = {
        patientId: testPatient._id,
        dateTime: testAppointment.dateTime,
        duration: 30,
        type: 'follow_up'
      };

      const response = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(conflictingAppointmentData);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });

    it('should fail with invalid data', async () => {
      const invalidAppointmentData = {
        patientId: testPatient._id,
        dateTime: 'invalid-date',
        type: 'invalid-type'
      };

      const response = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidAppointmentData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/appointments/:id', () => {
    it('should update appointment details', async () => {
      const updateData = {
        dateTime: moment().add(5, 'days').toDate(),
        duration: 45,
        notes: '예약 시간 변경'
      };

      const response = await request(app)
        .put(`/api/appointments/${testAppointment._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.duration).toBe(updateData.duration);
      expect(response.body.data.notes).toBe(updateData.notes);
    });

    it('should fail with invalid update data', async () => {
      const invalidUpdateData = {
        duration: -30 // invalid duration
      };

      const response = await request(app)
        .put(`/api/appointments/${testAppointment._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidUpdateData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/appointments/:id/status', () => {
    it('should update appointment status', async () => {
      const statusUpdate = {
        status: 'completed',
        notes: '진료 완료'
      };

      const response = await request(app)
        .put(`/api/appointments/${testAppointment._id}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(statusUpdate);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe(statusUpdate.status);
      expect(response.body.data.completedAt).toBeDefined();
    });

    it('should fail with invalid status transition', async () => {
      // 이미 완료된 예약의 상태를 scheduled로 변경 시도
      await testAppointment.updateOne({ status: 'completed' });

      const invalidStatusUpdate = {
        status: 'scheduled'
      };

      const response = await request(app)
        .put(`/api/appointments/${testAppointment._id}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidStatusUpdate);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/appointments/availability', () => {
    it('should return available time slots', async () => {
      const date = moment().add(1, 'day').format('YYYY-MM-DD');
      
      const response = await request(app)
        .get('/api/appointments/availability')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ date });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.availableSlots)).toBe(true);
    });

    it('should consider existing appointments', async () => {
      const date = moment().add(1, 'day').format('YYYY-MM-DD');
      
      const response = await request(app)
        .get('/api/appointments/availability')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ date });

      const existingAppointmentTime = moment(testAppointment.dateTime).format('HH:mm');
      const availableSlots = response.body.data.availableSlots;
      
      expect(availableSlots).not.toContain(existingAppointmentTime);
    });
  });

  describe('Authorization Tests', () => {
    it('should require authentication for all routes', async () => {
      const routes = [
        { method: 'get', path: '/api/appointments' },
        { method: 'post', path: '/api/appointments' },
        { method: 'put', path: `/api/appointments/${testAppointment._id}` },
        { method: 'put', path: `/api/appointments/${testAppointment._id}/status` },
        { method: 'get', path: '/api/appointments/availability' }
      ];

      for (const route of routes) {
        const response = await request(app)[route.method](route.path);
        expect(response.status).toBe(401);
      }
    });
  });
}); 