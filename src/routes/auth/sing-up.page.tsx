import {useState} from 'react';
import onlyLogo from "@/assets/only_logo.png";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import * as z from "zod";
import {UserIcon, Mail, Loader2, Lock as LockIcon} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  useAlertDialog
} from "@/context/alert-dialog-context.tsx";
import {
  userService
} from "@/services/user-service.ts";
import {introspect} from "@/lib/errors.ts";
import {Link} from "react-router";

const signUpSchema = z.object({
  username: z.string().min(1, "El usuario es requerido"),
  email: z.string().email("Correo electrónico inválido"),
  firstName: z.string().min(1, "El nombre es requerido"),
  lastName: z.string().min(1, "El apellido es requerido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  repeatPassword: z.string()
}).refine((data) => data.password === data.repeatPassword, {
  message: "Las contraseñas no coinciden",
  path: ["repeatPassword"],
});

export default function SignUp() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const {pushAlertDialog} = useAlertDialog();

  const form = useForm({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      username: "",
      email: "",
      firstName: "",
      lastName: "",
      password: "",
      repeatPassword: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof signUpSchema>) => {
    try {
      setLoading(true);
      await userService.singUp({
        username: data.username,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
      });
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
  };

  return (
    <>
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
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mb-4">
              <FormField
                control={form.control}
                name="username"
                render={({field}) => (
                  <FormItem>
                    <div className="relative">
                      <FormControl>
                        <Input
                          disabled={loading}
                          placeholder="Usuario"
                          className="pl-10"
                          {...field}
                        />
                      </FormControl>
                      <UserIcon className="absolute top-1/2 left-3 transform -translate-y-1/2 h-5 w-5 text-muted-foreground"/>
                    </div>
                    <FormMessage/>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({field}) => (
                  <FormItem>
                    <div className="relative">
                      <FormControl>
                        <Input
                          disabled={loading}
                          type="email"
                          placeholder="Correo electrónico"
                          className="pl-10"
                          {...field}
                        />
                      </FormControl>
                      <Mail className="absolute top-1/2 left-3 transform -translate-y-1/2 h-5 w-5 text-muted-foreground"/>
                    </div>
                    <FormMessage/>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="firstName"
                render={({field}) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        disabled={loading}
                        placeholder="Nombre"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage/>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastName"
                render={({field}) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        disabled={loading}
                        placeholder="Apellido"
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
                    <div className="relative">
                      <FormControl>
                        <Input
                          disabled={loading}
                          type="password"
                          placeholder="Contraseña"
                          className="pl-10"
                          {...field}
                        />
                      </FormControl>
                      <LockIcon className="absolute top-1/2 left-3 transform -translate-y-1/2 h-5 w-5 text-muted-foreground"/>
                    </div>
                    <FormMessage/>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="repeatPassword"
                render={({field}) => (
                  <FormItem>
                    <div className="relative">
                      <FormControl>
                        <Input
                          disabled={loading}
                          type="password"
                          placeholder="Repetir contraseña"
                          className="pl-10"
                          {...field}
                        />
                      </FormControl>
                      <LockIcon className="absolute top-1/2 left-3 transform -translate-y-1/2 h-5 w-5 text-muted-foreground"/>
                    </div>
                    <FormMessage/>
                  </FormItem>
                )}
              />

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
                Registrarse
              </Button>
            </form>
          </Form>
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
  );
}