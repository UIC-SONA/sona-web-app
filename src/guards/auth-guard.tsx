import {ThemeToggle} from "@/components/theme-toggle.tsx";
import {
  Outlet,
  useLocation,
  useNavigate
} from "react-router";
import {
  SVGProps,
  useEffect,
  useLayoutEffect
} from "react";
import {cn} from "@/lib/utils.ts";
import {useAlertDialog} from "@/context/alert-dialog-context.tsx";
import {useAuth} from "@/context/auth-context.tsx";


export default function AuthGuard() {
  const navigate = useNavigate();
  const {pathname} = useLocation();
  const {pushAlertDialog} = useAlertDialog();
  const {initializing, error, authenticated, clearError} = useAuth();

  useLayoutEffect(() => {
    if (initializing) return;
    if (authenticated) {
      if (pathname.startsWith('/auth')) {
        navigate('/');
      }
    } else if (!pathname.startsWith('/auth')) {
      navigate('/auth/login');
    }
  }, [initializing, pathname, navigate, authenticated]);

  useEffect(() => {
    if (error) pushAlertDialog({
      type: "error",
      title: "Error de autenticación",
      description: error.description,
      onConfirm: () => {
        navigate('/auth/login')
        clearError();
      }
    });
  }, [error]);

  if (initializing) {
    return <div className="w-screen h-screen flex items-center justify-center flex-col">
      <div className="absolute top-4 right-4">
        <ThemeToggle/>
      </div>
      <LoadingSpinner size={32} className="text-primary"/>
      Cargando...
    </div>
  }

  if (error) {
    return <div
      className="w-screen h-screen flex items-center justify-center flex-col gap-4 bg-background text-primary"
    />
  }
  return <Outlet/>;
}

export interface ISVGProps extends SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
}

export function LoadingSpinner({size = 24, className, ...props}: Readonly<ISVGProps>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("animate-spin", className)}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
    </svg>
  );
}