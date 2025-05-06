const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/user');
require('dotenv').config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');

    // 기존 관리자 확인
    const existingAdmin = await User.findOne({ username: 'admin' });
    if (existingAdmin) {
      console.log('Admin account already exists');
      await User.findOneAndUpdate(
        { username: 'admin' },
        { 
          $set: { 
            password: await bcrypt.hash('admin1234', 10),
            role: 'admin'
          } 
        }
      );
      console.log('Admin password updated');
      return;
    }

    // 관리자 계정 생성
    const admin = await User.create({
      username: 'admin',
      password: await bcrypt.hash('admin1234', 10),
      role: 'admin',
      name: '관리자',
      email: 'admin@maekstation.com',
      phone: '010-0000-0000'
    });

    console.log('Admin account created successfully:', {
      username: admin.username,
      role: admin.role,
      name: admin.name
    });

  } catch (error) {
    console.error('Error creating admin account:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB Disconnected');
  }
};

createAdmin(); 