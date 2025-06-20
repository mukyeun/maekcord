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

  } catch (error) {
    console.error('MongoDB 연결 실패:', error);
    process.exit(1);
  }
};

module.exports = connectDB;