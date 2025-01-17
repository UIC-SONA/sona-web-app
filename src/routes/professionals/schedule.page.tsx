import BreadcrumbSubLayout from "@/layout/breadcrumb-sub-layout.tsx";
import {
  ProfessionalSchedule,
  ProfessionalScheduleDto,
  ProfessionalSchedulesDto,
  professionalScheduleService,
} from "@/services/professional-schedule-service.ts";
import {
  User,
  userService
} from "@/services/user-service.ts";
import FullCalendarImproved from "@/components/calendar/full-calendar-improved.tsx";
import FullCalendarController from "@/components/calendar/full-calendar-controller.tsx"
import {
  Dispatch,
  useEffect,
  SetStateAction,
  useRef,
  useState
} from "react";
import {ComboboxRemote} from "@/components/ui/combobox.tsx";
import {
  EventChangeArg,
  EventClickArg,
  EventInput
} from "@fullcalendar/core";
import {useAuth} from "@/context/auth-context.tsx";
import {
  Calendar,
  EditIcon,
  LoaderCircle,
  TrashIcon
} from "lucide-react";
import {Button} from "@/components/ui/button.tsx";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form.tsx";
import {z} from "zod";
import {CrudSchema} from "@/components/crud/crud-common.ts";
import {cn, dispatchAsyncStates, getCSSVariableValue, getPeriod} from "@/lib/utils.ts";
import {Input} from "@/components/ui/input.tsx";
import {es} from 'date-fns/locale/es';
import {
  CreateForm,
  DeleteForm,
  FormComponentProps,
  UpdateForm
} from "@/components/crud/crud-forms.tsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog.tsx";
import {
  AppointmentsRange,
  appointmentsService
} from "@/services/appointments-service.ts";
import {Switch} from "@/components/ui/switch.tsx";
import {Label} from "@/components/ui/label.tsx";
import {useTheme} from "@/context/theme-context.tsx";
import FullCalendar from "@fullcalendar/react";
import {Card} from "@/components/ui/card.tsx";
import {CalendarDate, today} from "@internationalized/date";
import DateRangePicker from "@/components/ui/date/date-range-picker.tsx";
import DatePicker from "@/components/ui/date/date-picker.tsx";
import {ZONE_ID} from "@/constans.ts";

