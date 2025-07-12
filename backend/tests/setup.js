const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const config = require('../config');
const logger = require('../utils/logger');

let mongoServer;

// Jest setup file
require('dotenv').config();

// 타임아웃 증가 (2분)
jest.setTimeout(120000);

// Mocking console methods to reduce noise in tests
global.console = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// Clean up all mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});

// 테스트 전 설정
beforeAll(async () => {
  try {
    // 인메모리 MongoDB 서버 시작
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 60000,
      socketTimeoutMS: 60000,
      connectTimeoutMS: 60000,
      maxPoolSize: 10
    });

    logger.info('Test database connected');
  } catch (error) {
    logger.error('Test database connection error:', error);
    throw error;
  }
});

// 각 테스트 전 설정
beforeEach(async () => {
  try {
    // 모든 컬렉션을 직접 초기화
    const collections = await mongoose.connection.db.collections();
    for (const collection of collections) {
      await collection.deleteMany({});
    }
  } catch (error) {
    logger.error('Failed to clean up test database:', error);
    throw error;
  }
});

// 테스트 후 정리
afterAll(async () => {
  try {
    // 데이터베이스 연결 종료
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
    
    logger.info('Test database disconnected');
  } catch (error) {
    logger.error('Error during test cleanup:', error);
  }
}); 