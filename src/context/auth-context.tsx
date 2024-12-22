import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren
} from 'react';
import {
  AccessToken,
  clearAccessToken,
  loadAccessToken,
  login,
  logout,
  saveAccessToken,
  updateAndLoadAccessToken
} from "@/services/auth-service.ts";
import {
  extractError,
  ErrorTitle
} from "@/lib/errors.ts";


export interface AuthContextState {
  loginUser: (username: string, password: string) => Promise<void>;
  logoutUser: () => Promise<void>;
  initializing: boolean;
  error: ErrorTitle | null;
  clearError: () => void;
  authenticated: boolean;
}


// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextState | undefined>(undefined);

export default function AuthProvider({children}: Readonly<PropsWithChildren>) {

  const [error, setError] = useState<ErrorTitle | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = await updateAndLoadAccessToken(() => setError({title: 'Sesión expirada', description: 'Por favor, inicia sesión nuevamente'}));
        if (token) setAuthenticated(true);
      } catch (error) {
        const err = extractError(error);
        setError(err);
      }
      setInitializing(false);
    };

    initializeAuth().then();
  }, []);

  const loginUser = async (username: string, password: string) => {
    const accessToken = await login(username, password);
    saveAccessToken(accessToken);
    setAuthenticated(true);
  };

  const logoutUser = useCallback(async () => {
    try {
      const accessToken: AccessToken | null = loadAccessToken();
      if (accessToken) await logout(accessToken);
      setAuthenticated(false);
    } catch (error) {
      const err = extractError(error);
      setError(err);
    } finally {
      clearAccessToken();
    }
  }, []);

  const value = useMemo(() => ({
    loginUser,
    logoutUser,
    initializing,
    error,
    clearError: () => setError(null),
    authenticated
  }), [error, initializing, authenticated, logoutUser]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}