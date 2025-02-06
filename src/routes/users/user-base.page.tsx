import {
  Authority,
  userService,
  User,
  UserDto, UserFilter
} from "@/services/user-service.ts";
import {ItemsOnRounded} from "@/components/utils-componentes.tsx";
import BreadcrumbSubLayout from "@/layout/breadcrumb-sub-layout.tsx";
import {z} from "zod";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form.tsx";
import {Input} from "@/components/ui/input.tsx";
import {Switch} from "@/components/ui/switch.tsx";
import MultipleSelector, {Option} from "@/components/ui/multiple-selector.tsx";
import {
  useEffect,
  useState
} from "react";
import {UseFormReturn} from "react-hook-form";
import {
  FormComponentProps,
} from "@/components/crud/crud-forms.tsx";
import CrudTable, {FormFactory, TableFactory} from "@/components/crud/crud-table.tsx";
import {CrudSchema} from "@/components/crud/crud-common.ts";
import {useAuth} from "@/context/auth-context.tsx";
import {ShieldCheck, ShieldMinus} from "lucide-react";
import {useAlertDialog} from "@/context/alert-dialog-context.tsx";
import {introspect} from "@/lib/errors.ts";
import {Checkbox} from "@/components/ui/checkbox.tsx";


export interface UserBasePageProps {
  title: string;
  breadcrumbs: string[];
  authorities?: Authority[];
}

export default function UserBasePage(
  {
    title,
    authorities,
    breadcrumbs
  }: Readonly<UserBasePageProps>
) {
  
  const {authenticated} = useAuth();
  if (!authenticated) return null;
  
  const {pushAlertDialog} = useAlertDialog();
  
  const table: TableFactory<User, number, UserFilter> = {
    columns: [
      {
        header: "Nombre de Usuario",
        accessorKey: "username",
        enableSorting: true,
      },
      {
        header: "Nombre",
        accessorKey: "firstName",
        enableSorting: true,
      },
      {
        header: "Apellido",
        accessorKey: "lastName",
        enableSorting: true,
      },
      {
        header: "Correo",
        accessorKey: "email",
        enableSorting: true,
      },
      {
        header: "Roles",
        accessorKey: "authorities",
        enableSorting: false,
        cell: ({row}) => {
          return <ItemsOnRounded items={row.original.authorities} mapper={userService.getAuthorityName}/>
        },
      },
      {
        header: "Habilitado",
        accessorKey: "enabled",
        enableSorting: true,
        cell: ({row}) => {
          return <div className="flex items-center justify-center">
            <Checkbox checked={row.original.enabled} disabled/>
          </div>
        },
      }
    ],
    entityActions: (user, reload) => {
      const toggleEnableUser = async () => {
        await userService.enable(user.id, !user.enabled);
        reload();
      }
      
      return [
        {
          label: user.enabled ? "Deshabilitar" : "Habilitar",
          icon: user.enabled ? ShieldMinus : ShieldCheck,
          onClick: () => pushAlertDialog({
            type: "question",
            title: user.enabled ? "Deshabilitar Usuario" : "Habilitar Usuario",
            description: `¿Estás seguro de ${user.enabled ? "deshabilitar" : "habilitar"} al usuario ${user.username}?`,
            onConfirm: toggleEnableUser,
            onError: (error) => {
              pushAlertDialog({
                type: "error",
                ...introspect(error),
              });
            }
          })
        }
      ]
    }
  }
  
  const form: FormFactory<User, UserDto, number> = {
    update: {
      schema: z.object({
        username: z.string().nonempty(),
        firstName: z.string().nonempty(),
        lastName: z.string().nonempty(),
        email: z.string().email(),
        authoritiesToAdd: z.array(z.nativeEnum(Authority)),
        authoritiesToRemove: z.array(z.nativeEnum(Authority)),
        password: z.string().min(8, {message: "La contraseña debe tener al menos 8 caracteres"}).optional(),
      }),
      defaultValues: (data: User) => {
        return {
          username: data.username,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          authoritiesToAdd: [],
          authoritiesToRemove: [],
          password: undefined,
        };
      }
    },
    create: {
      schema: z.object({
        username: z.string().nonempty(),
        firstName: z.string().nonempty(),
        lastName: z.string().nonempty(),
        email: z.string().email(),
        authoritiesToAdd: z.array(z.nativeEnum(Authority)),
        authoritiesToRemove: z.array(z.nativeEnum(Authority)),
        password: z.string().min(8, {message: "La contraseña debe tener al menos 8 caracteres"}),
      }),
      defaultValues: {
        username: "",
        firstName: "",
        lastName: "",
        email: "",
        authoritiesToAdd: [],
        authoritiesToRemove: [],
        password: "",
      }
    },
    FormComponent: (props) => <FormComponent {...props} authorities={authorities}/>,
  };
  
  const {delete: _, ...operations} = {...userService};
  if (authorities) {
    operations.page = (query) => userService.page({...query, filters: {authorities}});
  }
  
  return (
    <BreadcrumbSubLayout items={breadcrumbs}>
      <CrudTable<User, UserDto, number, UserFilter>
        title={title}
        table={table}
        operations={operations}
        form={form}
      />
    </BreadcrumbSubLayout>
  );
}

