const backupService = require('../services/backup.service');
const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');

class BackupController {
    // 수동 백업 실행
    async runBackup() {
        try {
            await backupService.runManualBackup();
            return {
                success: true,
                message: '백업이 성공적으로 완료되었습니다.'
            };
        } catch (error) {
            logger.error('Manual backup failed:', error);
            throw error;
        }
    }

    // 백업 상태 확인
    async getStatus() {
        try {
            const files = await fs.promises.readdir(backupService.backupPath);
            const backups = files
                .filter(file => file.startsWith('backup_'))
                .map(file => {
                    const stats = fs.statSync(path.join(backupService.backupPath, file));
                    return {
                        filename: file,
                        size: stats.size,
                        createdAt: stats.birthtime,
                        modifiedAt: stats.mtime
                    };
                })
                .sort((a, b) => b.createdAt - a.createdAt);

            return {
                totalBackups: backups.length,
                latestBackup: backups[0] || null,
                backups: backups
            };
        } catch (error) {
            logger.error('Failed to get backup status:', error);
            throw error;
        }
    }
}

module.exports = new BackupController(); 