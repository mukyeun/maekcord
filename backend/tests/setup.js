const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const config = require('../config');
const logger = require('../utils/logger');

let mongoServer;

// 테스트 전 설정
beforeAll(async () => {
  try {
    // 인메모리 MongoDB 서버 시작
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    logger.info('Test database connected');
  } catch (error) {
    logger.error('Test database connection error:', error);
    throw error;
  }
});

// 각 테스트 전 설정
beforeEach(async () => {
  // 모든 컬렉션 초기화
  const collections = await mongoose.connection.db.collections();
  for (let collection of collections) {
    await collection.deleteMany({});
  }
});

// 테스트 후 정리
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
  logger.info('Test database disconnected');
}); 