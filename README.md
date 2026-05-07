# 헬스케어 PWA (React)

## 로컬 실행

```bash
npm i
npm run dev
```

## 백엔드 API 연결

이 프론트는 `VITE_API_BASE_URL`을 기준으로 API를 호출합니다. (구현: `src/api/client.js`)

1) `.env.local` 생성(권장) 또는 `.env` 수정

```bash
VITE_API_BASE_URL=https://api.example.com
```

2) 개발 서버 재시작

```bash
npm run dev
```

## 포함된 기본 구성

- React + Vite + TypeScript
- Tailwind CSS
- React Router 기반 하단 탭 네비게이션 레이아웃
- `vite-plugin-pwa` 기반 PWA 등록(자동 업데이트)
