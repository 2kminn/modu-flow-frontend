# Android(비콘/자세인식) ↔ 프론트 연결 가이드

이 프로젝트(React/Vite 프론트)는 “백그라운드 서비스에서 만든 이벤트”를 **웹 UI에 표시**하려면 중간 다리(브릿지)가 필요합니다.
권장 패턴은 아래 2가지 중 하나입니다.

## 백엔드 API 주소 연결(공통)
이 프론트는 `VITE_API_BASE_URL` 환경변수를 `src/api/client.js`에서 읽어서 `axios baseURL`로 사용합니다.

1) `.env.local`(권장) 또는 `.env`에 백엔드 주소 설정
```bash
VITE_API_BASE_URL=https://api.example.com
```

2) 개발 서버 재시작 (`npm run dev`)

참고:
- 주소는 `https://api.example.com`처럼 “오리진” 형태로 넣으면 됩니다(마지막 `/`는 있어도 자동 제거됨).
- 인증이 필요한 API면, 프론트는 `src/api/client.js`에서 토큰이 있으면 `Authorization: Bearer <token>`을 자동으로 붙입니다.

## 1) 권장: 서버(백엔드) 경유
1. Android 앱(비콘 감지/자세 인식)이 서버로 이벤트 전송(HTTPS)
2. 프론트는 서버에서 상태 조회(REST) + 실시간 구독(WebSocket/SSE)

장점: 여러 기기/여러 사용자 집계(혼잡도), 로그/분석, 보안/권한관리까지 자연스럽게 처리 가능.

## 2) 빠른 연결: Android WebView + JS 이벤트 브릿지
Android 앱에서 이 프론트를 WebView로 띄우는 경우, Android가 WebView에 “출석/혼잡도/자세 인식” 이벤트를 **직접 push**할 수 있습니다.

### 프론트에서 듣는 이벤트
- 이벤트 이름: `moduflow:native-event`
- 전송 방식: `window.dispatchEvent(new CustomEvent("moduflow:native-event", { detail }))`
- 구현 위치: `src/native/nativeEvents.js`
- 데모 화면: `/mypage/attendance` (`src/pages/mypage/Attendance.jsx`)

### detail 예시
```js
// 출석(비콘)
{
  type: "attendance",
  checkedIn: true,
  gymId: "gym_123",
  occurredAt: "2026-05-07T10:12:30Z",
  source: "beacon"
}

// 혼잡도(집계 결과)
{
  type: "congestion",
  gymId: "gym_123",
  percent: 72,
  count: 38,
  occurredAt: "2026-05-07T10:12:30Z"
}
```

### Android(WebView)에서 JS 실행(개념)
Android 측에서 이벤트를 보낼 때는 WebView에서 JS를 평가(evaluateJavascript)해서 위 CustomEvent를 dispatch하면 됩니다.

