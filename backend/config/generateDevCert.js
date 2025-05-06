const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// 개발용 임시 키 생성
const privateKey = crypto.randomBytes(32).toString('hex');
const certificate = crypto.randomBytes(32).toString('hex');

// SSL 디렉토리 경로
const sslDir = path.join(__dirname, 'ssl');

// 키 파일 저장
fs.writeFileSync(path.join(sslDir, 'private.key'), privateKey);
fs.writeFileSync(path.join(sslDir, 'certificate.crt'), certificate);

console.log('Development SSL files generated'); 