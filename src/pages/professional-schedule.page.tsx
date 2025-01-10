import BreadcrumbSubLayout from "@/layout/breadcrumb-sub-layout.tsx";
import {
  ProfessionalSchedule,
  ProfessionalScheduleDto,
  professionalScheduleService,
} from "@/services/professional-schedule-service.ts";
import {
  Authority,
  User,
  userService
} from "@/services/user-service.ts";
import FullCalendarImproved from "@/components/full-calendar/full-calendar-improved.tsx";
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
  LoaderCircle, SaveIcon,
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
import {DateTimePicker} from "@/components/ui/date-picker.tsx";
import {
  Dialog, DialogClose,
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
import FullCalendarController from "@/components/full-calendar/full-calendar-controller.tsx";
import {Card, CardContent} from "@/components/ui/card.tsx";
import {Checkbox} from "@/components/ui/checkbox.tsx";
import {Form, useForm, UseFormReturn} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";

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
  const [batchModeOpen, setBatchModeOpen] = useState(false);
  const [batchMode, setBatchMode] = useState(false);

  const calendarRef = useRef<FullCalendar | null>(null);

  const findSchedule = (id: string) => {
    return schedules.find((schedule) => schedule.id.toString() === id) as ProfessionalSchedule;
  }

  const addSchedule = (schedule: ProfessionalSchedule) => {
    setSchedules([...schedules, schedule]);
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
                    authorities: [Authority.LEGAL_PROFESSIONAL, Authority.MEDICAL_PROFESSIONAL]
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
              onClick={() => setBatchModeOpen(true)} disabled={!professional}
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

        <SelectCreationModelAlertDialog
          open={batchModeOpen}
          setOpen={setBatchModeOpen}
          setBatchMode={setBatchMode}
          setCreateScheduleOpen={setCreateScheduleOpen}
        />

        <CreateScheduleForm
          open={createScheduleOpen}
          setOpen={setCreateScheduleOpen}
          professional={professional}
          addSchedule={addSchedule}
          batch={batchMode}
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

interface SelectCreationModelAlertDialogProps {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  setBatchMode: Dispatch<SetStateAction<boolean>>;
  setCreateScheduleOpen: Dispatch<SetStateAction<boolean>>;
}

function SelectCreationModelAlertDialog(
  {
    open,
    setOpen,
    setBatchMode,
    setCreateScheduleOpen
  }: Readonly<SelectCreationModelAlertDialogProps>
) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Seleccionar modo de creación</DialogTitle>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={() => {
            setBatchMode(true);
            setCreateScheduleOpen(true);
            setOpen(false);
          }}>
            Crear en rango
          </Button>
          <Button onClick={() => {
            setBatchMode(false);
            setCreateScheduleOpen(true);
            setOpen(false);
          }}>
            Crear individual
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
  addSchedule: (schedule: ProfessionalSchedule) => void;
  batch?: boolean;
}

const scheduleSchema: CrudSchema<ProfessionalScheduleDto> = z.object({
  date: z.date(),
  fromHour: z.coerce.number().min(0).max(24),
  toHour: z.coerce.number().min(0).max(24),
  professionalId: z.number(),
});

function CreateScheduleForm(
  {
    open,
    setOpen,
    professional,
    addSchedule,
    batch
  }: Readonly<CreateScheduleFormProps>
) {

  if (batch) {
    return <BatchScheduleDialog
      open={open}
      onOpenChange={setOpen}
      professional={professional}
      onSubmit={async (schedules) => {
        const created = await professionalScheduleService.createAll(schedules);
        created.forEach(addSchedule);
      }}
    />
  }

  return <CreateForm<ProfessionalSchedule, ProfessionalScheduleDto, number>
    create={professionalScheduleService.create}
    open={open}
    setOpen={setOpen}
    title="Agregar horario de atención"
    description={`Agregar horario de atención para ${professional?.firstName} ${professional?.lastName}`}
    toastAction={{
      title: "Horario agregado",
      description: "El horario de atención ha sido agregado correctamente.",
    }}
    form={{
      FormComponent: (props) => <FormComponent {...props} professional={professional}/>,
      schema: scheduleSchema,
      defaultValues: {
        date: new Date(),
        fromHour: 8,
        toHour: 18,
        professionalId: professional?.id,
      },
    }}
    onSuccess={(schedule) => {
      addSchedule(schedule);
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
      FormComponent: (props) => <FormComponent {...props} entity={schedule}/>,
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


interface FormScheduleProps extends FormComponentProps<ProfessionalSchedule, ProfessionalScheduleDto> {
  professional?: User;
}

function FormComponent({form, entity, professional}: Readonly<FormScheduleProps>) {
  const now = new Date();

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
        return (
          <FormItem className="col-span-1 sm:col-span-2 md:col-span-2">
            <FormLabel>Fecha</FormLabel>
            <DateTimePicker
              locale={es}
              value={field.value}
              onChange={field.onChange}
              granularity="day"
              disabled={(date) => date < now}
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

  const events = schedule.map<EventInput>((schedule) => {
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

  return [...events, ...appoinmentsEvents];
}


interface BatchScheduleEntity {
  startDate?: Date;
  endDate?: Date;
  fromHour?: number;
  toHour?: number;
  selectedDays?: number[];
  professionalId?: number;
}

interface BatchScheduleFormProps {
  form: UseFormReturn<BatchScheduleFormValues>;
  entity: BatchScheduleEntity | null;
}

interface BatchScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (schedules: ProfessionalScheduleDto[]) => Promise<void>;
  loading?: boolean;
  professional?: User;
  entity?: BatchScheduleEntity | null;
}

interface WeekDay {
  id: number;
  label: string;
}

// Constantes
const WEEKDAYS: WeekDay[] = [
  {id: 1, label: "Lunes"},
  {id: 2, label: "Martes"},
  {id: 3, label: "Miércoles"},
  {id: 4, label: "Jueves"},
  {id: 5, label: "Viernes"},
  {id: 6, label: "Sábado"},
  {id: 0, label: "Domingo"}
];

// Schema de validación
const batchScheduleSchema = z.object({
  startDate: z.date({
    required_error: "La fecha inicial es requerida",
  }),
  endDate: z.date({
    required_error: "La fecha final es requerida",
  }),
  fromHour: z.number()
    .min(0, "La hora debe ser entre 0 y 24")
    .max(24, "La hora debe ser entre 0 y 24"),
  toHour: z.number()
    .min(0, "La hora debe ser entre 0 y 24")
    .max(24, "La hora debe ser entre 0 y 24"),
  selectedDays: z.array(z.number())
    .min(1, "Debe seleccionar al menos un día"),
  professionalId: z.number(),
}).refine(data => data.fromHour < data.toHour, {
  message: "La hora de inicio debe ser menor que la hora de fin",
  path: ["fromHour"],
}).refine(data => data.startDate <= data.endDate, {
  message: "La fecha final debe ser posterior a la inicial",
  path: ["endDate"],
});

type BatchScheduleFormValues = z.infer<typeof batchScheduleSchema>;

function BatchScheduleFormComponent({form}: Readonly<BatchScheduleFormProps>) {
  return (
    <Card className="p-4">
      <CardContent className="space-y-4 pt-0">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="startDate"
            render={({field}) => (
              <FormItem className="flex flex-col">
                <FormLabel>Fecha inicial</FormLabel>
                <DateTimePicker
                  granularity="day"
                  value={field.value}
                  onChange={field.onChange}
                  locale={es}
                />
                <FormMessage/>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endDate"
            render={({field}) => (
              <FormItem className="flex flex-col">
                <FormLabel>Fecha final</FormLabel>
                <DateTimePicker
                  granularity="day"
                  value={field.value}
                  onChange={field.onChange}
                  locale={es}
                  disabled={(date) => {
                    const startDate = form.getValues("startDate");
                    return startDate ? date < startDate : false;
                  }}
                />
                <FormMessage/>
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="fromHour"
            render={({field}) => (
              <FormItem>
                <FormLabel>Hora de inicio</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    max={23}
                    {...field}
                    onChange={e => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage/>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="toHour"
            render={({field}) => (
              <FormItem>
                <FormLabel>Hora de fin</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    max={24}
                    {...field}
                    onChange={e => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage/>
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="selectedDays"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel>Días de la semana</FormLabel>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {WEEKDAYS.map((day) => (
                  <FormField
                    key={day.id}
                    control={form.control}
                    name="selectedDays"
                    render={({field}) => {
                      return (
                        <FormItem
                          key={day.id}
                          className="flex flex-row items-center space-x-2"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(day.id)}
                              onCheckedChange={(checked) => {
                                const current = field.value || [];
                                const updated = checked
                                  ? [...current, day.id]
                                  : current.filter((value) => value !== day.id);
                                field.onChange(updated);
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">
                            {day.label}
                          </FormLabel>
                        </FormItem>
                      );
                    }}
                  />
                ))}
              </div>
              <FormMessage/>
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}

const generateSchedules = (formData: BatchScheduleFormValues): ProfessionalScheduleDto[] => {
  const schedules: ProfessionalScheduleDto[] = [];
  const current = new Date(formData.startDate);
  const end = new Date(formData.endDate);

  while (current <= end) {
    const dayOfWeek = current.getDay();

    if (formData.selectedDays.includes(dayOfWeek)) {
      schedules.push({
        date: current,
        fromHour: formData.fromHour,
        toHour: formData.toHour,
        professionalId: formData.professionalId
      });
    }

    current.setDate(current.getDate() + 1);
  }

  return schedules;
};

function BatchScheduleDialog(
  {
    open,
    onOpenChange,
    onSubmit,
    loading = false,
    professional,
    entity = null,
  }: Readonly<BatchScheduleDialogProps>) {

  const form = useForm<BatchScheduleFormValues>({
    resolver: zodResolver(batchScheduleSchema),
    defaultValues: {
      startDate: entity?.startDate || new Date(),
      endDate: entity?.endDate || new Date(),
      fromHour: entity?.fromHour ?? 8,
      toHour: entity?.toHour ?? 17,
      selectedDays: entity?.selectedDays || [],
      professionalId: professional?.id,
    },
  });

  const handleSubmit = async (data: BatchScheduleFormValues) => {
    const schedules = generateSchedules(data);
    await onSubmit(schedules);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={true}>
      <DialogContent
        className="max-w-[80vw] max-h-[80vh] overflow-y-auto"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} autoComplete="off">
            <DialogHeader className="mb-5">
              <DialogTitle className="text-2xl font-bold">
                Configuración de horarios en rango
              </DialogTitle>
              <DialogDescription>
                Configure los horarios de atención para múltiples días
              </DialogDescription>
            </DialogHeader>

            <BatchScheduleFormComponent form={form} entity={entity}/>

            <DialogFooter className="justify-end mt-4">
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="secondary"
                  className="mt-3 sm:mt-0"
                >
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" disabled={loading}>
                {loading ? <LoaderCircle className="animate-spin"/> : <SaveIcon/>}
                Guardar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}