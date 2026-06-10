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
