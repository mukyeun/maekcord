const os = require('os');
const mongoose = require('mongoose');
const logger = require('../utils/logger');

class MonitoringService {
    // 시스템 기본 정보 수집
    async getSystemInfo() {
        try {
            const systemInfo = {
                hostname: os.hostname(),
                platform: os.platform(),
                arch: os.arch(),
                release: os.release(),
                uptime: os.uptime(),
                loadavg: os.loadavg(),
                totalmem: os.totalmem(),
                freemem: os.freemem(),
                cpus: os.cpus(),
                networkInterfaces: os.networkInterfaces()
            };

            return systemInfo;
        } catch (error) {
            logger.error('시스템 정보 수집 실패:', error);
            throw error;
        }
    }

    // 메모리 사용량 조회
    async getMemoryUsage() {
        try {
            const total = os.totalmem();
            const free = os.freemem();
            const used = total - free;
            const usagePercent = (used / total) * 100;

            return {
                total: total,
                free: free,
                used: used,
                usagePercent: usagePercent.toFixed(2)
            };
        } catch (error) {
            logger.error('메모리 사용량 조회 실패:', error);
            throw error;
        }
    }

    // CPU 사용량 조회
    async getCpuUsage() {
        try {
            const cpus = os.cpus();
            const cpuCount = cpus.length;
            const cpuModel = cpus[0].model;
            const cpuSpeed = cpus[0].speed;

            const cpuUsage = cpus.map(cpu => {
                const total = Object.values(cpu.times).reduce((acc, tv) => acc + tv, 0);
                const idle = cpu.times.idle;
                return {
                    idle: idle,
                    total: total,
                    usagePercent: (100 - (idle / total) * 100).toFixed(2)
                };
            });

            return {
                count: cpuCount,
                model: cpuModel,
                speed: cpuSpeed,
                usage: cpuUsage
            };
        } catch (error) {
            logger.error('CPU 사용량 조회 실패:', error);
            throw error;
        }
    }

    // MongoDB 상태 조회
    async getMongoDBStatus() {
        try {
            const adminDb = mongoose.connection.db.admin();
            const status = await adminDb.serverStatus();
            
            return {
                version: status.version,
                uptime: status.uptime,
                connections: status.connections,
                activeClients: status.globalLock.activeClients,
                currentQueue: status.globalLock.currentQueue,
                memory: status.mem,
                network: status.network
            };
        } catch (error) {
            logger.error('MongoDB 상태 조회 실패:', error);
            throw error;
        }
    }

    // 애플리케이션 상태 조회
    async getApplicationStatus() {
        try {
            const processInfo = {
                pid: process.pid,
                platform: process.platform,
                version: process.version,
                memory: process.memoryUsage(),
                uptime: process.uptime(),
                env: process.env.NODE_ENV
            };

            return processInfo;
        } catch (error) {
            logger.error('애플리케이션 상태 조회 실패:', error);
            throw error;
        }
    }

    // 전체 시스템 상태 조회
    async getSystemStatus() {
        try {
            const [systemInfo, memoryUsage, cpuUsage, mongoStatus, appStatus] = await Promise.all([
                this.getSystemInfo(),
                this.getMemoryUsage(),
                this.getCpuUsage(),
                this.getMongoDBStatus(),
                this.getApplicationStatus()
            ]);

            return {
                system: systemInfo,
                memory: memoryUsage,
                cpu: cpuUsage,
                mongodb: mongoStatus,
                application: appStatus,
                timestamp: new Date()
            };
        } catch (error) {
            logger.error('시스템 상태 조회 실패:', error);
            throw error;
        }
    }
}

module.exports = new MonitoringService(); 