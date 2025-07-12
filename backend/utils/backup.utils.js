const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');
const moment = require('moment');
const backupConfig = require('../config/backup.config');

class BackupUtils {
  constructor() {
    this.backupPath = backupConfig.backupPath;
    this.init();
  }

  async init() {
    try {
      await fs.mkdir(this.backupPath, { recursive: true });
      console.log('백업 디렉토리 생성 완료:', this.backupPath);
    } catch (error) {
      console.error('백업 디렉토리 생성 실패:', error);
    }
  }

  async createBackup(type = 'daily') {
    const timestamp = moment().format('YYYY-MM-DD-HHmmss');
    const backupFileName = `${backupConfig.fileNameFormat[type]}-${timestamp}`;
    const backupFilePath = path.join(this.backupPath, backupFileName);

    try {
      // mongodump 명령어 실행
      await this.runMongodump(backupFilePath);
      
      // 압축 수행
      if (backupConfig.compression.enabled) {
        await this.compressBackup(backupFilePath);
      }

      console.log(`${type} 백업 완료:`, backupFileName);
      return backupFileName;
    } catch (error) {
      console.error(`${type} 백업 실패:`, error);
      throw error;
    }
  }

  runMongodump(outputPath) {
    return new Promise((resolve, reject) => {
      const mongodump = spawn('mongodump', [
        '--uri', process.env.MONGODB_URI,
        '--out', outputPath
      ]);

      mongodump.stdout.on('data', (data) => {
        console.log('mongodump 출력:', data.toString());
      });

      mongodump.stderr.on('data', (data) => {
        console.error('mongodump 에러:', data.toString());
      });

      mongodump.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`mongodump 실패 (코드: ${code})`));
        }
      });
    });
  }

  async compressBackup(backupPath) {
    // 압축 로직 구현
    const tar = spawn('tar', [
      '-czf',
      `${backupPath}.tar.gz`,
      '-C',
      path.dirname(backupPath),
      path.basename(backupPath)
    ]);

    return new Promise((resolve, reject) => {
      tar.on('close', (code) => {
        if (code === 0) {
          // 압축 후 원본 삭제
          fs.rm(backupPath, { recursive: true })
            .then(() => resolve())
            .catch(reject);
        } else {
          reject(new Error(`압축 실패 (코드: ${code})`));
        }
      });
    });
  }

  async cleanupOldBackups(type = 'daily') {
    const retention = backupConfig.retention[type];
    const pattern = new RegExp(`^${type}-backup-.*`);

    try {
      const files = await fs.readdir(this.backupPath);
      const oldFiles = files
        .filter(file => pattern.test(file))
        .sort()
        .slice(0, -retention);

      for (const file of oldFiles) {
        await fs.unlink(path.join(this.backupPath, file));
        console.log(`오래된 백업 파일 삭제:`, file);
      }
    } catch (error) {
      console.error('백업 정리 중 오류:', error);
    }
  }

  async restoreBackup(backupFile) {
    const backupPath = path.join(this.backupPath, backupFile);
    
    try {
      // 압축 해제
      if (backupFile.endsWith('.tar.gz')) {
        await this.decompressBackup(backupFile);
      }

      // mongorestore 실행
      await this.runMongorestore(backupPath.replace('.tar.gz', ''));
      
      console.log('복원 완료:', backupFile);
      return true;
    } catch (error) {
      console.error('복원 실패:', error);
      throw error;
    }
  }

  async decompressBackup(backupFile) {
    return new Promise((resolve, reject) => {
      const tar = spawn('tar', [
        '-xzf',
        path.join(this.backupPath, backupFile),
        '-C',
        this.backupPath
      ]);

      tar.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`압축 해제 실패 (코드: ${code})`));
        }
      });
    });
  }

  runMongorestore(backupPath) {
    return new Promise((resolve, reject) => {
      const mongorestore = spawn('mongorestore', [
        '--uri', process.env.MONGODB_URI,
        '--drop',
        backupPath
      ]);

      mongorestore.stdout.on('data', (data) => {
        console.log('mongorestore 출력:', data.toString());
      });

      mongorestore.stderr.on('data', (data) => {
        console.error('mongorestore 에러:', data.toString());
      });

      mongorestore.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`mongorestore 실패 (코드: ${code})`));
        }
      });
    });
  }
}

module.exports = new BackupUtils(); 