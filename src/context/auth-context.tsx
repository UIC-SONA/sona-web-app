import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren
} from 'react';
import {
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
  isAuth: boolean;
}


// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextState | undefined>(undefined);

export default function AuthProvider({children}: Readonly<PropsWithChildren>) {
  const [error, setError] = useState<ErrorTitle | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = await updateAndLoadAccessToken(() => setError({title: 'Sesión expirada', description: 'Por favor, inicia sesión nuevamente'}));
        if (token) setIsAuth(true);
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
    setIsAuth(true);
  };

  const logoutUser = useCallback(async () => {
    try {
      const accessToken = loadAccessToken();
      if (accessToken) await logout(accessToken);
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
    isAuth
  }), [error, initializing, isAuth, logoutUser]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}