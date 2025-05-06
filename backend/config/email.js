const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

const emailTemplates = {
  appointmentCreated: (appointment, patient, doctor) => ({
    subject: '[매크병원] 진료 예약이 완료되었습니다',
    html: `
      <h2>진료 예약 확인</h2>
      <p>안녕하세요, ${patient.name}님.</p>
      <p>진료 예약이 완료되었습니다.</p>
      <hr>
      <h3>예약 정보</h3>
      <ul>
        <li>예약 번호: ${appointment.appointmentId}</li>
        <li>담당 의사: ${doctor.name}</li>
        <li>진료 일시: ${new Date(appointment.appointmentDate).toLocaleString('ko-KR')}</li>
        <li>진료 유형: ${appointment.visitType}</li>
      </ul>
      <p>예약 변경이나 취소는 예약일 24시간 전까지 가능합니다.</p>
      <p>문의사항은 병원으로 연락 부탁드립니다.</p>
    `
  }),

  appointmentCancelled: (appointment, patient, doctor) => ({
    subject: '[매크병원] 진료 예약이 취소되었습니다',
    html: `
      <h2>진료 예약 취소 확인</h2>
      <p>안녕하세요, ${patient.name}님.</p>
      <p>진료 예약이 취소되었습니다.</p>
      <hr>
      <h3>취소된 예약 정보</h3>
      <ul>
        <li>예약 번호: ${appointment.appointmentId}</li>
        <li>담당 의사: ${doctor.name}</li>
        <li>진료 일시: ${new Date(appointment.appointmentDate).toLocaleString('ko-KR')}</li>
        <li>취소 사유: ${appointment.cancellationReason}</li>
      </ul>
      <p>다시 예약을 원하시면 병원으로 연락 부탁드립니다.</p>
    `
  }),

  appointmentReminder: (appointment, patient, doctor) => ({
    subject: '[매크병원] 내일 진료 예약이 있습니다',
    html: `
      <h2>진료 예약 알림</h2>
      <p>안녕하세요, ${patient.name}님.</p>
      <p>내일 진료 예약이 있음을 알려드립니다.</p>
      <hr>
      <h3>예약 정보</h3>
      <ul>
        <li>예약 번호: ${appointment.appointmentId}</li>
        <li>담당 의사: ${doctor.name}</li>
        <li>진료 일시: ${new Date(appointment.appointmentDate).toLocaleString('ko-KR')}</li>
        <li>진료 유형: ${appointment.visitType}</li>
      </ul>
      <p>변경이나 취소를 원하시면 즉시 병원으로 연락 부탁드립니다.</p>
    `
  })
};

// 개발 환경에서는 이메일 전송을 시뮬레이션하는 함수
const createTestAccount = async () => {
  try {
    // 테스트용 SMTP 설정 반환
    return {
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: 'test@ethereal.email',
        pass: 'testpassword'
      }
    };
  } catch (error) {
    console.error('테스트 계정 생성 실패:', error);
    return null;
  }
};

// 개발 환경에서는 이메일 전송을 시뮬레이션
const sendEmail = async (options) => {
  console.log('이메일 전송 시뮬레이션:', {
    to: options.to,
    subject: options.subject,
    text: options.text || options.html
  });
  return true;
};

// 이메일 설정을 완전히 비활성화하고 개발용 설정만 사용
const config = {
  email: {
    enabled: false,  // 개발 환경에서는 비활성화
    host: 'smtp.naver.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER || 'test@example.com',
      pass: process.env.EMAIL_PASS || 'test'
    }
  }
};

module.exports = config; 