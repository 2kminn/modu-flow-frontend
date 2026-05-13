# Social Login Backend Contract

프론트는 소셜 로그인 버튼과 성공 콜백 처리를 준비해 둔 상태입니다.
백엔드는 아래 계약에 맞춰 OAuth 처리를 완료해 주면 됩니다.

## Frontend Routes

- 로그인 화면: `/login`
- 소셜 로그인 성공 콜백: `/oauth/callback`

## Frontend Starts Login

프론트는 아래 URL로 브라우저를 이동시킵니다.

```text
{VITE_API_BASE_URL}/oauth2/authorization/{provider}
```

지원 provider:

- `google`
- `kakao`
- `naver`

예시:

```text
https://api.example.com/oauth2/authorization/google
```

## Backend Responsibilities

1. provider별 OAuth 앱 설정
2. provider callback 처리
3. provider access token으로 사용자 정보 조회
4. DB에서 회원 조회 또는 생성
5. 우리 서비스용 JWT access token 발급
6. 로그인 성공 후 프론트로 redirect

## Success Redirect

로그인 성공 시 백엔드는 프론트로 redirect 해 주세요.

```text
https://frontend.example.com/oauth/callback?accessToken={JWT}
```

프론트는 `accessToken`, `token`, `access_token` 중 하나를 읽을 수 있습니다.
권장 이름은 `accessToken`입니다.

선택으로 특정 경로 이동이 필요하면 `redirect`를 붙일 수 있습니다.

```text
https://frontend.example.com/oauth/callback?accessToken={JWT}&redirect=/mypage
```

## Failure Redirect

로그인 실패 시:

```text
https://frontend.example.com/oauth/callback?error={message}
```

## Token Rule

- 프론트는 받은 access token을 `sessionStorage`의 `auth_token`에 저장합니다.
- 이후 API 요청에는 `Authorization: Bearer {token}` 헤더가 자동으로 붙습니다.
- refresh token을 쓴다면 백엔드가 HttpOnly Secure Cookie로 관리하는 방식을 권장합니다.

## CORS / Cookie

- 프론트 origin을 CORS 허용 목록에 추가해 주세요.
- refresh token cookie를 쓸 경우 `SameSite=None; Secure; HttpOnly` 설정이 필요합니다.

## Local Development Example

프론트 `.env.local`:

```text
VITE_API_BASE_URL=http://localhost:8080
```

백엔드 성공 redirect:

```text
http://localhost:5173/oauth/callback?accessToken={JWT}
```
