const xlsx = require('xlsx');
const fs = require('fs').promises;
const path = require('path');
const PulseDiagnosisRecord = require('../models/PulseDiagnosisRecord');
const PatientData = require('../models/PatientData');
const Patient = require('../models/Patient');
const User = require('../models/User');
const moment = require('moment-timezone');

class DataExportService {
  constructor() {
    this.exportDir = path.join(__dirname, '../exports');
    this.ensureExportDirectory();
  }

  // 내보내기 디렉토리 생성
  async ensureExportDirectory() {
    try {
      await fs.access(this.exportDir);
    } catch (error) {
      await fs.mkdir(this.exportDir, { recursive: true });
    }
  }

  // 맥상 진단 기록을 엑셀로 내보내기
  async exportPulseDiagnosisRecords(options = {}) {
    const {
      startDate,
      endDate,
      patientId,
      doctorId,
      status,
      format = 'xlsx'
    } = options;

    try {
      // 쿼리 조건 구성
      const query = { isActive: true };
      
      if (startDate && endDate) {
        query.diagnosisDate = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }
      
      if (patientId) query.patientId = patientId;
      if (doctorId) query.doctorId = doctorId;
      if (status) query.status = status;

      // 데이터 조회 (관련 정보 포함)
      const records = await PulseDiagnosisRecord.find(query)
        .populate('patientId', 'basicInfo.name basicInfo.gender basicInfo.birthDate')
        .populate('doctorId', 'name role')
        .sort({ diagnosisDate: -1 });

      // 엑셀 데이터 구성
      const excelData = records.map(record => ({
        '기록 ID': record.recordId,
        '환자명': record.patientId?.basicInfo?.name || 'N/A',
        '환자 성별': record.patientId?.basicInfo?.gender || 'N/A',
        '환자 생년월일': record.patientId?.basicInfo?.birthDate ? 
          moment(record.patientId.basicInfo.birthDate).format('YYYY-MM-DD') : 'N/A',
        '진단 의사': record.doctorId?.name || 'N/A',
        '진단 일시': moment(record.diagnosisDate).format('YYYY-MM-DD HH:mm:ss'),
        'PVC (말초혈관 수축도)': record.pulseData.pvc,
        'HR (심박동수)': record.pulseData.hr,
        'BV (혈액 점도)': record.pulseData.bv,
        'SV (일회박출량)': record.pulseData.sv,
        '측정된 맥상': record.pulseData.detectedPulse,
        '매칭 점수': record.pulseData.matchingScore,
        '최종 진단 맥상': record.diagnosis.finalPulse,
        '진단 메모': record.diagnosis.memo,
        '위험도': record.diagnosis.riskLevel,
        '상태': record.status,
        '측정 시간대': record.measurementContext?.timeOfDay || 'N/A',
        '측정 환경 온도': record.measurementContext?.temperature || 'N/A',
        '측정 환경 습도': record.measurementContext?.humidity || 'N/A',
        '데이터 품질': record.metadata?.dataQuality || 'N/A',
        '측정 소요시간(초)': record.metadata?.measurementDuration || 'N/A',
        '생성일시': moment(record.createdAt).format('YYYY-MM-DD HH:mm:ss'),
        '수정일시': moment(record.updatedAt).format('YYYY-MM-DD HH:mm:ss')
      }));

      // 파일명 생성
      const timestamp = moment().format('YYYYMMDD_HHmmss');
      const fileName = `pulse_diagnosis_records_${timestamp}.${format}`;
      const filePath = path.join(this.exportDir, fileName);

      // 엑셀 파일 생성
      const workbook = xlsx.utils.book_new();
      const worksheet = xlsx.utils.json_to_sheet(excelData);

      // 컬럼 너비 설정
      const columnWidths = [
        { wch: 15 }, // 기록 ID
        { wch: 12 }, // 환자명
        { wch: 8 },  // 성별
        { wch: 12 }, // 생년월일
        { wch: 12 }, // 진단 의사
        { wch: 20 }, // 진단 일시
        { wch: 15 }, // PVC
        { wch: 12 }, // HR
        { wch: 12 }, // BV
        { wch: 12 }, // SV
        { wch: 15 }, // 측정된 맥상
        { wch: 10 }, // 매칭 점수
        { wch: 15 }, // 최종 진단 맥상
        { wch: 30 }, // 진단 메모
        { wch: 8 },  // 위험도
        { wch: 10 }, // 상태
        { wch: 12 }, // 측정 시간대
        { wch: 15 }, // 온도
        { wch: 15 }, // 습도
        { wch: 12 }, // 데이터 품질
        { wch: 15 }, // 측정 소요시간
        { wch: 20 }, // 생성일시
        { wch: 20 }  // 수정일시
      ];
      worksheet['!cols'] = columnWidths;

      xlsx.utils.book_append_sheet(workbook, worksheet, '맥상 진단 기록');

      // 파일 저장
      xlsx.writeFile(workbook, filePath);

      return {
        success: true,
        fileName,
        filePath,
        recordCount: records.length,
        exportDate: moment().format('YYYY-MM-DD HH:mm:ss')
      };

    } catch (error) {
      console.error('맥상 진단 기록 내보내기 오류:', error);
      throw new Error('데이터 내보내기 중 오류가 발생했습니다.');
    }
  }

