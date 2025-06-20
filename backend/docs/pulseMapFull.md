# 맥상 매핑 API (Full Version)

## 개요
맥상의 PVC, BV, SV, HR 값을 기반으로 완전한 맥상 정보를 조회하는 API입니다.

## 엔드포인트
`POST /api/pulse-map-full/map`

## 요청 형식
```json
{
  "pvc": string,  // 필수
  "bv": string,   // 필수
  "sv": string,   // 필수
  "hr": string    // 필수
}
```

### 유효한 값
- pvc: ["부", "침", "중"]
- bv: ["활", "삭", "지", "실"]
- sv: ["실", "허", "실허"]
- hr: ["삭", "지", "평"]

## 응답 형식

### 성공 (200 OK)
```json
{
  "success": true,
  "data": {
    "pulseCode": string,    // 맥상 코드 (예: "부활허지")
    "hanja": string,        // 한자 표기 (예: "浮滑虛遲")
    "reference": {
      "document": string,   // 참고 문헌
      "pages": {
        "start": number,    // 시작 페이지
        "end": number      // 종료 페이지
      }
    },
    "clinical": {
      "causes": string[],           // 원인 목록
      "management": string[],       // 관리 방법
      "diseases": string[],         // 관련 질병
      "organSymptoms": object      // 장부별 증상
    }
  }
}
```

### 실패
#### 잘못된 요청 (400 Bad Request)
```json
{
  "success": false,
  "message": string  // 오류 메시지
}
```

#### 맥상 정보 없음 (404 Not Found)
```json
{
  "success": false,
  "message": "일치하는 맥상을 찾을 수 없습니다."
}
```

#### 서버 오류 (500 Internal Server Error)
```json
{
  "success": false,
  "message": "서버 오류가 발생했습니다."
}
```

## 사용 예시
```javascript
// 요청
fetch('/api/pulse-map-full/map', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    pvc: "부",
    bv: "활",
    sv: "허",
    hr: "지"
  })
});

// 응답
{
  "success": true,
  "data": {
    "pulseCode": "부활허지",
    "hanja": "浮滑虛遲",
    "reference": {
      "document": "스마트맥진의 탄생 하편(상)",
      "pages": {
        "start": 21,
        "end": 24
      }
    },
    "clinical": {
      "causes": [],
      "management": [],
      "diseases": [],
      "organSymptoms": {}
    }
  }
}
``` 