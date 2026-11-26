"use client";

/**
 * Authentication state for the whole app (Part 2).
 *
 * Wrap the app in <AuthProvider> (done in app/layout.js), then in any
 * client component:
 *
 *   const { user, isAuthenticated, loading, login, register, logout } = useAuth();
 *
 * The JWT from the backend is stored in localStorage under "token", so the
 * user stays logged in after a page refresh. api.js reads it from there and
 * sends it as "Authorization: Bearer <token>" on every request.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import api from "@/api/api";

const TOKEN_KEY = "token";

const AuthContext = createContext(null);

/** True if a JWT's "exp" time has passed (or the token can't be read). */
export function isTokenExpired(token, now = Date.now()) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return typeof payload.exp === "number" && payload.exp * 1000 <= now;
  } catch {
    return true;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // the logged-in user from GET /auth/me
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true); // true until we've checked for a saved token

  // On first load, pick up a token saved earlier and check it's still valid.
  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      let savedToken = localStorage.getItem(TOKEN_KEY);
      // Security: don't even send an expired token to the server.
      if (savedToken && isTokenExpired(savedToken)) {
        localStorage.removeItem(TOKEN_KEY);
        savedToken = null;
      }
      if (savedToken) {
        try {
          const res = await api.get("/auth/me");
          if (!cancelled) {
            setToken(savedToken);
            setUser(res.data);
          }
        } catch {
          // Expired or invalid token: forget it.
          localStorage.removeItem(TOKEN_KEY);
        }
      }
      if (!cancelled) setLoading(false);
    }

    restoreSession();
    return () => {
      cancelled = true;
    };
  }, []);

  /** Log in with a username (or email) and password. Throws on failure. */
  const login = useCallback(async (usernameOrEmail, password) => {
    // The backend's /auth/login uses FastAPI's OAuth2 form, so it expects
    // form data with a "username" field (an email works there too), not JSON.
    const form = new URLSearchParams({ username: usernameOrEmail, password });
    // The Content-Type must be set here: api.js defaults every request to JSON.
    const res = await api.post("/auth/login", form, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    const newToken = res.data.access_token;
    localStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);

    const me = await api.get("/auth/me");
    setUser(me.data);
    return me.data;
  }, []);

  /** Create an account, then log straight in. Throws on failure. */
  const register = useCallback(
    async ({ username, email, password, display_name }) => {
      await api.post("/auth/register", {
        username,
        email,
        password,
        display_name: display_name || null,
      });
      return login(username, password);
    },
    [login]
  );

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem("activeTripId");
    setToken(null);
    setUser(null);
  }, []);

  // api.js fires "larp:logout" when the backend rejects our token (401),
  // so the whole app logs out instead of showing a half-logged-in state.
  useEffect(() => {
    const onForcedLogout = () => {
      setToken(null);
      setUser(null);
    };
    window.addEventListener("larp:logout", onForcedLogout);
    return () => window.removeEventListener("larp:logout", onForcedLogout);
  }, []);

  const value = useMemo(
    () => ({ user, token, loading, isAuthenticated: !!user, login, register, logout }),
    [user, token, loading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return context;
}
