import {ThemeToggle} from "@/components/theme-toggle.tsx";
import {
  Outlet,
  useLocation,
  useNavigate
} from "react-router";
import {
  useEffect,
  useLayoutEffect, useState
} from "react";
import {useAlertDialog} from "@/context/alert-dialog-context.tsx";
import {useAuth} from "@/context/auth-context.tsx";
import {LoaderCircle} from "lucide-react";
import {User} from "@/services/user-service.ts";


type AuthGuardProps = {
  hasAuthenticated?: boolean;
  redirect: string;
  hasAuthorized?: (user: User) => boolean;
};

export default function AuthGuard({hasAuthenticated = false, redirect, hasAuthorized}: Readonly<AuthGuardProps>) {
  
  const {initializing, error, authenticated, clearError, user} = useAuth();
  const {pathname} = useLocation();
  const {pushAlertDialog} = useAlertDialog();
  const [guarding, setGuarding] = useState(true);
  const navigate = useNavigate();
  
  useLayoutEffect(() => {
    if (initializing) return;
    
    if (user && authenticated && hasAuthorized) {
      if (!hasAuthorized(user)) {
        navigate(redirect);
      }
      setGuarding(false);
      return;
    }
    
    if (hasAuthenticated && !authenticated) {
      navigate(redirect);
      return;
    }
    
    if (!hasAuthenticated && authenticated) {
      navigate(redirect);
      return;
    }
    
    setGuarding(false);
  }, [initializing, pathname, authenticated, user]);
  
  useEffect(() => {
    if (error) {
      pushAlertDialog({
        type: "error",
        ...error,
        onConfirm: () => {
          navigate('/auth/login')
          clearError();
        }
      });
    }
  }, [error]);
  
  if (initializing) {
    return <div className="w-screen h-screen flex items-center justify-center flex-col">
      <div className="absolute top-4 right-4">
        <ThemeToggle/>
      </div>
      <LoaderCircle className="w-16 h-16 animate-spin"/>
      Cargando...
    </div>
  }
  
  if (error || guarding) {
    return <div
      className="w-screen h-screen flex items-center justify-center flex-col gap-4 bg-background text-primary"
    />
  }
  
  return <Outlet/>;
}
