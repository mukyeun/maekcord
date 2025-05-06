const nodemailer = require('nodemailer');

// 환경변수 로드 확인
console.log('🔍 EMAIL_USER:', process.env.EMAIL_USER);
console.log('🔍 EMAIL_PASS:', process.env.EMAIL_PASS);

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

transporter.verify((error, success) => {
  if (error) {
    console.error('❌ 이메일 서비스 연결 실패:', error);
  } else {
    console.log('✅ 이메일 서비스 연결 성공');
  }
});

module.exports = transporter;