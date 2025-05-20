const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB 스키마 정의
const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String
});

const User = mongoose.model('User', userSchema);

// MongoDB 연결
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('MongoDB 연결 성공');
        findAllUsers();
    })
    .catch(err => {
        console.error('MongoDB 연결 실패:', err);
        process.exit(1);
    });

async function findAllUsers() {
    try {
        const users = await User.find({});
        console.log('\n등록된 사용자 목록:');
        users.forEach(user => {
            console.log(`
사용자명: ${user.username}
이메일: ${user.email}
해시된 비밀번호: ${user.password}
-------------------`);
        });
    } catch (error) {
        console.error('사용자 조회 실패:', error);
    } finally {
        mongoose.connection.close();
    }
}