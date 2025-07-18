const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    console.log('MongoDB 연결 시도...');
    console.log('MongoDB URI:', process.env.MONGODB_URI);
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('MongoDB 연결 성공:', conn.connection.host);
    
    // 연결된 데이터베이스의 컬렉션 목록 조회
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('사용 가능한 컬렉션:', collections.map(c => c.name));
    
    // queues 컬렉션의 문서 수 확인
    const queueCount = await mongoose.connection.db.collection('queues').countDocuments();
    console.log('queues 컬렉션 문서 수:', queueCount);
    
    // 샘플 데이터 확인
    const sampleQueues = await mongoose.connection.db.collection('queues')
      .find({})
      .limit(3)
      .toArray();
    console.log('queues 샘플 데이터:', sampleQueues);

    // 데이터베이스 인덱스 생성
    await createIndexes();

  } catch (error) {
    console.error('MongoDB 연결 실패:', error);
    process.exit(1);
  }
};

// 성능 최적화를 위한 인덱스 생성
const createIndexes = async () => {
  try {
    console.log('🔍 데이터베이스 인덱스 생성 중...');

    // 사용자 컬렉션 인덱스
    await mongoose.connection.db.collection('users').createIndex({ email: 1 }, { unique: true });
    await mongoose.connection.db.collection('users').createIndex({ username: 1 }, { unique: true });
    await mongoose.connection.db.collection('users').createIndex({ role: 1 });
    await mongoose.connection.db.collection('users').createIndex({ createdAt: -1 });

    // 환자 컬렉션 인덱스
    await mongoose.connection.db.collection('patients').createIndex({ 'basicInfo.name': 1 });
    await mongoose.connection.db.collection('patients').createIndex({ 'basicInfo.phone': 1 });
    await mongoose.connection.db.collection('patients').createIndex({ 'basicInfo.patientId': 1 }, { unique: true });
    await mongoose.connection.db.collection('patients').createIndex({ createdAt: -1 });
    await mongoose.connection.db.collection('patients').createIndex({ 'basicInfo.name': 'text', 'basicInfo.phone': 'text' });

    // 대기열 컬렉션 인덱스
    await mongoose.connection.db.collection('queues').createIndex({ status: 1 });
    await mongoose.connection.db.collection('queues').createIndex({ createdAt: -1 });
    await mongoose.connection.db.collection('queues').createIndex({ patientId: 1 });
    await mongoose.connection.db.collection('queues').createIndex({ queueNumber: 1 });
    await mongoose.connection.db.collection('queues').createIndex({ 
      status: 1, 
      createdAt: -1 
    });

    // 예약 컬렉션 인덱스
    await mongoose.connection.db.collection('appointments').createIndex({ appointmentDate: 1 });
    await mongoose.connection.db.collection('appointments').createIndex({ patientId: 1 });
    await mongoose.connection.db.collection('appointments').createIndex({ status: 1 });
    await mongoose.connection.db.collection('appointments').createIndex({ 
      appointmentDate: 1, 
      appointmentTime: 1 
    });

    // 로그 컬렉션 인덱스
    await mongoose.connection.db.collection('logs').createIndex({ level: 1 });
    await mongoose.connection.db.collection('logs').createIndex({ timestamp: -1 });
    await mongoose.connection.db.collection('logs').createIndex({ 
      level: 1, 
      timestamp: -1 
    });

    console.log('✅ 데이터베이스 인덱스 생성 완료');

  } catch (error) {
    console.error('❌ 인덱스 생성 실패:', error);
  }
};

// 쿼리 성능 모니터링
const monitorQueryPerformance = () => {
  mongoose.connection.on('query', (query) => {
    console.log('🔍 MongoDB 쿼리:', {
      collection: query.collection,
      operation: query.op,
      query: query.query,
      duration: query.duration
    });
  });
};

// 연결 풀 설정
const configureConnectionPool = () => {
  mongoose.connection.on('connected', () => {
    console.log('🔗 MongoDB 연결 풀 설정 완료');
  });

  mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB 연결 오류:', err);
  });

  mongoose.connection.on('disconnected', () => {
    console.log('🔌 MongoDB 연결 끊김');
  });
};

module.exports = connectDB;