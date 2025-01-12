import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card.tsx";
import onlyLogo from "@/assets/only_logo.png";
import {Input} from "@/components/ui/input.tsx";
import {Button} from "@/components/ui/button.tsx";
import {Loader2, LockIcon, Mail, UserIcon} from "lucide-react";
import {Link} from "react-router";
import {FormEvent, useState} from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog.tsx";
import {introspect} from "@/lib/errors.ts";
import {useAlertDialog} from "@/context/alert-dialog-context.tsx";
import {userService} from "@/services/user-service.ts";


export default function SingUpForm() {

  const {pushAlertDialog} = useAlertDialog();

  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSignUp = async (e: FormEvent) => {
    e.preventDefault();
    if ([username, password, repeatPassword, firstName, lastName, email].some((field) => field === "")) {
      pushAlertDialog({
        type: "error",
        title: "Campos vacíos",
        description: "Por favor, completa todos los campos"
      });
      return;
    }

    if (password !== repeatPassword) {
      pushAlertDialog({
        type: "error",
        title: "Contraseñas no coinciden",
        description: "Las contraseñas no coinciden"
      });
      return;
    }

    try {
      setLoading(true);
      await userService.singUp({username, password, firstName, lastName, email});
      setSuccess(true);
    } catch (error) {
      const err = introspect(error);
      pushAlertDialog({
        type: "error",
        title: err.title,
        description: err.description
      });
    } finally {
      setLoading(false);
    }
  }

  return <>
    <AlertDialog open={success}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-success">
            ¡Registro exitoso!
          </AlertDialogTitle>
          <AlertDialogDescription>
            Tu cuenta ha sido creada exitosamente
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Link to="/auth/login">
            <Button>
              Iniciar sesión
            </Button>
          </Link>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    <Card>
      <CardHeader className="mb-4 text-center">
        <CardTitle className="text-2xl font-bold md:mb-0 mb-4">
          Regístrate
        </CardTitle>
        <CardDescription>
          <div className="md:hidden mb-4">
            <img src={onlyLogo} alt="Logo" className="w-1/2 mx-auto mb-8"/>
          </div>
          Regístrate para acceder a SONA
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4 mb-4" onSubmit={handleSignUp}>
          <div className="relative">
            <Input
              disabled={loading}
              type="text"
              placeholder="Usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="pl-10"
            />
            <UserIcon className="absolute top-1/2 left-3 transform -translate-y-1/2 h-5 w-5 text-muted-foreground"/>
          </div>
          <div className="relative">
            <Input
              disabled={loading}
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10"
            />
            <Mail className="absolute top-1/2 left-3 transform -translate-y-1/2 h-5 w-5 text-muted-foreground"/>
          </div>
          <Input
            disabled={loading}
            type="text"
            placeholder="Nombre"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
          <Input
            disabled={loading}
            type="text"
            placeholder="Apellido"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
          <div className="relative">
            <Input
              disabled={loading}
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10"
            />
            <LockIcon className="absolute top-1/2 left-3 transform -translate-y-1/2 h-5 w-5 text-muted-foreground"/>
          </div>
          <div className="relative">
            <Input
              disabled={loading}
              type="password"
              placeholder="Repetir contraseña"
              value={repeatPassword}
              onChange={(e) => setRepeatPassword(e.target.value)}
              className="pl-10"
            />
            <LockIcon className="absolute top-1/2 left-3 transform -translate-y-1/2 h-5 w-5 text-muted-foreground"/>
          </div>
          <Button
            type="submit"
            className="w-full"
          >
            {loading
              ? <Loader2 className="animate-spin"/>
              : <UserIcon className="h-5 w-5 mr-2"/>
            }
            Registrarse
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col items-center">
        <p className="text-center text-sm">
          ¿Ya tienes una cuenta?{" "}
          <Link to="/auth/login" className="underline text-primary">
            Iniciar sesión
          </Link>
        </p>
      </CardFooter>
    </Card>
  </>
}
