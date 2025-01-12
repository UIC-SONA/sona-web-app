import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';
import {
  AccessToken,
  clearAccessToken,
  isAccessToken,
  loadAccessToken,
  login,
  logout,
  saveAccessToken,
  RefreshTokenBadResult,
  updateAndLoadAccessToken
} from "@/services/auth-service.ts";
import {ErrorTitle, introspect} from "@/lib/errors.ts";
import {Authority, User, userService} from "@/services/user-service.ts";


const AUTHORIZED = [
  Authority.ADMIN,
  Authority.ADMINISTRATIVE,
  Authority.MEDICAL_PROFESSIONAL,
  Authority.LEGAL_PROFESSIONAL
];

export interface AuthContextState {
  loginUser: (username: string, password: string) => Promise<void>;
  logoutUser: () => Promise<void>;
  initializing: boolean;
  user?: User;
  refreshUser: () => Promise<void>;
  error?: ErrorTitle;
  clearError: () => void;
  authenticated: boolean;
}


// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextState | undefined>(undefined);

export default function AuthProvider({children}: Readonly<PropsWithChildren>) {

  const [user, setUser] = useState<User | undefined>();
  const [error, setError] = useState<ErrorTitle>();
  const [initializing, setInitializing] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  const refreshUser = useCallback(async () => {
    try {
      const user = await userService.profile();
      if (!user.authorities.some((authority) => AUTHORIZED.includes(authority))) {
        setError({
          title: 'Acceso denegado',
          description: 'No tienes permisos para acceder a esta aplicación'
        });
      }
      setUser(user);
      setAuthenticated(true);
    } catch (error) {
      console.log(error);
      setError(introspect(error));
    }
  }, []);


  useEffect(() => {
    async function initialize() {
      try {
        const token = await updateAndLoadAccessToken();

        if (token == RefreshTokenBadResult.EXPIRED_TOKEN) {
          setError({
            title: 'Sesión expirada',
            description: 'Por favor, inicia sesión nuevamente'
          });
          return;
        }

        if (token == RefreshTokenBadResult.NO_TOKEN) {
          return;
        }

        if (isAccessToken(token)) {
          await refreshUser();
          return;
        }

      } catch (error) {
        setError(introspect(error));
      } finally {
        setInitializing(false);
      }
    }

    initialize().then();
  }, []);


  const loginUser = async (username: string, password: string) => {
    try {
      const accessToken = await login(username, password);
      saveAccessToken(accessToken);
      await refreshUser();
    } catch (error) {
      setError(introspect(error));
    }
  };

  const logoutUser = useCallback(async () => {
    try {
      const accessToken: AccessToken | null = loadAccessToken();
      if (accessToken) await logout(accessToken);
      setAuthenticated(false);
      setUser(undefined);
    } catch (error) {
      setError(introspect(error));
    } finally {
      clearAccessToken();
    }
  }, []);

  const clearError = useCallback(() => setError(undefined), []);

  const value = useMemo(() => ({
    loginUser,
    logoutUser,
    initializing,
    error,
    user,
    clearError,
    refreshUser,
    authenticated
  }), [error, initializing, authenticated, logoutUser]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}