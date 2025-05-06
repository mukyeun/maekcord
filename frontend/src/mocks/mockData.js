export const mockPatients = [
  {
    id: 1,
    name: '김환자',
    age: 45,
    gender: '남',
    phoneNumber: '010-1234-5678',
    waitingNumber: 'A001',
    registeredTime: '09:30',
    status: '대기중',
    type: '초진',
    lastVisit: null
  },
  {
    id: 2,
    name: '이환자',
    age: 32,
    gender: '여',
    phoneNumber: '010-5678-1234',
    waitingNumber: 'A002',
    registeredTime: '09:45',
    status: '대기중',
    type: '재진',
    lastVisit: '2024-01-15'
  },
  {
    id: 3,
    name: '박환자',
    age: 28,
    gender: '여',
    phoneNumber: '010-9012-3456',
    waitingNumber: 'A003',
    registeredTime: '10:00',
    status: '대기중',
    type: '재진',
    lastVisit: '2024-02-01'
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