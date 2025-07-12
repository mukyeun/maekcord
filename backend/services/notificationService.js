const emailService = require('./emailService');
const emailTemplates = require('../config/emailTemplates');
const Appointment = require('../models/Appointment');
const logger = require('../config/logger');
const Waitlist = require('../models/Waitlist');
const User = require('../models/User');
const Notification = require('../models/Notification');
const webSocketService = require('./websocketService');
const cacheService = require('./cacheService');
const { performance } = require('perf_hooks');
const { promisify } = require('util');
const sleep = promisify(setTimeout);
const { NotificationError } = require('../utils/errors');
const metrics = require('../utils/metrics');

// Rate limiting을 위한 Map 추가
const rateLimits = new Map(); // userId -> {count, timestamp}
const RATE_LIMIT_WINDOW = 60000; // 1분
const MAX_NOTIFICATIONS_PER_WINDOW = 50; // 1분당 최대 알림 수
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000; // 1초

class NotificationService {
  // Rate limiting 체크 함수
  checkRateLimit(userId) {
    const now = Date.now();
    const userLimit = rateLimits.get(userId);

    if (!userLimit) {
      rateLimits.set(userId, { count: 1, timestamp: now });
      return true;
    }

    if (now - userLimit.timestamp > RATE_LIMIT_WINDOW) {
      rateLimits.set(userId, { count: 1, timestamp: now });
      return true;
    }

    if (userLimit.count >= MAX_NOTIFICATIONS_PER_WINDOW) {
      logger.warn('Rate limit exceeded', {
        userId,
        count: userLimit.count,
        window: RATE_LIMIT_WINDOW
      });
      return false;
    }

    userLimit.count += 1;
    rateLimits.set(userId, userLimit);
    return true;
  }