  // 환자 데이터를 엑셀로 내보내기
  async exportPatientData(options = {}) {
    const {
      startDate,
      endDate,
      visitType,
      status,
      format = 'xlsx'
    } = options;

    try {
      // 쿼리 조건 구성
      const query = {};
      
      if (startDate && endDate) {
        query['basicInfo.firstVisitDate'] = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }
      
      if (visitType) query['basicInfo.visitType'] = visitType;
      if (status) query.status = status;

      // 데이터 조회
      const patients = await PatientData.find(query)
        .populate('metadata.createdBy', 'name role')
        .populate('metadata.lastUpdatedBy', 'name role')
        .sort({ 'basicInfo.firstVisitDate': -1 });

      // 엑셀 데이터 구성
      const excelData = patients.map(patient => ({
        '환자 ID': patient.basicInfo.patientId,
        '환자명': patient.basicInfo.name,
        '전화번호': patient.basicInfo.phone,
        '성별': patient.basicInfo.gender,
        '생년월일': patient.basicInfo.birthDate ? 
          moment(patient.basicInfo.birthDate).format('YYYY-MM-DD') : 'N/A',
        '나이': patient.age || 'N/A',
        '방문 유형': patient.basicInfo.visitType,
        '첫 방문일': moment(patient.basicInfo.firstVisitDate).format('YYYY-MM-DD'),
        '마지막 방문일': moment(patient.basicInfo.lastVisitDate).format('YYYY-MM-DD'),
        '방문 횟수': patient.basicInfo.visitCount,
        '신장(cm)': patient.basicInfo.height || 'N/A',
        '체중(kg)': patient.basicInfo.weight || 'N/A',
        'BMI': patient.basicInfo.bmi || 'N/A',
        '직업': patient.basicInfo.occupation || 'N/A',
        '작업 강도': patient.basicInfo.workIntensity || 'N/A',
        '성격': patient.basicInfo.personality || 'N/A',
        '주소': patient.basicInfo.address || 'N/A',
        '비상연락처': patient.basicInfo.emergencyContact ? 
          `${patient.basicInfo.emergencyContact.name} (${patient.basicInfo.emergencyContact.relationship})` : 'N/A',
        '주요 증상': patient.symptoms?.mainSymptoms?.map(s => s.symptom).join(', ') || 'N/A',
        '현재 복용 약물': patient.medication?.currentMedications?.map(m => m.name).join(', ') || 'N/A',
        '알레르기': patient.medication?.allergies?.map(a => a.medication).join(', ') || 'N/A',
        '식습관': patient.lifestyle?.diet?.type || 'N/A',
        '운동 빈도': patient.lifestyle?.exercise?.frequency || 'N/A',
        '흡연 상태': patient.lifestyle?.smoking?.status || 'N/A',
        '음주 상태': patient.lifestyle?.alcohol?.status || 'N/A',
        '스트레스 수준': patient.lifestyle?.stress?.level || 'N/A',
        '가족력': patient.familyHistory?.hereditaryDiseases?.map(d => d.disease).join(', ') || 'N/A',
        '과거 질환': patient.medicalHistory?.pastDiseases?.map(d => d.disease).join(', ') || 'N/A',
        '수술력': patient.medicalHistory?.surgeries?.map(s => s.procedure).join(', ') || 'N/A',
        '진료 기록 수': patient.medicalRecords?.length || 0,
        '상태': patient.status,
        '데이터 품질': patient.metadata?.dataQuality || 'N/A',
        '생성자': patient.metadata?.createdBy?.name || 'N/A',
        '최종 수정자': patient.metadata?.lastUpdatedBy?.name || 'N/A',
        '생성일시': moment(patient.createdAt).format('YYYY-MM-DD HH:mm:ss'),
        '수정일시': moment(patient.updatedAt).format('YYYY-MM-DD HH:mm:ss')
      }));

      // 파일명 생성
      const timestamp = moment().format('YYYYMMDD_HHmmss');
      const fileName = `patient_data_${timestamp}.${format}`;
      const filePath = path.join(this.exportDir, fileName);

      // 엑셀 파일 생성
      const workbook = xlsx.utils.book_new();
      const worksheet = xlsx.utils.json_to_sheet(excelData);

      // 컬럼 너비 설정
      const columnWidths = [
        { wch: 15 }, // 환자 ID
        { wch: 12 }, // 환자명
        { wch: 15 }, // 전화번호
        { wch: 8 },  // 성별
        { wch: 12 }, // 생년월일
        { wch: 8 },  // 나이
        { wch: 10 }, // 방문 유형
        { wch: 12 }, // 첫 방문일
        { wch: 12 }, // 마지막 방문일
        { wch: 10 }, // 방문 횟수
        { wch: 10 }, // 신장
        { wch: 10 }, // 체중
        { wch: 8 },  // BMI
        { wch: 15 }, // 직업
        { wch: 12 }, // 작업 강도
        { wch: 15 }, // 성격
        { wch: 20 }, // 주소
        { wch: 20 }, // 비상연락처
        { wch: 30 }, // 주요 증상
        { wch: 25 }, // 현재 복용 약물
        { wch: 20 }, // 알레르기
        { wch: 12 }, // 식습관
        { wch: 12 }, // 운동 빈도
        { wch: 12 }, // 흡연 상태
        { wch: 12 }, // 음주 상태
        { wch: 12 }, // 스트레스 수준
        { wch: 20 }, // 가족력
        { wch: 20 }, // 과거 질환
        { wch: 20 }, // 수술력
        { wch: 12 }, // 진료 기록 수
        { wch: 10 }, // 상태
        { wch: 12 }, // 데이터 품질
        { wch: 12 }, // 생성자
        { wch: 12 }, // 최종 수정자
        { wch: 20 }, // 생성일시
        { wch: 20 }  // 수정일시
      ];
      worksheet['!cols'] = columnWidths;

      xlsx.utils.book_append_sheet(workbook, worksheet, '환자 데이터');

      // 파일 저장
      xlsx.writeFile(workbook, filePath);

      return {
        success: true,
        fileName,
        filePath,
        recordCount: patients.length,
        exportDate: moment().format('YYYY-MM-DD HH:mm:ss')
      };

    } catch (error) {
      console.error('환자 데이터 내보내기 오류:', error);
      throw new Error('환자 데이터 내보내기 중 오류가 발생했습니다.');
    }
  }

