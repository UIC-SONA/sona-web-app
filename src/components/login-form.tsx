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
import {Loader2, UserIcon} from "lucide-react";
import {
  Link,
  useNavigate
} from "react-router";
import {FormEvent, useState} from "react";
import {extractError} from "@/lib/errors.ts";
import {
  DialogType,
  useAlertDialog
} from "@/context/alert-dialog-context.tsx";
import {useAuth} from "@/context/auth-context.tsx";


export default function LoginForm() {

  const navigate = useNavigate();
  const {loginUser} = useAuth();
  const {pushAlertDialog} = useAlertDialog();

  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await loginUser(username, password);
      navigate("/");
    } catch (error) {
      const err = extractError(error);
      pushAlertDialog({type: DialogType.ERROR, title: err.title, description: err.description});
    } finally {
      setLoading(false);
    }
  }

  return <Card>
    <CardHeader className="mb-4 text-center">
      <CardTitle className="text-2xl font-bold md:mb-0 mb-4">
        Iniciar sesión
      </CardTitle>
      <CardDescription>
        <div className="md:hidden mb-4">
          <img src={onlyLogo} alt="Logo" className="w-1/2 mx-auto mb-8"/>
        </div>
        Inicia sesión con tu cuenta de SONA
      </CardDescription>
    </CardHeader>
    <CardContent>
      <form className="space-y-4 mb-4" onSubmit={handleLogin}>
        <Input
          disabled={loading}
          type="text"
          placeholder="Usuario o correo electrónico"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <Input
          disabled={loading}
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button
          type="submit"
          className="w-full"
        >
          {loading
            ? <Loader2 className="animate-spin"/>
            : <UserIcon className="h-5 w-5 mr-2"/>
          }
          Iniciar sesión
        </Button>
      </form>
    </CardContent>
    <CardFooter className="flex flex-col items-center">
      <p className="text-center text-sm">
        ¿No tienes una cuenta?{" "}
        <Link to="/auth/sign-up" className="underline text-primary">
          Regístrate
        </Link>
      </p>
    </CardFooter>
  </Card>;
}


