const request = require('supertest');
const app = require('../../app');
const Patient = require('../../models/Patient');
const { createTestUser, generateToken } = require('../testUtils');

describe('Patient Controller Test', () => {
  let authToken;
  let testPatient;

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
      email: 'hong@example.com',
      address: '서울시 강남구'
    },
    medicalInfo: {
      bloodType: 'A+',
      allergies: ['penicillin'],
      medications: ['aspirin'],
      conditions: ['hypertension']
    }
  };

  beforeEach(async () => {
    // 테스트 사용자 생성 및 토큰 발급
    const user = await createTestUser(testUser);
    authToken = generateToken(user);

    // 테스트 환자 생성
    testPatient = await Patient.create(validPatientData);
  });

  describe('GET /api/patients', () => {
    beforeEach(async () => {
      // 추가 테스트 환자들 생성
      await Patient.create([
        { ...validPatientData, name: '김철수', contact: { ...validPatientData.contact, phone: '010-2222-3333' } },
        { ...validPatientData, name: '이영희', contact: { ...validPatientData.contact, phone: '010-4444-5555' } }
      ]);
    });

    it('should get all patients with pagination', async () => {
      const response = await request(app)
        .get('/api/patients')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.patients).toHaveLength(3);
      expect(response.body.data.total).toBe(3);
    });

    it('should search patients by name', async () => {
      const response = await request(app)
        .get('/api/patients')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ search: '김철수' });

      expect(response.status).toBe(200);
      expect(response.body.data.patients).toHaveLength(1);
      expect(response.body.data.patients[0].name).toBe('김철수');
    });

    it('should search patients by phone number', async () => {
      const response = await request(app)
        .get('/api/patients')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ search: '4444' });

      expect(response.status).toBe(200);
      expect(response.body.data.patients).toHaveLength(1);
      expect(response.body.data.patients[0].name).toBe('이영희');
    });
  });

  describe('GET /api/patients/:id', () => {
    it('should get patient by id', async () => {
      const response = await request(app)
        .get(`/api/patients/${testPatient._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(testPatient.name);
    });

    it('should return 404 for non-existent patient', async () => {
      const nonExistentId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .get(`/api/patients/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/patients', () => {
    it('should create a new patient', async () => {
      const newPatientData = {
        ...validPatientData,
        name: '신규환자',
        contact: { ...validPatientData.contact, phone: '010-9999-8888' }
      };

      const response = await request(app)
        .post('/api/patients')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newPatientData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(newPatientData.name);
    });

    it('should fail with invalid data', async () => {
      const invalidPatientData = {
        name: '', // required field
        gender: 'invalid' // invalid enum value
      };

      const response = await request(app)
        .post('/api/patients')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidPatientData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/patients/:id', () => {
    it('should update patient information', async () => {
      const updateData = {
        name: '홍길동(수정)',
        contact: {
          ...validPatientData.contact,
          phone: '010-5555-6666'
        }
      };

      const response = await request(app)
        .put(`/api/patients/${testPatient._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.contact.phone).toBe(updateData.contact.phone);
    });

    it('should fail with invalid data', async () => {
      const invalidUpdateData = {
        gender: 'invalid'
      };

      const response = await request(app)
        .put(`/api/patients/${testPatient._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidUpdateData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/patients/:id/status', () => {
    it('should update patient status', async () => {
      const statusUpdate = {
        status: 'inactive',
        reason: '장기 미방문'
      };

      const response = await request(app)
        .put(`/api/patients/${testPatient._id}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(statusUpdate);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe(statusUpdate.status);
    });

    it('should fail with invalid status', async () => {
      const invalidStatusUpdate = {
        status: 'invalid'
      };

      const response = await request(app)
        .put(`/api/patients/${testPatient._id}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidStatusUpdate);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Authorization Tests', () => {
    it('should require authentication for all routes', async () => {
      const routes = [
        { method: 'get', path: '/api/patients' },
        { method: 'get', path: `/api/patients/${testPatient._id}` },
        { method: 'post', path: '/api/patients' },
        { method: 'put', path: `/api/patients/${testPatient._id}` },
        { method: 'put', path: `/api/patients/${testPatient._id}/status` }
      ];

      for (const route of routes) {
        const response = await request(app)[route.method](route.path);
        expect(response.status).toBe(401);
      }
    });
  });
}); 