const axios = require('axios');
const { sendSMS, sendAppointmentReminder, sendWaitlistNotification } = require('../../utils/sms');
const config = require('../../config');

jest.mock('axios');

describe('SMS Utility Test', () => {
  beforeEach(() => {
    axios.post.mockReset();
    axios.post.mockResolvedValue({
      data: {
        statusCode: '202',
        statusMessage: 'success',
        messageId: 'test-message-id'
      }
    });
  });

  describe('sendSMS Function', () => {
    it('should send SMS successfully', async () => {
      const smsData = {
        to: '01012345678',
        content: '테스트 메시지'
      };

      await sendSMS(smsData);

      expect(axios.post).toHaveBeenCalledWith(
        config.sms.apiUrl,
        expect.objectContaining({
          type: 'SMS',
          from: config.sms.sender,
          content: smsData.content,
          messages: [{
            to: smsData.to
          }]
        }),
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
            'x-ncp-apigw-timestamp': expect.any(String),
            'x-ncp-iam-access-key': config.sms.accessKey,
            'x-ncp-apigw-signature': expect.any(String)
          }
        })
      );
    });

    it('should handle SMS sending failure', async () => {
      axios.post.mockRejectedValue(new Error('Failed to send SMS'));

      const smsData = {
        to: '01012345678',
        content: '테스트 메시지'
      };

      await expect(sendSMS(smsData)).rejects.toThrow('Failed to send SMS');
    });

    it('should validate phone number format', async () => {
      const invalidSMSData = {
        to: '123', // invalid phone number
        content: '테스트 메시지'
      };

      await expect(sendSMS(invalidSMSData)).rejects.toThrow('Invalid phone number format');
    });

    it('should handle message length limits', async () => {
      const longMessage = 'a'.repeat(91); // SMS 길이 제한 초과
      const smsData = {
        to: '01012345678',
        content: longMessage
      };

      await expect(sendSMS(smsData)).rejects.toThrow('Message too long');
    });
  });

  describe('sendAppointmentReminder Function', () => {
    const appointment = {
      patientName: '홍길동',
      dateTime: new Date('2024-03-20T14:30:00'),
      type: 'initial',
      doctorName: '김의사'
    };

    const phoneNumber = '01012345678';

    it('should send appointment reminder SMS', async () => {
      await sendAppointmentReminder(appointment, phoneNumber);

      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          messages: [{
            to: phoneNumber
          }],
          content: expect.stringContaining('홍길동'),
          content: expect.stringContaining('3월 20일'),
          content: expect.stringContaining('14:30')
        }),
        expect.any(Object)
      );
    });

    it('should format date and time correctly', async () => {
      await sendAppointmentReminder(appointment, phoneNumber);

      const requestData = axios.post.mock.calls[0][1];
      expect(requestData.content).toMatch(/3월 20일/);
      expect(requestData.content).toMatch(/14시 30분/);
    });

    it('should include appointment type', async () => {
      await sendAppointmentReminder(appointment, phoneNumber);

      const requestData = axios.post.mock.calls[0][1];
      expect(requestData.content).toContain('초진');
    });

    it('should handle missing appointment information', async () => {
      const invalidAppointment = {
        patientName: '홍길동'
        // missing dateTime
      };

      await expect(sendAppointmentReminder(invalidAppointment, phoneNumber))
        .rejects.toThrow('Invalid appointment data');
    });
  });

  describe('sendWaitlistNotification Function', () => {
    const waitlistData = {
      patientName: '홍길동',
      estimatedTime: new Date('2024-03-20T14:30:00'),
      priority: 1,
      department: '내과'
    };

    const phoneNumber = '01012345678';

    it('should send waitlist notification SMS', async () => {
      await sendWaitlistNotification(waitlistData, phoneNumber);

      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          messages: [{
            to: phoneNumber
          }],
          content: expect.stringContaining('홍길동'),
          content: expect.stringContaining('14:30'),
          content: expect.stringContaining('내과')
        }),
        expect.any(Object)
      );
    });

    it('should include priority information', async () => {
      await sendWaitlistNotification(waitlistData, phoneNumber);

      const requestData = axios.post.mock.calls[0][1];
      expect(requestData.content).toContain('1번');
    });

    it('should handle status updates', async () => {
      const updatedWaitlist = {
        ...waitlistData,
        status: 'called',
        roomNumber: '진료실 1'
      };

      await sendWaitlistNotification(updatedWaitlist, phoneNumber);

      const requestData = axios.post.mock.calls[0][1];
      expect(requestData.content).toContain('진료실 1');
    });

    it('should handle missing waitlist information', async () => {
      const invalidWaitlist = {
        patientName: '홍길동'
        // missing other required fields
      };

      await expect(sendWaitlistNotification(invalidWaitlist, phoneNumber))
        .rejects.toThrow('Invalid waitlist data');
    });
  });

  describe('SMS API Integration', () => {
    it('should handle API rate limits', async () => {
      // API 속도 제한 시뮬레이션
      axios.post
        .mockRejectedValueOnce(new Error('Too many requests'))
        .mockResolvedValueOnce({
          data: {
            statusCode: '202',
            statusMessage: 'success'
          }
        });

      const smsData = {
        to: '01012345678',
        content: '테스트 메시지'
      };

      // 첫 번째 시도는 실패
      await expect(sendSMS(smsData)).rejects.toThrow('Too many requests');

      // 두 번째 시도는 성공
      await expect(sendSMS(smsData)).resolves.not.toThrow();
    });

    it('should handle different response formats', async () => {
      const responses = [
        { data: { statusCode: '202', statusMessage: 'success' } },
        { data: { statusCode: '400', statusMessage: 'invalid_parameter' } },
        { data: { statusCode: '429', statusMessage: 'too_many_requests' } }
      ];

      for (const response of responses) {
        axios.post.mockResolvedValueOnce(response);

        const smsData = {
          to: '01012345678',
          content: '테스트 메시지'
        };

        if (response.data.statusCode === '202') {
          await expect(sendSMS(smsData)).resolves.not.toThrow();
        } else {
          await expect(sendSMS(smsData)).rejects.toThrow();
        }
      }
    });
  });

  describe('Message Templates', () => {
    it('should use predefined templates correctly', async () => {
      const templateData = {
        templateId: 'appointment-reminder',
        params: {
          patientName: '홍길동',
          date: '3월 20일',
          time: '14:30'
        }
      };

      await sendSMS({
        to: '01012345678',
        template: templateData
      });

      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          templateId: templateData.templateId,
          messageType: 'ATA'
        }),
        expect.any(Object)
      );
    });
  });
}); 