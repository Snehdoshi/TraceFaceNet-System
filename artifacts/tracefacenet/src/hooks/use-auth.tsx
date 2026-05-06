import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type AuthContextValue = {
  loading: boolean;
  isAuthenticated: boolean;
  username: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, password: string) => Promise<boolean>;
  requestPasswordReset: (username: string) => Promise<string | null>;
  resetPassword: (username: string, resetToken: string, newPassword: string) => Promise<boolean>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function parseResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return (await response.json()) as T;
  }
  return (await response.text()) as T;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadSession = async () => {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "include",
        });

        if (!response.ok) {
          if (!cancelled) setUsername(null);
          return;
        }

        const data = (await parseResponse<{ username?: string }>(response)) || {};
        if (!cancelled) setUsername(data.username?.trim() || null);
      } catch {
        if (!cancelled) setUsername(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadSession();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (nextUsername: string, password: string) => {
    const cleanUsername = nextUsername.trim();
    const cleanPassword = password.trim();

    if (!cleanUsername || !cleanPassword) return false;

    const response = await fetch("/api/auth/login", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username: cleanUsername, password: cleanPassword }),
    });

    if (!response.ok) return false;

    const data = await parseResponse<{ username?: string }>(response);
    setUsername(data.username?.trim() || cleanUsername);
    return true;
  };

  const register = async (nextUsername: string, password: string) => {
    const cleanUsername = nextUsername.trim();
    const cleanPassword = password.trim();

    if (!cleanUsername || !cleanPassword) return false;

    const response = await fetch("/api/auth/register", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username: cleanUsername, password: cleanPassword }),
    });

    if (!response.ok) return false;

    const data = await parseResponse<{ username?: string }>(response);
    setUsername(data.username?.trim() || cleanUsername);
    return true;
  };

  const requestPasswordReset = async (nextUsername: string) => {
    const cleanUsername = nextUsername.trim();
    if (!cleanUsername) return null;

    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username: cleanUsername }),
    });

    if (!response.ok) return null;

    const data = await parseResponse<{ resetToken?: string }>(response);
    return data.resetToken ?? null;
  };

  const resetPassword = async (nextUsername: string, resetToken: string, newPassword: string) => {
    const cleanUsername = nextUsername.trim();
    const cleanToken = resetToken.trim();
    const cleanPassword = newPassword.trim();

    if (!cleanUsername || !cleanToken || !cleanPassword) return false;

    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username: cleanUsername, resetToken: cleanToken, newPassword: cleanPassword }),
    });

    return response.ok;
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } finally {
      // Always clear local state even if the request fails; the session cookie may
      // already be expired or the server may be temporarily unavailable.
      setUsername(null);
    }
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      loading,
      isAuthenticated: Boolean(username),
      username,
      login,
      register,
      requestPasswordReset,
      resetPassword,
      logout,
    }),
    [loading, username],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
