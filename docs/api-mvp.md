# ModuFlow MVP 백엔드 API 명세 (자세 인식 제외)

현재 프론트 구현 기준으로 **자세 인식/분석 기능을 제외한 MVP 범위**만 포함합니다.

- 포함: 인증, 루틴, 운동기록, 통계, 설정
- 날짜 포맷: `YYYY-MM-DD`, `YYYY-MM`
- 인증 헤더: `Authorization: Bearer <accessToken>`
- 공통 에러 응답: `{ "code": "...", "message": "..." }`

---

## 공통 에러 응답

모든 실패 응답은 아래 형식으로 통일합니다.

```json
{ "code": "STRING_CODE", "message": "사람이 읽을 수 있는 메시지" }
```

권장 에러 코드 예시:

- `AUTH_REQUIRED` (401): 토큰 없음/만료
- `FORBIDDEN` (403): 권한 없음
- `NOT_FOUND` (404): 리소스 없음
- `VALIDATION_ERROR` (422): 파라미터/바디 검증 실패
- `INTERNAL_ERROR` (500): 서버 오류

예시:

```json
{ "code": "VALIDATION_ERROR", "message": "month는 YYYY-MM 형식이어야 합니다." }
```

---

## 1) 인증 (Auth)

### 1-1. 회원가입

- 기능 설명: 이메일/비밀번호로 계정 생성 후 로그인 토큰 발급
- HTTP Method + URL: `POST /api/v1/auth/signup`
- Request
  - Body

```json
{ "email": "user@example.com", "password": "P@ssw0rd!" }
```

- Response (예시 JSON)

```json
{
  "accessToken": "eyJhbGciOi...",
  "user": { "id": "u_123", "email": "user@example.com", "name": "사용자" }
}
```

---

### 1-2. 로그인

- 기능 설명: 이메일/비밀번호로 로그인 토큰 발급
- HTTP Method + URL: `POST /api/v1/auth/login`
- Request
  - Body

```json
{ "email": "user@example.com", "password": "P@ssw0rd!" }
```

- Response (예시 JSON)

```json
{
  "accessToken": "eyJhbGciOi...",
  "user": { "id": "u_123", "email": "user@example.com", "name": "사용자" }
}
```

---

### 1-3. 내 정보 조회

- 기능 설명: 홈 상단 표시용 사용자 기본 정보 조회
- HTTP Method + URL: `GET /api/v1/me`
- Request (Body / Query)
  - Query: 없음
  - Body: 없음
- Response (예시 JSON)

```json
{ "id": "u_123", "email": "user@example.com", "name": "사용자" }
```

---

## 2) 루틴 (Routines)

루틴 데이터 구조(프론트가 바로 쓰기 좋게):

- 요일 키: `mon|tue|wed|thu|fri|sat|sun`
- 아이템: `{ id, name, sets, weight, exerciseId? }`
  - `sets`, `weight`: 숫자 또는 `null`
  - `exerciseId`: MVP에서는 선택(프론트는 `name` 기반으로도 동작 가능)

### 2-1. 요일별 루틴 전체 조회

- 기능 설명: 마이페이지 루틴/홈 “오늘 루틴”에서 사용할 요일별 루틴 전체 조회
- HTTP Method + URL: `GET /api/v1/routines`
- Request (Body / Query)
  - Query: 없음
  - Body: 없음
- Response (예시 JSON)

```json
{
  "mon": [
    { "id": "r_1", "name": "Bench Press", "sets": 4, "weight": 60, "exerciseId": "bench-press" }
  ],
  "wed": [
    { "id": "r_2", "name": "Pull Up", "sets": 4, "weight": 0, "exerciseId": "pullup" }
  ],
  "fri": [
    { "id": "r_3", "name": "Squat", "sets": 5, "weight": 80, "exerciseId": "squat" }
  ]
}
```

---

### 2-2. 요일별 루틴 저장(전체 덮어쓰기)

- 기능 설명: 프론트에서 루틴 추가/수정/삭제 후 “요일별 전체”를 저장(서버는 덮어쓰기)
- HTTP Method + URL: `PUT /api/v1/routines`
- Request
  - Body

```json
{
  "mon": [
    { "id": "r_1", "name": "Bench Press", "sets": 4, "weight": 60, "exerciseId": "bench-press" }
  ],
  "tue": [],
  "wed": [
    { "id": "r_2", "name": "Pull Up", "sets": 4, "weight": 0, "exerciseId": "pullup" }
  ],
  "thu": [],
  "fri": [
    { "id": "r_3", "name": "Squat", "sets": 5, "weight": 80, "exerciseId": "squat" }
  ],
  "sat": [],
  "sun": []
}
```

- Response (예시 JSON)

```json
{ "ok": true }
```

---

## 3) 운동기록 (Workouts)

기록 데이터 구조(Stats 기준):

- 날짜 단위 기록: `date`에 여러 운동 `items[]`
- item: `{ id, name, note?, sets, weight }`
  - `sets`, `weight`: 숫자 또는 `null`
  - `note`: 선택

### 3-1. 기간 내 운동기록 조회(캘린더 표시용)

