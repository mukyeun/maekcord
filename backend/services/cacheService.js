const Redis = require('ioredis');
const logger = require('../config/logger');
const metrics = require('../utils/metrics');
const { performance } = require('perf_hooks');

class CacheService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.NOTIFICATION_KEY_PREFIX = 'notifications:';
    this.CACHE_TTL = 300; // 5분
    this.initialize();
  }

  initialize() {
    try {
      // 개발 환경에서는 메모리 캐시 사용
      if (process.env.NODE_ENV === 'development') {
        this.cache = new Map();
        this.isConnected = true;
        logger.info('Using in-memory cache for development');
        return;
      }

      // Redis 연결 설정
      this.client = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD,
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        }
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        logger.info('Cache service connected to Redis');
      });

      this.client.on('error', (error) => {
        this.isConnected = false;
        logger.error('Cache service Redis error:', error);
      });
    } catch (error) {
      logger.error('Cache service initialization error:', error);
      this.isConnected = false;
    }
  }

  async getNotifications(userId, page) {
    const startTime = performance.now();
    const key = `${this.NOTIFICATION_KEY_PREFIX}${userId}:${page}`;

    try {
      if (!this.isConnected) {
        return null;
      }

      let data;
      if (process.env.NODE_ENV === 'development') {
        data = this.cache.get(key);
      } else {
        const rawData = await this.client.get(key);
        data = rawData ? JSON.parse(rawData) : null;
      }

      if (data) {
        metrics.timing('cache.get.duration', performance.now() - startTime, { type: 'notifications' });
        return data;
      }

      return null;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  }

  async cacheNotifications(userId, page, data) {
    const startTime = performance.now();
    const key = `${this.NOTIFICATION_KEY_PREFIX}${userId}:${page}`;

    try {
      if (!this.isConnected) {
        return;
      }

      if (process.env.NODE_ENV === 'development') {
        this.cache.set(key, data);
        setTimeout(() => this.cache.delete(key), this.CACHE_TTL * 1000);
      } else {
        await this.client.setex(key, this.CACHE_TTL, JSON.stringify(data));
      }

      metrics.timing('cache.set.duration', performance.now() - startTime, { type: 'notifications' });
    } catch (error) {
      logger.error('Cache set error:', error);
    }
  }

  async clearUserCache(userId) {
    try {
      if (!this.isConnected) {
        return;
      }

      if (process.env.NODE_ENV === 'development') {
        for (const key of this.cache.keys()) {
          if (key.startsWith(`${this.NOTIFICATION_KEY_PREFIX}${userId}`)) {
            this.cache.delete(key);
          }
        }
      } else {
        const pattern = `${this.NOTIFICATION_KEY_PREFIX}${userId}:*`;
        const keys = await this.client.keys(pattern);
        if (keys.length > 0) {
          await this.client.del(...keys);
        }
      }

      logger.info('User cache cleared:', { userId });
    } catch (error) {
      logger.error('Cache clear error:', error);
    }
  }
}

module.exports = new CacheService(); 