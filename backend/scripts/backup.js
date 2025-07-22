const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const cron = require('node-cron');
const { logger } = require('../utils/logger');

const execAsync = promisify(exec);

class DatabaseBackup {
  constructor() {
    this.backupDir = path.join(__dirname, '../backups');
    this.ensureBackupDirectory();
  }

  // 백업 디렉토리 생성
  ensureBackupDirectory() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
      logger.info('📁 백업 디렉토리 생성됨:', this.backupDir);
    }
  }

  // 백업 파일명 생성
  generateBackupFileName() {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
    return `maekcord-backup-${timestamp}.gz`;
  }

  // MongoDB 백업 실행
  async createBackup() {
    try {
      const backupFileName = this.generateBackupFileName();
      const backupPath = path.join(this.backupDir, backupFileName);
      
      logger.info('🔄 데이터베이스 백업 시작...');
      
      // MongoDB URI에서 데이터베이스 이름 추출
      const dbUri = process.env.MONGODB_URI;
      const dbName = dbUri.split('/').pop().split('?')[0];
      
      // mongodump 명령어 실행
      const command = `mongodump --uri="${dbUri}" --archive="${backupPath}" --gzip`;
      
      const { stdout, stderr } = await execAsync(command);
      
      if (stderr && !stderr.includes('warning')) {
        throw new Error(`백업 중 오류 발생: ${stderr}`);
      }
      
      const stats = fs.statSync(backupPath);
      const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
      
      logger.info('✅ 백업 완료', {
        fileName: backupFileName,
        fileSize: `${fileSizeMB}MB`,
        path: backupPath,
        timestamp: new Date().toISOString()
      });
      
      // 백업 정보 저장
      await this.saveBackupInfo(backupFileName, fileSizeMB);
      
      // 오래된 백업 파일 정리
      await this.cleanupOldBackups();
      
      return {
        success: true,
        fileName: backupFileName,
        fileSize: `${fileSizeMB}MB`,
        path: backupPath
      };
      
    } catch (error) {
      logger.error('❌ 백업 실패:', error);
      throw error;
    }
  }

  // 백업 정보 저장
  async saveBackupInfo(fileName, fileSize) {
    const backupInfo = {
      fileName,
      fileSize,
      createdAt: new Date().toISOString(),
      status: 'completed'
    };
    
    const infoPath = path.join(this.backupDir, 'backup-info.json');
    let backupHistory = [];
    
    try {
      if (fs.existsSync(infoPath)) {
        backupHistory = JSON.parse(fs.readFileSync(infoPath, 'utf8'));
      }
    } catch (error) {
      logger.warn('백업 정보 파일 읽기 실패, 새로 생성합니다.');
    }
    
    backupHistory.unshift(backupInfo);
    
    // 최근 50개만 유지
    if (backupHistory.length > 50) {
      backupHistory = backupHistory.slice(0, 50);
    }
    
    fs.writeFileSync(infoPath, JSON.stringify(backupHistory, null, 2));
  }

  // 오래된 백업 파일 정리
  async cleanupOldBackups() {
    try {
      const files = fs.readdirSync(this.backupDir);
      const backupFiles = files.filter(file => 
        file.startsWith('maekcord-backup-') && file.endsWith('.gz')
      );
      
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      let deletedCount = 0;
      
      for (const file of backupFiles) {
        const filePath = path.join(this.backupDir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.mtime < thirtyDaysAgo) {
          fs.unlinkSync(filePath);
          deletedCount++;
          logger.info(`🗑️ 오래된 백업 파일 삭제: ${file}`);
        }
      }
      
      if (deletedCount > 0) {
        logger.info(`✅ 백업 정리 완료: ${deletedCount}개 파일 삭제됨`);
      }
      
    } catch (error) {
      logger.error('❌ 백업 정리 실패:', error);
    }
  }

  // 백업 복구
  async restoreBackup(backupFileName) {
    try {
      const backupPath = path.join(this.backupDir, backupFileName);
      
      if (!fs.existsSync(backupPath)) {
        throw new Error(`백업 파일을 찾을 수 없습니다: ${backupFileName}`);
      }
      
      logger.info('🔄 데이터베이스 복구 시작...', { backupFileName });
      
      const dbUri = process.env.MONGODB_URI;
      const command = `mongorestore --uri="${dbUri}" --archive="${backupPath}" --gzip --drop`;
      
      const { stdout, stderr } = await execAsync(command);
      
      if (stderr && !stderr.includes('warning')) {
        throw new Error(`복구 중 오류 발생: ${stderr}`);
      }
      
      logger.info('✅ 복구 완료', {
        backupFileName,
        timestamp: new Date().toISOString()
      });
      
      return {
        success: true,
        message: '데이터베이스 복구가 완료되었습니다.'
      };
      
    } catch (error) {
      logger.error('❌ 복구 실패:', error);
      throw error;
    }
  }

  // 백업 목록 조회
  getBackupList() {
    try {
      const files = fs.readdirSync(this.backupDir);
      const backupFiles = files
        .filter(file => file.startsWith('maekcord-backup-') && file.endsWith('.gz'))
        .map(file => {
          const filePath = path.join(this.backupDir, file);
          const stats = fs.statSync(filePath);
          const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
          
          return {
            fileName: file,
            fileSize: `${fileSizeMB}MB`,
            createdAt: stats.mtime.toISOString(),
            path: filePath
          };
        })
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      return backupFiles;
      
    } catch (error) {
      logger.error('❌ 백업 목록 조회 실패:', error);
      return [];
    }
  }

  // 백업 상태 확인
  getBackupStatus() {
    try {
      const backupList = this.getBackupList();
      const latestBackup = backupList[0];
      
      if (!latestBackup) {
        return {
          hasBackup: false,
          lastBackup: null,
          totalBackups: 0
        };
      }
      
      const lastBackupDate = new Date(latestBackup.createdAt);
      const daysSinceLastBackup = Math.floor((Date.now() - lastBackupDate.getTime()) / (1000 * 60 * 60 * 24));
      
      return {
        hasBackup: true,
        lastBackup: latestBackup,
        totalBackups: backupList.length,
        daysSinceLastBackup,
        isRecent: daysSinceLastBackup <= 1
      };
      
    } catch (error) {
      logger.error('❌ 백업 상태 확인 실패:', error);
      return {
        hasBackup: false,
        lastBackup: null,
        totalBackups: 0
      };
    }
  }

  // 자동 백업 스케줄링
  scheduleBackup() {
    // 매일 새벽 2시에 백업 실행
    cron.schedule('0 2 * * *', async () => {
      try {
        logger.info('⏰ 자동 백업 시작');
        await this.createBackup();
        logger.info('✅ 자동 백업 완료');
      } catch (error) {
        logger.error('❌ 자동 백업 실패:', error);
      }
    }, {
      timezone: 'Asia/Seoul'
    });
    
    logger.info('📅 자동 백업 스케줄 등록됨 (매일 새벽 2시)');
  }

  // 백업 테스트
  async testBackup() {
    try {
      logger.info('🧪 백업 테스트 시작...');
      
      const result = await this.createBackup();
      
      // 테스트 백업 파일 삭제
      const testBackupPath = path.join(this.backupDir, result.fileName);
      if (fs.existsSync(testBackupPath)) {
        fs.unlinkSync(testBackupPath);
        logger.info('🧹 테스트 백업 파일 삭제됨');
      }
      
      logger.info('✅ 백업 테스트 성공');
      return { success: true, message: '백업 테스트가 성공했습니다.' };
      
    } catch (error) {
      logger.error('❌ 백업 테스트 실패:', error);
      throw error;
    }
  }
}

// 백업 인스턴스 생성
const backupManager = new DatabaseBackup();

// 프로덕션 환경에서 자동 백업 스케줄링
if (process.env.NODE_ENV === 'production') {
  backupManager.scheduleBackup();
}

module.exports = backupManager; 