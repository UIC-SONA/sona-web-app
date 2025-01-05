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
  User,
} from "@/services/user-service.ts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select.tsx";
import {es} from "date-fns/locale/es";
import {DateTimePicker} from "@/components/ui/date-picker.tsx";
import {EraserIcon, LoaderCircle} from "lucide-react";
import {cn, getPeriod} from "@/lib/utils.ts";
import {Button} from "@/components/ui/button.tsx";
import {useEffect, useState} from "react";
import {format} from "date-fns";
import {Card, CardContent} from "@/components/ui/card.tsx";
import UserSelect from "@/components/user-select.tsx";


export function AppointmentPage() {

  const {authenticated} = useAuth();
  if (!authenticated) return null;

  const table: TableFactory<Appointment, number, AppointmentFilters> = {
    columns: [
      {
        header: "Id",
        accessorKey: "id",
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
        header: "Atendido",
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
        accessorKey: "cancelled",
        cell: ({row}) => {
          return <div>
            <Checkbox checked={row.original.canceled}/>
          </div>
        },
      },
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
  const [professional, setProfessional] = useState<User | undefined>();
  const [user, setUser] = useState<User | undefined>();

  useEffect(() => {
    console.log(professionalId);
    if (!professionalId) setProfessional(undefined);
  }, [professionalId]);

  useEffect(() => {
    console.log(userId);
    if (!userId) setUser(undefined);
  }, [userId]);

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
          <div className="w-60">
            <UserSelect
              selectItemText="Profesional"
              searchPlaceholder="Buscar profesional"
              value={professional}
              filters={{
                authorities: [Authority.LEGAL_PROFESSIONAL, Authority.MEDICAL_PROFESSIONAL]
              }}
              onSelect={(professional) => {
                setProfessional(professional);
                filters.set("professionalId", professional?.id);
              }}
            />
          </div>
          <div className="w-60">
            <UserSelect
              selectItemText="Usuario"
              searchPlaceholder="Buscar usuario"
              value={user}
              filters={{
                authorities: [Authority.USER]
              }}
              onSelect={(user) => {
                setUser(user);
                filters.set("userId", user?.id);
              }}
            />
          </div>
          <div className="grid gap-2">
            <DateTimePicker
              placeholder={"Desde"}
              locale={es}
              value={from}
              onChange={(date) => filters.set("from", date)}
              granularity="day"
            />
          </div>

          <div className="grid gap-2">
            <DateTimePicker
              placeholder={"Hasta"}
              locale={es}
              value={to}
              onChange={(date) => filters.set("to", date)}
              granularity="day"
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
        <SelectItem value="ALL">Todos</SelectItem>
        <SelectItem value="VIRTUAL">Virtual</SelectItem>
        <SelectItem value="PRESENTIAL">Presencial</SelectItem>
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
