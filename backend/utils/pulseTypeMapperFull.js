const PulseProfileFull = require('../models/PulseProfileFull');

async function mapPulseTypes(pvc, bv, sv, hr) {
  try {
    const matchedProfile = await PulseProfileFull.findOne({
      pvcType: pvc,
      bvType: bv,
      svType: sv,
      hrType: hr
    });

    if (!matchedProfile) {
      return {
        success: false,
        message: '일치하는 맥상을 찾을 수 없습니다.'
      };
    }

    return {
      success: true,
      data: {
        pulseCode: matchedProfile.pulseCode,
        hanja: matchedProfile.hanja,
        reference: matchedProfile.reference,
        clinical: matchedProfile.clinical
      }
    };
  } catch (error) {
    console.error('맥상 매핑 중 오류 발생:', error);
    return {
      success: false,
      message: '맥상 매핑 중 오류가 발생했습니다.'
    };
  }
}

module.exports = {
  mapPulseTypes
}; 