# Maekcord 백업 및 복구 가이드

## 📋 목차
1. [개요](#개요)
2. [백업 시스템](#백업-시스템)
3. [자동 백업](#자동-백업)
4. [수동 백업](#수동-백업)
5. [복구 절차](#복구-절차)
6. [모니터링](#모니터링)
7. [문제 해결](#문제-해결)

## 🎯 개요

Maekcord 시스템의 데이터베이스 백업 및 복구 절차를 설명합니다. 이 가이드는 시스템 관리자와 개발자가 안전하게 데이터를 보호하고 복구할 수 있도록 도와줍니다.

### 백업 정책
- **자동 백업**: 매일 새벽 2시
- **보관 기간**: 30일
- **백업 형식**: MongoDB Archive (.gz)
- **압축**: Gzip 압축 사용

## 🔄 백업 시스템

### 백업 위치
```
backend/backups/
├── maekcord-backup-2024-12-01T02-00-00.gz
├── maekcord-backup-2024-12-02T02-00-00.gz
├── backup-info.json
└── ...
```

### 백업 파일 명명 규칙
```
maekcord-backup-{YYYY-MM-DDTHH-mm-ss}.gz
```

### 백업 정보 파일
`backup-info.json` 파일에는 백업 히스토리가 저장됩니다:
```json
[
  {
    "fileName": "maekcord-backup-2024-12-01T02-00-00.gz",
    "fileSize": "15.2MB",
    "createdAt": "2024-12-01T02:00:00.000Z",
    "status": "completed"
  }
]
```

## ⏰ 자동 백업

### 스케줄 설정
- **시간**: 매일 새벽 2시 (KST)
- **크론 표현식**: `0 2 * * *`
- **타임존**: Asia/Seoul

### 자동 백업 프로세스
1. MongoDB 데이터베이스 전체 백업
2. Gzip 압축
3. 백업 정보 저장
4. 오래된 백업 파일 정리 (30일 이상)

### 백업 상태 확인
```bash
# API를 통한 상태 확인
curl -H "Authorization: Bearer {token}" \
  http://localhost:5000/api/backup/status

# 백업 목록 조회
curl -H "Authorization: Bearer {token}" \
  http://localhost:5000/api/backup/list
```

## 🛠️ 수동 백업

### API를 통한 수동 백업
```bash
curl -X POST \
  -H "Authorization: Bearer {token}" \
  http://localhost:5000/api/backup/create
```

### 명령줄을 통한 수동 백업
```bash
# 백업 디렉토리로 이동
cd backend

# 수동 백업 실행
node -e "
const backupManager = require('./scripts/backup');
backupManager.createBackup()
  .then(result => console.log('백업 완료:', result))
  .catch(error => console.error('백업 실패:', error));
"
```

### 백업 테스트
```bash
curl -X POST \
  -H "Authorization: Bearer {token}" \
  http://localhost:5000/api/backup/test
```

## 🔧 복구 절차

### 1. 복구 전 준비사항

#### 시스템 상태 확인
```bash
# 현재 시스템 상태 확인
curl -H "Authorization: Bearer {token}" \
  http://localhost:5000/api/v1/monitoring/status
```

#### 백업 파일 확인
```bash
# 사용 가능한 백업 목록 확인
curl -H "Authorization: Bearer {token}" \
  http://localhost:5000/api/backup/list
```

#### 서비스 중지
```bash
# 애플리케이션 서비스 중지
pm2 stop maekcord-backend
# 또는
npm run stop
```

### 2. 복구 실행

#### API를 통한 복구
```bash
curl -X POST \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"fileName": "maekcord-backup-2024-12-01T02-00-00.gz"}' \
  http://localhost:5000/api/backup/restore
```

#### 명령줄을 통한 복구
```bash
# MongoDB 서비스 중지 (선택사항)
sudo systemctl stop mongod

# 복구 실행
mongorestore --uri="mongodb://localhost:27017/maekcord" \
  --archive="backend/backups/maekcord-backup-2024-12-01T02-00-00.gz" \
  --gzip --drop

# MongoDB 서비스 재시작
sudo systemctl start mongod
```

### 3. 복구 후 검증

#### 데이터베이스 연결 확인
```bash
# MongoDB 연결 테스트
mongo --eval "db.adminCommand('ping')"
```

#### 애플리케이션 재시작
```bash
# 애플리케이션 재시작
pm2 start maekcord-backend
# 또는
npm start
```

#### 시스템 상태 확인
```bash
# 헬스 체크
curl http://localhost:5000/health

# API 상태 확인
curl -H "Authorization: Bearer {token}" \
  http://localhost:5000/api/v1/monitoring/status
```

## 📊 모니터링

### 백업 모니터링
- **백업 상태**: `/api/backup/status`
- **백업 목록**: `/api/backup/list`
- **백업 테스트**: `/api/backup/test`

### 시스템 모니터링
- **시스템 상태**: `/api/v1/monitoring/status`
- **성능 메트릭**: `/api/v1/monitoring/metrics`
- **로그 조회**: `/api/v1/monitoring/logs`
- **알림 조회**: `/api/v1/monitoring/alerts`

### 모니터링 대시보드
```bash
# Swagger UI를 통한 API 문서 확인
http://localhost:5000/api-docs
```

## 🚨 문제 해결

### 일반적인 문제들

#### 1. 백업 실패
**증상**: 백업 API 호출 시 오류 발생
**해결 방법**:
```bash
# MongoDB 연결 확인
mongo --eval "db.adminCommand('ping')"

# 디스크 공간 확인
df -h

# 백업 디렉토리 권한 확인
ls -la backend/backups/

# 수동 백업 테스트
node -e "
const backupManager = require('./scripts/backup');
backupManager.testBackup()
  .then(result => console.log('테스트 성공:', result))
  .catch(error => console.error('테스트 실패:', error));
"
```

#### 2. 복구 실패
**증상**: 복구 API 호출 시 오류 발생
**해결 방법**:
```bash
# 백업 파일 무결성 확인
file backend/backups/maekcord-backup-*.gz

# MongoDB 서비스 상태 확인
sudo systemctl status mongod

# 수동 복구 시도
mongorestore --uri="mongodb://localhost:27017/maekcord" \
  --archive="backend/backups/maekcord-backup-*.gz" \
  --gzip --dryRun
```

#### 3. 디스크 공간 부족
**증상**: 백업 생성 시 공간 부족 오류
**해결 방법**:
```bash
# 디스크 사용량 확인
df -h

# 오래된 백업 파일 정리
find backend/backups/ -name "*.gz" -mtime +30 -delete

# 로그 파일 정리
find backend/logs/ -name "*.log" -mtime +7 -delete
```

#### 4. 권한 문제
**증상**: 백업/복구 시 권한 오류
**해결 방법**:
```bash
# 백업 디렉토리 권한 설정
sudo chown -R $USER:$USER backend/backups/
chmod 755 backend/backups/

# MongoDB 권한 확인
sudo chown -R mongodb:mongodb /var/lib/mongodb/
```

### 로그 확인
```bash
# 애플리케이션 로그
tail -f backend/logs/combined-*.log

# 에러 로그
tail -f backend/logs/error-*.log

# 백업 관련 로그
grep -i backup backend/logs/combined-*.log
```

### 긴급 복구 절차

#### 1. 완전 복구 (최악의 경우)
```bash
# 1. 모든 서비스 중지
pm2 stop all
sudo systemctl stop mongod

# 2. 데이터베이스 완전 삭제
sudo rm -rf /var/lib/mongodb/*

# 3. MongoDB 재시작
sudo systemctl start mongod

# 4. 최신 백업으로 복구
mongorestore --uri="mongodb://localhost:27017/maekcord" \
  --archive="backend/backups/$(ls -t backend/backups/*.gz | head -1)" \
  --gzip --drop

# 5. 애플리케이션 재시작
pm2 start ecosystem.config.js
```

#### 2. 부분 복구 (특정 컬렉션만)
```bash
# 특정 컬렉션만 복구
mongorestore --uri="mongodb://localhost:27017/maekcord" \
  --archive="backend/backups/maekcord-backup-*.gz" \
  --gzip --nsFrom="maekcord.*" --nsTo="maekcord.*" \
  --nsInclude="maekcord.patients"
```

## 📞 지원

### 연락처
- **개발팀**: dev@maekcord.com
- **시스템 관리자**: admin@maekcord.com

### 문서
- [API 문서](http://localhost:5000/api-docs)
- [개발자 가이드](docs/DEVELOPER_GUIDE.md)
- [배포 가이드](docs/DEPLOYMENT_GUIDE.md)

### 모니터링 도구
- **PM2**: `pm2 monit`
- **MongoDB**: `mongo --eval "db.stats()"`
- **시스템**: `htop`, `iotop`, `nethogs`

---

**⚠️ 중요**: 복구 작업 전에는 반드시 현재 데이터의 백업을 생성하세요. 복구 과정에서 데이터 손실이 발생할 수 있습니다. 