  // 통계 데이터 내보내기
  async exportStatistics(options = {}) {
    const { startDate, endDate } = options;

    try {
      const query = { isActive: true };
      
      if (startDate && endDate) {
        query.diagnosisDate = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }

      // 맥상별 통계
      const pulseStats = await PulseDiagnosisRecord.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$pulseData.detectedPulse',
            count: { $sum: 1 },
            avgScore: { $avg: '$pulseData.matchingScore' },
            riskLevels: {
              $push: '$diagnosis.riskLevel'
            }
          }
        },
        { $sort: { count: -1 } }
      ]);

      // 의사별 통계
      const doctorStats = await PulseDiagnosisRecord.aggregate([
        { $match: query },
        {
          $lookup: {
            from: 'users',
            localField: 'doctorId',
            foreignField: '_id',
            as: 'doctor'
          }
        },
        {
          $group: {
            _id: '$doctorId',
            doctorName: { $first: '$doctor.name' },
            count: { $sum: 1 },
            avgScore: { $avg: '$pulseData.matchingScore' }
          }
        },
        { $sort: { count: -1 } }
      ]);

      // 일별 통계
      const dailyStats = await PulseDiagnosisRecord.aggregate([
        { $match: query },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$diagnosisDate'
              }
            },
            count: { $sum: 1 },
            avgScore: { $avg: '$pulseData.matchingScore' }
          }
        },
        { $sort: { _id: -1 } }
      ]);

      // 환자 데이터 통계
      const patientQuery = {};
      if (startDate && endDate) {
        patientQuery['basicInfo.firstVisitDate'] = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }

      const patientStats = await PatientData.aggregate([
        { $match: patientQuery },
        {
          $group: {
            _id: '$basicInfo.visitType',
            count: { $sum: 1 }
          }
        }
      ]);

      const genderStats = await PatientData.aggregate([
        { $match: patientQuery },
        {
          $group: {
            _id: '$basicInfo.gender',
            count: { $sum: 1 }
          }
        }
      ]);

      // 엑셀 데이터 구성
      const workbook = xlsx.utils.book_new();

      // 맥상별 통계 시트
      const pulseStatsData = pulseStats.map(stat => ({
        '맥상명': stat._id,
        '진단 횟수': stat.count,
        '평균 매칭 점수': Math.round(stat.avgScore * 100) / 100,
        '위험도 분포': stat.riskLevels.join(', ')
      }));
      
      const pulseWorksheet = xlsx.utils.json_to_sheet(pulseStatsData);
      xlsx.utils.book_append_sheet(workbook, pulseWorksheet, '맥상별 통계');

      // 의사별 통계 시트
      const doctorStatsData = doctorStats.map(stat => ({
        '의사명': stat.doctorName?.[0] || 'N/A',
        '진단 횟수': stat.count,
        '평균 매칭 점수': Math.round(stat.avgScore * 100) / 100
      }));
      
      const doctorWorksheet = xlsx.utils.json_to_sheet(doctorStatsData);
      xlsx.utils.book_append_sheet(workbook, doctorWorksheet, '의사별 통계');

      // 일별 통계 시트
      const dailyStatsData = dailyStats.map(stat => ({
        '날짜': stat._id,
        '진단 횟수': stat.count,
        '평균 매칭 점수': Math.round(stat.avgScore * 100) / 100
      }));
      
      const dailyWorksheet = xlsx.utils.json_to_sheet(dailyStatsData);
      xlsx.utils.book_append_sheet(workbook, dailyWorksheet, '일별 통계');

      // 환자 통계 시트
      const patientStatsData = patientStats.map(stat => ({
        '방문 유형': stat._id,
        '환자 수': stat.count
      }));
      
      const patientWorksheet = xlsx.utils.json_to_sheet(patientStatsData);
      xlsx.utils.book_append_sheet(workbook, patientWorksheet, '환자 통계');

      // 성별 통계 시트
      const genderStatsData = genderStats.map(stat => ({
        '성별': stat._id,
        '환자 수': stat.count
      }));
      
      const genderWorksheet = xlsx.utils.json_to_sheet(genderStatsData);
      xlsx.utils.book_append_sheet(workbook, genderWorksheet, '성별 통계');

      // 파일 저장
      const timestamp = moment().format('YYYYMMDD_HHmmss');
      const fileName = `comprehensive_statistics_${timestamp}.xlsx`;
      const filePath = path.join(this.exportDir, fileName);

      xlsx.writeFile(workbook, filePath);

      return {
        success: true,
        fileName,
        filePath,
        pulseStatsCount: pulseStats.length,
        doctorStatsCount: doctorStats.length,
        dailyStatsCount: dailyStats.length,
        patientStatsCount: patientStats.length,
        genderStatsCount: genderStats.length,
        exportDate: moment().format('YYYY-MM-DD HH:mm:ss')
      };

    } catch (error) {
      console.error('통계 데이터 내보내기 오류:', error);
      throw new Error('통계 데이터 내보내기 중 오류가 발생했습니다.');
    }
  }

  // 백업 데이터 생성
  async createBackup() {
    try {
      const timestamp = moment().format('YYYYMMDD_HHmmss');
      const backupData = {
        exportDate: moment().format('YYYY-MM-DD HH:mm:ss'),
        pulseDiagnosisRecords: await PulseDiagnosisRecord.find({ isActive: true }).lean(),
        patientData: await PatientData.find({}).lean(),
        patients: await Patient.find({}).lean(),
        users: await User.find({}).lean()
      };

      const fileName = `maekcord_comprehensive_backup_${timestamp}.json`;
      const filePath = path.join(this.exportDir, fileName);

      await fs.writeFile(filePath, JSON.stringify(backupData, null, 2), 'utf8');

      return {
        success: true,
        fileName,
        filePath,
        pulseRecordCount: backupData.pulseDiagnosisRecords.length,
        patientDataCount: backupData.patientData.length,
        patientCount: backupData.patients.length,
        userCount: backupData.users.length,
        exportDate: backupData.exportDate
      };

    } catch (error) {
      console.error('백업 생성 오류:', error);
      throw new Error('백업 생성 중 오류가 발생했습니다.');
    }
  }

  // 내보내기 파일 목록 조회
  async getExportFiles() {
    try {
      const files = await fs.readdir(this.exportDir);
      const fileStats = await Promise.all(
        files.map(async (file) => {
          const filePath = path.join(this.exportDir, file);
          const stats = await fs.stat(filePath);
          return {
            fileName: file,
            filePath,
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime
          };
        })
      );

      return fileStats.sort((a, b) => b.modified - a.modified);
    } catch (error) {
      console.error('내보내기 파일 목록 조회 오류:', error);
      throw new Error('파일 목록 조회 중 오류가 발생했습니다.');
    }
  }

  // 파일 삭제
  async deleteExportFile(fileName) {
    try {
      const filePath = path.join(this.exportDir, fileName);
      await fs.unlink(filePath);
      return { success: true, message: '파일이 삭제되었습니다.' };
    } catch (error) {
      console.error('파일 삭제 오류:', error);
      throw new Error('파일 삭제 중 오류가 발생했습니다.');
    }
  }
}

module.exports = new DataExportService(); 