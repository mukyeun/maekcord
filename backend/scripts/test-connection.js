const mongoose = require('mongoose');
require('dotenv').config();

async function testConnection() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB 연결 성공!');
        
        // 데이터베이스 목록 조회
        const admin = mongoose.connection.db.admin();
        const databases = await admin.listDatabases();
        console.log('\n현재 데이터베이스 목록:');
        databases.databases.forEach(db => {
            console.log(`- ${db.name}`);
        });
    } catch (error) {
        console.error('MongoDB 연결 실패:', error);
    } finally {
        await mongoose.connection.close();
    }
}

testConnection(); 