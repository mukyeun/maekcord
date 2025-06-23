const fs = require('fs');
const path = require('path');

// 81맥상 목록 (한의학 맥상 분류 기준)
const pulseTypes = [
  // 부맥 계열 (1-20)
  "부삭활실맥", "부활삭맥", "부실삭맥", "부삭지맥", "부활지맥", 
  "부실지맥", "부삭허맥", "부활허맥", "부실허맥", "부지허맥",
  "부삭활허맥", "부삭실허맥", "부활실허맥", "부삭지허맥", "부활지허맥",
  "부실지허맥", "부삭활실지맥", "부삭활실허맥", "부삭활지허맥", "부삭실지허맥",
  
  // 침맥 계열 (21-40)
  "침삭활실맥", "침활삭맥", "침실삭맥", "침삭지맥", "침활지맥",
  "침실지맥", "침삭허맥", "침활허맥", "침실허맥", "침지허맥",
  "침삭활허맥", "침삭실허맥", "침활실허맥", "침삭지허맥", "침활지허맥",
  "침실지허맥", "침삭활실지맥", "침삭활실허맥", "침삭활지허맥", "침삭실지허맥",
  
  // 현맥 계열 (41-60)
  "현삭활실맥", "현활삭맥", "현실삭맥", "현삭지맥", "현활지맥",
  "현실지맥", "현삭허맥", "현활허맥", "현실허맥", "현지허맥",
  "현삭활허맥", "현삭실허맥", "현활실허맥", "현삭지허맥", "현활지허맥",
  "현실지허맥", "현삭활실지맥", "현삭활실허맥", "현삭활지허맥", "현삭실지허맥",
  
  // 완맥 계열 (61-81)
  "완삭활실맥", "완활삭맥", "완실삭맥", "완삭지맥", "완활지맥",
  "완실지맥", "완삭허맥", "완활허맥", "완실허마", "완지허맥",
  "완삭활허맥", "완삭실허맥", "완활실허맥", "완삭지허맥", "완활지허맥",
  "완실지허맥", "완삭활실지맥", "완삭활실허맥", "완삭활지허맥", "완삭실지허맥",
  "완활실지허맥"
];

// 한자명 매핑 (일부 예시)
const hanjaMapping = {
  "부삭활실맥": "浮數滑實脈",
  "부활삭맥": "浮滑數脈",
  "침삭활실맥": "沈數滑實脈",
  "현삭활실맥": "弦數滑實脈",
  "완삭활실맥": "緩數滑實脈"
  // 나머지는 빈 문자열로 시작
};

// JSON 템플릿 생성 함수
function generatePulseTemplate(pulseType, index) {
  const hanja = hanjaMapping[pulseType] || "";
  
  return {
    "pulseType": pulseType,
    "hanja": hanja,
    "physiology": {
      "PVC": "",
      "BV": "",
      "SV": "",
      "HR": ""
    },
    "origin": [],
    "effects": [],
    "relatedDiseases": [],
    "systemicImpacts": {
      "cardiovascular": [],
      "respiratory": [],
      "renal": [],
      "musculoskeletal": [],
      "dermatologic": [],
      "ophthalmologic": [],
      "gastrointestinal": [],
      "neurological": []
    },
    "notes": "",
    "references": []
  };
}

// 템플릿 디렉토리 생성
const templateDir = './pulse_templates';
if (!fs.existsSync(templateDir)) {
  fs.mkdirSync(templateDir);
}

// 81개 JSON 파일 생성
pulseTypes.forEach((pulseType, index) => {
  const template = generatePulseTemplate(pulseType, index + 1);
  const filename = `pulse_${String(index + 1).padStart(3, '0')}_${pulseType}.json`;
  const filepath = path.join(templateDir, filename);
  
  fs.writeFileSync(filepath, JSON.stringify(template, null, 2), 'utf8');
  console.log(`✅ 생성됨: ${filename}`);
});

// 통합 JSON 파일도 생성
const allPulses = pulseTypes.map((pulseType, index) => {
  return {
    id: index + 1,
    ...generatePulseTemplate(pulseType, index + 1)
  };
});

fs.writeFileSync(
  path.join(templateDir, 'all_pulses.json'), 
  JSON.stringify(allPulses, null, 2), 
  'utf8'
);

console.log(`\n🎉 완료! 총 ${pulseTypes.length}개의 맥상 템플릿이 생성되었습니다.`);
console.log(`📁 위치: ${templateDir}/`);
console.log(`📄 개별 파일: pulse_001.json ~ pulse_081.json`);
console.log(`📄 통합 파일: all_pulses.json`); 