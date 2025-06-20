const express = require('express');
const router = express.Router();
const PulseProfile = require('../models/PulseProfile');

// GET /api/pulse-map?pvc=침&hr=삭&bv=활&sv=실
router.get('/', async (req, res) => {
  const { pvc, hr, bv, sv } = req.query;
  
  if (!pvc || !hr || !bv || !sv) {
    return res.status(400).json({
      success: false,
      message: '모든 매개변수가 필요합니다.',
      required: {
        pvc: '말초혈관 수축도 (침/부)',
        hr: '심박동수 (삭/지/평)',
        bv: '혈액 점도 (활/삽)',
        sv: '일회박출량 (실/허)'
      },
      example: '/api/pulse-map?pvc=침&hr=삭&bv=활&sv=실'
    });
  }

  try {
    // 정확한 맥상 검색
    const query = {
      'characteristics.pvc': pvc,
      'characteristics.hr': hr,
      'characteristics.bv': bv,
      'characteristics.sv': sv
    };
    
    console.log('🔍 검색 조건:', query);

    const pulseProfile = await PulseProfile.findOne(query);
    
    if (!pulseProfile) {
      // 유사한 맥상 찾기 - 더 많은 결과를 가져와서 매칭 점수로 정렬
      const similarProfiles = await PulseProfile.find({
        $or: [
          { 'characteristics.pvc': pvc },
          { 'characteristics.hr': hr },
          { 'characteristics.bv': bv },
          { 'characteristics.sv': sv }
        ]
      }).limit(10);

      // 매칭 점수 계산
      const scoredProfiles = similarProfiles
        .map(profile => {
          const matchingCharacteristics = [];
          if (profile.characteristics.pvc === pvc) {
            matchingCharacteristics.push(`pvc(말초혈관 수축도): ${pvc}`);
          }
          if (profile.characteristics.hr === hr) {
            matchingCharacteristics.push(`hr(심박동수): ${hr}`);
          }
          if (profile.characteristics.bv === bv) {
            matchingCharacteristics.push(`bv(혈액 점도): ${bv}`);
          }
          if (profile.characteristics.sv === sv) {
            matchingCharacteristics.push(`sv(일회박출량): ${sv}`);
          }

          return {
            profile,
            matchingCharacteristics,
            matchingCount: matchingCharacteristics.length
          };
        })
        .sort((a, b) => b.matchingCount - a.matchingCount)
        .slice(0, 5);

      console.log('유사한 맥상 프로파일:', scoredProfiles.map(p => p.profile.name.ko));

      return res.status(404).json({
        success: false,
        message: '해당하는 맥상 프로파일을 찾을 수 없습니다.',
        searchQuery: { pvc, hr, bv, sv },
        suggestion: '유사한 맥상 프로파일:',
        similarProfiles: scoredProfiles.map(({ profile, matchingCharacteristics, matchingCount }) => ({
          name: {
            ko: profile.name.ko,
            hanja: profile.name.hanja
          },
          characteristics: profile.characteristics,
          matchingCharacteristics,
          matchingCount,
          clinical: profile.clinical,
          reference: profile.reference
        }))
      });
    }

    // 정확히 일치하는 맥상을 찾은 경우
    res.json({
      success: true,
      data: {
        name: pulseProfile.name,
        characteristics: pulseProfile.characteristics,
        clinical: pulseProfile.clinical,
        reference: pulseProfile.reference
      }
    });
  } catch (error) {
    console.error('맥상 프로파일 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
});

module.exports = router;