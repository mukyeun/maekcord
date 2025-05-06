const emailService = require('./emailService');
const emailTemplates = require('../config/emailTemplates');
const Appointment = require('../models/Appointment');
const logger = require('../config/logger');
const Waitlist = require('../models/Waitlist');
const User = require('../models/User');

const notificationService = {
  // 예약 생성 알림
  async sendAppointmentCreatedNotification(appointment) {
    try {
      // 환자에게 이메일 발송
      if (appointment.patientId.email) {
        await emailService.sendEmail({
          to: appointment.patientId.email,
          subject: '예약이 생성되었습니다',
          text: `
            ${appointment.patientId.name}님의 예약이 생성되었습니다.
            예약 시간: ${new Date(appointment.startTime).toLocaleString()}
            담당 의사: ${appointment.doctorId.name}
          `
        });
      }

      // 의사에게 이메일 발송
      if (appointment.doctorId.email) {
        await emailService.sendEmail({
          to: appointment.doctorId.email,
          subject: '새로운 예약이 생성되었습니다',
          text: `
            새로운 예약이 생성되었습니다.
            환자: ${appointment.patientId.name}
            예약 시간: ${new Date(appointment.startTime).toLocaleString()}
          `
        });
      }
    } catch (error) {
      logger.error('Failed to send appointment notification:', error);
    }
  },

  // 예약 취소 알림
  async sendAppointmentCancelledNotification(appointment) {
    try {
      // 환자에게 이메일 발송
      if (appointment.patientId.email) {
        await emailService.sendEmail({
          to: appointment.patientId.email,
          subject: '예약이 취소되었습니다',
          text: `
            ${appointment.patientId.name}님의 예약이 취소되었습니다.
            취소된 예약 시간: ${new Date(appointment.startTime).toLocaleString()}
            취소 사유: ${appointment.cancelReason}
          `
        });
      }

      // 의사에게 이메일 발송
      if (appointment.doctorId.email) {
        await emailService.sendEmail({
          to: appointment.doctorId.email,
          subject: '예약이 취소되었습니다',
          text: `
            예약이 취소되었습니다.
            환자: ${appointment.patientId.name}
            취소된 예약 시간: ${new Date(appointment.startTime).toLocaleString()}
            취소 사유: ${appointment.cancelReason}
          `
        });
      }
    } catch (error) {
      logger.error('Failed to send cancellation notification:', error);
    }
  },

  // 예약 24시간 전 알림
  async sendAppointmentReminders() {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const endOfTomorrow = new Date(tomorrow);
      endOfTomorrow.setHours(23, 59, 59, 999);

      const appointments = await Appointment.find({
        appointmentDate: {
          $gte: tomorrow,
          $lte: endOfTomorrow
        },
        status: 'scheduled'
      })
        .populate('patientId')
        .populate('doctorId');

      for (const appointment of appointments) {
        const patient = appointment.patientId;
        const doctor = appointment.doctorId;

        if (patient.contact?.email) {
          await emailService.sendEmail(
            patient.contact.email,
            emailTemplates.appointmentReminder(appointment, patient, doctor)
          );
          logger.info(`Appointment reminder sent to ${patient.contact.email}`);
        }
      }
    } catch (error) {
      logger.error('Failed to send appointment reminders:', error);
      throw error;
    }
  },

  // 예약 변경 알림
  async sendAppointmentUpdatedNotification(appointment) {
    try {
      // 환자에게 이메일 발송
      if (appointment.patientId.email) {
        await emailService.sendEmail({
          to: appointment.patientId.email,
          subject: '예약이 변경되었습니다',
          text: `
            ${appointment.patientId.name}님의 예약이 변경되었습니다.
            변경된 예약 시간: ${new Date(appointment.startTime).toLocaleString()}
            담당 의사: ${appointment.doctorId.name}
          `
        });
      }

      // 의사에게 이메일 발송
      if (appointment.doctorId.email) {
        await emailService.sendEmail({
          to: appointment.doctorId.email,
          subject: '예약이 변경되었습니다',
          text: `
            예약이 변경되었습니다.
            환자: ${appointment.patientId.name}
            변경된 예약 시간: ${new Date(appointment.startTime).toLocaleString()}
          `
        });
      }
    } catch (error) {
      logger.error('Failed to send update notification:', error);
    }
  },

  // 예약 재활성화 알림
  async sendAppointmentReactivatedNotification(appointment) {
    try {
      // 환자에게 이메일 발송
      if (appointment.patientId.email) {
        await emailService.sendEmail({
          to: appointment.patientId.email,
          subject: '예약이 재활성화되었습니다',
          text: `
            ${appointment.patientId.name}님의 예약이 재활성화되었습니다.
            예약 시간: ${new Date(appointment.startTime).toLocaleString()}
            담당 의사: ${appointment.doctorId.name}
          `
        });
      }

      // 의사에게 이메일 발송
      if (appointment.doctorId.email) {
        await emailService.sendEmail({
          to: appointment.doctorId.email,
          subject: '예약이 재활성화되었습니다',
          text: `
            예약이 재활성화되었습니다.
            환자: ${appointment.patientId.name}
            예약 시간: ${new Date(appointment.startTime).toLocaleString()}
          `
        });
      }
    } catch (error) {
      logger.error('Failed to send reactivation notification:', error);
    }
  },

  // 알림 전송
  async sendNotification(userId, type, message) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // 여기에 실제 알림 전송 로직 구현
      // 예: 이메일, SMS, 웹소켓 등
      logger.info(`Sending ${type} notification to ${user.email}: ${message}`);

      return {
        success: true,
        sentAt: new Date(),
        type,
        recipient: {
          id: user._id,
          email: user.email
        }
      };
    } catch (error) {
      logger.error('Send notification error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

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
  },

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
};

module.exports = notificationService; 