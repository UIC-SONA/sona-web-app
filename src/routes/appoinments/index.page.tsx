import BreadcrumbSubLayout from "@/layout/breadcrumb-sub-layout.tsx";
import {useAuth} from "@/context/auth-context.tsx";
import CrudTable, {
  FilterComponentProps,
  TableFactory
} from "@/components/crud/crud-table.tsx";
import {
  Appointment,
  AppointmentFilters,
  appointmentsService,
  AppointmentType
} from "@/services/appointments-service.ts";
import {Checkbox} from "@/components/ui/checkbox.tsx";
import {
  Authority,
  User, userService,
} from "@/services/user-service.ts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select.tsx";
import {
  EraserIcon,
  Laptop,
  LoaderCircle,
  Speech
} from "lucide-react";
import {
  cn,
  getPeriod
} from "@/lib/utils.ts";
import {Button} from "@/components/ui/button.tsx";
import {
  useEffect,
  useState
} from "react";
import {format} from "date-fns";
import {Card, CardContent} from "@/components/ui/card.tsx";
import UserSelect from "@/components/user-select.tsx";
import AppointmentView from "@/components/appointment-view.tsx";
import {CalendarDate} from "@internationalized/date";
import DatePicker from "@/components/ui/date/date-picker.tsx";
import {ZONE_ID} from "@/constans.ts";


export function AppointmentPage() {

  const {authenticated} = useAuth();
  if (!authenticated) return null;

  const table: TableFactory<Appointment, number, AppointmentFilters> = {
    columns: [
      {
        header: "Id",
        accessorKey: "id",
        meta: {
          hidden: true
        }
      },
      {
        header: "Fecha",
        cell: ({row}) => {
          return format(row.original.date, "dd/MM/yyyy");
        }
      },
      {
        header: "Intervalo",
        cell: ({row}) => {
          const appointment = row.original;
          const startHourFormatted = appointment.hour + getPeriod(appointment.hour);
          const endHour = appointment.hour + 1;
          const endHourFormatted = endHour + getPeriod(endHour);
          return `${startHourFormatted} - ${endHourFormatted}`;
        }
      },
      {
        header: "Tipo",
        cell: ({row}) => {
          return appointmentsService.getAppointmentTypeName(row.original.type);
        }
      },
      {
        header: "Usuario",
        cell: ({row}) => {
          const attendant = row.original.attendant;
          return `${attendant.firstName} ${attendant.lastName}`
        }
      },
      {
        header: "Profesional",
        enableSorting: false,
        cell: ({row}) => {
          const professional = row.original.professional;
          return `${professional.firstName} ${professional.lastName}`
        }
      },
      {
        header: "Cancelado",
        accessorKey: "canceled",
        cell: ({row}) => {
          return <div className="flex items-center justify-center">
            <Checkbox checked={row.original.canceled}/>
          </div>
        },
      },
      {
        header: "Acciones",
        enableSorting: false,
        cell: ({row}) => {

          const [appointment, setAppointment] = useState<Appointment | undefined>();

          return <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAppointment(row.original)}
            >
              Ver
            </Button>
            <AppointmentView appointment={appointment} onClose={() => setAppointment(undefined)}/>
          </div>
        }
      }
    ],
    FilterComponent: FilterComponent
  }

  return (
    <BreadcrumbSubLayout items={['Citas']}>
      <CrudTable<Appointment, any, number, AppointmentFilters>
        title="Citas"
        table={table}
        operations={appointmentsService}
      />
    </BreadcrumbSubLayout>
  );
}

