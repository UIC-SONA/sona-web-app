import {
  Authority,
  operationUsers, pageUser,
  User,
  UserDto, UserFilter
} from "@/services/user-service.ts";
import {ColumnDef} from "@tanstack/react-table";
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
  FormDefFactory
} from "@/components/crud/crud-forms.tsx";
import CrudTable from "@/components/crud/crud-table.tsx";
import {CrudSchema} from "@/components/crud/crud-common.ts";
import {useAuth} from "@/context/auth-context.tsx";
import {
  Page,
  PageQuery
} from "@/lib/crud.ts";


function pageUserByAuthorities(query: PageQuery<UserFilter>, authorities: Authority[]): Promise<Page<User>> {
  return pageUser({
    ...query,
    authorities,
  });
}

const columns: ColumnDef<User>[] = [
  {
    header: "Id",
    accessorKey: "id",
    enableSorting: true,
  },
  {
    header: "Nombre de Usuario",
    accessorKey: "username",
    enableSorting: false,
  },
  {
    header: "Nombre",
    accessorKey: "firstName",
    enableSorting: false,
  },
  {
    header: "Apellido",
    accessorKey: "lastName",
    enableSorting: false,
  },
  {
    header: "Correo",
    accessorKey: "email",
    enableSorting: false,
  },
  {
    header: "Roles",
    accessorKey: "authorities",
    cell: ({row}) => {
      return <ItemsOnRounded items={row.original.authorities} mapper={getRole}/>
    },
  },
];

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

  const form: FormDefFactory<User, UserDto, number> = {
    getSchema: () => {
      return z.object({
        username: z.string().nonempty(),
        firstName: z.string().nonempty(),
        lastName: z.string().nonempty(),
        email: z.string().email(),
        authoritiesToAdd: z.array(z.nativeEnum(Authority)),
        authoritiesToRemove: z.array(z.nativeEnum(Authority)),
        password: z.string()
          .nonempty()
          .min(8, {message: "La contraseña debe tener al menos 8 caracteres"})
          .optional(),
      });
    },
    FormComponent: (props) => <FormComponent {...props} authorities={authorities}/>,
    getDefaultValues: (data?: User) => {
      if (!data)
        return {
          username: "",
          firstName: "",
          lastName: "",
          email: "",
          authoritiesToAdd: [],
          authoritiesToRemove: [],
          password: "",
        };

      return {
        username: data.username,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        authoritiesToAdd: [],
        authoritiesToRemove: [],
        password: undefined,
      };
    },
  };

  return (
    <BreadcrumbSubLayout items={breadcrumbs}>
      <CrudTable<User, UserDto, number>
        title={title}
        columns={columns}
        operations={{
          ...operationUsers,
          page: (authorities ? (query) => pageUserByAuthorities(query, authorities) : pageUser),
        }}
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
              <Input placeholder="Nombre de Usuario" {...field} />
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
                <Input type="password" placeholder="Contraseña" {...field} />
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

  return <FormItem className="lg:col-span-2">
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

function getRole(authority: Authority): string {
  switch (authority) {
    case Authority.ADMIN:
      return "Administrador";
    case Authority.ADMINISTRATIVE:
      return "Administrativo";
    case Authority.MEDICAL_PROFESSIONAL:
      return "Profesional Médico";
    case Authority.LEGAL_PROFESSIONAL:
      return "Profesional Legal";
    case Authority.USER:
      return "Usuario";
  }
}

function authorityToOption(authority: Authority): Option {
  return {
    value: authority,
    label: getRole(authority),
  };
}


function optionToAuthority(option: Option): Authority {
  return option.value as Authority;
}