export const mockPatients = [
  {
    id: 1,
    basicInfo: {
      name: '김철수',
      residentNumber: '900101-1234567',
      gender: 'male',
      birthDate: '1990-01-01',
      contact: { phone: '010-1234-5678' },
      personality: '내향적',
      workIntensity: '사무직',
      height: 175,
      weight: 70,
      bmi: 22.9,
      visitType: '초진'
    },
    medication: {
      current: ['아스피린', '혈압약'],
      preferences: ['한약']
    },
    symptoms: ['두통', '어지러움'],
    records: {
      pulse: {
        values: {
          HR: 75,
          HRV: 45,
          BV: 65
        },
        measuredAt: '2024-03-15T09:00:00.000Z'
      },
      stress: {
        items: ['업무 스트레스', '수면 부족'],
        score: 8,
        level: 'medium',
        measuredAt: '2024-03-15T09:00:00.000Z'
      }
    },
    memo: '초진 환자, 스트레스로 인한 두통 호소'
  },
  {
    id: 2,
    basicInfo: {
      name: '이영희',
      residentNumber: '850315-2345678',
      gender: 'female',
      birthDate: '1985-03-15',
      contact: { phone: '010-9876-5432' },
      personality: '외향적',
      workIntensity: '서비스직',
      height: 165,
      weight: 55,
      bmi: 20.2,
      visitType: '재진'
    },
    medication: {
      current: ['비타민'],
      preferences: ['한약']
    },
    symptoms: ['요통', '불면증'],
    records: {
      pulse: {
        values: {
          HR: 68,
          HRV: 55,
          BV: 75
        },
        measuredAt: '2024-03-14T15:30:00.000Z'
      },
      stress: {
        items: ['수면 장애'],
        score: 5,
        level: 'low',
        measuredAt: '2024-03-14T15:30:00.000Z'
      }
    },
    memo: '수면 패턴 개선 필요'
  }
];

export const mockQueue = {
  waitingList: [
    {
      id: 1,
      name: '김환자',
      waitingNumber: 'A001',
      registeredTime: '09:30',
      status: '대기중',
      type: '초진'
    },
    {
      id: 2,
      name: '이환자',
      waitingNumber: 'A002',
      registeredTime: '09:45',
      status: '대기중',
      type: '재진'
    }
  ],
  currentPatient: null
};

export const mockMedicalRecords = [
  {
    id: 1,
    patientId: 2,
    date: '2024-01-15',
    symptoms: '두통, 어지러움',
    diagnosis: '긴장성 두통',
    treatment: '침치료, 부항',
    prescription: '한약 처방 (7일분)'
  }
]; 