- 기능 설명: `from~to` 기간 내 기록을 내려줘서 Stats 캘린더(마킹) + 날짜 클릭 목록에 사용
- HTTP Method + URL: `GET /api/v1/workouts`
- Request
  - Query
    - `from`: `YYYY-MM-DD`
    - `to`: `YYYY-MM-DD`
- Response (예시 JSON)

```json
{
  "workouts": [
    {
      "date": "2026-05-02",
      "items": [
        { "id": "w_1", "name": "스쿼트", "note": "하체", "sets": 4, "weight": 60 },
        { "id": "w_2", "name": "플랭크", "note": "코어", "sets": 3, "weight": 0 }
      ]
    },
    {
      "date": "2026-05-01",
      "items": [
        { "id": "w_3", "name": "푸쉬업", "note": "가슴 · 삼두", "sets": 3, "weight": 0 }
      ]
    }
  ]
}
```

---

### 3-2. 특정 날짜 운동기록 조회(선택)

- 기능 설명: Stats에서 특정 날짜 클릭 시 해당 날짜 데이터만 가져오는 방식이 필요하면 사용(3-1만으로도 MVP 구현 가능)
- HTTP Method + URL: `GET /api/v1/workouts/{date}`
- Request (Body / Query)
  - Path: `date` = `YYYY-MM-DD`
- Response (예시 JSON)

```json
{
  "date": "2026-05-02",
  "items": [
    { "id": "w_1", "name": "스쿼트", "note": "하체", "sets": 4, "weight": 60 }
  ]
}
```

---

### 3-3. 운동기록 저장(날짜 단위, 덮어쓰기)

- 기능 설명: 운동 수행 완료 후 해당 날짜의 운동기록을 저장(서버는 해당 날짜를 덮어쓰기)
- HTTP Method + URL: `PUT /api/v1/workouts/{date}`
- Request
  - Path: `date` = `YYYY-MM-DD`
  - Body

```json
{
  "items": [
    { "id": "w_1", "name": "스쿼트", "note": "하체", "sets": 4, "weight": 60 },
    { "id": "w_2", "name": "플랭크", "note": "코어", "sets": 3, "weight": 0 }
  ]
}
```

- Response (예시 JSON)

```json
{ "ok": true }
```

---

### 3-4. 운동기록 아이템 수정(Stats 모달 “수정/저장”)

- 기능 설명: 특정 날짜의 특정 운동 item의 `sets/weight`를 수정
- HTTP Method + URL: `PATCH /api/v1/workouts/{date}/items/{itemId}`
- Request
  - Path
    - `date`: `YYYY-MM-DD`
    - `itemId`: 문자열
  - Body (`sets`, `weight`는 숫자 또는 `null`)

```json
{ "sets": 5, "weight": 62.5 }
```

- Response (예시 JSON)

```json
{
  "date": "2026-05-02",
  "item": { "id": "w_1", "name": "스쿼트", "note": "하체", "sets": 5, "weight": 62.5 }
}
```

---

### 3-5. 운동기록 아이템 삭제(Stats 모달 “삭제”)

- 기능 설명: 특정 날짜의 특정 운동 item 삭제(삭제 후 items가 0개면 날짜 기록은 비워지거나 삭제 처리)
- HTTP Method + URL: `DELETE /api/v1/workouts/{date}/items/{itemId}`
- Request (Body / Query)
  - Path
    - `date`: `YYYY-MM-DD`
    - `itemId`: 문자열
- Response (예시 JSON)

```json
{ "ok": true }
```

---

## 4) 통계 (Stats)

> 자세 정확도/추이 관련은 **MVP에서 제외**합니다.

### 4-1. 월간 요약 통계(출석률 중심)

- 기능 설명: `month`에 대해 월간 출석률(=해당 월 운동기록이 있는 날짜 수 / 월 전체 일수)을 계산해 내려줌
- HTTP Method + URL: `GET /api/v1/stats/monthly-summary`
- Request
  - Query
    - `month`: `YYYY-MM`
- Response (예시 JSON)

```json
{
  "month": "2026-05",
  "attendanceRate": 26,
  "workoutDays": 8,
  "totalDaysInMonth": 31
}
```

---

### 4-2. 월간 운동일 목록(캘린더 마킹 최적화용, 선택)

- 기능 설명: 캘린더에 “기록 있는 날”만 빠르게 표시하고 싶을 때 사용(3-1로도 대체 가능)
- HTTP Method + URL: `GET /api/v1/stats/workout-days`
- Request
  - Query
    - `month`: `YYYY-MM`
- Response (예시 JSON)

```json
{
  "month": "2026-05",
  "days": ["2026-05-01", "2026-05-02", "2026-05-05"]
}
```

---

## 5) 설정 (Settings)

### 5-1. 사용자 설정 조회

- 기능 설명: 홈 화면의 자동출석 토글 상태 로딩
- HTTP Method + URL: `GET /api/v1/settings`
- Request (Body / Query)
  - Query: 없음
  - Body: 없음
- Response (예시 JSON)

```json
{ "autoAttendanceEnabled": true }
```

---

### 5-2. 사용자 설정 저장

- 기능 설명: 홈 화면의 자동출석 토글 저장
- HTTP Method + URL: `PUT /api/v1/settings`
- Request
  - Body

```json
{ "autoAttendanceEnabled": false }
```

- Response (예시 JSON)

```json
{ "ok": true }
```

