const Patient = require('../models/Patient');
const asyncHandler = require('../utils/asyncHandler');
const moment = require('moment');

// 맥파 매개변수 평균값 조회
exports.getPulseParameterAverages = asyncHandler(async (req, res) => {
  try {
    console.log('🔄 맥파 매개변수 평균값 조회 시작');

    // 데이터 존재 여부 확인
    const totalPatients = await Patient.countDocuments();
    console.log('전체 환자 수:', totalPatients);

    // 샘플 데이터 확인
    const samplePatient = await Patient.findOne({ 'records.pulseWave': { $exists: true } });
    console.log('샘플 환자 데이터 구조:', JSON.stringify(samplePatient?.records?.[0]?.pulseWave || {}, null, 2));

    // 조건에 맞는 records 수 확인
    const recordsCount = await Patient.aggregate([
      { $unwind: '$records' },
      {
        $match: {
          'records.pulseWave.PVC': { $exists: true }
        }
      },
      { $count: 'total' }
    ]);
    console.log('조건에 맞는 records 수:', recordsCount[0]?.total || 0);

    const result = await Patient.aggregate([
      // records 배열 펼치기
      { $unwind: '$records' },
      // 필요한 필드가 있는 records만 선택
      {
        $match: {
          'records.pulseWave.PVC': { $exists: true },
          'records.pulseWave.BV': { $exists: true },
          'records.pulseWave.SV': { $exists: true },
          'records.pulseWave.heartRate': { $exists: true }
        }
      },
      // 평균값 계산
      {
        $group: {
          _id: null,
          PVC: { $avg: '$records.pulseWave.PVC' },
          BV: { $avg: '$records.pulseWave.BV' },
          SV: { $avg: '$records.pulseWave.SV' },
          HR: { $avg: '$records.pulseWave.heartRate' },
          PVC_min: { $min: '$records.pulseWave.PVC' },
          BV_min: { $min: '$records.pulseWave.BV' },
          SV_min: { $min: '$records.pulseWave.SV' },
          HR_min: { $min: '$records.pulseWave.heartRate' },
          PVC_max: { $max: '$records.pulseWave.PVC' },
          BV_max: { $max: '$records.pulseWave.BV' },
          SV_max: { $max: '$records.pulseWave.SV' },
          HR_max: { $max: '$records.pulseWave.heartRate' },
          totalRecords: { $sum: 1 }
        }
      },
      // 결과 포맷팅
      {
        $project: {
          _id: 0,
          PVC: { $round: ['$PVC', 2] },
          BV: { $round: ['$BV', 2] },
          SV: { $round: ['$SV', 2] },
          HR: { $round: ['$HR', 2] },
          PVC_min: { $round: ['$PVC_min', 2] },
          BV_min: { $round: ['$BV_min', 2] },
          SV_min: { $round: ['$SV_min', 2] },
          HR_min: { $round: ['$HR_min', 2] },
          PVC_max: { $round: ['$PVC_max', 2] },
          BV_max: { $round: ['$BV_max', 2] },
          SV_max: { $round: ['$SV_max', 2] },
          HR_max: { $round: ['$HR_max', 2] },
          totalRecords: 1
        }
      }
    ]);

    console.log('집계 결과:', result);

    // 결과가 없는 경우 기본값 반환
    const averages = result[0] || {
      PVC: 0, BV: 0, SV: 0, HR: 0,
      PVC_min: 0, BV_min: 0, SV_min: 0, HR_min: 0,
      PVC_max: 0, BV_max: 0, SV_max: 0, HR_max: 0,
      totalRecords: 0
    };

    console.log('✅ 맥파 매개변수 평균값 조회 완료:', {
      totalRecords: averages.totalRecords,
      averages: {
        PVC: averages.PVC?.toFixed(2),
        BV: averages.BV?.toFixed(2),
        SV: averages.SV?.toFixed(2),
        HR: averages.HR?.toFixed(2)
      }
    });

    res.json({
      success: true,
      data: averages
    });

  } catch (error) {
    console.error('❌ 맥파 매개변수 평균값 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '맥파 매개변수 평균값 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
}); 