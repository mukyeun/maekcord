const express = require('express');
const router = express.Router();
const PulseProfile = require('../models/PulseProfile');
const fs = require('fs');
const path = require('path');

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

// GET /api/pulse-map/profile/:name
router.get('/profile/:name', (req, res) => {
  const { name } = req.params;
  
  try {
    // backend/data/pulseProfiles.json 파일 사용
    const filePath = path.join(__dirname, '..', 'data', 'pulseProfiles.json');
    const rawData = fs.readFileSync(filePath, 'utf8');
    const pulseData = JSON.parse(rawData);
    
    // 1. 정확한 맥상명으로 찾기
    let profile = pulseData.find(p => p.pulseCode === name);

    // 2. 정확히 일치하지 않으면 유사한 맥상 찾기
    if (!profile) {
      // 입력된 맥상명에서 각 맥상 타입 추출 (예: '부허맥' -> ['부', '허'])
      const inputTypes = name.replace(/맥$/, '').split('');
      
      // 각 맥상 프로파일과 매칭 점수 계산
      const scoredProfiles = pulseData.map(p => {
        const profileTypes = p.pulseCode.replace(/맥$/, '').split('');
        let matchScore = 0;
        let matchingTypes = [];
        
        // 각 입력 타입이 프로파일에 포함되는지 확인
        inputTypes.forEach(inputType => {
          if (profileTypes.includes(inputType)) {
            matchScore++;
            matchingTypes.push(inputType);
          }
        });
        
        // 매칭 점수 계산 개선
        const inputLength = inputTypes.length;
        const profileLength = profileTypes.length;
        const matchRatio = matchScore / inputLength; // 입력된 맥상명에 대한 매칭 비율
        const lengthDifference = Math.abs(profileLength - inputLength); // 길이 차이
        
        // 새로운 점수 계산 방식:
        // 1. 매칭 비율이 높을수록 높은 점수 (0-10점)
        // 2. 길이 차이가 적을수록 높은 점수 (0-5점 보너스)
        // 3. 입력 길이와 프로파일 길이가 같으면 추가 보너스 (2점)
        const ratioScore = matchRatio * 10;
        const lengthBonus = Math.max(0, 5 - lengthDifference);
        const exactLengthBonus = (inputLength === profileLength) ? 2 : 0;
        
        const finalScore = ratioScore + lengthBonus + exactLengthBonus;
        
        return {
          profile: p,
          matchScore: finalScore,
          matchingTypes,
          profileTypes,
          matchRatio,
          lengthDifference,
          ratioScore,
          lengthBonus,
          exactLengthBonus
        };
      });
      
      // 매칭 점수로 정렬하고 가장 높은 점수의 맥상 선택
      scoredProfiles.sort((a, b) => b.matchScore - a.matchScore);
      
      if (scoredProfiles.length > 0 && scoredProfiles[0].matchScore > 0) {
        profile = scoredProfiles[0].profile;
        console.log(`🔍 유사한 맥상 찾음: ${name} -> ${profile.pulseCode}`);
        console.log(`   매칭점수: ${scoredProfiles[0].matchScore.toFixed(2)}`);
        console.log(`   매칭비율: ${scoredProfiles[0].matchRatio.toFixed(2)}`);
        console.log(`   길이차이: ${scoredProfiles[0].lengthDifference}`);
        console.log(`   매칭타입: ${scoredProfiles[0].matchingTypes.join(', ')}`);
      }
    }

    if (profile) {
      // 현재 JSON 구조를 프론트엔드에서 기대하는 구조로 변환
      const transformedProfile = {
        name: {
          ko: profile.pulseCode,
          hanja: profile.pulseCode // 현재 JSON에는 한자가 없으므로 pulseCode 사용
        },
        clinical: {
          causes: [profile.description || '정보 없음'],
          diseases: [profile.precaution || '정보 없음'],
          management: profile.recommendations || ['정보 없음'],
          organSymptoms: {
            liver: ['정보 없음'],
            heart: ['정보 없음'],
            spleen: ['정보 없음'],
            lung: ['정보 없음'],
            kidney: ['정보 없음']
          }
        },
        reference: {
          document: '스마트맥진의 탄생',
          pages: {
            start: 1,
            end: 1
          }
        },
        // 추가 정보 제공
        characteristics: {
          pvc: profile.pvcType,
          bv: profile.bvType,
          sv: profile.svType,
          hr: profile.hrType
        }
      };
      
      res.json({ success: true, data: transformedProfile });
    } else {
      res.status(404).json({ 
        success: false, 
        message: `'${name}'에 해당하는 맥상 정보를 찾을 수 없습니다.`,
        availablePulses: pulseData.slice(0, 10).map(p => p.pulseCode) // 처음 10개 맥상명 제공
      });
    }
  } catch (error) {
    console.error('맥상 프로파일 JSON 파일 처리 오류:', error);
    res.status(500).json({ 
      success: false, 
      message: '서버에서 맥상 정보를 처리하는 중 오류가 발생했습니다.',
      error: error.message 
    });
  }
});

module.exports = router;