interface FormUserProps extends FormComponentProps<User, UserDto> {
  authorities?: Authority[];
}

function FormComponent({form, entity, authorities}: Readonly<FormUserProps>) {
  const {control, setValue} = form;
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <FormField
        control={control}
        name="username"
        render={({field}) => (
          <FormItem className="lg:col-span-2">
            <FormLabel>Nombre de Usuario</FormLabel>
            <FormControl>
              <Input placeholder="Nombre de Usuario" {...field} autoComplete="off"/>
            </FormControl>
            <FormMessage/>
          </FormItem>
        )}
      />
      {entity
        ? <EnableChangePassword form={form}/>
        : <FormField
          control={control}
          name="password"
          render={({field}) => (
            
            <FormItem className="lg:col-span-2">
              <FormLabel>Contraseña</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Contraseña" {...field} autoComplete="off"/>
              </FormControl>
              <FormMessage/>
            </FormItem>
          
          )}
        />
      }
      <FormField
        control={control}
        name="firstName"
        render={({field}) => {
          return (
            <FormItem className="lg:col-span-2">
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <Input placeholder="Nombre" {...field} />
              </FormControl>
              <FormMessage/>
            </FormItem>
          );
        }}
      />
      <FormField
        control={control}
        name="lastName"
        render={({field}) => {
          return (
            <FormItem className="lg:col-span-2">
              <FormLabel>Apellido</FormLabel>
              <FormControl>
                <Input placeholder="Apellido" {...field} />
              </FormControl>
              <FormMessage/>
            </FormItem>
          );
        }}
      />
      <FormField
        control={control}
        name="email"
        render={({field}) => {
          return (
            <FormItem className="lg:col-span-2">
              <FormLabel>Correo</FormLabel>
              <FormControl>
                <Input placeholder="Correo" {...field} />
              </FormControl>
              <FormMessage/>
            </FormItem>
          );
        }}
      />
      <AuthorityManager
        authorities={authorities}
        intialAuthorities={entity?.authorities ?? []}
        onChange={(authoritiesToAdd, authoritiesToRemove) => {
          setValue("authoritiesToAdd", authoritiesToAdd);
          setValue("authoritiesToRemove", authoritiesToRemove);
        }}
      />
    </div>
  );
}


function EnableChangePassword({form}: Readonly<{ form: UseFormReturn<z.infer<CrudSchema<UserDto>>> }>) {
  
  const [enabled, setEnabled] = useState(false);
  const [value, setValue] = useState("");
  const {getFieldState} = form;
  
  const fieldState = getFieldState("password");
  
  useEffect(() => {
    form.setValue("password", enabled ? value : undefined);
  }, [form, enabled, value]);
  
  return (
    <div className="lg:col-span-2">
      <FormItem>
        <FormLabel>
          Contraseña
        </FormLabel>
        <div className="flex items-center">
          <div className="flex items-center justify-between mr-4">
            <p className="text-sm text-gray-500">Cambiar Contraseña</p>
            <Switch
              checked={enabled}
              onCheckedChange={setEnabled}
            />
          </div>
          <FormControl>
            <Input
              autoComplete={enabled ? "new-password" : "off"}
              disabled={!enabled}
              type="password"
              placeholder="Contraseña"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </FormControl>
        </div>
        {fieldState.error && <FormMessage>{fieldState.error.message}</FormMessage>}
      </FormItem>
    </div>
  );
}

interface AuthorityManagerProps {
  intialAuthorities: Authority[],
  onChange: (authoritiesToAdd: Authority[], authoritiesToRemove: Authority[]) => void,
  authorities?: Authority[],
}

function AuthorityManager(
  {
    intialAuthorities,
    onChange,
    authorities: _authorities
  }: Readonly<AuthorityManagerProps>
) {
  
  const [authorities, setAuthorities] = useState<Option[]>(intialAuthorities.map(authorityToOption));
  
  return <FormItem className="lg:col-span-2 mb-5">
    <FormLabel>Roles</FormLabel>
    <FormControl>
      <MultipleSelector
        defaultOptions={_authorities?.map(authorityToOption) ?? Object.values(Authority).map(authorityToOption)}
        value={authorities}
        onChange={(selected) => {
          const conditionToAdd = (option: Option) => !intialAuthorities.includes(optionToAuthority(option));
          const conditionToRemove = (authority: Authority) => !selected.find((s) => s.value === authority);
          
          const rolesToAdd = selected.filter(conditionToAdd).map(optionToAuthority);
          const rolesToRemove = intialAuthorities.filter(conditionToRemove) ?? [];
          
          setAuthorities(selected);
          onChange(rolesToAdd, rolesToRemove);
        }}
      />
    </FormControl>
    <FormMessage/>
  </FormItem>;
}


function authorityToOption(authority: Authority): Option {
  return {
    value: authority,
    label: userService.getAuthorityName(authority),
  };
}


function optionToAuthority(option: Option): Authority {
  return option.value as Authority;
}