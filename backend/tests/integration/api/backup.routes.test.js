const request = require('supertest');
const app = require('../../../app');
const backupService = require('../../../services/backup.service');
const auth = require('../../../middlewares/auth');
const cron = require('node-cron');

jest.mock('../../../services/backup.service');
jest.mock('../../../middlewares/auth');

// 테스트별 타임아웃 설정 (60초)
const TEST_TIMEOUT = 60000;

describe('Backup Routes', () => {
  beforeAll(async () => {
    // 테스트 시작 전에 모든 cron 작업 중지
    cron.getTasks().forEach(task => task.stop());
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock authenticateAdmin middleware to allow requests
    auth.authenticateAdmin.mockImplementation((req, res, next) => next());
  });

  afterAll(async () => {
    // 테스트 완료 후 정리
    cron.getTasks().forEach(task => task.stop());
    
    // 서버 관련 리소스 정리
    if (app.close) {
      await new Promise(resolve => app.close(resolve));
    }
  });

  describe('GET /api/backup/status', () => {
    it('should return backup status', async () => {
      const mockStatus = {
        totalBackups: 1,
        latestBackup: {
          filename: 'backup_2024-01-01.json',
          size: 1024,
          createdAt: '2024-01-01T00:00:00.000Z',
          modifiedAt: '2024-01-01T00:00:00.000Z'
        },
        backups: [
          {
            filename: 'backup_2024-01-01.json',
            size: 1024,
            createdAt: '2024-01-01T00:00:00.000Z',
            modifiedAt: '2024-01-01T00:00:00.000Z'
          }
        ]
      };

      // Mock backupService.backupPath
      backupService.backupPath = './backups';
      
      // Mock fs.promises.readdir
      const fs = require('fs').promises;
      jest.spyOn(fs, 'readdir').mockResolvedValue(['backup_2024-01-01.json']);
      
      // Mock fs.statSync
      const fsSync = require('fs');
      jest.spyOn(fsSync, 'statSync').mockReturnValue({
        size: 1024,
        birthtime: new Date('2024-01-01'),
        mtime: new Date('2024-01-01')
      });

      const response = await request(app)
        .get('/api/backup/status')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockStatus);
    }, TEST_TIMEOUT);

    it('should handle errors', async () => {
      // Mock fs.promises.readdir to throw error
      const fs = require('fs').promises;
      jest.spyOn(fs, 'readdir').mockRejectedValue(new Error('Failed to read directory'));

      const response = await request(app)
        .get('/api/backup/status')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeTruthy();
    }, TEST_TIMEOUT);
  });

  describe('POST /api/backup/create', () => {
    it('should create backup successfully', async () => {
      const mockResult = {
        filename: 'backup_2024-01-01.json',
        size: 1024
      };

      backupService.createBackup.mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/api/backup/create')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.filename).toBe(mockResult.filename);
    }, TEST_TIMEOUT);

    it('should handle backup creation errors', async () => {
      backupService.createBackup.mockRejectedValue(new Error('Backup failed'));

      const response = await request(app)
        .post('/api/backup/create')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('백업 생성 실패');
    }, TEST_TIMEOUT);
  });

  describe('POST /api/backup/restore/:filename', () => {
    it('should restore backup successfully', async () => {
      const filename = 'backup_2024-01-01.json';
      backupService.restoreBackup.mockResolvedValue();

      const response = await request(app)
        .post(`/api/backup/restore/${filename}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('백업 복원 완료');
      expect(backupService.restoreBackup).toHaveBeenCalledWith(filename);
    }, TEST_TIMEOUT);

    it('should handle restore errors', async () => {
      const filename = 'nonexistent.json';
      backupService.restoreBackup.mockRejectedValue(new Error('Restore failed'));

      const response = await request(app)
        .post(`/api/backup/restore/${filename}`)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('백업 복원 실패');
    }, TEST_TIMEOUT);
  });
}); 