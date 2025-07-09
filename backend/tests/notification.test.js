const { expect } = require('chai');
const sinon = require('sinon');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Notification = require('../models/Notification');
const NotificationService = require('../services/notificationService');
const WebSocketService = require('../services/websocketService');
const CacheService = require('../services/cacheService');

describe('Notification Service Tests', () => {
  let mongoServer;
  let testUserId;
  let testNotificationId;
  let webSocketStub;
  let cacheStub;

  before(async () => {
    // 인메모리 MongoDB 서버 시작
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // WebSocket 서비스 스텁 생성
    webSocketStub = sinon.stub(WebSocketService);
    webSocketStub.sendNotification.returns(true);
    webSocketStub.broadcastNotification.returns(1);

    // 캐시 서비스 스텁 생성
    cacheStub = sinon.stub(CacheService);
    cacheStub.getNotifications.returns(null);
    cacheStub.getUnreadCount.returns(null);
    cacheStub.cacheNotifications.returns(true);
    cacheStub.cacheUnreadCount.returns(true);
    cacheStub.clearUserCache.returns(true);
  });

  after(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
    sinon.restore();
  });

  beforeEach(async () => {
    await Notification.deleteMany({});
    testUserId = new mongoose.Types.ObjectId();
    testNotificationId = new mongoose.Types.ObjectId();
  });

  describe('createNotification', () => {
    it('should create a notification with valid data', async () => {
      const notificationData = {
        userId: testUserId,
        type: 'system',
        title: 'Test Notification',
        message: 'This is a test notification'
      };

      const notification = await NotificationService.createNotification(notificationData);

      expect(notification).to.have.property('_id');
      expect(notification.userId.toString()).to.equal(testUserId.toString());
      expect(notification.type).to.equal('system');
      expect(notification.title).to.equal('Test Notification');
      expect(notification.message).to.equal('This is a test notification');
      expect(notification.isRead).to.be.false;
      expect(notification.priority).to.equal('medium');
      
      sinon.assert.calledWith(webSocketStub.sendNotification, testUserId);
      sinon.assert.calledWith(cacheStub.clearUserCache, testUserId);
    });

    it('should automatically set priority based on type', async () => {
      const notifications = await Promise.all([
        NotificationService.createNotification({
          userId: testUserId,
          type: 'appointment',
          title: 'Appointment',
          message: 'Test'
        }),
        NotificationService.createNotification({
          userId: testUserId,
          type: 'system',
          title: 'System',
          message: 'Test'
        }),
        NotificationService.createNotification({
          userId: testUserId,
          type: 'message',
          title: 'Message',
          message: 'Test'
        })
      ]);

      expect(notifications[0].priority).to.equal('high');
      expect(notifications[1].priority).to.equal('medium');
      expect(notifications[2].priority).to.equal('low');
    });

    it('should enforce rate limiting', async () => {
      const createMany = Array(51).fill({
        userId: testUserId,
        type: 'system',
        title: 'Test',
        message: 'Test'
      });

      try {
        await Promise.all(createMany.map(data => 
          NotificationService.createNotification(data)
        ));
        throw new Error('Should have failed');
      } catch (error) {
        expect(error.message).to.include('알림 전송 횟수가 제한을 초과했습니다');
      }
    });
  });

  describe('getNotifications', () => {
    beforeEach(async () => {
      // 테스트 데이터 생성
      await Promise.all([
        Notification.create({
          _id: testNotificationId,
          userId: testUserId,
          type: 'system',
          priority: 'high',
          title: 'Test 1',
          message: 'Test message 1',
          isRead: false
        }),
        Notification.create({
          userId: testUserId,
          type: 'message',
          priority: 'low',
          title: 'Test 2',
          message: 'Test message 2',
          isRead: true
        })
      ]);
    });

    it('should return notifications with pagination', async () => {
      const result = await NotificationService.getNotifications(testUserId, 1, 10);

      expect(result.notifications).to.have.length(2);
      expect(result.total).to.equal(2);
      expect(result.page).to.equal(1);
      expect(result.totalPages).to.equal(1);
      expect(result.fromCache).to.be.false;
    });

    it('should return cached notifications when available', async () => {
      const cachedData = {
        notifications: [{
          _id: testNotificationId,
          userId: testUserId,
          type: 'system',
          title: 'Cached'
        }],
        total: 1,
        page: 1,
        totalPages: 1
      };

      cacheStub.getNotifications.returns(cachedData);

      const result = await NotificationService.getNotifications(testUserId, 1, 10);

      expect(result.notifications[0].title).to.equal('Cached');
      expect(result.fromCache).to.be.true;
      sinon.assert.calledWith(cacheStub.getNotifications, testUserId, 1);
    });

    it('should filter notifications by type and priority', async () => {
      const result = await NotificationService.getNotifications(testUserId, 1, 10, {
        type: 'system',
        priority: 'high'
      });

      expect(result.notifications).to.have.length(1);
      expect(result.notifications[0].type).to.equal('system');
      expect(result.notifications[0].priority).to.equal('high');
    });
  });

  describe('markAsRead', () => {
    beforeEach(async () => {
      await Notification.create({
        _id: testNotificationId,
        userId: testUserId,
        type: 'system',
        priority: 'high',
        title: 'Test',
        message: 'Test message',
        isRead: false
      });
    });

    it('should mark a notification as read', async () => {
      const result = await NotificationService.markAsRead(testNotificationId, testUserId);

      expect(result.isRead).to.be.true;
      sinon.assert.calledWith(webSocketStub.sendNotification, testUserId);
      sinon.assert.calledWith(cacheStub.invalidateNotificationCache, testNotificationId);
      sinon.assert.calledWith(cacheStub.clearUserCache, testUserId);
    });

    it('should fail for non-existent notification', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      try {
        await NotificationService.markAsRead(fakeId, testUserId);
        throw new Error('Should have failed');
      } catch (error) {
        expect(error.message).to.equal('Notification not found');
      }
    });
  });

  describe('markAllAsRead', () => {
    beforeEach(async () => {
      await Promise.all([
        Notification.create({
          userId: testUserId,
          type: 'system',
          priority: 'high',
          title: 'Test 1',
          message: 'Test message 1',
          isRead: false
        }),
        Notification.create({
          userId: testUserId,
          type: 'message',
          priority: 'low',
          title: 'Test 2',
          message: 'Test message 2',
          isRead: false
        })
      ]);
    });

    it('should mark all notifications as read', async () => {
      await NotificationService.markAllAsRead(testUserId);

      const notifications = await Notification.find({ userId: testUserId });
      expect(notifications.every(n => n.isRead)).to.be.true;
      
      sinon.assert.calledWith(webSocketStub.sendNotification, testUserId);
      sinon.assert.calledWith(cacheStub.clearUserCache, testUserId);
    });
  });

  describe('getUnreadCount', () => {
    beforeEach(async () => {
      await Promise.all([
        Notification.create({
          userId: testUserId,
          type: 'system',
          priority: 'high',
          title: 'Test 1',
          message: 'Test message 1',
          isRead: false
        }),
        Notification.create({
          userId: testUserId,
          type: 'message',
          priority: 'low',
          title: 'Test 2',
          message: 'Test message 2',
          isRead: true
        })
      ]);
    });

    it('should return correct unread count', async () => {
      const count = await NotificationService.getUnreadCount(testUserId);
      expect(count).to.equal(1);
    });

    it('should return cached unread count when available', async () => {
      cacheStub.getUnreadCount.returns(5);
      
      const count = await NotificationService.getUnreadCount(testUserId);
      expect(count).to.equal(5);
      
      sinon.assert.calledWith(cacheStub.getUnreadCount, testUserId);
    });
  });
}); 