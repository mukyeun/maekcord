const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');
const mongoose = require('mongoose');

class BackupService {
    constructor() {
        this.backupPath = path.join(__dirname, '../../backups');
    }

    async generateBackupData() {
        try {
            const collections = await mongoose.connection.db.collections();
            const backupData = {};

            for (const collection of collections) {
                const documents = await collection.find({}).toArray();
                backupData[collection.collectionName] = documents;
            }

            return backupData;
        } catch (error) {
            logger.error('백업 데이터 생성 실패:', error);
            throw error;
        }
    }

    async createBackup() {
        try {
            const backupData = await this.generateBackupData();
            const timestamp = new Date().toISOString().split('T')[0];
            const filename = `backup_${timestamp}.json`;
            const filePath = path.join(this.backupPath, filename);

            await fs.writeFile(filePath, JSON.stringify(backupData), 'utf8');
            logger.info(`백업 파일 생성 완료: ${filename}`);

            return { filename, size: Buffer.from(JSON.stringify(backupData)).length };
        } catch (error) {
            logger.error('백업 생성 실패:', error);
            throw error;
        }
    }

    async listBackups() {
        try {
            const files = await fs.readdir(this.backupPath);
            return files.filter(file => file.startsWith('backup_') && file.endsWith('.json'));
        } catch (error) {
            logger.error('백업 목록 조회 실패:', error);
            throw error;
        }
    }

    async restoreBackup(filename) {
        try {
            const filePath = path.join(this.backupPath, filename);
            const backupData = JSON.parse(await fs.readFile(filePath, 'utf8'));
            await this.restoreBackupData(backupData);
            logger.info(`백업 복원 완료: ${filename}`);
        } catch (error) {
            logger.error('백업 복원 실패:', error);
            throw error;
        }
    }

    async restoreBackupData(backupData) {
        const session = await mongoose.startSession();
        try {
            session.startTransaction();

            for (const [collectionName, documents] of Object.entries(backupData)) {
                const collection = mongoose.connection.collection(collectionName);
                await collection.deleteMany({}, { session });
                if (documents.length > 0) {
                    await collection.insertMany(documents, { session });
                }
            }

            await session.commitTransaction();
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    async scheduledBackup() {
        try {
            await this.createBackup();
            logger.info('예약된 백업 실행 완료');
        } catch (error) {
            logger.error('예약된 백업 실행 실패:', error);
            throw error;
        }
    }

    async getStatus() {
        try {
            const backups = await this.listBackups();
            const backupDetails = await Promise.all(
                backups.map(async filename => {
                    const filePath = path.join(this.backupPath, filename);
                    const stats = await fs.stat(filePath);
                    return {
                        filename,
                        size: stats.size,
                        createdAt: stats.birthtime
                    };
                })
            );

            return {
                totalBackups: backups.length,
                latestBackup: backupDetails[0] || null,
                backups: backupDetails
            };
        } catch (error) {
            logger.error('백업 상태 조회 실패:', error);
            throw error;
        }
    }
}

module.exports = new BackupService(); 