//

import {ThemeToggle} from "@/components/theme-toggle.tsx";
import {Outlet, useLocation, useNavigate} from "react-router";
import {useAuth} from "@/hooks/use-auth.ts";
import {SVGProps, useEffect} from "react";
import {cn} from "@/lib/utils.ts";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
} from "@/components/ui/alert-dialog.tsx";


export default function AuthGuard() {
  const navigate = useNavigate();
  const {pathname} = useLocation();
  const {initializing, accessToken, error} = useAuth();


  useEffect(() => {
    if (!initializing) {
      if (!accessToken && !pathname.startsWith('/auth')) {
        navigate('/auth/login');
      } else if (accessToken && pathname.startsWith('/auth')) {
        navigate('/');
      }
    }
  }, [initializing, accessToken, pathname, navigate]);


  if (initializing) {
    return <div className="w-full h-full flex items-center justify-center">
      <div className="absolute top-4 right-4">
        <ThemeToggle/>
      </div>
      <LoadingSpinner size={32} className="text-primary"/>
    </div>

  }

  if (error) {
    return <AlertDialog>
      <AlertDialogContent>
        <AlertDialogHeader>
          {error?.title}
        </AlertDialogHeader>
        <AlertDialogDescription>
          {error?.description}
        </AlertDialogDescription>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => navigate('/auth/login')}>
            Cerrar
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  }


  return <Outlet/>;
}

export interface ISVGProps extends SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
}

export function LoadingSpinner(
  {
    size = 24,
    className,
    ...props
  }: Readonly<ISVGProps>
) {
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