  async getNotifications(userId, page = 1, limit = 10, options = {}) {
    const startTime = performance.now();
    const metricsLabels = { userId, page };
    
    try {
      metrics.increment('notification.get.attempts', metricsLabels);
      const skip = (page - 1) * limit;
      
      // 캐시 확인
      const cachedData = await cacheService.getNotifications(userId, page);
      if (cachedData) {
        metrics.increment('notification.get.cache_hit', metricsLabels);
        logger.info('Notifications retrieved from cache', { userId, page });
        return {
          ...cachedData,
          fromCache: true,
          executionTime: performance.now() - startTime
        };
      }

      metrics.increment('notification.get.cache_miss', metricsLabels);

      // 기본 쿼리 조건
      const query = { userId };
      
      // 필터 옵션 적용
      if (options.type) query.type = options.type;
      if (options.priority) query.priority = options.priority;
      if (options.isRead !== undefined) query.isRead = options.isRead;
      if (options.appointmentId) query.appointmentId = options.appointmentId;
      
      // 만료되지 않은 알림만 조회
      const now = new Date();
      query.$or = [
        { expiresAt: { $gt: now } },
        { expiresAt: null }
      ];

      // 알림 조회 및 총 개수 계산을 병렬로 실행
      const [notifications, total] = await Promise.all([
        Notification.find(query)
          .sort(options.sort || { createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate('appointmentId')
          .lean(),
        Notification.countDocuments(query)
      ]);

      const result = {
        notifications,
        total,
        page,
        totalPages: Math.ceil(total / limit),
        executionTime: performance.now() - startTime,
        fromCache: false
      };

      // 결과 캐싱
      await cacheService.cacheNotifications(userId, page, result);
      
      metrics.timing('notification.get.duration', performance.now() - startTime, metricsLabels);
      logger.info('Notifications retrieved from database', { 
        userId, 
        page, 
        count: notifications.length,
        total,
        executionTime: `${result.executionTime.toFixed(2)}ms`
      });
      
      return result;
    } catch (error) {
      metrics.increment('notification.get.error', metricsLabels);
      logger.error('Error retrieving notifications', { 
        userId, 
        error: error.message,
        stack: error.stack
      });
      throw new NotificationError('알림 조회 중 오류가 발생했습니다', error);
    }
  }

  async createNotification(data, retryAttempt = 0) {
    const startTime = performance.now();
    const metricsLabels = { type: data.type };

    try {
      metrics.increment('notification.create.attempts', metricsLabels);

      // Rate limiting 체크
      if (!this.checkRateLimit(data.userId)) {
        metrics.increment('notification.create.rate_limit', metricsLabels);
        throw new NotificationError('알림 전송 횟수가 제한을 초과했습니다. 잠시 후 다시 시도해주세요.');
      }

      // 알림 우선순위 자동 설정
      if (!data.priority) {
        data.priority = this.determinePriority(data);
      }

      // 만료 시간 설정
      if (!data.expiresAt) {
        const now = new Date();
        data.expiresAt = new Date(now.setDate(now.getDate() + 30));
      }

      const notification = await Notification.create(data);
      
      try {
        // 캐시 무효화
        await cacheService.clearUserCache(data.userId);
        
        // 새 알림을 실시간으로 전송
        await webSocketService.sendNotification(data.userId, {
          type: 'new_notification',
          notification
        });
      } catch (error) {
        logger.error('Error in post-notification tasks', {
          userId: data.userId,
          notificationId: notification._id,
          error: error.message
        });
        
        // 실패한 경우 재시도
        if (retryAttempt < MAX_RETRY_ATTEMPTS) {
          await sleep(RETRY_DELAY * Math.pow(2, retryAttempt));
          return this.createNotification(data, retryAttempt + 1);
        }
      }

      metrics.timing('notification.create.duration', performance.now() - startTime, metricsLabels);
      logger.info('Notification created', {
        notificationId: notification._id,
        userId: data.userId,
        type: data.type,
        priority: data.priority,
        executionTime: `${(performance.now() - startTime).toFixed(2)}ms`
      });

      return notification;
    } catch (error) {
      metrics.increment('notification.create.error', metricsLabels);
      logger.error('Error creating notification', {
        userId: data.userId,
        type: data.type,
        error: error.message,
        stack: error.stack
      });
      throw new NotificationError('알림 생성 중 오류가 발생했습니다', error);
    }
  }

  determinePriority(data) {
    switch (data.type) {
      case 'appointment':
      case 'vital_sign_critical':
        return 'high';
      case 'system':
      case 'vital_sign_warning':
        return 'medium';
      case 'message':
      case 'vital_sign_normal':
        return 'low';
      default:
        return 'medium';
    }
  }

  async markAsRead(notificationId, userId) {
    const startTime = performance.now();
    const metricsLabels = { userId };

    try {
      metrics.increment('notification.mark_read.attempts', metricsLabels);

      const notification = await Notification.findOne({ 
        _id: notificationId,
        userId
      });

      if (!notification) {
        metrics.increment('notification.mark_read.not_found', metricsLabels);
        throw new NotificationError('알림을 찾을 수 없습니다');
      }

      await notification.markAsRead();

      // 캐시 무효화
      await Promise.all([
        cacheService.invalidateNotificationCache(notificationId),
        cacheService.clearUserCache(userId)
      ]);

      // 알림 상태 변경을 실시간으로 전송
      await webSocketService.sendNotification(userId, {
        type: 'notification_updated',
        notification
      });

      metrics.timing('notification.mark_read.duration', performance.now() - startTime, metricsLabels);
      return notification;
    } catch (error) {
      metrics.increment('notification.mark_read.error', metricsLabels);
      logger.error('Error marking notification as read', {
        notificationId,
        userId,
        error: error.message,
        stack: error.stack
      });
      throw new NotificationError('알림 읽음 처리 중 오류가 발생했습니다', error);
    }
  }

  async markAllAsRead(userId) {
    const startTime = performance.now();
    const metricsLabels = { userId };

    try {
      metrics.increment('notification.mark_all_read.attempts', metricsLabels);

      const result = await Notification.updateMany(
        { userId, isRead: false },
        { isRead: true }
      );

      // 캐시 무효화
      await cacheService.clearUserCache(userId);

      // 전체 읽음 처리 상태를 실시간으로 전송
      await webSocketService.sendNotification(userId, {
        type: 'all_notifications_read'
      });

      metrics.timing('notification.mark_all_read.duration', performance.now() - startTime, metricsLabels);
      return result;
    } catch (error) {
      metrics.increment('notification.mark_all_read.error', metricsLabels);
      logger.error('Error marking all notifications as read', {
        userId,
        error: error.message,
        stack: error.stack
      });
      throw new NotificationError('알림 전체 읽음 처리 중 오류가 발생했습니다', error);
    }
  }

  async getUnreadCount(userId) {
    const startTime = performance.now();
    const metricsLabels = { userId };

    try {
      metrics.increment('notification.unread_count.attempts', metricsLabels);

      // 캐시 확인
      const cachedCount = await cacheService.getUnreadCount(userId);
      if (cachedCount !== null) {
        metrics.increment('notification.unread_count.cache_hit', metricsLabels);
        return cachedCount;
      }

      metrics.increment('notification.unread_count.cache_miss', metricsLabels);

      // DB에서 조회
      const count = await Notification.countDocuments({
        userId,
        isRead: false,
        $or: [
          { expiresAt: { $gt: new Date() } },
          { expiresAt: null }
        ]
      });
      
      // 결과 캐싱
      await cacheService.cacheUnreadCount(userId, count);
      
      metrics.timing('notification.unread_count.duration', performance.now() - startTime, metricsLabels);
      return count;
    } catch (error) {
      metrics.increment('notification.unread_count.error', metricsLabels);
      logger.error('Error getting unread count', {
        userId,
        error: error.message,
        stack: error.stack
      });
      throw new NotificationError('읽지 않은 알림 개수 조회 중 오류가 발생했습니다', error);
    }
  }

  // 시스템 알림 생성
  async createSystemNotification(userId, title, message, metadata = {}) {
    return this.createNotification({
      userId,
      type: 'system',
      title,
      message,
      metadata
    });
  }

  // 예약 관련 알림 생성
  async createAppointmentNotification(userId, appointmentId, title, message, metadata = {}) {
    return this.createNotification({
      userId,
      type: 'appointment',
      appointmentId,
      title,
      message,
      metadata,
      priority: 'high'
    });
  }

  // 메시지 알림 생성
  async createMessageNotification(userId, title, message, metadata = {}) {
    return this.createNotification({
      userId,
      type: 'message',
      title,
      message,
      metadata,
      priority: 'low'
    });
  }

  // 활력징후 알림 생성
  async createVitalSignNotification(userId, type, data) {
    const title = this.getVitalSignTitle(type, data.value);
    const message = this.getVitalSignMessage(type, data);
    
    return this.createNotification({
      userId,
      type: `vital_sign_${data.status}`,
      title,
      message,
      metadata: data,
      priority: data.status === 'critical' ? 'high' : data.status === 'warning' ? 'medium' : 'low'
    });
  }

  getVitalSignTitle(type, value) {
    const typeNames = {
      heartrate: '심박수',
      bp: '혈압',
      temperature: '체온',
      spo2: '산소포화도'
    };
    return `${typeNames[type] || type}: ${value}`;
  }

  getVitalSignMessage(type, data) {
    const { value, status, timestamp } = data;
    const time = new Date(timestamp).toLocaleTimeString();
    return `${time} 기준 ${type} 수치가 ${value}로 ${status === 'critical' ? '위험' : status === 'warning' ? '주의' : '정상'} 수준입니다.`;
  }

  // 예약 관련 알림 통합 메서드
  async sendAppointmentNotification(appointment, type, additionalData = {}) {
    const startTime = performance.now();
    const metricsLabels = { type };

    try {
      metrics.increment('notification.appointment.attempts', metricsLabels);

      const { patientId, doctorId } = appointment;
      let subject, patientMessage, doctorMessage;

      switch (type) {
        case 'created':
          subject = '예약이 생성되었습니다';
          patientMessage = `
            ${patientId.name}님의 예약이 생성되었습니다.
            예약 시간: ${new Date(appointment.startTime).toLocaleString()}
            담당 의사: ${doctorId.name}
          `;
          doctorMessage = `
            새로운 예약이 생성되었습니다.
            환자: ${patientId.name}
            예약 시간: ${new Date(appointment.startTime).toLocaleString()}
          `;
          break;

        case 'cancelled':
          subject = '예약이 취소되었습니다';
          patientMessage = `
            ${patientId.name}님의 예약이 취소되었습니다.
            취소된 예약 시간: ${new Date(appointment.startTime).toLocaleString()}
            취소 사유: ${additionalData.cancelReason || ''}
          `;
          doctorMessage = `
            예약이 취소되었습니다.
            환자: ${patientId.name}
            취소된 예약 시간: ${new Date(appointment.startTime).toLocaleString()}
            취소 사유: ${additionalData.cancelReason || ''}
          `;
          break;

        case 'updated':
          subject = '예약이 변경되었습니다';
          patientMessage = `
            ${patientId.name}님의 예약이 변경되었습니다.
            변경된 예약 시간: ${new Date(appointment.startTime).toLocaleString()}
            담당 의사: ${doctorId.name}
          `;
          doctorMessage = `
            예약이 변경되었습니다.
            환자: ${patientId.name}
            변경된 예약 시간: ${new Date(appointment.startTime).toLocaleString()}
          `;
          break;

        case 'reactivated':
          subject = '예약이 재활성화되었습니다';
          patientMessage = `
            ${patientId.name}님의 예약이 재활성화되었습니다.
            예약 시간: ${new Date(appointment.startTime).toLocaleString()}
            담당 의사: ${doctorId.name}
          `;
          doctorMessage = `
            예약이 재활성화되었습니다.
            환자: ${patientId.name}
            예약 시간: ${new Date(appointment.startTime).toLocaleString()}
          `;
          break;

        case 'reminder':
          subject = '예약 알림';
          patientMessage = `
            ${patientId.name}님, 내일 예약이 있습니다.
            예약 시간: ${new Date(appointment.startTime).toLocaleString()}
            담당 의사: ${doctorId.name}
          `;
          doctorMessage = `
            내일 예약 알림
            환자: ${patientId.name}
            예약 시간: ${new Date(appointment.startTime).toLocaleString()}
          `;
          break;

        default:
          throw new NotificationError('알 수 없는 알림 유형입니다');
      }

      // 알림 생성 및 이메일 발송
      const notifications = await Promise.all([
        // 환자 알림
        this.createNotification({
          userId: patientId._id,
          type: `appointment_${type}`,
          title: subject,
          message: patientMessage.trim(),
          metadata: {
            appointmentId: appointment._id,
            type
          }
        }),

        // 의사 알림
        this.createNotification({
          userId: doctorId._id,
          type: `appointment_${type}`,
          title: subject,
          message: doctorMessage.trim(),
          metadata: {
            appointmentId: appointment._id,
            type
          }
        })
      ]);

      // 이메일 발송
      if (patientId.email) {
        await emailService.sendEmail({
          to: patientId.email,
          subject,
          text: patientMessage
        });
      }

      if (doctorId.email) {
        await emailService.sendEmail({
          to: doctorId.email,
          subject,
          text: doctorMessage
        });
      }

      metrics.timing('notification.appointment.duration', performance.now() - startTime, metricsLabels);
      return notifications;
    } catch (error) {
      metrics.increment('notification.appointment.error', metricsLabels);
      logger.error('Failed to send appointment notification:', {
        appointmentId: appointment._id,
        type,
        error: error.message,
        stack: error.stack
      });
      throw new NotificationError('예약 알림 전송 중 오류가 발생했습니다', error);
    }
  }

  // 기존의 개별 메서드들은 통합 메서드를 호출하도록 수정
  async sendAppointmentCreatedNotification(appointment) {
    return this.sendAppointmentNotification(appointment, 'created');
  }

  async sendAppointmentCancelledNotification(appointment) {
    return this.sendAppointmentNotification(appointment, 'cancelled', {
      cancelReason: appointment.cancelReason
    });
  }

  async sendAppointmentUpdatedNotification(appointment) {
    return this.sendAppointmentNotification(appointment, 'updated');
  }

  async sendAppointmentReactivatedNotification(appointment) {
    return this.sendAppointmentNotification(appointment, 'reactivated');
  }

  // 예약 24시간 전 알림
  async sendAppointmentReminders() {
    const startTime = performance.now();
    const metricsLabels = { type: 'reminder' };

    try {
      metrics.increment('notification.reminder.attempts', metricsLabels);

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const endOfTomorrow = new Date(tomorrow);
      endOfTomorrow.setHours(23, 59, 59, 999);

      const appointments = await Appointment.find({
        startTime: {
          $gte: tomorrow,
          $lte: endOfTomorrow
        },
        status: 'scheduled'
      })
        .populate('patientId')
        .populate('doctorId');

      const notifications = await Promise.all(
        appointments.map(appointment =>
          this.sendAppointmentNotification(appointment, 'reminder')
        )
      );

      metrics.timing('notification.reminder.duration', performance.now() - startTime, metricsLabels);
      return notifications;
    } catch (error) {
      metrics.increment('notification.reminder.error', metricsLabels);
      logger.error('Failed to send appointment reminders:', {
        error: error.message,
        stack: error.stack
      });
      throw new NotificationError('예약 알림 전송 중 오류가 발생했습니다', error);
    }
  }

  // 대기자 매칭 알림
  async notifyWaitlistMatch(waitlistId, appointment) {
    try {
      const waitlist = await Waitlist.findById(waitlistId)
        .populate('patientId', 'name email')
        .populate('doctorId', 'name');

      if (!waitlist) {
        throw new Error('Waitlist not found');
      }

      const startTime = new Date(appointment.startTime);
      const message = `${waitlist.patientId.name}님, 대기하신 진료가 예약되었습니다.
의사: ${waitlist.doctorId.name}
날짜: ${startTime.toLocaleDateString()}
시간: ${startTime.toLocaleTimeString()}`;

      const notification = await this.sendNotification(
        waitlist.patientId._id,
        'waitlist_matched',
        message
      );

      if (notification.success) {
        // 알림 전송 기록 저장
        waitlist.notificationsSent.push({
          sentAt: notification.sentAt,
          type: notification.type,
          success: true
        });
        await waitlist.save();
      }

      return notification;
    } catch (error) {
      logger.error('Notify waitlist match error:', error);
      throw error;
    }
  }

  // 대기 만료 예정 알림
  async notifyWaitlistExpiringSoon(waitlistId) {
    try {
      const waitlist = await Waitlist.findById(waitlistId)
        .populate('patientId', 'name email')
        .populate('doctorId', 'name');

      if (!waitlist) {
        throw new Error('Waitlist not found');
      }

      const message = `${waitlist.patientId.name}님, 대기 신청이 곧 만료됩니다.
의사: ${waitlist.doctorId.name}
만료일: ${waitlist.expiresAt.toLocaleDateString()}`;

      const notification = await this.sendNotification(
        waitlist.patientId._id,
        'waitlist_expiring',
        message
      );

      if (notification.success) {
        waitlist.notificationsSent.push({
          sentAt: notification.sentAt,
          type: notification.type,
          success: true
        });
        await waitlist.save();
      }

      return notification;
    } catch (error) {
      logger.error('Notify waitlist expiring error:', error);
      throw error;
    }
  }
}

module.exports = new NotificationService(); 