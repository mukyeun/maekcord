const mongoose = require('mongoose');
const Patient = require('../../models/Patient');

describe('Patient Model Test', () => {
  const validPatientData = {
    name: '홍길동',
    birthDate: '1990-01-01',
    gender: 'male',
    contact: {
      phone: '010-1234-5678',
      email: 'hong@example.com',
      address: '서울시 강남구'
    },
    medicalInfo: {
      bloodType: 'A+',
      allergies: ['penicillin'],
      medications: ['aspirin'],
      conditions: ['hypertension']
    }
  };

  describe('Validation Tests', () => {
    it('should validate a valid patient', async () => {
      const validPatient = new Patient(validPatientData);
      const savedPatient = await validPatient.save();
      
      expect(savedPatient._id).toBeDefined();
      expect(savedPatient.name).toBe(validPatientData.name);
      expect(savedPatient.birthDate.toISOString().split('T')[0]).toBe(validPatientData.birthDate);
      expect(savedPatient.gender).toBe(validPatientData.gender);
    });

    it('should fail validation without required fields', async () => {
      const patientWithoutRequired = new Patient({});
      let err;
      
      try {
        await patientWithoutRequired.save();
      } catch (error) {
        err = error;
      }
      
      expect(err).toBeDefined();
      expect(err.errors.name).toBeDefined();
      expect(err.errors.birthDate).toBeDefined();
      expect(err.errors.gender).toBeDefined();
    });

    it('should fail validation with invalid gender', async () => {
      const patientWithInvalidGender = new Patient({
        ...validPatientData,
        gender: 'invalid'
      });
      let err;
      
      try {
        await patientWithInvalidGender.save();
      } catch (error) {
        err = error;
      }
      
      expect(err).toBeDefined();
      expect(err.errors.gender).toBeDefined();
    });

    it('should fail validation with invalid blood type', async () => {
      const patientWithInvalidBloodType = new Patient({
        ...validPatientData,
        medicalInfo: {
          ...validPatientData.medicalInfo,
          bloodType: 'invalid'
        }
      });
      let err;
      
      try {
        await patientWithInvalidBloodType.save();
      } catch (error) {
        err = error;
      }
      
      expect(err).toBeDefined();
      expect(err.errors['medicalInfo.bloodType']).toBeDefined();
    });

    it('should fail validation with future birth date', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      
      const patientWithFutureBirthDate = new Patient({
        ...validPatientData,
        birthDate: futureDate
      });
      let err;
      
      try {
        await patientWithFutureBirthDate.save();
      } catch (error) {
        err = error;
      }
      
      expect(err).toBeDefined();
      expect(err.errors.birthDate).toBeDefined();
    });
  });

  describe('Virtual Fields', () => {
    it('should calculate age correctly', async () => {
      const birthYear = new Date().getFullYear() - 30;
      const patient = new Patient({
        ...validPatientData,
        birthDate: `${birthYear}-01-01`
      });
      await patient.save();
      
      expect(patient.age).toBe(30);
    });
  });

  describe('Methods', () => {
    it('should update medical history correctly', async () => {
      const patient = new Patient(validPatientData);
      await patient.save();

      const newCondition = {
        type: 'diagnosis',
        description: 'Common cold',
        date: new Date(),
        notes: 'Prescribed antibiotics'
      };

      await patient.updateMedicalHistory(newCondition);
      
      expect(patient.medicalHistory).toHaveLength(1);
      expect(patient.medicalHistory[0].type).toBe(newCondition.type);
      expect(patient.medicalHistory[0].description).toBe(newCondition.description);
    });

    it('should update contact information correctly', async () => {
      const patient = new Patient(validPatientData);
      await patient.save();

      const newContact = {
        phone: '010-9876-5432',
        email: 'newemail@example.com',
        address: '서울시 서초구'
      };

      await patient.updateContact(newContact);
      
      expect(patient.contact.phone).toBe(newContact.phone);
      expect(patient.contact.email).toBe(newContact.email);
      expect(patient.contact.address).toBe(newContact.address);
    });
  });

  describe('Indexes', () => {
    it('should have text index on name and contact.phone', async () => {
      const indexes = await Patient.collection.getIndexes();
      const textIndex = Object.values(indexes).find(index => index.name === 'name_text_contact.phone_text');
      
      expect(textIndex).toBeDefined();
      expect(textIndex.key).toHaveProperty('name', 'text');
      expect(textIndex.key).toHaveProperty('contact.phone', 'text');
    });
  });
}); 