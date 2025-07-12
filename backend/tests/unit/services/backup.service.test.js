const backupService = require('../../../services/backup.service');
const fs = require('fs').promises;
const path = require('path');

jest.mock('fs', () => ({
  promises: {
    writeFile: jest.fn(),
    readdir: jest.fn(),
    readFile: jest.fn(),
    stat: jest.fn()
  }
}));

jest.mock('../../../utils/logger');
jest.mock('mongoose');

describe('BackupService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createBackup', () => {
    it('should create a backup successfully', async () => {
      const mockDate = new Date('2024-01-01');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
      
      const mockBackupData = { data: 'test-backup-data' };
      jest.spyOn(backupService, 'generateBackupData').mockResolvedValue(mockBackupData);
      
      await backupService.createBackup();
      
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('backup_2024-01-01'),
        JSON.stringify(mockBackupData),
        'utf8'
      );
    });

    it('should handle backup creation errors', async () => {
      jest.spyOn(backupService, 'generateBackupData').mockRejectedValue(new Error('Backup failed'));
      
      await expect(backupService.createBackup()).rejects.toThrow('Backup failed');
    });
  });

  describe('listBackups', () => {
    it('should return list of backups', async () => {
      const mockFiles = ['backup_2024-01-01.json', 'backup_2024-01-02.json'];
      fs.readdir.mockResolvedValue(mockFiles);
      
      const result = await backupService.listBackups();
      
      expect(result).toEqual(mockFiles);
      expect(fs.readdir).toHaveBeenCalled();
    });
  });

  describe('restoreBackup', () => {
    it('should restore backup successfully', async () => {
      const mockBackupData = { data: 'test-backup-data' };
      fs.readFile.mockResolvedValue(JSON.stringify(mockBackupData));
      
      jest.spyOn(backupService, 'restoreBackupData').mockResolvedValue();
      
      await backupService.restoreBackup('backup_2024-01-01.json');
      
      expect(backupService.restoreBackupData).toHaveBeenCalledWith(mockBackupData);
    });

    it('should handle restore errors', async () => {
      fs.readFile.mockRejectedValue(new Error('File not found'));
      
      await expect(backupService.restoreBackup('nonexistent.json'))
        .rejects.toThrow('File not found');
    });
  });

  describe('scheduledBackup', () => {
    it('should execute scheduled backup', async () => {
      jest.spyOn(backupService, 'createBackup').mockResolvedValue();
      
      await backupService.scheduledBackup();
      
      expect(backupService.createBackup).toHaveBeenCalled();
    });
  });
}); 