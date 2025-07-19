const express = require('express');
const router = express.Router();
const medicalRecordController = require('../controllers/medicalRecordController');
const authMiddleware = require('../middlewares/auth');
const { USER_ROLES } = require('../config/constants');

// 모든 라우트에 인증 미들웨어 적용
router.use(authMiddleware.authenticate);

// 진료 기록 생성 (의사만 가능)
router.post('/',
  authMiddleware.authorize([USER_ROLES.DOCTOR]),
  medicalRecordController.createRecord
);

// 진료 기록 목록 조회 - 환자별
router.get('/patient/:patientId',
  authMiddleware.authorize([USER_ROLES.ADMIN, USER_ROLES.DOCTOR, USER_ROLES.RECEPTIONIST]),
  medicalRecordController.getPatientRecords
);

// 진료 기록 목록 조회 - 의사별
router.get('/doctor/:doctorId?',
  authMiddleware.authorize([USER_ROLES.ADMIN, USER_ROLES.DOCTOR]),
  medicalRecordController.getDoctorRecords
);

// 특정 진료 기록 조회
router.get('/:recordId',
  authMiddleware.authorize([USER_ROLES.ADMIN, USER_ROLES.DOCTOR, USER_ROLES.RECEPTIONIST]),
  medicalRecordController.getRecord
);

// 진료 기록 수정 (해당 의사 또는 관리자만 가능)
router.put('/:recordId',
  authMiddleware.authorize([USER_ROLES.ADMIN, USER_ROLES.DOCTOR]),
  medicalRecordController.updateRecord
);

// 진료 기록 삭제 (해당 의사 또는 관리자만 가능)
router.delete('/:recordId',
  authMiddleware.authorize([USER_ROLES.ADMIN, USER_ROLES.DOCTOR]),
  medicalRecordController.deleteRecord
);

module.exports = router; 