const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const notificationSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      'system',
      'appointment_created',
      'appointment_cancelled',
      'appointment_updated',
      'appointment_reminder',
      'appointment_reactivated',
      'vital_sign_critical',
      'vital_sign_warning',
      'vital_sign_normal',
      'message',
      'waitlist_matched',
      'waitlist_expiring'
    ]
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'low',
    index: true
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  metadata: {
    appointmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Appointment'
    },
    waitlistId: {
      type: Schema.Types.ObjectId,
      ref: 'Waitlist'
    },
    vitalSignId: {
      type: Schema.Types.ObjectId,
      ref: 'VitalSign'
    },
    messageId: {
      type: Schema.Types.ObjectId,
      ref: 'Message'
    },
    additionalData: Schema.Types.Mixed
  },
  expiresAt: {
    type: Date,
    index: true
  },
  readAt: Date,
  deliveredAt: Date
}, {
  timestamps: true
});

// 인덱스 설정
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ userId: 1, type: 1 });
notificationSchema.index({ userId: 1, priority: 1 });

// 가상 필드: 읽지 않은 알림 수
notificationSchema.statics.getUnreadCount = async function(userId) {
  return this.countDocuments({
    userId,
    isRead: false,
    $or: [
      { expiresAt: { $gt: new Date() } },
      { expiresAt: null }
    ]
  });
};

// 알림 읽음 처리
notificationSchema.methods.markAsRead = async function() {
  if (!this.isRead) {
    this.isRead = true;
    this.readAt = new Date();
    await this.save();
  }
  return this;
};

// 알림 만료 처리
notificationSchema.methods.expire = async function() {
  this.expiresAt = new Date();
  await this.save();
  return this;
};

// 오래된 알림 정리
notificationSchema.statics.cleanupOldNotifications = async function(days = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  return this.deleteMany({
    $or: [
      { createdAt: { $lt: cutoffDate } },
      { expiresAt: { $lt: new Date() } }
    ]
  });
};

// 알림 전달 확인
notificationSchema.methods.markAsDelivered = async function() {
  if (!this.deliveredAt) {
    this.deliveredAt = new Date();
    await this.save();
  }
  return this;
};

// 알림 메타데이터 업데이트
notificationSchema.methods.updateMetadata = async function(key, value) {
  if (!this.metadata) {
    this.metadata = {};
  }
  this.metadata.additionalData = {
    ...this.metadata.additionalData,
    [key]: value
  };
  await this.save();
  return this;
};

// 만료된 알림 자동 삭제를 위한 TTL 인덱스
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// 알림 생성 시 기본 제목 설정
notificationSchema.pre('save', function(next) {
  if (!this.title) {
    switch (this.type) {
      case 'appointment_created':
        this.title = '새로운 예약';
        break;
      case 'appointment_updated':
        this.title = '예약 변경';
        break;
      case 'appointment_cancelled':
        this.title = '예약 취소';
        break;
      case 'appointment_reminder':
        this.title = '예약 알림';
        break;
      case 'vital_sign_critical':
        this.title = '긴급 활력징후 알림';
        this.priority = 'high';
        break;
      case 'vital_sign_warning':
        this.title = '활력징후 경고';
        this.priority = 'medium';
        break;
      case 'vital_sign_normal':
        this.title = '활력징후 정상';
        break;
      default:
        this.title = '시스템 알림';
    }
  }
  next();
});

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification; 