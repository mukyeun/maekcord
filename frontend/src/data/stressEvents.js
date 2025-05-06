export const 스트레스카테고리 = [
  {
    대분류: "개인적 사건",
    중분류: [
      { name: "배우자 사망", score: 100 },
      { name: "이혼", score: 73 },
      { name: "별거", score: 65 },
      { name: "가까운 가족 구성원의 사망", score: 63 },
      { name: "개인적 부상이나 질병", score: 53 }
    ]
  },
  {
    대분류: "직업 및 경제적 스트레스",
    중분류: [
      { name: "해고나 실직", score: 47 },
      { name: "직장에서의 큰 변화", score: 39 },
      { name: "경제적 어려움", score: 38 },
      { name: "은퇴", score: 45 }
    ]
  },
  {
    대분류: "가족 및 관계적 스트레스",
    중분류: [
      { name: "결혼", score: 50 },
      { name: "임신", score: 40 },
      { name: "가족 구성원의 건강 문제", score: 44 },
      { name: "자녀의 독립", score: 29 },
      { name: "배우자와의 갈등", score: 35 }
    ]
  },
  {
    대분류: "환경적 스트레스",
    중분류: [
      { name: "이사", score: 20 },
      { name: "새로운 직장으로의 이동", score: 36 },
      { name: "집 수리", score: 25 },
      { name: "기후 변화 적응", score: 15 }
    ]
  },
  {
    대분류: "긍정적 변화로 인한 스트레스",
    중분류: [
      { name: "승진", score: 39 },
      { name: "학업 졸업", score: 26 },
      { name: "새로운 사업 시작", score: 38 },
      { name: "휴가", score: 13 },
      { name: "명절이나 연휴", score: 12 }
    ]
  }
];

export const evaluateStressLevel = (totalScore) => {
  if (totalScore <= 150) {
    return {
      level: "낮음",
      description: "질병 발생 가능성이 낮음"
    };
  } else if (totalScore <= 299) {
    return {
      level: "중간",
      description: "질병 위험이 약간 증가"
    };
  } else {
    return {
      level: "높음",
      description: "질병 발생 가능성이 크게 증가"
    };
  }
}; 