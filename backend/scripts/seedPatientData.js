const mongoose = require('mongoose');
const PatientData = require('../models/PatientData');
require('dotenv').config();

// MongoDB 연결
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/maekcord', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// 테스트 사용자 ID (실제 존재하는 사용자 ID로 변경 필요)
const testUserId = new mongoose.Types.ObjectId();

// 테스트 환자 데이터
const testPatients = [
  {
    basicInfo: {
      patientId: 'P20250001',
      name: '김철수',
      gender: 'male',
      birthDate: new Date('1985-03-15'),
      phone: '010-1234-5678',
      visitType: '초진',
      visitCount: 1,
      firstVisitDate: new Date('2025-01-15'),
      lastVisitDate: new Date('2025-01-15'),
      height: 175,
      weight: 70,
      bmi: 22.9,
      occupation: '회사원',
      workIntensity: '보통'
    },
    symptoms: {
      mainSymptoms: [
        {
          symptom: '두통',
          severity: '보통',
          duration: '3일'
        }
      ],
      additionalSymptoms: ['피로감', '어깨 통증']
    },
    medication: {
      currentMedications: [],
      allergies: ['페니실린']
    },
    medicalRecords: [],
    status: 'active',
    metadata: {
      createdBy: testUserId,
      dataQuality: 'good'
    }
  },
  {
    basicInfo: {
      patientId: 'P20250002',
      name: '이영희',
      gender: 'female',
      birthDate: new Date('1990-07-22'),
      phone: '010-2345-6789',
      visitType: '재진',
      visitCount: 3,
      firstVisitDate: new Date('2024-12-10'),
      lastVisitDate: new Date('2025-01-20'),
      height: 162,
      weight: 55,
      bmi: 21.0,
      occupation: '교사',
      workIntensity: '낮음'
    },
    symptoms: {
      mainSymptoms: [
        {
          symptom: '복통',
          severity: '경미',
          duration: '1주일'
        }
      ],
      additionalSymptoms: ['소화불량']
    },
    medication: {
      currentMedications: [
        {
          name: '소화제',
          dosage: '1정',
          frequency: '식후 30분',
          startDate: new Date('2025-01-15')
        }
      ],
      allergies: []
    },
    medicalRecords: [
      {
        recordId: 'MR20250115001',
        visitDate: new Date('2025-01-15'),
        doctorId: testUserId,
        diagnosis: {
          primary: '소화불량',
          secondary: []
        },
        treatment: {
          plan: '소화제 처방',
          medications: [
            {
              name: '소화제',
              dosage: '1정',
              duration: '7일'
            }
          ]
        },
        memo: '스트레스로 인한 소화불량 의심',
        status: 'completed'
      }
    ],
    status: 'active',
    metadata: {
      createdBy: testUserId,
      dataQuality: 'good'
    }
  },
  {
    basicInfo: {
      patientId: 'P20250003',
      name: '박민수',
      gender: 'male',
      birthDate: new Date('1978-11-08'),
      phone: '010-3456-7890',
      visitType: '초진',
      visitCount: 1,
      firstVisitDate: new Date('2025-01-25'),
      lastVisitDate: new Date('2025-01-25'),
      height: 180,
      weight: 85,
      bmi: 26.2,
      occupation: '건설업',
      workIntensity: '높음'
    },
    symptoms: {
      mainSymptoms: [
        {
          symptom: '요통',
          severity: '심함',
          duration: '2주일'
        }
      ],
      additionalSymptoms: ['다리 저림']
    },
    medication: {
      currentMedications: [],
      allergies: []
    },
    medicalRecords: [],
    status: 'active',
    metadata: {
      createdBy: testUserId,
      dataQuality: 'good'
    }
  },
  {
    basicInfo: {
      patientId: 'P20250004',
      name: '최수진',
      gender: 'female',
      birthDate: new Date('1995-04-30'),
      phone: '010-4567-8901',
      visitType: '재진',
      visitCount: 5,
      firstVisitDate: new Date('2024-10-05'),
      lastVisitDate: new Date('2025-01-18'),
      height: 168,
      weight: 58,
      bmi: 20.5,
      occupation: '간호사',
      workIntensity: '보통'
    },
    symptoms: {
      mainSymptoms: [
        {
          symptom: '불면증',
          severity: '보통',
          duration: '1개월'
        }
      ],
      additionalSymptoms: ['스트레스', '피로감']
    },
    medication: {
      currentMedications: [
        {
          name: '수면제',
          dosage: '1정',
          frequency: '취침 전',
          startDate: new Date('2025-01-10')
        }
      ],
      allergies: []
    },
    medicalRecords: [
      {
        recordId: 'MR20250110001',
        visitDate: new Date('2025-01-10'),
        doctorId: testUserId,
        diagnosis: {
          primary: '불면증',
          secondary: []
        },
        treatment: {
          plan: '수면제 처방 및 상담',
          medications: [
            {
              name: '수면제',
              dosage: '1정',
              duration: '14일'
            }
          ]
        },
        memo: '야간 근무로 인한 수면 패턴 교란',
        status: 'completed'
      }
    ],
    status: 'active',
    metadata: {
      createdBy: testUserId,
      dataQuality: 'good'
    }
  },
  {
    basicInfo: {
      patientId: 'P20250005',
      name: '정태호',
      gender: 'male',
      birthDate: new Date('1982-09-12'),
      phone: '010-5678-9012',
      visitType: '초진',
      visitCount: 1,
      firstVisitDate: new Date('2025-01-30'),
      lastVisitDate: new Date('2025-01-30'),
      height: 172,
      weight: 78,
      bmi: 26.4,
      occupation: '운전기사',
      workIntensity: '보통'
    },
    symptoms: {
      mainSymptoms: [
        {
          symptom: '고혈압',
          severity: '심함',
          duration: '6개월'
        }
      ],
      additionalSymptoms: ['두통', '어지러움']
    },
    medication: {
      currentMedications: [],
      allergies: []
    },
    medicalRecords: [],
    status: 'active',
    metadata: {
      createdBy: testUserId,
      dataQuality: 'good'
    }
  }
];

// 데이터 삽입 함수
async function seedPatientData() {
  try {
    console.log('환자 데이터 시드 시작...');
    
    // 기존 데이터 삭제
    await PatientData.deleteMany({});
    console.log('기존 환자 데이터 삭제 완료');
    
    // 새 데이터 삽입
    const result = await PatientData.insertMany(testPatients);
    console.log(`${result.length}개의 환자 데이터 삽입 완료`);
    
    console.log('환자 데이터 시드 완료!');
    process.exit(0);
  } catch (error) {
    console.error('환자 데이터 시드 오류:', error);
    process.exit(1);
  }
}

// 스크립트 실행
seedPatientData(); 