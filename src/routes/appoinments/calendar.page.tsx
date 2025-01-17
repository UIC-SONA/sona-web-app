import BreadcrumbSubLayout from "@/layout/breadcrumb-sub-layout.tsx";
import {
  useEffect,
  useRef,
  useState
} from "react";
import {
  Appointment,
  appointmentsService,
  AppointmentType
} from "@/services/appointments-service.ts";
import {
  Authority,
  User, userService
} from "@/services/user-service.ts";
import FullCalendarController from "@/components/calendar/full-calendar-controller.tsx";
import {
  Card,
  CardContent
} from "@/components/ui/card.tsx";
import FullCalendarImproved from "@/components/calendar/full-calendar-improved.tsx";
import {es} from "date-fns/locale/es";
import FullCalendar from "@fullcalendar/react";
import {
  CaneceledCheckbox,
  SelectAppointmentType
} from "./index.page.tsx";
import {
  EraserIcon,
  LoaderCircle
} from "lucide-react";
import {
  cn,
  getCSSVariableValue
} from "@/lib/utils.ts";
import {EventInput} from "@fullcalendar/core";
import {Button} from "@/components/ui/button.tsx";
import UserSelect from "@/components/user-select.tsx";
import AppointmentView from "@/components/appointment-view.tsx";
import {useAuth} from "@/context/auth-context.tsx";
import {useTheme} from "@/context/theme-context.tsx";

export default function AppointmentsCalendarPage() {

  const calendarRef = useRef<FullCalendar | null>(null);

  const {user} = useAuth();
  const {theme} = useTheme();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [appointment, setAppointment] = useState<Appointment | undefined>();
  const [range, setRange] = useState({from: new Date(), to: new Date()});
  const [loading, setLoading] = useState(false);
  const [professional, setProfessional] = useState<User | undefined>();
  const [attendant, setAttendant] = useState<User | undefined>();
  const [canceled, setCanceled] = useState<boolean | undefined>();
  const [type, setType] = useState<AppointmentType | undefined>();

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const appointments = await appointmentsService.page({
        page: 0,
        size: 0,
        filters: {
          from: range.from,
          to: range.to,
          professionalId: professional?.id,
          canceled: canceled,
          type: type,
        }
      });
      setAppointments(appointments.content);
    } finally {
      setLoading(false);
    }
  }

  const clearFilters = () => {
    setProfessional(undefined);
    setCanceled(undefined);
    setType(undefined);
  }

  useEffect(() => {
    loadAppointments().then();
  }, [range, professional, canceled, type]);

  useEffect(() => {
    setAppointments([...appointments]);
  }, [theme]);

  const hasPrivileges = (user != undefined && userService.hasPrivilegedUser(user));

  return (
    <BreadcrumbSubLayout items={['Citas', 'Calendario']}>
      <h1 className="text-2xl font-bold mb-4">Calendario de Citas</h1>
      <Card className="my-4">
        <CardContent>
          <div className="flex flex-wrap gap-4 items-center mb-4 pt-4 justify-between">
            <div className="flex items-center space-x-2">
              <p className="text-lg font-semibold">Filtros</p>
              <LoaderCircle className={cn("w-5 h-5", loading ? "animate-spin" : "invisible")}/>
            </div>
            <div>
              <Button onClick={clearFilters}>
                <EraserIcon className="w-4 h-4"/>
                Limpiar
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 items-center justify-center mt-3">
            {hasPrivileges && <div className="w-60">
                <UserSelect
                    selectItemText="Profesional"
                    searchPlaceholder="Buscar profesional"
                    value={professional}
                    filters={{
                      authorities: userService.professionalAuthorities,
                    }}
                    onSelect={setProfessional}
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
                onSelect={setAttendant}
              />
            </div>
            <SelectAppointmentType
              value={type}
              onChange={setType}
            />
            <CaneceledCheckbox
              value={canceled === true}
              onCheckedChange={setCanceled}
            />
          </div>
        </CardContent>
      </Card>

      <div className="mt-4 relative">
        <div>
          <FullCalendarController
            calendarRef={calendarRef}
          />
        </div>
        <Card className="h-[400px] overflow-y-scroll p-3 mt-4">
          <FullCalendarImproved
            locale={es}
            ref={calendarRef}
            slotMinTime="00:00:00"
            slotMaxTime="24:00:00"
            events={toEventsInputs(appointments, hasPrivileges)}
            datesSet={(arg) => setRange({from: arg.start, to: arg.end})}
            eventClick={(arg) => setAppointment(arg.event.extendedProps.appointment)}
          />
        </Card>
      </div>
      <AppointmentView appointment={appointment} onClose={() => setAppointment(undefined)}/>
    </BreadcrumbSubLayout>
  );
}


function toEventsInputs(appointments: Appointment[], hasPrivileged?: boolean): EventInput[] {
  const now = new Date();

  return appointments.map((appointment) => {
    const range = appointment.range;
    const canceled = appointment.canceled;
    const isPast = range.to < now;

    const title = hasPrivileged
      ? `${appointment.professional.firstName} ${appointment.professional.lastName}`
      : `${appointment.attendant.firstName} ${appointment.attendant.lastName}`

    return {
      id: appointment.id.toString(),
      title,
      start: range.from,
      end: range.to,
      editable: false,
      backgroundColor: `hsl(${getAppointmentColorVariable(canceled, isPast, false)})`,
      textColor: `hsl(${getAppointmentColorVariable(canceled, isPast, true)})`,
      extendedProps: {
        appointment,
        tooltipContent: {
          props: {
            className: "flex flex-col space-y-2 p-2 rounded-md shadow-md border border-gray-200"
          },
          child: (
            <div className="flex flex-col space-y-2">
              <p>Profesional: {appointment.professional.firstName} {appointment.professional.lastName}</p>
              <p>Usuario: {appointment.attendant.firstName} {appointment.attendant.lastName}</p>
              <p>{range.from.toLocaleDateString()} {range.from.toLocaleTimeString()} - {range.to.toLocaleTimeString()}</p>
            </div>
          )
        }
      }
    }
  });
}

function getAppointmentColorVariable(isCanceled: boolean, isPast: boolean, isForeground: boolean) {
  const suffix = isForeground ? '-foreground' : '';

  if (isCanceled) return getCSSVariableValue(`--destructive${suffix}`);
  if (isPast) return getCSSVariableValue(`--muted${suffix}`);
  return getCSSVariableValue(`--primary${suffix}`);
}
