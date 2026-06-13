// Axios 요청 헤더의 기존 인증 값을 제거하고 현재 계정의 Bearer 토큰 하나만 설정한다.
export function replaceAuthorizationHeader(headers = {}, token, skipAuth = false) {
  if (typeof headers.delete === "function") {
    headers.delete("Authorization");
  } else {
    delete headers.Authorization;
    delete headers.authorization;
  }

  if (!skipAuth && token) {
    if (typeof headers.set === "function") {
      headers.set("Authorization", `Bearer ${token}`);
    } else {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  return headers;
}
