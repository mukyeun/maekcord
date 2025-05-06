const mongoose = require('mongoose');
const Waitlist = require('../../models/Waitlist');
const Patient = require('../../models/Patient');
const moment = require('moment-timezone');

describe('Waitlist Model Test', () => {
  let patient;

  beforeEach(async () => {
    // 테스트용 환자 생성
    patient = await Patient.create({
      name: '홍길동',
      birthDate: '1990-01-01',
      gender: 'male',
      contact: {
        phone: '010-1234-5678',
        email: 'hong@example.com'
      }
    });
  });

  const validWaitlistData = {
    patientId: null, // beforeEach에서 설정
    priority: 1,
    estimatedTime: moment().add(1, 'hour').toDate(),
    status: 'waiting',
    note: '초진 환자'
  };

  beforeEach(() => {
    validWaitlistData.patientId = patient._id;
  });

  describe('Validation Tests', () => {
    it('should validate a valid waitlist entry', async () => {
      const validWaitlist = new Waitlist(validWaitlistData);
      const savedWaitlist = await validWaitlist.save();
      
      expect(savedWaitlist._id).toBeDefined();
      expect(savedWaitlist.patientId).toEqual(patient._id);
      expect(savedWaitlist.priority).toBe(validWaitlistData.priority);
      expect(savedWaitlist.status).toBe(validWaitlistData.status);
    });

    it('should fail validation without required fields', async () => {
      const waitlistWithoutRequired = new Waitlist({});
      let err;
      
      try {
        await waitlistWithoutRequired.save();
      } catch (error) {
        err = error;
      }
      
      expect(err).toBeDefined();
      expect(err.errors.patientId).toBeDefined();
    });

    it('should fail validation with invalid status', async () => {
      const waitlistWithInvalidStatus = new Waitlist({
        ...validWaitlistData,
        status: 'invalid'
      });
      let err;
      
      try {
        await waitlistWithInvalidStatus.save();
      } catch (error) {
        err = error;
      }
      
      expect(err).toBeDefined();
      expect(err.errors.status).toBeDefined();
    });

    it('should fail validation with invalid priority', async () => {
      const waitlistWithInvalidPriority = new Waitlist({
        ...validWaitlistData,
        priority: 0 // 우선순위는 1 이상이어야 함
      });
      let err;
      
      try {
        await waitlistWithInvalidPriority.save();
      } catch (error) {
        err = error;
      }
      
      expect(err).toBeDefined();
      expect(err.errors.priority).toBeDefined();
    });
  });

  describe('Status Update Tests', () => {
    it('should update timestamps on status change', async () => {
      const waitlist = await Waitlist.create(validWaitlistData);
      
      // called 상태로 변경
      waitlist.status = 'called';
      await waitlist.save();
      expect(waitlist.calledAt).toBeDefined();
      
      // completed 상태로 변경
      waitlist.status = 'completed';
      await waitlist.save();
      expect(waitlist.completedAt).toBeDefined();
    });

    it('should not allow invalid status transitions', async () => {
      const waitlist = await Waitlist.create(validWaitlistData);
      
      // completed에서 waiting으로 변경 시도
      waitlist.status = 'completed';
      await waitlist.save();
      
      waitlist.status = 'waiting';
      let err;
      try {
        await waitlist.save();
      } catch (error) {
        err = error;
      }
      
      expect(err).toBeDefined();
    });
  });

  describe('Queue Management Tests', () => {
    it('should maintain priority order', async () => {
      // 우선순위가 다른 여러 대기자 생성
      const priorities = [3, 1, 2];
      const waitlistEntries = await Promise.all(
        priorities.map(priority =>
          Waitlist.create({
            ...validWaitlistData,
            priority
          })
        )
      );

      // 우선순위 순으로 조회
      const orderedWaitlist = await Waitlist.find()
        .sort({ priority: -1, registeredAt: 1 });

      expect(orderedWaitlist[0].priority).toBe(3);
      expect(orderedWaitlist[1].priority).toBe(2);
      expect(orderedWaitlist[2].priority).toBe(1);
    });

    it('should handle same priority with FIFO', async () => {
      // 같은 우선순위를 가진 대기자들 생성
      const firstEntry = await Waitlist.create(validWaitlistData);
      const secondEntry = await Waitlist.create({
        ...validWaitlistData,
        patientId: new mongoose.Types.ObjectId() // 다른 환자
      });

      const orderedWaitlist = await Waitlist.find()
        .sort({ priority: -1, registeredAt: 1 });

      expect(orderedWaitlist[0]._id).toEqual(firstEntry._id);
      expect(orderedWaitlist[1]._id).toEqual(secondEntry._id);
    });
  });

  describe('Virtual Fields', () => {
    it('should calculate waitingTime correctly', async () => {
      const waitlist = await Waitlist.create({
        ...validWaitlistData,
        registeredAt: moment().subtract(30, 'minutes').toDate()
      });

      expect(waitlist.waitingTime).toBeGreaterThanOrEqual(29);
      expect(waitlist.waitingTime).toBeLessThanOrEqual(31);
    });
  });

  describe('Indexes', () => {
    it('should have compound index on status and priority', async () => {
      const indexes = await Waitlist.collection.getIndexes();
      const statusPriorityIndex = Object.values(indexes).find(
        index => index.key.status && index.key.priority
      );
      
      expect(statusPriorityIndex).toBeDefined();
    });

    it('should have index on patientId', async () => {
      const indexes = await Waitlist.collection.getIndexes();
      const patientIdIndex = Object.values(indexes).find(
        index => index.key.patientId
      );
      
      expect(patientIdIndex).toBeDefined();
    });
  });
}); 