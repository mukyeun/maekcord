const nodemailer = require('nodemailer');
const { sendEmail, sendPasswordResetEmail, sendAppointmentReminder } = require('../../utils/email');
const config = require('../../config');

jest.mock('nodemailer');

describe('Email Utility Test', () => {
  let mockTransporter;
  let mockSendMail;

  beforeEach(() => {
    mockSendMail = jest.fn().mockResolvedValue({
      messageId: 'test-message-id'
    });

    mockTransporter = {
      sendMail: mockSendMail
    };

    nodemailer.createTransport.mockReturnValue(mockTransporter);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendEmail Function', () => {
    it('should send email successfully', async () => {
      const emailOptions = {
        to: 'test@example.com',
        subject: '테스트 이메일',
        text: '테스트 내용',
        html: '<p>테스트 내용</p>'
      };

      await sendEmail(emailOptions);

      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        host: config.email.host,
        port: config.email.port,
        secure: config.email.secure,
        auth: {
          user: config.email.user,
          pass: config.email.pass
        }
      });

      expect(mockSendMail).toHaveBeenCalledWith({
        from: config.email.from,
        ...emailOptions
      });
    });

    it('should handle email sending failure', async () => {
      mockSendMail.mockRejectedValue(new Error('Failed to send email'));

      const emailOptions = {
        to: 'test@example.com',
        subject: '테스트 이메일',
        text: '테스트 내용'
      };

      await expect(sendEmail(emailOptions)).rejects.toThrow('Failed to send email');
    });

    it('should validate email options', async () => {
      const invalidOptions = {
        subject: '테스트 이메일', // missing 'to' field
        text: '테스트 내용'
      };

      await expect(sendEmail(invalidOptions)).rejects.toThrow('Invalid email options');
    });
  });

  describe('sendPasswordResetEmail Function', () => {
    it('should send password reset email', async () => {
      const user = {
        email: 'test@example.com',
        name: '홍길동'
      };
      const resetToken = 'test-reset-token';
      const resetUrl = `${config.clientUrl}/reset-password/${resetToken}`;

      await sendPasswordResetEmail(user, resetToken);

      expect(mockSendMail).toHaveBeenCalledWith({
        from: config.email.from,
        to: user.email,
        subject: '비밀번호 재설정',
        html: expect.stringContaining(resetUrl),
        text: expect.stringContaining(resetUrl)
      });
    });

    it('should include user name in reset email', async () => {
      const user = {
        email: 'test@example.com',
        name: '홍길동'
      };
      const resetToken = 'test-reset-token';

      await sendPasswordResetEmail(user, resetToken);

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining('홍길동'),
          text: expect.stringContaining('홍길동')
        })
      );
    });

    it('should handle missing user information', async () => {
      const invalidUser = {
        name: '홍길동'
        // missing email
      };
      const resetToken = 'test-reset-token';

      await expect(sendPasswordResetEmail(invalidUser, resetToken))
        .rejects.toThrow('Invalid user data');
    });
  });

  describe('sendAppointmentReminder Function', () => {
    const appointment = {
      patientName: '홍길동',
      dateTime: new Date('2024-03-20T14:30:00'),
      type: 'initial',
      doctorName: '김의사'
    };

    const patientEmail = 'patient@example.com';

    it('should send appointment reminder email', async () => {
      await sendAppointmentReminder(appointment, patientEmail);

      expect(mockSendMail).toHaveBeenCalledWith({
        from: config.email.from,
        to: patientEmail,
        subject: expect.stringContaining('진료 예약 알림'),
        html: expect.stringContaining('홍길동'),
        html: expect.stringContaining('2024년 3월 20일'),
        html: expect.stringContaining('14:30'),
        text: expect.stringContaining('홍길동'),
        text: expect.stringContaining('2024년 3월 20일'),
        text: expect.stringContaining('14:30')
      });
    });

    it('should format date and time correctly in Korean', async () => {
      await sendAppointmentReminder(appointment, patientEmail);

      const emailCall = mockSendMail.mock.calls[0][0];
      expect(emailCall.html).toMatch(/2024년 3월 20일/);
      expect(emailCall.html).toMatch(/14시 30분/);
    });

    it('should include appointment type information', async () => {
      await sendAppointmentReminder(appointment, patientEmail);

      const emailCall = mockSendMail.mock.calls[0][0];
      expect(emailCall.html).toContain('초진');
      expect(emailCall.text).toContain('초진');
    });

    it('should include doctor information when available', async () => {
      await sendAppointmentReminder(appointment, patientEmail);

      const emailCall = mockSendMail.mock.calls[0][0];
      expect(emailCall.html).toContain('김의사');
      expect(emailCall.text).toContain('김의사');
    });

    it('should handle missing appointment information', async () => {
      const invalidAppointment = {
        patientName: '홍길동'
        // missing dateTime
      };

      await expect(sendAppointmentReminder(invalidAppointment, patientEmail))
        .rejects.toThrow('Invalid appointment data');
    });
  });

  describe('Email Templates', () => {
    it('should use HTML templates for emails', async () => {
      const emailOptions = {
        to: 'test@example.com',
        subject: '테스트 이메일',
        template: 'test-template',
        context: {
          name: '홍길동',
          message: '테스트 메시지'
        }
      };

      await sendEmail(emailOptions);

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining('<!DOCTYPE html>')
        })
      );
    });

    it('should handle template rendering errors', async () => {
      const invalidTemplate = {
        to: 'test@example.com',
        subject: '테스트 이메일',
        template: 'non-existent-template'
      };

      await expect(sendEmail(invalidTemplate))
        .rejects.toThrow('Template not found');
    });
  });

  describe('Email Queue', () => {
    it('should handle multiple emails in queue', async () => {
      const emails = [
        { to: 'test1@example.com', subject: '테스트 1', text: '내용 1' },
        { to: 'test2@example.com', subject: '테스트 2', text: '내용 2' },
        { to: 'test3@example.com', subject: '테스트 3', text: '내용 3' }
      ];

      await Promise.all(emails.map(email => sendEmail(email)));

      expect(mockSendMail).toHaveBeenCalledTimes(3);
    });
  });
}); 