const mongoose = require('mongoose');

const pulseProfileSchema = new mongoose.Schema({
  name: {
    ko: { type: String, required: true },    // 한글 이름 (예: "침삽실삭")
    hanja: { type: String, required: true }  // 한자 이름 (예: "沈澁實數")
  },
  characteristics: {
    pvc: { type: String, required: true },  // 말초혈관수축도 (침/부)
    bv: { type: String, required: true },   // 혈액점도 (활/삽)
    sv: { type: String, required: true },   // 일회박출량 (실/허)
    hr: { type: String, required: true }    // 심박동수 (삭/지/평)
  },
  clinical: {
    causes: [String],           // 발생원인
    management: [String],       // 영향 및 관리
    diseases: [String],         // 나타날 수 있는 질환들
    organSymptoms: {           // 인체 기관별 나타날 수 있는 현상들
      type: Map,
      of: [String]
    }
  },
  reference: {
    document: String,          // 문서 이름
    pages: {
      start: Number,           // 시작 페이지
      end: Number             // 끝 페이지
    }
  }
}, {
  timestamps: true             // createdAt, updatedAt 자동 생성
});

// 맥상 조합으로 검색을 위한 인덱스
pulseProfileSchema.index({
  'characteristics.pvc': 1,
  'characteristics.bv': 1,
  'characteristics.sv': 1,
  'characteristics.hr': 1
});

module.exports = mongoose.model('PulseProfile', pulseProfileSchema); 