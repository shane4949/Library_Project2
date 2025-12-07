import { jwtDecode } from 'jwt-decode';

const TOKEN_KEY = "token";
const EMAIL_KEY = "authEmail";

export function setAuth(token, email) {
  localStorage.setItem(TOKEN_KEY, token);
  if (email) localStorage.setItem(EMAIL_KEY, email);
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EMAIL_KEY);
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || null;
}

export function getEmail() {
  return localStorage.getItem(EMAIL_KEY) || null;
}

export function parseToken() {
  const token = getToken();
  if (!token) return null;
  try {
    return jwtDecode(token); // returns { userId, role, exp, iat }
  } catch {
    return null;
  }
}
