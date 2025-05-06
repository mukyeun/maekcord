const Waitlist = require('../models/waitlist');
const Appointment = require('../models/appointment');
const notificationService = require('./notificationService');
const logger = require('../config/logger');
const appointmentService = require('./appointmentService');
const User = require('../models/user');

// 상수 정의
const MESSAGES = {
  MATCH_COMPLETED: '매칭 완료',
  DEFAULT_NOTE: '대기자 매칭'
};

const waitlistService = {
  // 대기 신청
  async addToWaitlist(patientId, doctorId, preferredTimeSlots, notes) {
    try {
      // 이미 대기 중인지 확인
      const existingWaitlist = await Waitlist.findOne({
        patientId,
        doctorId,
        status: 'waiting'
      });

      if (existingWaitlist) {
        throw new Error('이미 대기 신청이 되어있습니다.');
      }

      // 30일 후 만료
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      const waitlist = await Waitlist.create({
        patientId,
        doctorId,
        preferredTimeSlots,
        notes,
        expiresAt
      });

      return waitlist;
    } catch (error) {
      logger.error('Add to waitlist error:', error);
      throw error;
    }
  },

  // 취소된 예약 시간에 대기자 확인
  async checkWaitlistForSlot(appointmentDate, doctorId, duration) {
    try {
      const slotStart = new Date(appointmentDate);
      const slotEnd = new Date(appointmentDate);
      slotEnd.setMinutes(slotEnd.getMinutes() + duration);

      // 해당 시간대를 선호하는 대기자 찾기
      const waitingPatients = await Waitlist.find({
        doctorId,
        status: 'waiting',
        'preferredTimeSlots': {
          $elemMatch: {
            startTime: { $lte: slotStart },
            endTime: { $gte: slotEnd }
          }
        }
      })
      .sort({ priority: -1, createdAt: 1 })
      .populate('patientId');

      if (waitingPatients.length > 0) {
        // 첫 번째 대기자에게 알림
        const firstWaiting = waitingPatients[0];
        firstWaiting.status = 'notified';
        firstWaiting.notificationsSent.push({
          sentAt: new Date(),
          type: 'slot-available',
          success: true
        });
        await firstWaiting.save();

        // 알림 발송
        await notificationService.sendWaitlistNotification(
          firstWaiting.patientId,
          slotStart,
          duration
        );

        return firstWaiting;
      }

      return null;
    } catch (error) {
      logger.error('Check waitlist error:', error);
      throw error;
    }
  },

  // 만료된 대기 처리
  async processExpiredWaitlist() {
    try {
      const now = new Date();
      const expiredWaitlist = await Waitlist.updateMany(
        {
          status: 'waiting',
          expiresAt: { $lt: now }
        },
        {
          $set: { status: 'expired' }
        }
      );

      return expiredWaitlist.modifiedCount;
    } catch (error) {
      logger.error('Process expired waitlist error:', error);
      throw error;
    }
  },

  // 대기자 자동 매칭
  async autoMatchWaitlist(doctorId, date) {
    try {
      // 해당 날짜의 가용 시간대 찾기
      const availableSlots = await this.findAvailableTimeSlots(doctorId, date);
      logger.info(`Found ${availableSlots.length} available slots`);
      
      // 대기자 목록 조회 (우선순위 순)
      const waitingPatients = await Waitlist.find({
        doctorId,
        status: 'waiting',
        expiresAt: { $gt: new Date() }
      })
      .sort({ priority: -1, createdAt: 1 })
      .populate('patientId')
      .populate('doctorId');

      logger.info(`Found ${waitingPatients.length} waiting patients`);
      logger.info('Waiting patients:', waitingPatients);

      const matches = [];

      // 각 대기자에 대해 선호 시간대와 매칭
      for (const waitlist of waitingPatients) {
        logger.info(`Checking waitlist ${waitlist._id}`);
        logger.info(`Preferred time slots:`, waitlist.preferredTimeSlots);

        for (const slot of availableSlots) {
          logger.info(`Checking slot ${slot.startTime} - ${slot.endTime}`);

          // 대기자의 선호 시간대와 비교 (1시간 단위로 나누어 확인)
          const isPreferred = waitlist.preferredTimeSlots.some(preferred => {
            const preferredStart = new Date(preferred.startTime);
            const preferredEnd = new Date(preferred.endTime);
            const slotStart = new Date(slot.startTime);
            const slotEnd = new Date(slot.endTime);

            logger.info(`Comparing with preferred ${preferredStart} - ${preferredEnd}`);
            
            // 시간대가 겹치는지 확인
            const overlap = (
              slotStart >= preferredStart && slotEnd <= preferredEnd ||  // 선호 시간대 내에 있음
              preferredStart >= slotStart && preferredEnd <= slotEnd     // 가용 시간대 내에 있음
            );

            logger.info(`Overlap: ${overlap}`);
            return overlap;
          });

          if (isPreferred) {
            logger.info(`Found matching slot for waitlist ${waitlist._id}`);
            
            // 예약 생성
            const appointment = await appointmentService.createAppointment({
              patientId: waitlist.patientId._id,
              doctorId: doctorId,
              startTime: slot.startTime,
              endTime: slot.endTime,
              status: 'confirmed',
              notes: MESSAGES.DEFAULT_NOTE,
              createdFrom: {
                type: 'waitlist',
                id: waitlist._id
              }
            });

            // 대기 상태 업데이트
            waitlist.status = 'completed';
            const matchedTime = this.formatMatchedTime(slot.startTime);
            waitlist.notes = `${waitlist.notes}\n${MESSAGES.MATCH_COMPLETED}: ${matchedTime}`;
            await waitlist.save();

            // 매칭 결과 저장
            matches.push({
              waitlist,
              appointment,
              slot
            });

            // 해당 시간대 제거
            availableSlots.splice(availableSlots.indexOf(slot), 1);

            // 매칭 성공 알림 전송
            await notificationService.notifyWaitlistMatch(waitlist._id, appointment);

            break;
          }
        }
      }

      return matches;
    } catch (error) {
      logger.error('Auto match waitlist error:', error);
      throw error;
    }
  },

  // 가용 시간대 찾기
  async findAvailableTimeSlots(doctorId, date) {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      logger.info(`Finding available slots for doctor ${doctorId} on ${date}`);

      // 해당 날짜의 모든 예약 조회
      const existingAppointments = await Appointment.find({
        doctorId,
        startTime: { $gte: startOfDay },
        endTime: { $lte: endOfDay },
        status: { $ne: 'cancelled' }
      }).sort({ startTime: 1 });

      logger.info(`Found ${existingAppointments.length} existing appointments`);

      // 진료 시간대 설정 (예: 9시-17시)
      const workingHours = {
        start: 9,
        end: 17,
        slotDuration: 60 // 1시간 단위
      };

      const availableSlots = [];
      let currentTime = new Date(startOfDay);
      currentTime.setHours(workingHours.start);

      while (currentTime.getHours() < workingHours.end) {
        const slotEnd = new Date(currentTime);
        slotEnd.setMinutes(slotEnd.getMinutes() + workingHours.slotDuration);

        // 해당 시간대에 예약이 있는지 확인
        const hasConflict = existingAppointments.some(appointment => 
          appointment.startTime < slotEnd && 
          appointment.endTime > currentTime
        );

        if (!hasConflict) {
          availableSlots.push({
            startTime: new Date(currentTime),
            endTime: new Date(slotEnd)
          });
        }

        currentTime = new Date(slotEnd);
      }

      logger.info(`Found ${availableSlots.length} available slots`);
      availableSlots.forEach(slot => {
        logger.info(`Available slot: ${slot.startTime} - ${slot.endTime}`);
      });

      return availableSlots;
    } catch (error) {
      logger.error('Find available slots error:', error);
      throw error;
    }
  },

  // 우선순위 계산
  async calculatePriority(patientId, doctorId) {
    try {
      // 1. 기본 우선순위 (환자 상태에 따라)
      const patient = await User.findById(patientId);
      let priority = 0;

      // VIP 환자
      if (patient.isVIP) {
        priority += 2;
      }

      // 2. 대기 이력 확인
      const waitingHistory = await Waitlist.find({
        patientId,
        doctorId,
        status: { $in: ['completed', 'cancelled'] }
      });

      // 이전 취소 이력이 있는 경우 우선순위 가산
      const cancelledCount = waitingHistory.filter(w => w.status === 'cancelled').length;
      if (cancelledCount > 0) {
        priority += Math.min(cancelledCount, 3); // 최대 3점까지
      }

      // 3. 현재 대기 시간에 따른 우선순위
      const currentWaitlist = await Waitlist.findOne({
        patientId,
        doctorId,
        status: 'waiting'
      });

      if (currentWaitlist) {
        const waitingDays = Math.floor((new Date() - currentWaitlist.createdAt) / (1000 * 60 * 60 * 24));
        priority += Math.min(waitingDays, 5); // 최대 5점까지
      }

      return Math.min(priority, 10); // 최대 10점
    } catch (error) {
      logger.error('Calculate priority error:', error);
      throw error;
    }
  },

  // 우선순위 업데이트
  async updatePriority(waitlistId, newPriority, reason) {
    try {
      const waitlist = await Waitlist.findById(waitlistId);
      if (!waitlist) {
        throw new Error('Waitlist not found');
      }

      const oldPriority = waitlist.priority;
      waitlist.priority = newPriority;
      waitlist.notes = `${waitlist.notes}\n우선순위 변경: ${oldPriority} → ${newPriority} (${reason})`;
      await waitlist.save();

      // 우선순위 변경 알림
      if (newPriority > oldPriority) {
        await notificationService.sendNotification(
          waitlist.patientId,
          'priority_increased',
          `대기 우선순위가 상향 조정되었습니다. (${reason})`
        );
      }

      return waitlist;
    } catch (error) {
      logger.error('Update priority error:', error);
      throw error;
    }
  },

  // 우선순위 자동 업데이트 (배치 작업)
  async updateAllPriorities() {
    try {
      const waitlists = await Waitlist.find({ status: 'waiting' });
      const updates = [];

      for (const waitlist of waitlists) {
        const newPriority = await this.calculatePriority(
          waitlist.patientId,
          waitlist.doctorId
        );

        if (newPriority !== waitlist.priority) {
          updates.push(
            this.updatePriority(
              waitlist._id,
              newPriority,
              '정기 우선순위 재계산'
            )
          );
        }
      }

      await Promise.all(updates);
      return updates.length;
    } catch (error) {
      logger.error('Update all priorities error:', error);
      throw error;
    }
  },

  // 날짜 형식 변환 함수
  formatMatchedTime(date) {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(new Date(date));
  },

  // waitlist 노트 업데이트
  updateWaitlistNotes(waitlist, matchedTime) {
    const originalNotes = waitlist.notes || MESSAGES.DEFAULT_NOTE;
    return `${originalNotes}\n${MESSAGES.MATCH_COMPLETED}: ${this.formatMatchedTime(matchedTime)}`;
  }
};

module.exports = waitlistService; 