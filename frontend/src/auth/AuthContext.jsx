import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "@/api";
import { setAuth, clearAuth, parseToken, getEmail } from "./auth";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({ children }) {
  const [tokenPayload, setTokenPayload] = useState(() => parseToken());
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const payload = parseToken();
    setTokenPayload(payload);
    if (payload) {
      const fallbackEmail = getEmail();
      setProfile({ name: null, email: fallbackEmail, role: payload.role });
    } else {
      setProfile(null);
    }
  }, []);

  const isAuthenticated = !!tokenPayload;
  const role = tokenPayload?.role ?? null;
  const isAdmin = role === "admin";

const login = async ({ email, password }) => {
  const res = await api.post("/auth/login", { email, password });
  const token = res.data.token;

  // Store token and email
  setAuth(token, email);

  // Decode JWT to extract role
  const payload = parseToken();
  setTokenPayload(payload);

  // Set profile for display
  const role = payload.role;
  const name = res.data.user?.name ?? null;
  setProfile({ name, email, role });

  // 👇 Return role so we can redirect accordingly
  return role;
};

  const logout = () => {
    clearAuth();
    setTokenPayload(null);
    setProfile(null);
  };

  const value = useMemo(
    () => ({ isAuthenticated, isAdmin, role, profile, login, logout }),
    [isAuthenticated, isAdmin, role, profile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
