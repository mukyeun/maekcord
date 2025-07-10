const request = require('supertest');
const app = require('../../app');
const {
  validateUserRegistration,
  validateUserLogin,
  validatePatientCreate,
  validateAppointmentCreate,
  validateWaitlistCreate
} = require('../../middlewares/validators');

describe('Validators Middleware Test', () => {
  let mockReq;
  let mockRes;
  let nextFunction;

  beforeEach(() => {
    mockReq = {
      body: {}
    };
    
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    nextFunction = jest.fn();
  });

  describe('User Registration Validation', () => {
    it('should pass valid registration data', async () => {
      mockReq.body = {
        email: 'test@example.com',
        password: 'Password123!',
        passwordConfirm: 'Password123!',
        name: '홍길동',
        role: 'staff'
      };

      await validateUserRegistration(mockReq, mockRes, nextFunction);
      expect(nextFunction).toHaveBeenCalledWith();
    });

    it('should fail with invalid email format', async () => {
      mockReq.body = {
        email: 'invalid-email',
        password: 'Password123!',
        passwordConfirm: 'Password123!',
        name: '홍길동'
      };

      await validateUserRegistration(mockReq, mockRes, nextFunction);
      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          message: expect.stringContaining('이메일')
        })
      );
    });

    it('should fail with weak password', async () => {
      mockReq.body = {
        email: 'test@example.com',
        password: 'weak',
        passwordConfirm: 'weak',
        name: '홍길동'
      };

      await validateUserRegistration(mockReq, mockRes, nextFunction);
      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          message: expect.stringContaining('비밀번호')
        })
      );
    });

    it('should fail with password mismatch', async () => {
      mockReq.body = {
        email: 'test@example.com',
        password: 'Password123!',
        passwordConfirm: 'DifferentPassword123!',
        name: '홍길동'
      };

      await validateUserRegistration(mockReq, mockRes, nextFunction);
      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          message: expect.stringContaining('일치하지 않습니다')
        })
      );
    });
  });

  describe('User Login Validation', () => {
    it('should pass valid login data', async () => {
      mockReq.body = {
        email: 'test@example.com',
        password: 'Password123!'
      };

      await validateUserLogin(mockReq, mockRes, nextFunction);
      expect(nextFunction).toHaveBeenCalledWith();
    });

    it('should fail without required fields', async () => {
      mockReq.body = {
        email: 'test@example.com'
      };

      await validateUserLogin(mockReq, mockRes, nextFunction);
      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          message: expect.stringContaining('필수')
        })
      );
    });
  });

  describe('Patient Creation Validation', () => {
    it('should pass valid patient data', async () => {
      mockReq.body = {
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
          medications: ['aspirin']
        }
      };

      await validatePatientCreate(mockReq, mockRes, nextFunction);
      expect(nextFunction).toHaveBeenCalledWith();
    });

    it('should fail with invalid birth date', async () => {
      mockReq.body = {
        name: '홍길동',
        birthDate: 'invalid-date',
        gender: 'male'
      };

      await validatePatientCreate(mockReq, mockRes, nextFunction);
      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          message: expect.stringContaining('생년월일')
        })
      );
    });

    it('should fail with invalid gender value', async () => {
      mockReq.body = {
        name: '홍길동',
        birthDate: '1990-01-01',
        gender: 'invalid'
      };

      await validatePatientCreate(mockReq, mockRes, nextFunction);
      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          message: expect.stringContaining('성별')
        })
      );
    });

    it('should fail with invalid phone format', async () => {
      mockReq.body = {
        name: '홍길동',
        birthDate: '1990-01-01',
        gender: 'male',
        contact: {
          phone: '12345',
          email: 'hong@example.com'
        }
      };

      await validatePatientCreate(mockReq, mockRes, nextFunction);
      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          message: expect.stringContaining('전화번호')
        })
      );
    });
  });

  describe('Appointment Creation Validation', () => {
    it('should pass valid appointment data', async () => {
      mockReq.body = {
        patientId: '507f1f77bcf86cd799439011',
        dateTime: '2024-03-20T14:30:00Z',
        duration: 30,
        type: 'initial',
        notes: '초진 예약'
      };

      await validateAppointmentCreate(mockReq, mockRes, nextFunction);
      expect(nextFunction).toHaveBeenCalledWith();
    });

    it('should fail with past date', async () => {
      mockReq.body = {
        patientId: '507f1f77bcf86cd799439011',
        dateTime: '2020-01-01T14:30:00Z',
        duration: 30,
        type: 'initial'
      };

      await validateAppointmentCreate(mockReq, mockRes, nextFunction);
      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          message: expect.stringContaining('과거')
        })
      );
    });

    it('should fail with invalid duration', async () => {
      mockReq.body = {
        patientId: '507f1f77bcf86cd799439011',
        dateTime: '2024-03-20T14:30:00Z',
        duration: -30,
        type: 'initial'
      };

      await validateAppointmentCreate(mockReq, mockRes, nextFunction);
      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          message: expect.stringContaining('진료 시간')
        })
      );
    });
  });

  describe('Waitlist Creation Validation', () => {
    it('should pass valid waitlist data', async () => {
      mockReq.body = {
        patientId: '507f1f77bcf86cd799439011',
        priority: 1,
        estimatedTime: '2024-03-20T14:30:00Z',
        note: '긴급 환자'
      };

      await validateWaitlistCreate(mockReq, mockRes, nextFunction);
      expect(nextFunction).toHaveBeenCalledWith();
    });

    it('should fail with invalid priority', async () => {
      mockReq.body = {
        patientId: '507f1f77bcf86cd799439011',
        priority: 0,
        estimatedTime: '2024-03-20T14:30:00Z'
      };

      await validateWaitlistCreate(mockReq, mockRes, nextFunction);
      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          message: expect.stringContaining('우선순위')
        })
      );
    });

    it('should fail with invalid estimated time', async () => {
      mockReq.body = {
        patientId: '507f1f77bcf86cd799439011',
        priority: 1,
        estimatedTime: 'invalid-time'
      };

      await validateWaitlistCreate(mockReq, mockRes, nextFunction);
      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          message: expect.stringContaining('예상 시간')
        })
      );
    });
  });

  describe('Sanitization Tests', () => {
    it('should sanitize user input', async () => {
      mockReq.body = {
        name: '   홍길동   ',
        email: '  TEST@EXAMPLE.COM  ',
        notes: '<script>alert("xss")</script>안녕하세요'
      };

      await validatePatientCreate(mockReq, mockRes, nextFunction);
      
      expect(mockReq.body.name).toBe('홍길동');
      expect(mockReq.body.email).toBe('test@example.com');
      expect(mockReq.body.notes).not.toContain('<script>');
    });
  });
}); 