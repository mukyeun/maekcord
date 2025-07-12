const request = require('supertest');
const app = require('../../app');
const fs = require('fs').promises;
const path = require('path');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

describe('Backup System Tests', () => {
  let mongoServer;
  let adminToken;

  beforeAll(async () => {
    // Setup in-memory MongoDB instance
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Create admin user and get token
    const adminResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: process.env.ADMIN_EMAIL || 'admin@test.com',
        password: process.env.ADMIN_PASSWORD || 'admin123'
      });
    adminToken = adminResponse.body.token;
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  describe('Full Backup Flow', () => {
    it('should perform complete backup lifecycle', async () => {
      // 1. Create test data
      const testData = {
        patientId: 'TEST001',
        name: 'Test Patient',
        measurements: [{
          timestamp: new Date(),
          value: 120
        }]
      };

      await request(app)
        .post('/api/patients')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(testData)
        .expect(201);

      // 2. Create backup
      const createResponse = await request(app)
        .post('/api/backup/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(createResponse.body.success).toBe(true);
      const backupFilename = createResponse.body.filename;

      // 3. Verify backup file exists
      const backupPath = path.join(__dirname, '../../backups', backupFilename);
      const fileExists = await fs.access(backupPath)
        .then(() => true)
        .catch(() => false);
      expect(fileExists).toBe(true);

      // 4. Delete test data
      await request(app)
        .delete(`/api/patients/${testData.patientId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // 5. Restore backup
      const restoreResponse = await request(app)
        .post(`/api/backup/restore/${backupFilename}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(restoreResponse.body.success).toBe(true);

      // 6. Verify data is restored
      const getResponse = await request(app)
        .get(`/api/patients/${testData.patientId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(getResponse.body.patientId).toBe(testData.patientId);
      expect(getResponse.body.name).toBe(testData.name);
    });
  });

  describe('Backup Scheduling', () => {
    it('should handle scheduled backups', async () => {
      // Start backup scheduler
      await request(app)
        .post('/api/backup/start')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Wait for scheduled backup (reduced time for testing)
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Check backup was created
      const listResponse = await request(app)
        .get('/api/backup/list')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(listResponse.body.success).toBe(true);
      expect(listResponse.body.backups.length).toBeGreaterThan(0);

      // Stop backup scheduler
      await request(app)
        .post('/api/backup/stop')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid backup restore', async () => {
      const response = await request(app)
        .post('/api/backup/restore/nonexistent.json')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeTruthy();
    });

    it('should handle unauthorized access', async () => {
      await request(app)
        .post('/api/backup/create')
        .expect(401);
    });
  });
}); 