const validPulseTypes = {
  pvc: ['부', '침', '중'],
  bv: ['활', '삭', '지', '실'],
  sv: ['실', '허', '실허'],
  hr: ['삭', '지', '평']
};

function isValidPulseType(type, value) {
  if (!validPulseTypes[type]) {
    return false;
  }
  return validPulseTypes[type].includes(value);
}

function validatePulseTypes(pvc, bv, sv, hr) {
  const validations = [
    { type: 'pvc', value: pvc },
    { type: 'bv', value: bv },
    { type: 'sv', value: sv },
    { type: 'hr', value: hr }
  ];

  for (const validation of validations) {
    if (!isValidPulseType(validation.type, validation.value)) {
      return {
        isValid: false,
        message: `유효하지 않은 ${validation.type} 타입입니다: ${validation.value}`
      };
    }
  }

  return {
    isValid: true
  };
}

module.exports = {
  validatePulseTypes,
  validPulseTypes
}; 