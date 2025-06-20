const PulseProfile = require('../models/PulseProfile'); // Mongoose model 연결

exports.getPulseMapping = async (req, res) => {
  console.log('📥 요청 파라미터:', req.query);
  
  const { pvc, bv, sv, hr } = req.query;

  if (!pvc || !bv || !sv || !hr) {
    console.log('❌ 필수 파라미터 누락');
    return res.status(400).json({ 
      success: false, 
      message: '4개 매개변수가 모두 필요합니다.',
      description: {
        pvc: 'PVC(말초혈관 수축도): 부맥/중맥/침맥',
        bv: 'BV(혈액 점도/점탄도): 활맥/중맥/삽맥',
        sv: 'SV(일회박출량): 허맥/중맥/실맥',
        hr: 'HR(심박동수): 지맥/중맥/삭맥'
      },
      received: { pvc, bv, sv, hr }
    });
  }

  try {
    // "맥" 글자 제거
    const cleanPvc = pvc.replace(/맥$/, '');
    const cleanBv = bv.replace(/맥$/, '');
    const cleanSv = sv.replace(/맥$/, '');
    const cleanHr = hr.replace(/맥$/, '');

    // 각 파라미터 유효성 검증
    const validPvcTypes = ['부', '중', '침'];
    const validBvTypes = ['활', '중', '삽'];
    const validSvTypes = ['허', '중', '실'];
    const validHrTypes = ['지', '중', '삭'];

    if (!validPvcTypes.includes(cleanPvc)) {
      return res.status(400).json({
        success: false,
        message: 'PVC(말초혈관 수축도) 값이 잘못되었습니다.',
        validTypes: validPvcTypes.map(t => t + '맥'),
        received: pvc
      });
    }

    if (!validBvTypes.includes(cleanBv)) {
      return res.status(400).json({
        success: false,
        message: 'BV(혈액 점도/점탄도) 값이 잘못되었습니다.',
        validTypes: validBvTypes.map(t => t + '맥'),
        received: bv
      });
    }

    if (!validSvTypes.includes(cleanSv)) {
      return res.status(400).json({
        success: false,
        message: 'SV(일회박출량) 값이 잘못되었습니다.',
        validTypes: validSvTypes.map(t => t + '맥'),
        received: sv
      });
    }

    if (!validHrTypes.includes(cleanHr)) {
      return res.status(400).json({
        success: false,
        message: 'HR(심박동수) 값이 잘못되었습니다.',
        validTypes: validHrTypes.map(t => t + '맥'),
        received: hr
      });
    }

    const searchTypes = {
      pvcType: cleanPvc,
      bvType: cleanBv,
      svType: cleanSv,
      hrType: cleanHr
    };

    console.log('🔍 검색 조건:', searchTypes);

    // 전체 데이터 수 확인
    const totalCount = await PulseProfile.countDocuments();
    console.log(`📊 전체 맥상 프로파일 수: ${totalCount}`);

    const pulse = await PulseProfile.findOne(searchTypes);
    console.log('🔎 검색 결과:', pulse);

    if (!pulse) {
      // 유사한 맥상 찾기
      const similar = await PulseProfile.find({
        $or: [
          { pvcType: cleanPvc },
          { bvType: cleanBv },
          { svType: cleanSv },
          { hrType: cleanHr }
        ]
      });
      
      console.log(`💡 유사한 맥상 ${similar.length}개 발견`);
      
      return res.status(404).json({ 
        success: false, 
        message: '해당 맥상 조합을 찾을 수 없습니다.',
        searchParams: {
          pvc: { type: cleanPvc + '맥', category: '말초혈관 수축도' },
          bv: { type: cleanBv + '맥', category: '혈액 점도/점탄도' },
          sv: { type: cleanSv + '맥', category: '일회박출량' },
          hr: { type: cleanHr + '맥', category: '심박동수' }
        },
        similarProfiles: similar.map(p => ({
          pulseCode: p.pulseCode,
          matchingTypes: Object.entries(searchTypes)
            .filter(([key, value]) => p[key] === value)
            .map(([key]) => {
              const category = {
                pvcType: '말초혈관 수축도',
                bvType: '혈액 점도/점탄도',
                svType: '일회박출량',
                hrType: '심박동수'
              }[key];
              return { type: key, category };
            })
        }))
      });
    }

    return res.status(200).json({ 
      success: true, 
      data: {
        ...pulse.toObject(),
        parameters: {
          pvc: { type: cleanPvc + '맥', category: '말초혈관 수축도' },
          bv: { type: cleanBv + '맥', category: '혈액 점도/점탄도' },
          sv: { type: cleanSv + '맥', category: '일회박출량' },
          hr: { type: cleanHr + '맥', category: '심박동수' }
        }
      }
    });
  } catch (err) {
    console.error('🔴 맥상 매핑 오류:', err);
    return res.status(500).json({ 
      success: false, 
      message: '서버 오류가 발생했습니다.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
}; 