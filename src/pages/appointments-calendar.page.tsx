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
  User
} from "@/services/user-service.ts";
import FullCalendarController from "@/components/full-calendar/full-calendar-controller.tsx";
import {
  Card,
  CardContent
} from "@/components/ui/card.tsx";
import FullCalendarImproved from "@/components/full-calendar/full-calendar-improved.tsx";
import {es} from "date-fns/locale/es";
import FullCalendar from "@fullcalendar/react";
import {
  CaneceledCheckbox,
  SelectAppointmentType
} from "@/pages/appointment.page.tsx";
import {
  EraserIcon,
  LoaderCircle,
  UserIcon
} from "lucide-react";
import {
  cn,
  getCSSVariableValue, getPeriod
} from "@/lib/utils.ts";
import {EventInput} from "@fullcalendar/core";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog.tsx";
import {Badge} from "@/components/ui/badge.tsx";
import {format} from "date-fns";
import {Button} from "@/components/ui/button.tsx";
import UserSelect from "@/components/user-select.tsx";

export default function AppointmentsCalendarPage() {

  const calendarRef = useRef<FullCalendar | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [appointment, setAppointment] = useState<Appointment | undefined>();
  const [range, setRange] = useState({from: new Date(), to: new Date()});
  const [loading, setLoading] = useState(false);
  const [professional, setProfessional] = useState<User | undefined>();
  const [user, setUser] = useState<User | undefined>();
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
    setRange({from: new Date(), to: new Date()});
  }

  useEffect(() => {
    loadAppointments().then();
  }, [range, professional, canceled, type]);

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
            <div className="w-60">
              <UserSelect
                selectItemText="Profesional"
                searchPlaceholder="Buscar profesional"
                value={professional}
                filters={{
                  authorities: [Authority.LEGAL_PROFESSIONAL, Authority.MEDICAL_PROFESSIONAL]
                }}
                onSelect={setProfessional}
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
                onSelect={setUser}
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
        <div className="absolute bottom-4 transform z-10">
          <FullCalendarController
            calendarRef={calendarRef}
          />
        </div>
        <Card className="h-[500px] overflow-y-scroll p-3 mt-4">
          <FullCalendarImproved
            locale={es}
            ref={calendarRef}
            slotMinTime="00:00:00"
            slotMaxTime="24:00:00"
            events={toEventsInputs(appointments)}
            datesSet={(arg) => setRange({from: arg.start, to: arg.end})}
            eventClick={(arg) => setAppointment(arg.event.extendedProps.appointment)}
          />
        </Card>
      </div>
      <AppointmentView appointment={appointment} onClose={() => setAppointment(undefined)}/>
    </BreadcrumbSubLayout>
  );
}

interface AppointmentViewProps {
  appointment?: Appointment;
  onClose: () => void;
}

function AppointmentView({appointment, onClose}: Readonly<AppointmentViewProps>) {
  const period = getPeriod(appointment?.hour);
  const formattedDate = appointment ? format(appointment.date, "EEEE d 'de' MMMM 'de' yyyy", {locale: es}) : '';
  const formattedHour = appointment ? `${appointment.hour} ${period}` : '';

  return (
    <Dialog open={!!appointment} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md rounded-lg shadow-lg">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="flex justify-between items-center text-lg font-semibold">
            <span>Detalles de la Cita</span>
            {appointment?.canceled && (
              <Badge variant="destructive" className="ml-2 text-xs">
                Cancelada
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>
        {appointment && (
          <div className="grid gap-6">
            <div className="space-y-1">
              <h4 className="font-semibold text-sm">Fecha y Hora</h4>
              <p className="text-sm">{formattedDate} - {formattedHour}</p>
            </div>

            <div className="space-y-1">
              <h4 className="font-semibold text-sm">Tipo de Cita</h4>
              <p className="text-sm">{appointmentsService.getAppointmentTypeName(appointment.type)}</p>
            </div>

            <div className="space-y-1">
              <h4 className="font-semibold text-sm">Profesional</h4>
              <div className="flex items-center gap-2 text-sm">
                <UserIcon size={16}/>
                <span>{appointment.professional.firstName + ' ' + appointment.professional.lastName}</span>
              </div>
            </div>

            <div className="space-y-1">
              <h4 className="font-semibold text-sm">Paciente</h4>
              <div className="flex items-center gap-2 text-sm">
                <UserIcon size={16}/>
                <span>{appointment.attendant.firstName + ' ' + appointment.attendant.lastName}</span>
              </div>
            </div>

            {appointment.canceled && appointment.cancellationReason && (
              <div className="space-y-1">
                <h4 className="font-semibold text-sm">Motivo de Cancelación</h4>
                <p className="text-sm">{appointment.cancellationReason}</p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function toEventsInputs(appointments: Appointment[]): EventInput[] {
  return appointments.map((appointment) => {
    const range = appointment.range;

    const scheduleColor = getCSSVariableValue("--primary");
    const scheduletextColor = getCSSVariableValue("--primary-foreground");
    return {
      id: appointment.id.toString(),
      title: `${appointment.professional.firstName} ${appointment.professional.lastName}`,
      start: range.from,
      end: range.to,
      editable: false,
      backgroundColor: `hsl(${scheduleColor})`,
      textColor: `hsl(${scheduletextColor})`,
      extendedProps: {
        appointment,
        tooltipContent: {
          props: {
            className: "flex flex-col space-y-2  p-2 rounded-md shadow-md border border-gray-200"
          },
          child: (
            <div className="flex flex-col space-y-2">
              <p>Profesional: {appointment.professional.firstName} {appointment.professional.lastName}</p>
              <p>Atendido: {appointment.attendant.firstName} {appointment.attendant.lastName}</p>
              <p>{range.from.toLocaleDateString()} {range.from.toLocaleTimeString()} - {range.to.toLocaleTimeString()}</p>
            </div>
          )
        }
      }
    }
  });
}