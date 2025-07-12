const Redis = require('ioredis');
const logger = require('../utils/logger');

class CacheService {
  constructor() {
    this.client = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      }
    });

    this.client.on('error', (error) => {
      logger.error('Redis error:', error);
    });

    this.client.on('connect', () => {
      logger.info('Redis connected');
    });

    // 캐시 키 접두사
    this.keys = {
      UNREAD_COUNT: 'unread_count:',
      NOTIFICATIONS: 'notifications:',
      NOTIFICATION_DETAIL: 'notification_detail:',
      USER_SETTINGS: 'user_settings:'
    };

    // 기본 TTL 설정 (초)
    this.ttl = {
      UNREAD_COUNT: 300, // 5분
      NOTIFICATIONS: 600, // 10분
      NOTIFICATION_DETAIL: 1800, // 30분
      USER_SETTINGS: 3600 // 1시간
    };
  }

  // 캐시 키 생성
  getKey(prefix, identifier) {
    return `${prefix}${identifier}`;
  }

  // 읽지 않은 알림 수 캐싱
  async cacheUnreadCount(userId, count) {
    const key = this.getKey(this.keys.UNREAD_COUNT, userId);
    try {
      await this.client.setex(key, this.ttl.UNREAD_COUNT, count);
      return true;
    } catch (error) {
      logger.error('Error caching unread count:', error);
      return false;
    }
  }

  // 캐시된 읽지 않은 알림 수 조회
  async getUnreadCount(userId) {
    const key = this.getKey(this.keys.UNREAD_COUNT, userId);
    try {
      const count = await this.client.get(key);
      return count ? parseInt(count) : null;
    } catch (error) {
      logger.error('Error getting cached unread count:', error);
      return null;
    }
  }

  // 알림 목록 캐싱
  async cacheNotifications(userId, page, notifications) {
    const key = this.getKey(this.keys.NOTIFICATIONS, `${userId}:${page}`);
    try {
      await this.client.setex(
        key,
        this.ttl.NOTIFICATIONS,
        JSON.stringify(notifications)
      );
      return true;
    } catch (error) {
      logger.error('Error caching notifications:', error);
      return false;
    }
  }

  // 캐시된 알림 목록 조회
  async getNotifications(userId, page) {
    const key = this.getKey(this.keys.NOTIFICATIONS, `${userId}:${page}`);
    try {
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Error getting cached notifications:', error);
      return null;
    }
  }

  // 알림 상세 정보 캐싱
  async cacheNotificationDetail(notificationId, notification) {
    const key = this.getKey(this.keys.NOTIFICATION_DETAIL, notificationId);
    try {
      await this.client.setex(
        key,
        this.ttl.NOTIFICATION_DETAIL,
        JSON.stringify(notification)
      );
      return true;
    } catch (error) {
      logger.error('Error caching notification detail:', error);
      return false;
    }
  }

  // 캐시된 알림 상세 정보 조회
  async getNotificationDetail(notificationId) {
    const key = this.getKey(this.keys.NOTIFICATION_DETAIL, notificationId);
    try {
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Error getting cached notification detail:', error);
      return null;
    }
  }

  // 사용자 알림 설정 캐싱
  async cacheUserSettings(userId, settings) {
    const key = this.getKey(this.keys.USER_SETTINGS, userId);
    try {
      await this.client.setex(
        key,
        this.ttl.USER_SETTINGS,
        JSON.stringify(settings)
      );
      return true;
    } catch (error) {
      logger.error('Error caching user settings:', error);
      return false;
    }
  }

  // 캐시된 사용자 알림 설정 조회
  async getUserSettings(userId) {
    const key = this.getKey(this.keys.USER_SETTINGS, userId);
    try {
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Error getting cached user settings:', error);
      return null;
    }
  }

  // 특정 사용자의 모든 캐시 삭제
  async clearUserCache(userId) {
    try {
      const pattern = `*:${userId}*`;
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
        logger.info('User cache cleared:', { userId, clearedKeys: keys.length });
      }
      return true;
    } catch (error) {
      logger.error('Error clearing user cache:', error);
      return false;
    }
  }

  // 특정 알림의 캐시 삭제
  async invalidateNotificationCache(notificationId) {
    const key = this.getKey(this.keys.NOTIFICATION_DETAIL, notificationId);
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      logger.error('Error invalidating notification cache:', error);
      return false;
    }
  }

  // 연결 종료
  async disconnect() {
    try {
      await this.client.quit();
      logger.info('Redis disconnected');
    } catch (error) {
      logger.error('Error disconnecting Redis:', error);
    }
  }
}

module.exports = new CacheService(); 