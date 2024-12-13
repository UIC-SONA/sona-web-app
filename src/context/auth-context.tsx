import {createContext, useCallback, useEffect, useMemo, useState, type PropsWithChildren} from 'react';
import {jwtDecode} from 'jwt-decode';
import {login, logout, refresh} from "@/services/auth-service.ts";
import {dispatchAxiosError, ErrorTitle} from "@/lib/errors.ts";

// Constants
const ACCESS_TOKEN_KEY = 'access_token';

// Types
export interface AccessToken {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  token_type: string;
  scope: string;
}

export interface AuthContextData {
  accessToken: AccessToken | null;
  error: ErrorTitle | null;
  loginUser: (username: string, password: string) => Promise<void>;
  logoutUser: () => Promise<void>;
  refreshToken: () => Promise<void>;
  initializing: boolean;  // Renombrado de 'loading' a 'initializing' para mayor claridad
}


// eslint-disable-next-line react-refresh/only-export-components
export function getStoredToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextData | undefined>(undefined);


export default function AuthProvider({children}: Readonly<PropsWithChildren>) {
  const [accessToken, setAccessToken] = useState<AccessToken | null>(null);
  const [error, setError] = useState<ErrorTitle | null>(null);
  const [initializing, setInitializing] = useState(true);

  const isTokenExpired = useCallback((token: AccessToken): boolean => {
    try {
      const decoded = jwtDecode(token.access_token);
      const expiration = (decoded.exp as number) * 1000;
      return expiration < Date.now();
    } catch {
      return true;
    }
  }, []);

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = getStoredToken();

      if (storedToken) {
        try {
          const parsedToken = JSON.parse(storedToken) as AccessToken;
          if (!isTokenExpired(parsedToken)) {
            setAccessToken(parsedToken);
          } else if (parsedToken.refresh_token) {
            const refreshedToken = await refresh(parsedToken);
            setAccessToken(refreshedToken);
            localStorage.setItem(ACCESS_TOKEN_KEY, JSON.stringify(refreshedToken));
          } else {
            localStorage.removeItem(ACCESS_TOKEN_KEY);
          }
        } catch (error) {
          localStorage.removeItem(ACCESS_TOKEN_KEY);
          dispatchAxiosError(error, setError);
        }
      }

      setInitializing(false);
    };

    initializeAuth().then();
  }, [isTokenExpired]);

  const loginUser = async (username: string, password: string) => {
    const token = await login(username, password);
    setAccessToken(token);
    localStorage.setItem(ACCESS_TOKEN_KEY, JSON.stringify(token));
  };

  const logoutUser = useCallback(async () => {
    try {
      if (accessToken) {
        await logout(accessToken);
      }
    } catch (error) {
      console.error('Error logging out:', error);
    } finally {
      setAccessToken(null);
      localStorage.removeItem(ACCESS_TOKEN_KEY);
    }
  }, [accessToken]);

  const refreshToken = useCallback(async () => {
    if (!accessToken?.refresh_token) return;

    try {
      const refreshedToken = await refresh(accessToken);
      setAccessToken(refreshedToken);
      localStorage.setItem(ACCESS_TOKEN_KEY, JSON.stringify(refreshedToken));
    } catch (error) {
      console.error('Error refreshing token:', error);
      setAccessToken(null);
      localStorage.removeItem(ACCESS_TOKEN_KEY);
    }
  }, [accessToken]);

  const value = useMemo(() => ({
    accessToken,
    loginUser,
    logoutUser,
    refreshToken,
    initializing,
    error,
  }), [accessToken, error, initializing, logoutUser, refreshToken]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}