export default function ProfessionalSchedulePage() {
  const {authenticated} = useAuth();
  if (!authenticated) return null;

  const {theme} = useTheme();

  const [schedule, setSchedule] = useState<ProfessionalSchedule | undefined>();
  const [oldSchedule, setOldSchedule] = useState<ProfessionalSchedule | undefined>();
  const [schedules, setSchedules] = useState<ProfessionalSchedule[]>([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);

  const [professional, setProfessional] = useState<User | undefined>();
  const [range, setRange] = useState({from: new Date(), to: new Date()});

  const [appointments, setAppointments] = useState<AppointmentsRange[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [showAppointments, setShowAppointments] = useState(false);

  const [scheduleViewOpen, setScheduleViewOpen] = useState(false);
  const [createScheduleOpen, setCreateScheduleOpen] = useState(false);
  const [updateScheduleOpen, setUpdateScheduleOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const calendarRef = useRef<FullCalendar | null>(null);

  const findSchedule = (id: string) => {
    return schedules.find((schedule) => schedule.id.toString() === id) as ProfessionalSchedule;
  }

  const addSchedules = (newSchedules: ProfessionalSchedule[]) => {
    setSchedules([...schedules, ...newSchedules]);
  }

  const removeSchedule = (schedule: ProfessionalSchedule) => {
    setSchedules(schedules.filter((s) => s.id !== schedule.id));
  }

  const updateSchedule = (schedule: ProfessionalSchedule) => {
    setSchedules(schedules.map((s) => s.id === schedule.id ? schedule : s));
  }

  const handleEventClick = (info: EventClickArg) => {
    const schedule = info.event.extendedProps.schedule;
    if (schedule) {
      setSchedule(schedule as ProfessionalSchedule);
      setOldSchedule(undefined);
      setScheduleViewOpen(true);
    }
  }


  const handleEventChange = (info: EventChangeArg) => {
    const {start, end, extendedProps} = info.event;
    if (!start || !end || !extendedProps) return;
    const schedule = extendedProps.schedule;
    if (schedule) {
      const oldSchedule = schedule as ProfessionalSchedule;

      const newSchedule: ProfessionalSchedule = {
        ...findSchedule(info.event.id),
        date: start,
        fromHour: start.getHours(),
        toHour: end.getHours(),
      };

      setSchedule(newSchedule);
      setOldSchedule(oldSchedule);
      updateSchedule(newSchedule);
      setUpdateScheduleOpen(true);
    }
  }

  useEffect(() => {
    if (!professional) {
      setSchedules([]);
      setAppointments([]);
      return;
    }
    dispatchAsyncStates(() => professionalScheduleService.getByProfessional(professional.id, range.from, range.to), setSchedules, setLoadingSchedules);
    dispatchAsyncStates(() => appointmentsService.getAppointmentsRangesByProfessional(professional.id, range.from, range.to), setAppointments, setLoadingAppointments);
  }, [professional, range]);

  useEffect(() => {
    // FORZAR EL CAMBIO DE ESTADO DE LOS COLORES DE LOS EVENTOS CUANDO SE CAMBIE EL TEMA
    setAppointments([...appointments]);
  }, [theme]);


  return (
    <BreadcrumbSubLayout items={["Professionales", "Horarios de atención"]}>

      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Horarios de atención</h1>

        <p className="text-muted-foreground text-sm">
          Seleccione un profesional para ver sus horarios de atención.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-4">
          <div className="col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-4">
            <ComboboxRemote<User>
              className="w-full"
              value={professional}
              onSelect={setProfessional}
              fetchItems={async (search) => {
                const professionals = await userService.page({
                  search,
                  page: 0,
                  size: 15,
                  filters: {
                    authorities: userService.professionalAuthorities,
                  },
                });
                return professionals.content;
              }}
              comboboxItem={(professional) => ({
                value: professional.id.toString(),
                label: `${professional.firstName} ${professional.lastName}`
              })}
            />
          </div>
          <div className="col-span-1 md:col-span-2 lg:col-span-1">
            <Button
              className="w-full"
              onClick={() => setCreateScheduleOpen(true)} disabled={!professional}
            >
              <Calendar className="mr-2 h-4 w-4"/>
              Agregar horario
            </Button>
          </div>
        </div>

        <div className={cn(!professional && "hidden", "flex items-center gap-4")}>
          <Switch
            checked={showAppointments}
            onCheckedChange={setShowAppointments}
          />
          <Label>Mostrar citas</Label>
          <LoaderCircle className={cn((loadingSchedules || loadingAppointments) ? "animate-spin" : "invisible")}/>
        </div>
      </div>

      <div className="mt-4">
        <div>
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
            events={toEventsInputs(schedules, showAppointments ? appointments : [])}
            eventClick={handleEventClick}
            eventChange={handleEventChange}
            datesSet={(arg) => setRange({from: arg.start, to: arg.end})}
          />
        </Card>

        <ScheduleView
          schedule={schedule}
          open={scheduleViewOpen}
          setOpen={setScheduleViewOpen}
          setDeleteOpen={setDeleteOpen}
          setUpdateScheduleOpen={setUpdateScheduleOpen}
        />

        <CreateScheduleForm
          open={createScheduleOpen}
          setOpen={setCreateScheduleOpen}
          professional={professional}
          addSchedules={addSchedules}
        />

        <UpdateScheduleForm
          open={updateScheduleOpen}
          setOpen={setUpdateScheduleOpen}
          schedule={schedule}
          setSchedule={setSchedule}
          oldSchedule={oldSchedule}
          updateSchedule={updateSchedule}
        />
        <DeleteScheduleForm
          open={deleteOpen}
          setOpen={setDeleteOpen}
          schedule={schedule}
          removeSchedule={removeSchedule}
          setScheduleViewOpen={setScheduleViewOpen}
        />
      </div>
    </BreadcrumbSubLayout>
  );
}

interface ScheduleViewProps {
  schedule?: ProfessionalSchedule;
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  setDeleteOpen: Dispatch<SetStateAction<boolean>>;
  setUpdateScheduleOpen: Dispatch<SetStateAction<boolean>>;
}

function ScheduleView({schedule, open, setOpen, setDeleteOpen, setUpdateScheduleOpen}: Readonly<ScheduleViewProps>) {

  const professional = schedule?.professional;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
      >
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            Horario de atención de {professional?.firstName} {professional?.lastName}
          </DialogTitle>
          <DialogDescription>
            {schedule?.date.toLocaleDateString("es-ES")}
            <br/>
            {schedule?.fromHour + " " + getPeriod(schedule?.fromHour)} - {schedule?.toHour + " " + getPeriod(schedule?.toHour)}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={() => setDeleteOpen(true)}>
            <TrashIcon/>
            Eliminar
          </Button>
          <Button onClick={() => setUpdateScheduleOpen(true)}>
            <EditIcon/>
            Editar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface CreateScheduleFormProps {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  professional?: User;
  addSchedules: (schedule: ProfessionalSchedule[]) => void;
}

const scheduleSchema: CrudSchema<ProfessionalScheduleDto> = z.object({
  date: z.date(),
  fromHour: z.coerce.number().min(0).max(24),
  toHour: z.coerce.number().min(0).max(24),
  professionalId: z.number(),
});

const schendulesSchema: CrudSchema<ProfessionalSchedulesDto> = z.object({
  dates: z.array(z.date()),
  fromHour: z.coerce.number().min(0).max(24),
  toHour: z.coerce.number().min(0).max(24),
  professionalId: z.number(),
});

function CreateScheduleForm(
  {
    open,
    setOpen,
    professional,
    addSchedules,
  }: Readonly<CreateScheduleFormProps>
) {

  return <CreateForm<ProfessionalSchedule[], ProfessionalSchedulesDto>
    create={professionalScheduleService.createAll}
    open={open}
    setOpen={setOpen}
    title="Agregar horario de atención"
    description={`Agregar horario de atención para ${professional?.firstName} ${professional?.lastName}`}
    toastAction={{
      title: "Horario agregado",
      description: "El horario de atención ha sido agregado correctamente.",
    }}
    form={{
      FormComponent: (props) => <CreateFormSchedule {...props} professional={professional}/>,
      schema: schendulesSchema,
      defaultValues: {
        dates: [new Date()],
        fromHour: 8,
        toHour: 18,
        professionalId: professional?.id,
      },
    }}
    onSuccess={(schedule) => {
      addSchedules(schedule);
    }}
  />
}

interface UpdateScheduleFormProps {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  schedule?: ProfessionalSchedule;
  setSchedule: Dispatch<SetStateAction<ProfessionalSchedule | undefined>>;
  oldSchedule?: ProfessionalSchedule
  updateSchedule: (schedule: ProfessionalSchedule) => void;
}

function UpdateScheduleForm(
  {
    open,
    setOpen,
    schedule,
    oldSchedule,
    updateSchedule,
    setSchedule
  }: Readonly<UpdateScheduleFormProps>
) {

  const defaultValues = schedule ? {
    date: schedule.date,
    fromHour: schedule.fromHour,
    toHour: schedule.toHour,
    professionalId: schedule.professional.id,
  } : {
    date: new Date(),
    fromHour: 8,
    toHour: 18,
    professionalId: 0,
  }

  const resetSchedule = () => {
    if (oldSchedule) {
      updateSchedule(oldSchedule);
    }
  }

  return <UpdateForm
    entity={schedule as ProfessionalSchedule}
    update={professionalScheduleService.update}
    open={open}
    setOpen={setOpen}
    title="Actualizar horario"
    description="Actualizar horario de atención"
    toastAction={{
      title: "Horario actualizado",
      description: "El horario de atención ha sido actualizado correctamente.",
    }}
    form={{
      FormComponent: (props) => <UpdateFormSchedule {...props} entity={schedule}/>,
      schema: scheduleSchema,
      defaultValues: defaultValues,
    }}
    onSuccess={(schedule) => {
      updateSchedule(schedule);
      setSchedule(schedule);
    }}
    onCancel={resetSchedule}
  />
}

interface ScheduleDeleteFormProps {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  schedule?: ProfessionalSchedule;
  removeSchedule: (schedule: ProfessionalSchedule) => void;
  setScheduleViewOpen: Dispatch<SetStateAction<boolean>>;
}

function DeleteScheduleForm({open, setOpen, schedule, removeSchedule, setScheduleViewOpen}: Readonly<ScheduleDeleteFormProps>
) {
  return <DeleteForm
    entity={schedule}
    open={open}
    setOpen={setOpen}
    title="Eliminar horario"
    description="¿Está seguro que desea eliminar el horario de atención?"
    delete={professionalScheduleService.delete}
    toastAction={{
      title: "Horario eliminado",
      description: "El horario de atención ha sido eliminado correctamente.",
    }}
    onSuccess={() => {
      removeSchedule(schedule as ProfessionalSchedule);
      setScheduleViewOpen(false);
    }}
  />
}

interface CreateFormScheduleProps extends FormComponentProps<ProfessionalSchedule[], ProfessionalSchedulesDto> {
  professional?: User;
}

function CreateFormSchedule({form, professional}: Readonly<CreateFormScheduleProps>) {
  const now = today(ZONE_ID);

  useEffect(() => {
    if (!professional) return;
    form.setValue("professionalId", professional.id);
  }, [professional]);

  return <div className="gap-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
    <FormField
      control={form.control}
      name="dates"
      render={({field}) => {

        return (
          <FormItem className="col-span-1 sm:col-span-2 md:col-span-2">
            <FormLabel>Fecha</FormLabel>
            <DateRangePicker<CalendarDate>
              isDateUnavailable={(date) => date.compare(now) < 0}
              onChange={value => {
                if (!value) {
                  field.onChange([]);
                  return;
                }
                const startDate = value.start.toDate(ZONE_ID);
                const endDate = value.end.toDate(ZONE_ID);
                field.onChange(getDays(startDate, endDate));
              }}
            />
            <FormMessage/>
          </FormItem>
        );
      }}
    />

    <FormField
      control={form.control}
      name="fromHour"
      render={({field}) => (
        <FormItem className="col-span-1">
          <FormLabel>Hora de inicio</FormLabel>
          <FormControl>
            <Input type="number" {...field} />
          </FormControl>
          <FormMessage/>
        </FormItem>
      )}
    />

    <FormField
      control={form.control}
      name="toHour"
      render={({field}) => (
        <FormItem className="col-span-1">
          <FormLabel>Hora de fin</FormLabel>
          <FormControl>
            <Input type="number" {...field} />
          </FormControl>
          <FormMessage/>
        </FormItem>
      )}
    />
  </div>
}

function getDays(start: Date, end: Date): Date[] {
  const dates = [];
  for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(new Date(d));
  }
  return dates;
}

interface UpdateFormScheduleProps extends FormComponentProps<ProfessionalSchedule, ProfessionalScheduleDto> {
  professional?: User;
}

function UpdateFormSchedule({form, entity, professional}: Readonly<UpdateFormScheduleProps>) {
  const now = today(ZONE_ID);

  useEffect(() => {
    if (!professional) return;
    form.setValue("professionalId", professional.id);
  }, [professional]);

  useEffect(() => {
    if (!entity) return;

    const defaultValues = {
      date: entity.date,
      fromHour: entity.fromHour,
      toHour: entity.toHour,
      professionalId: entity.professional.id,
    }

    form.reset(defaultValues);
  }, [form, entity]);


  return <div className="gap-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
    <FormField
      control={form.control}
      name="date"
      render={({field}) => {
        const date: Date | undefined = field.value;
        const value = date ? new CalendarDate(date.getFullYear(), date.getMonth(), date.getDate()) : undefined;

        return (
          <FormItem className="col-span-1 sm:col-span-2 md:col-span-2">
            <FormLabel>Fecha</FormLabel>
            <DatePicker<CalendarDate>
              isDateUnavailable={(date) => date.compare(now) < 0}
              defaultValue={value}
              onChange={(value) => {
                if (!value) {
                  field.onChange(undefined);
                  return;
                }
                field.onChange(value.toDate(ZONE_ID));
              }}
            />
            <FormMessage/>
          </FormItem>
        );
      }}
    />

    <FormField
      control={form.control}
      name="fromHour"
      render={({field}) => (
        <FormItem className="col-span-1">
          <FormLabel>Hora de inicio</FormLabel>
          <FormControl>
            <Input type="number" {...field} />
          </FormControl>
          <FormMessage/>
        </FormItem>
      )}
    />

    <FormField
      control={form.control}
      name="toHour"
      render={({field}) => (
        <FormItem className="col-span-1">
          <FormLabel>Hora de fin</FormLabel>
          <FormControl>
            <Input type="number" {...field} />
          </FormControl>
          <FormMessage/>
        </FormItem>
      )}
    />
  </div>
}

function toEventsInputs(schedule: ProfessionalSchedule[], appoinments: AppointmentsRange[]): EventInput[] {
  const now = new Date();

  const scheduleColor = getCSSVariableValue("--primary");
  const scheduletextColor = getCSSVariableValue("--primary-foreground");

  const schenduleEvents = schedule.map<EventInput>((schedule) => {
    const date = schedule.date;
    const from = new Date(date.getFullYear(), date.getMonth(), date.getDate(), schedule.fromHour);
    const to = new Date(date.getFullYear(), date.getMonth(), date.getDate(), schedule.toHour);
    const title = "Horario de atención";


    return {
      id: schedule.id.toString(),
      end: to,
      start: from,
      title: title,
      backgroundColor: `hsl(${scheduleColor})`,
      textColor: `hsl(${scheduletextColor})`,
      description: title,
      editable: now < from,
      extendedProps: {schedule},
    };
  });

  const appoinmentsColor = getCSSVariableValue("--secondary");
  const appoinmentsTextColor = getCSSVariableValue("--secondary-foreground");

  const appoinmentsEvents = appoinments.map((appoinment) => {
    const from = new Date(appoinment.from);
    const to = new Date(appoinment.to);
    const title = 'Cita reservada';
    return {
      id: `${appoinment.from}-${appoinment.to}`,
      end: to,
      start: from,
      title: title,
      backgroundColor: `hsl(${appoinmentsColor})`,
      textColor: `hsl(${appoinmentsTextColor})`,
      description: title,
      editable: false,
      extendedProps: {appoinment},
    };
  });

  return [...schenduleEvents, ...appoinmentsEvents];
}