function FilterComponent({filters}: Readonly<FilterComponentProps<AppointmentFilters>>) {

  const {from, to, canceled, type, professionalId, userId} = filters.values;
  const {user} = useAuth();
  const [professional, setProfessional] = useState<User | undefined>();
  const [attendant, setAttendant] = useState<User | undefined>();

  useEffect(() => {
    if (!professionalId) setProfessional(undefined);
  }, [professionalId]);

  useEffect(() => {
    if (!userId) setAttendant(undefined);
  }, [userId]);

  const fromValue = from ? new CalendarDate(from.getFullYear(), from.getMonth() + 1, from.getDate()) : null;
  const toValue = to ? new CalendarDate(to.getFullYear(), to.getMonth() + 1, to.getDate()) : null;

  return (
    <Card className="my-4">
      <CardContent>
        <div className="flex flex-wrap gap-4 items-center mb-4 pt-4 justify-between">
          <div className="flex items-center space-x-2">
            <p className="text-lg font-semibold">Filtros</p>
            <LoaderCircle className={cn("w-5 h-5", filters.loading ? "animate-spin" : "invisible")}/>
          </div>
          <div>
            <Button onClick={filters.clear}>
              <EraserIcon className="w-4 h-4"/>
              Limpiar
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 items-center justify-center mt-3">

          {(user && userService.hasPrivilegedUser(user)) && <div className="w-60">
              <UserSelect
                  selectItemText="Profesional"
                  searchPlaceholder="Buscar profesional"
                  value={professional}
                  filters={{
                    authorities: userService.professionalAuthorities,
                  }}
                  onSelect={(professional) => {
                    setProfessional(professional);
                    filters.set("professionalId", professional?.id);
                  }}
              />
          </div>}
          <div className="w-60">
            <UserSelect
              selectItemText="Usuario"
              searchPlaceholder="Buscar usuario"
              value={attendant}
              filters={{
                authorities: [Authority.USER]
              }}
              onSelect={(user) => {
                setAttendant(user);
                filters.set("userId", user?.id);
              }}
            />
          </div>
          <div className="grid gap-2">
            <DatePicker<CalendarDate>
              placeHolder="Desde"
              value={fromValue}
              onChange={(date) => filters.set("from", date ? date.toDate(ZONE_ID) : undefined)}
            />
          </div>

          <div className="grid gap-2">
            <DatePicker<CalendarDate>
              placeHolder="Hasta"
              value={toValue}
              onChange={(date) => filters.set("to", date ? date.toDate(ZONE_ID) : undefined)}
            />
          </div>

          <SelectAppointmentType
            value={type}
            onChange={(value) => filters.set("type", value)}
          />

          <CaneceledCheckbox
            value={canceled === true}
            onCheckedChange={(value) => filters.set("canceled", value)}
          />
        </div>
      </CardContent>
    </Card>
  );
}

export interface SelectAppointmentTypeProps {
  value?: AppointmentType;
  onChange: (value?: AppointmentType) => void;
}

export function SelectAppointmentType({value, onChange}: Readonly<SelectAppointmentTypeProps>) {
  return (
    <Select
      value={value}
      onValueChange={(value) => onChange(value === "ALL" ? undefined : value as AppointmentType)}
    >
      <SelectTrigger className="w-40">
        <SelectValue placeholder="Tipo de cita"/>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ALL">
          Todos
        </SelectItem>
        <SelectItem value="VIRTUAL">
          <div className="flex items-center space-x-2">
            <Laptop size={18}/>
            <p>Virtual</p>
          </div>
        </SelectItem>
        <SelectItem value="PRESENTIAL">
          <div className="flex items-center space-x-2">
            <Speech size={18}/>
            <p>Presencial</p>
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}

export interface CaneceledCheckboxProps {
  value: boolean;
  onCheckedChange: (value: boolean) => void;
}

export function CaneceledCheckbox({value, onCheckedChange}: Readonly<CaneceledCheckboxProps>) {
  return <div className="flex items-center space-x-2">
    <Checkbox
      id="canceled"
      checked={value}
      onCheckedChange={onCheckedChange}
    />
    <label
      htmlFor="canceled"
      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
    >
      Cancelado
    </label>
  </div>

}
