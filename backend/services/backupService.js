const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const schedule = require('node-schedule');
const execAsync = promisify(exec);

class BackupService {
  constructor() {
    this.backupDir = path.join(process.cwd(), 'backups');
    this.schedules = {};
    this.ensureBackupDirectory();
  }

  ensureBackupDirectory() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  // 스케줄링된 백업 시작
  startScheduledBackups() {
    // 일간 백업 (매일 새벽 3시)
    this.schedules.daily = schedule.scheduleJob('0 3 * * *', async () => {
      console.log('일간 백업 시작...');
      try {
        await this.createBackup('daily');
        await this.cleanupOldBackups('daily', 7); // 7일치 보관
      } catch (error) {
        console.error('일간 백업 실패:', error);
      }
    });

    // 주간 백업 (매주 일요일 새벽 4시)
    this.schedules.weekly = schedule.scheduleJob('0 4 * * 0', async () => {
      console.log('주간 백업 시작...');
      try {
        await this.createBackup('weekly');
        await this.cleanupOldBackups('weekly', 4); // 4주치 보관
      } catch (error) {
        console.error('주간 백업 실패:', error);
      }
    });

    // 월간 백업 (매월 1일 새벽 5시)
    this.schedules.monthly = schedule.scheduleJob('0 5 1 * *', async () => {
      console.log('월간 백업 시작...');
      try {
        await this.createBackup('monthly');
        await this.cleanupOldBackups('monthly', 12); // 12개월치 보관
      } catch (error) {
        console.error('월간 백업 실패:', error);
      }
    });

    console.log('백업 스케줄러 시작됨');
  }

  // 스케줄링된 백업 중지
  stopScheduledBackups() {
    Object.values(this.schedules).forEach(job => job.cancel());
    console.log('백업 스케줄러 중지됨');
  }

  // 수동 백업 실행
  async runManualBackup(type = 'manual') {
    console.log(`수동 백업 시작 (타입: ${type})...`);
    try {
      const backupPath = await this.createBackup(type);
      return { 
        success: true, 
        message: '수동 백업이 성공적으로 생성되었습니다.',
        backupPath 
      };
    } catch (error) {
      console.error(`수동 백업 실패:`, error);
      throw new Error(`수동 백업 실패: ${error.message}`);
    }
  }

