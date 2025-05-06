const nodemailer = require('nodemailer');
const config = require('../config');
const logger = require('./logger');

// 이메일 전송을 위한 트랜스포터 생성
const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.port === 465, // true for 465, false for other ports
  auth: {
    user: config.email.user,
    pass: config.email.pass
  }
});

// 트랜스포터 연결 확인
transporter.verify()
  .then(() => logger.info('이메일 서비스가 준비되었습니다.'))
  .catch(err => logger.error('이메일 서비스 설정 오류:', err));

/**
 * 이메일 전송 함수
 * @param {Object} options - 이메일 옵션
 * @param {string} options.email - 수신자 이메일
 * @param {string} options.subject - 이메일 제목
 * @param {string} options.message - 이메일 본문 (HTML 가능)
 * @param {Object} [options.attachments] - 첨부 파일
 * @returns {Promise}
 */
const sendEmail = async (options) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('개발 환경 - 이메일 전송 시뮬레이션:', {
      to: options.to,
      subject: options.subject,
      content: options.text || options.html
    });
    return true;
  }
  throw new Error('이메일 서비스가 구성되지 않았습니다');
};

const sendPasswordResetEmail = async (user, resetToken) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('개발 환경 - 비밀번호 재설정 이메일 시뮬레이션:', {
      to: user.email,
      resetToken
    });
    return true;
  }
  throw new Error('이메일 서비스가 구성되지 않았습니다');
};

const sendAppointmentReminder = async (appointment, patientEmail) => {
  console.log('예약 알림 이메일 시뮬레이션:', {
    appointment,
    patientEmail
  });
  return true;
};

/**
 * 이메일 템플릿 생성 함수
 * @param {string} type - 템플릿 타입
 * @param {Object} data - 템플릿 데이터
 * @returns {string} HTML 문자열
 */
const createEmailTemplate = (type, data) => {
  switch (type) {
    case 'passwordReset':
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>비밀번호 재설정</h2>
          <p>안녕하세요,</p>
          <p>비밀번호 재설정을 요청하셨습니다. 아래 링크를 클릭하여 비밀번호를 재설정해주세요:</p>
          <p>
            <a href="${data.resetUrl}" style="
              background-color: #4CAF50;
              color: white;
              padding: 10px 20px;
              text-decoration: none;
              border-radius: 5px;
              display: inline-block;
              margin: 20px 0;
            ">
              비밀번호 재설정
            </a>
          </p>
          <p>이 링크는 30분 동안만 유효합니다.</p>
          <p>비밀번호 재설정을 요청하지 않으셨다면 이 이메일을 무시하시면 됩니다.</p>
        </div>
      `;

    case 'appointmentReminder':
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>예약 알림</h2>
          <p>안녕하세요 ${data.patientName}님,</p>
          <p>내일 ${data.appointmentTime}에 예약이 있습니다.</p>
          <div style="
            background-color: #f5f5f5;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
          ">
            <p><strong>예약 정보:</strong></p>
            <p>날짜: ${data.appointmentDate}</p>
            <p>시간: ${data.appointmentTime}</p>
            <p>유형: ${data.appointmentType}</p>
          </div>
          <p>변경이나 취소가 필요하시면 연락 부탁드립니다.</p>
        </div>
      `;

    default:
      throw new Error('지원하지 않는 이메일 템플릿 타입입니다.');
  }
};

module.exports = {
  sendEmail,
  sendPasswordResetEmail,
  sendAppointmentReminder,
  createEmailTemplate
}; 