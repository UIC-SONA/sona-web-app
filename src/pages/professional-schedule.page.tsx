import BreadcrumbSubLayout from "@/layout/breadcrumb-sub-layout.tsx";
import {
  createProfessionalSchedule,
  deleteProfessionalSchedule,
  getSchedulesByProfessionalId,
  ProfessionalSchedule,
  ProfessionalScheduleDto,
  updateProfessionalSchedule
} from "@/services/professional-schedule-service.ts";
import {
  Authority,
  pageUser,
  User
} from "@/services/user-service.ts";
import EventCalendar from "@/components/full-calendar/event-calendar.tsx";
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useState
} from "react";
import {Combobox} from "@/components/ui/combobox.tsx";
import {
  EventChangeArg,
  EventClickArg,
  EventInput
} from "@fullcalendar/core";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog.tsx";
import {useAuth} from "@/context/auth-context.tsx";
import {
  EditIcon,
  Plus,
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
import {cn} from "@/lib/utils.ts";
import {
  format,
  parse,
  parseISO
} from "date-fns";
import {Input} from "@/components/ui/input.tsx";
import {es} from 'date-fns/locale/es';
import {
  CreateForm,
  DeleteForm,
  FormComponentProps, UpdateForm
} from "@/components/crud/crud-forms.tsx";
import {DateTimePicker} from "@/components/ui/date-picker.tsx";

export default function ProfessionalSchedulePage() {
  const {authenticated} = useAuth();
  if (!authenticated) return null;

  const [schedules, setSchedules] = useState<ProfessionalSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [professionals, setProfessionals] = useState<User[]>([]);
  const [professional, setProfessional] = useState<User | undefined>();
  const [range, setRange] = useState({from: new Date(), to: new Date()});

  const [schedule, setSchedule] = useState<ProfessionalSchedule | undefined>();
  const [oldSchedule, setOldSchedule] = useState<ProfessionalSchedule | undefined>();

  const [scheduleViewOpen, setScheduleViewOpen] = useState(false);
  const [createScheduleOpen, setCreateScheduleOpen] = useState(false);
  const [updateScheduleOpen, setUpdateScheduleOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);


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
    const schedule = findSchedule(info.event.id);
    setSchedule(schedule);
    setOldSchedule(undefined);
    setScheduleViewOpen(true);
  }

  const handleEventChange = (info: EventChangeArg) => {
    const oldSchedule = findSchedule(info.event.id);

    const formatedDate = format(info.event.start!, "yyyy-MM-dd");

    const newSchedule: ProfessionalSchedule = {
      ...findSchedule(info.event.id),
      date: formatedDate,
      fromHour: info.event.start?.getHours() ?? 0,
      toHour: info.event.end?.getHours() ?? 0,
    };

    setSchedule(newSchedule);
    setOldSchedule(oldSchedule);
    updateSchedule(newSchedule);
    setUpdateScheduleOpen(true);
  }

  const loadProfessionals = useCallback(async (search?: string) => {
    setLoading(true);
    try {
      const professionals = await pageUser({
        search,
        page: 0,
        size: 15,
        authorities: [Authority.LEGAL_PROFESSIONAL, Authority.MEDICAL_PROFESSIONAL],
      });

      setProfessionals(professionals.content);
    } finally {
      setLoading(false);
    }
  }, []);


  useEffect(() => {
    if (!professional) return;

    const loadSchedules = async () => {
      if (!professional) return;

      const schedules = await getSchedulesByProfessionalId(professional.id, range.from, range.to);
      setSchedules(schedules);
    }

    loadSchedules().then();
  }, [professional, range]);


  useEffect(() => {
    loadProfessionals().then();
  }, []);


  const events = schedules.map(scheduleToEventInput);


  return (
    <BreadcrumbSubLayout items={["Professionales", "Horarios de atención"]}>
      <h1 className="text-2xl font-bold mb-4">Horarios de atención</h1>
      <p className="mb-2">Seleccione un profesional para ver sus horarios de atención.</p>
      <Combobox
        className="w-full"
        value={professional}
        items={professionals}
        onSelect={setProfessional}
        isLoading={loading}
        onSearch={loadProfessionals}
        debounceTime={300}
        onSearchInputChange={() => setLoading(true)}
        compare={(a, b) => a.id === b.id}
        toComboboxItem={(professional) => {
          return {
            value: professional.id.toString(),
            label: `${professional.firstName} ${professional.lastName}`,
          };
        }}
      />
      <Button onClick={() => setCreateScheduleOpen(true)} className={cn("mt-4", !professional && "hidden")}>
        <Plus/>
        Agregar horario
      </Button>
      <div className="mt-6">
        <EventCalendar
          slotMinTime="00:00:00"
          slotMaxTime="24:00:00"
          events={events}
          eventClick={handleEventClick}
          eventChange={handleEventChange}
          cardCalendarProps={{
            className: "h-[500px] overflow-y-scroll p-3",
          }}
          datesSet={(arg) => setRange({from: arg.start, to: arg.end})}
        />
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
          addSchedule={addSchedule}
        />
        <UpdateScheduleForm
          open={updateScheduleOpen}
          setOpen={setUpdateScheduleOpen}
          schedule={schedule}
          oldSchedule={oldSchedule}
          updateSchedule={updateSchedule}
        />
        <ScheduleDeleteForm
          open={deleteOpen}
          setOpen={setDeleteOpen}
          schedule={schedule}
          removeSchedule={removeSchedule}
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
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex justify-between items-center">
            Horario de atención de {professional?.firstName} {professional?.lastName}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {schedule?.date}
            <br/>
            {getPeriod(schedule?.fromHour)} - {getPeriod(schedule?.toHour)}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={() => setDeleteOpen(true)}>
            <TrashIcon/>
            Eliminar
          </AlertDialogAction>
          <AlertDialogAction onClick={() => setUpdateScheduleOpen(true)}>
            <EditIcon/>
            Editar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

interface CreateScheduleFormProps {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  professional?: User;
  addSchedule: (schedule: ProfessionalSchedule) => void;
}

const scheduleSchema: CrudSchema<ProfessionalScheduleDto> = z.object({
  date: z.date(),
  fromHour: z.coerce.number().min(0).max(24),
  toHour: z.coerce.number().min(0).max(24),
  professionalId: z.number(),
});

function CreateScheduleForm({open, setOpen, professional, addSchedule}: Readonly<CreateScheduleFormProps>) {
  return <CreateForm
    create={createProfessionalSchedule}
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
  oldSchedule?: ProfessionalSchedule
  updateSchedule: (schedule: ProfessionalSchedule) => void;
}

function UpdateScheduleForm({open, setOpen, schedule, oldSchedule, updateSchedule}: Readonly<UpdateScheduleFormProps>) {

  const defaultValues = schedule ? {
    date: parseISO(schedule.date),
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
    update={updateProfessionalSchedule}
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
    }}
    onCancel={resetSchedule}
    onCloseErrorDialog={resetSchedule}
  />
}

interface ScheduleDeleteFormProps {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  schedule?: ProfessionalSchedule;
  removeSchedule: (schedule: ProfessionalSchedule) => void;
}

function ScheduleDeleteForm({open, setOpen, schedule, removeSchedule}: Readonly<ScheduleDeleteFormProps>
) {
  return <DeleteForm
    entity={schedule}
    open={open}
    setOpen={setOpen}
    title="Eliminar horario"
    description="¿Está seguro que desea eliminar el horario de atención?"
    delete={deleteProfessionalSchedule}
    toastAction={{
      title: "Horario eliminado",
      description: "El horario de atención ha sido eliminado correctamente.",
    }}
    onSuccess={() => {
      removeSchedule(schedule as ProfessionalSchedule);
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
      date: parseISO(entity.date),
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

function scheduleToEventInput(schedule: ProfessionalSchedule): EventInput {
  const date = parse(schedule.date, "yyyy-MM-dd", new Date());
  const from = new Date(date.getFullYear(), date.getMonth(), date.getDate(), schedule.fromHour);
  const to = new Date(date.getFullYear(), date.getMonth(), date.getDate(), schedule.toHour);
  const title = `${getPeriod(schedule.fromHour)} - ${getPeriod(schedule.toHour)}`;
  const now = new Date();
  return {
    id: schedule.id.toString(),
    end: to,
    start: from,
    title: title,
    backgroundColor: "#3182ce",
    description: title,
    editable: now < from,
  };
}

function getPeriod(number?: number): string {
  if (number === undefined) return "";
  if (number >= 12) {
    return `${number} PM`;
  } else {
    return `${number} AM`;
  }
}