const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
require('moment/locale/ko');
moment.locale('ko');

class ReportGenerator {
  constructor(data) {
    this.data = data;
    this.doc = new PDFDocument({
      size: 'A4',
      margin: 50
    });
  }

  async generate(outputPath) {
    try {
      // 스트림 생성
      const stream = fs.createWriteStream(outputPath);
      this.doc.pipe(stream);

      // 보고서 헤더
      this.generateHeader();
      
      // 환자 정보
      this.generatePatientInfo();
      
      // 맥상 정보
      this.generatePulseInfo();
      
      // 임상 정보
      this.generateClinicalInfo();
      
      // 참고 문헌
      this.generateReference();
      
      // 보고서 푸터
      this.generateFooter();

      // PDF 생성 완료
      this.doc.end();

      return new Promise((resolve, reject) => {
        stream.on('finish', () => resolve(outputPath));
        stream.on('error', reject);
      });
    } catch (error) {
      throw new Error(`PDF 생성 중 오류 발생: ${error.message}`);
    }
  }

  generateHeader() {
    this.doc
      .fontSize(20)
      .text('맥진 진단 보고서', {
        align: 'center'
      })
      .moveDown(2);
  }

  generatePatientInfo() {
    const { patientInfo } = this.data;
    const measurementDate = moment(patientInfo.measurementDate).format('YYYY년 MM월 DD일 HH:mm');

    this.doc
      .fontSize(12)
      .text('환자 정보', { underline: true })
      .moveDown(0.5)
      .text(`이름: ${patientInfo.name}`)
      .text(`나이: ${patientInfo.age}세`)
      .text(`성별: ${patientInfo.gender}`)
      .text(`측정일시: ${measurementDate}`)
      .moveDown(2);
  }

  generatePulseInfo() {
    const { pulseData } = this.data;

    this.doc
      .fontSize(12)
      .text('맥상 정보', { underline: true })
      .moveDown(0.5)
      .text(`진단된 맥상: ${pulseData.pulseCode} (${pulseData.hanja})`)
      .text(`맥위치(PVC): ${pulseData.pvcType}`)
      .text(`맥박용적(BV): ${pulseData.bvType}`)
      .text(`맥박강도(SV): ${pulseData.svType}`)
      .text(`맥박수(HR): ${pulseData.hrType}`)
      .moveDown(2);
  }

  generateClinicalInfo() {
    const { clinical } = this.data.pulseData;

    this.doc
      .fontSize(12)
      .text('임상 정보', { underline: true })
      .moveDown(0.5);

    if (clinical.causes.length > 0) {
      this.doc
        .text('추정 원인:')
        .list(clinical.causes)
        .moveDown(0.5);
    }

    if (clinical.diseases.length > 0) {
      this.doc
        .text('관련 질병:')
        .list(clinical.diseases)
        .moveDown(0.5);
    }

    if (clinical.management.length > 0) {
      this.doc
        .text('관리 방안:')
        .list(clinical.management)
        .moveDown(0.5);
    }

    if (Object.keys(clinical.organSymptoms).length > 0) {
      this.doc
        .text('장부별 증상:');
      
      Object.entries(clinical.organSymptoms).forEach(([organ, symptom]) => {
        this.doc.text(`  - ${organ}: ${symptom}`);
      });
    }

    this.doc.moveDown(2);
  }

  generateReference() {
    const { reference } = this.data.pulseData;

    this.doc
      .fontSize(12)
      .text('참고 문헌', { underline: true })
      .moveDown(0.5)
      .text(`${reference.document}, ${reference.pages.start}~${reference.pages.end}쪽`)
      .moveDown(2);
  }

  generateFooter() {
    this.doc
      .fontSize(10)
      .text(
        `생성일시: ${moment().format('YYYY년 MM월 DD일 HH:mm:ss')}`,
        50,
        this.doc.page.height - 50,
        { align: 'center' }
      );
  }
}

module.exports = ReportGenerator; 