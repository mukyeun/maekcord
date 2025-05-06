const mongoose = require('mongoose');
const Appointment = require('../../models/Appointment');
const Patient = require('../../models/Patient');
const moment = require('moment-timezone');

describe('Appointment Model Test', () => {
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

  const validAppointmentData = {
    patientId: null, // beforeEach에서 설정
    dateTime: moment().add(1, 'day').toDate(),
    duration: 30,
    type: 'initial',
    status: 'scheduled'
  };

  beforeEach(() => {
    validAppointmentData.patientId = patient._id;
  });

  describe('Validation Tests', () => {
    it('should validate a valid appointment', async () => {
      const validAppointment = new Appointment(validAppointmentData);
      const savedAppointment = await validAppointment.save();
      
      expect(savedAppointment._id).toBeDefined();
      expect(savedAppointment.patientId).toEqual(patient._id);
      expect(savedAppointment.type).toBe(validAppointmentData.type);
      expect(savedAppointment.status).toBe(validAppointmentData.status);
    });

    it('should fail validation without required fields', async () => {
      const appointmentWithoutRequired = new Appointment({});
      let err;
      
      try {
        await appointmentWithoutRequired.save();
      } catch (error) {
        err = error;
      }
      
      expect(err).toBeDefined();
      expect(err.errors.patientId).toBeDefined();
      expect(err.errors.dateTime).toBeDefined();
      expect(err.errors.type).toBeDefined();
    });

    it('should fail validation with invalid appointment type', async () => {
      const appointmentWithInvalidType = new Appointment({
        ...validAppointmentData,
        type: 'invalid'
      });
      let err;
      
      try {
        await appointmentWithInvalidType.save();
      } catch (error) {
        err = error;
      }
      
      expect(err).toBeDefined();
      expect(err.errors.type).toBeDefined();
    });

    it('should fail validation with past date', async () => {
      const appointmentWithPastDate = new Appointment({
        ...validAppointmentData,
        dateTime: moment().subtract(1, 'day').toDate()
      });
      let err;
      
      try {
        await appointmentWithPastDate.save();
      } catch (error) {
        err = error;
      }
      
      expect(err).toBeDefined();
      expect(err.errors.dateTime).toBeDefined();
    });

    it('should fail validation with invalid duration', async () => {
      const appointmentWithInvalidDuration = new Appointment({
        ...validAppointmentData,
        duration: 10 // 최소 15분
      });
      let err;
      
      try {
        await appointmentWithInvalidDuration.save();
      } catch (error) {
        err = error;
      }
      
      expect(err).toBeDefined();
      expect(err.errors.duration).toBeDefined();
    });
  });

  describe('Time Conflict Tests', () => {
    it('should detect time conflict with existing appointment', async () => {
      // 첫 번째 예약 생성
      const firstAppointment = await Appointment.create(validAppointmentData);

      // 같은 시간에 두 번째 예약 시도
      const conflictingAppointment = new Appointment({
        ...validAppointmentData,
        dateTime: firstAppointment.dateTime
      });

      let err;
      try {
        await conflictingAppointment.save();
      } catch (error) {
        err = error;
      }

      expect(err).toBeDefined();
      expect(err.message).toContain('해당 시간에 이미 예약이 있습니다');
    });

    it('should allow appointments with non-conflicting times', async () => {
      // 첫 번째 예약 생성
      await Appointment.create(validAppointmentData);

      // 1시간 후 두 번째 예약
      const nonConflictingAppointment = new Appointment({
        ...validAppointmentData,
        dateTime: moment(validAppointmentData.dateTime).add(1, 'hour').toDate()
      });

      const savedAppointment = await nonConflictingAppointment.save();
      expect(savedAppointment._id).toBeDefined();
    });
  });

  describe('Status Update Tests', () => {
    it('should update completedAt when status changes to completed', async () => {
      const appointment = await Appointment.create(validAppointmentData);
      
      appointment.status = 'completed';
      await appointment.save();

      expect(appointment.completedAt).toBeDefined();
      expect(appointment.completedAt).toBeInstanceOf(Date);
    });

    it('should not update completedAt for other status changes', async () => {
      const appointment = await Appointment.create(validAppointmentData);
      
      appointment.status = 'cancelled';
      await appointment.save();

      expect(appointment.completedAt).toBeUndefined();
    });
  });

  describe('Virtual Fields', () => {
    it('should calculate remainingTime correctly', async () => {
      const futureDateTime = moment().add(2, 'hours').toDate();
      const appointment = await Appointment.create({
        ...validAppointmentData,
        dateTime: futureDateTime
      });

      expect(appointment.remainingTime).toBeGreaterThan(110); // 약 120분 (오차 허용)
      expect(appointment.remainingTime).toBeLessThan(130);
    });
  });

  describe('Indexes', () => {
    it('should have compound index on dateTime and status', async () => {
      const indexes = await Appointment.collection.getIndexes();
      const dateTimeStatusIndex = Object.values(indexes).find(
        index => index.key.dateTime && index.key.status
      );
      
      expect(dateTimeStatusIndex).toBeDefined();
    });
  });
}); 