  // 백업 생성
  async createBackup(type = 'manual') {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFileName = `backup_${type}_${timestamp}`;
      const backupPath = path.join(this.backupDir, type, backupFileName);

      // 백업 디렉토리 생성
      fs.mkdirSync(path.join(this.backupDir, type), { recursive: true });

      // 데이터베이스 백업
      await this.backupDatabase(backupPath);

      // 맥파 데이터 백업
      await this.backupPulseData(backupPath);

      // 환자 기록 백업
      await this.backupPatientRecords(backupPath);

      return backupPath;
    } catch (error) {
      console.error('백업 생성 중 오류 발생:', error);
      throw new Error('백업 생성 중 오류가 발생했습니다.');
    }
  }

  // 오래된 백업 정리
  async cleanupOldBackups(type, keepCount) {
    const typeDir = path.join(this.backupDir, type);
    if (!fs.existsSync(typeDir)) return;

    const backups = fs.readdirSync(typeDir)
      .filter(file => fs.statSync(path.join(typeDir, file)).isDirectory())
      .sort((a, b) => {
        const timeA = fs.statSync(path.join(typeDir, a)).mtime.getTime();
        const timeB = fs.statSync(path.join(typeDir, b)).mtime.getTime();
        return timeB - timeA;
      });

    // 지정된 수 이상의 오래된 백업 삭제
    if (backups.length > keepCount) {
      const toDelete = backups.slice(keepCount);
      for (const backup of toDelete) {
        const backupPath = path.join(typeDir, backup);
        await fs.promises.rm(backupPath, { recursive: true, force: true });
        console.log(`오래된 백업 삭제됨: ${backupPath}`);
      }
    }
  }

  async backupDatabase(backupPath) {
    const dbBackupPath = path.join(backupPath, 'db');
    fs.mkdirSync(dbBackupPath, { recursive: true });

    try {
      await execAsync(`mongodump --out=${dbBackupPath}`);
    } catch (error) {
      console.error('데이터베이스 백업 중 오류:', error);
      throw new Error('데이터베이스 백업 실패');
    }
  }

  async backupPulseData(backupPath) {
    const pulseDataDir = 'D:\\uBioMacpaData';
    const backupPulseDir = path.join(backupPath, 'pulse_data');
    fs.mkdirSync(backupPulseDir, { recursive: true });

    try {
      const files = fs.readdirSync(pulseDataDir);
      for (const file of files) {
        if (file.endsWith('.xlsx')) {
          fs.copyFileSync(
            path.join(pulseDataDir, file),
            path.join(backupPulseDir, file)
          );
        }
      }
    } catch (error) {
      console.error('맥파 데이터 백업 중 오류:', error);
      throw new Error('맥파 데이터 백업 실패');
    }
  }

  async backupPatientRecords(backupPath) {
    const recordsDir = path.join(process.cwd(), 'patient_records');
    const backupRecordsDir = path.join(backupPath, 'patient_records');
    fs.mkdirSync(backupRecordsDir, { recursive: true });

    try {
      const files = fs.readdirSync(recordsDir);
      for (const file of files) {
        fs.copyFileSync(
          path.join(recordsDir, file),
          path.join(backupRecordsDir, file)
        );
      }
    } catch (error) {
      console.error('환자 기록 백업 중 오류:', error);
      throw new Error('환자 기록 백업 실패');
    }
  }

  async restoreBackup(backupPath) {
    try {
      if (!fs.existsSync(backupPath)) {
        throw new Error('지정된 백업 파일을 찾을 수 없습니다.');
      }

      // 데이터베이스 복원
      await this.restoreDatabase(backupPath);

      // 맥파 데이터 복원
      await this.restorePulseData(backupPath);

      // 환자 기록 복원
      await this.restorePatientRecords(backupPath);

      return {
        success: true,
        message: '백업이 성공적으로 복원되었습니다.'
      };
    } catch (error) {
      console.error('백업 복원 중 오류 발생:', error);
      throw new Error('백업 복원 중 오류가 발생했습니다.');
    }
  }

  async restoreDatabase(backupPath) {
    const dbBackupPath = path.join(backupPath, 'db');
    try {
      await execAsync(`mongorestore ${dbBackupPath}`);
    } catch (error) {
      console.error('데이터베이스 복원 중 오류:', error);
      throw new Error('데이터베이스 복원 실패');
    }
  }

  async restorePulseData(backupPath) {
    const pulseBackupDir = path.join(backupPath, 'pulse_data');
    const targetDir = 'D:\\uBioMacpaData';

    try {
      const files = fs.readdirSync(pulseBackupDir);
      for (const file of files) {
        if (file.endsWith('.xlsx')) {
          fs.copyFileSync(
            path.join(pulseBackupDir, file),
            path.join(targetDir, file)
          );
        }
      }
    } catch (error) {
      console.error('맥파 데이터 복원 중 오류:', error);
      throw new Error('맥파 데이터 복원 실패');
    }
  }

  async restorePatientRecords(backupPath) {
    const recordsBackupDir = path.join(backupPath, 'patient_records');
    const targetDir = path.join(process.cwd(), 'patient_records');

    try {
      const files = fs.readdirSync(recordsBackupDir);
      for (const file of files) {
        fs.copyFileSync(
          path.join(recordsBackupDir, file),
          path.join(targetDir, file)
        );
      }
    } catch (error) {
      console.error('환자 기록 복원 중 오류:', error);
      throw new Error('환자 기록 복원 실패');
    }
  }
}

module.exports = new BackupService(); 