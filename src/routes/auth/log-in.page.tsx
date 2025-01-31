import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {
  Loader2,
  UserIcon
} from "lucide-react";
import {
  Link,
  useNavigate
} from "react-router";
import {
  useAlertDialog
} from "@/context/alert-dialog-context";
import {
  useLogin
} from "@/context/auth-context";
import onlyLogo from "@/assets/only_logo.png";
import {
  introspect
} from "@/lib/errors.ts";


const loginSchema = z.object({
  username: z.string()
    .min(1, "Usuario o correo electrónico es requerido")
    .max(50, "asdasdsad")
  ,
  password: z.string().min(1, "Contraseña es requerida"),
});

export default function LogIn() {
  const navigate = useNavigate();
  const {login, loading} = useLogin();
  const {pushAlertDialog} = useAlertDialog();

  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });


  const onSubmit = async (data: z.infer<typeof loginSchema>) => {
    try {
      await login(data.username, data.password);
      navigate("/");
    } catch (error) {
      const err = introspect(error);

      if (err.description === "Invalid user credentials") {
        form.setError("root", {
          type: "manual",
          message: "Usuario o contraseña incorrectos",
        });
        return;
      }
      pushAlertDialog({type: "error", ...err});
    }
  };

  return (
    <Card>
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
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mb-4">
            <FormField
              control={form.control}
              name="username"
              render={({field}) => (
                <FormItem>
                  <FormControl>
                    <Input
                      disabled={loading}
                      placeholder="Usuario o correo electrónico"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage/>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({field}) => (
                <FormItem>
                  <FormControl>
                    <Input
                      disabled={loading}
                      type="password"
                      placeholder="Password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage/>
                </FormItem>
              )}
            />

            {form.formState.errors.root && (
              <div className="text-red-500 text-sm text-center">
                {form.formState.errors.root.message}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="animate-spin"/>
              ) : (
                <UserIcon className="h-5 w-5 mr-2"/>
              )}
              Iniciar sesión
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex flex-col items-center">
        <p className="text-center text-sm">
          ¿No tienes una cuenta?{" "}
          <Link to="/auth/sign-up" className="underline text-primary">
            Regístrate
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}