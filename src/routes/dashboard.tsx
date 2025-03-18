import BreadcrumbSubLayout from "@/layout/breadcrumb-sub-layout.tsx";
import {
  useMemo,
  useEffect,
  useRef,
  useState
} from "react";
import {
  Appointment,
  appointmentsService,
  AppointmentType
} from "@/services/appointments-service.ts";
import {useAuth} from "@/context/auth-context.tsx";
import {
  Authority,
  User,
  userService
} from "@/services/user-service.ts";
import {Heart, LoaderCircle, MessageCircle} from "lucide-react";
import UserSelect from "@/components/user-select.tsx";
import DatePicker from "@/components/ui/date/date-picker.tsx";
import {CalendarDate} from "@internationalized/date";
import {ZONE_ID} from "@/constans.ts";
import {
  AreaData, AreaSeries,
  AreaSeriesPartialOptions,
  ChartOptions,
  ColorType,
  createChart,
  DeepPartial,
  ISeriesApi
} from "lightweight-charts";
import {
  Card,
  CardContent, CardFooter,
  CardHeader, CardTitle
} from "@/components/ui/card.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select.tsx";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs.tsx";
import {Separator} from "@/components/ui/separator.tsx";
import {Post, postService, TopPostsDto} from "@/services/post-service.ts";
import {format} from "date-fns";
import {Tip, tipsService} from "@/services/tip-service.ts";
import TopTips from "@/components/tips.tsx";
import {useSidebar} from "@/components/ui/sidebar.tsx";


export default function Dashboard() {
  const {user} = useAuth();
  
  return (
    <BreadcrumbSubLayout items={[]}>
      <h1 className="text-2xl font-semibold mb-3.5">Dashboard</h1>
      {user && <Tabs defaultValue="appointments">
        <TabsList>
          <TabsTrigger value="appointments">Citas</TabsTrigger>
          <TabsTrigger value="posts">Publicaciones</TabsTrigger>
          <TabsTrigger value="tips">Tips</TabsTrigger>
        </TabsList>
        <Separator className="my-3"/>
        <TabsContent value="appointments">
          <AppointmensCharts user={user}/>
        </TabsContent>
        <TabsContent value="posts">
          <TopPosts/>
        </TabsContent>
        <TabsContent value="tips">
          <Tips/>
        </TabsContent>
      </Tabs>}
    </BreadcrumbSubLayout>
  );
}


function Tips() {
  const [tips, setTips] = useState<Tip[]>([]);
  const [loading, setLoading] = useState(true);
  
  const loadTips = async () => {
    setLoading(true);
    try {
      const tips = await tipsService.topTips();
      setTips(tips);
    } finally {
      setLoading(false);
    }
  }
  
  useEffect(() => {
    loadTips();
  }, []);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Tips</CardTitle>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="flex items-center justify-center">
            <LoaderCircle className="w-5 h-5 animate-spin"/>
          </div>
        )}
        {!loading && tips.length === 0 && (
          <p className="text-muted-foreground">No hay tips aún</p>
        )}
        {!loading && tips.length > 0 && (
          <TopTips tips={tips}/>
        )}
      </CardContent>
    </Card>
  );
}


function TopPosts() {
  const [topPostsDto, setTopPostsDto] = useState<TopPostsDto | undefined>();
  const [loading, setLoading] = useState(true);
  
  const loadTopPosts = async () => {
    setLoading(true);
    try {
      const topPosts = await postService.topPosts();
      setTopPostsDto(topPosts);
    } finally {
      setLoading(false);
    }
  }
  
  useEffect(() => {
    loadTopPosts();
  }, []);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Publicaciones Destacadas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="col-span-1">
            <PostView
              title="Publicación más gustada"
              post={topPostsDto?.mostLikedPost}
              loading={loading}
              emptyMessage="No hay publicaciones gustadas aún"
            />
          </div>
          <div className="col-span-1">
            <PostView
              title="Publicación más comentada"
              post={topPostsDto?.mostCommentedPost}
              loading={loading}
              emptyMessage="No hay publicaciones comentadas aún"
            />
          </div>
        </div>
      </CardContent>
      <CardFooter>
      
      </CardFooter>
    </Card>
  );
}

function PostView({
                    title,
                    post,
                    loading,
                    emptyMessage = "No hay publicaciones"
                  }: Readonly<{
  title: string,
  post?: Post | null,
  loading: boolean,
  emptyMessage?: string
}>) {
  
  const hasAuthor = post?.author != null;
  const [author, setAuthor] = useState<User | undefined>();
  const [authorLoading, setAuthorLoading] = useState(true);
  
  useEffect(() => {
    setAuthorLoading(true);
    if (hasAuthor) {
      userService.find(post.author!).then(setAuthor).finally(() => setAuthorLoading(false));
    } else {
      setAuthorLoading(false);
    }
  }, [hasAuthor]);
  
  
  const buildAuthorSection = () => {
    if (authorLoading) {
      return (
        <div className="flex items-center justify-center">
          <LoaderCircle className="w-5 h-5 animate-spin"/>
        </div>
      );
    }
    if (author) {
      return (
        <div className="flex items-center gap-2">
          <p className="text-sm">{author.firstName + ' ' + author.lastName}</p>
          <p className="text-xs text-muted-foreground">{author.email}</p>
        </div>
      );
    }
    return <div>
      <p className="text-muted-foreground">Autor anónimo</p>
    </div>
  }
  
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <div className="flex items-center gap-2">
          {buildAuthorSection()}
        </div>
      </CardHeader>
      <CardContent className="flex-grow flex items-center justify-center">
        {loading && (
          <div className="flex items-center justify-center">
            <LoaderCircle className="w-5 h-5 animate-spin"/>
          </div>
        )}
        
        {!loading && !post && (
          <p className="text-muted-foreground">{emptyMessage}</p>
        )}
        
        {!loading && post && (
          <div className="space-y-2">
            <p className="text-sm">{post.content}</p>
            <p className="text-xs text-muted-foreground">
              {format(post.createdAt, 'dd/MM/yyyy HH:mm')}
            </p>
          </div>
        )}
      </CardContent>
      {!loading && post && (
        <CardFooter className="flex justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4"/>
            {post.likedBy.length} Likes
          </div>
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4"/>
            {post.comments.length} Comentarios
          </div>
        </CardFooter>
      )}
    </Card>
  );
}

const chartConfig: DeepPartial<ChartOptions> = {
  layout: {
    attributionLogo: false,
    background: {
      type: ColorType.Solid,
      color: 'rgba(255,255,255,0)',
    },
    textColor: '#8C9BA5',
  },
  grid: {
    vertLines: {
      visible: false,
    },
    horzLines: {
      visible: false,
    }
  },
  localization: {
    locale: 'es-ES',
  },
  height: 250,
};

const appointmenAreaConfig: AreaSeriesPartialOptions = {
  topColor: '#2962FF',
  bottomColor: 'rgba(41, 98, 255, 0.28)',
  lineColor: '#2962FF',
  lineWidth: 2,
  title: 'Cantidad de citas',
};

function AppointmensCharts({user}: Readonly<{ user: User }>) {
  const hasPrivileged = userService.hasPrivilegedUser(user);
  const currentYear = new Date().getFullYear();
  
  const [professionalType, setProfessionalType] = useState<Authority.LEGAL_PROFESSIONAL | Authority.MEDICAL_PROFESSIONAL | undefined>();
  const [professional, setProfessional] = useState<User | undefined>();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState<CalendarDate | null>(new CalendarDate(currentYear, 1, 1));
  const [to, setTo] = useState<CalendarDate | null>(new CalendarDate(currentYear, 12, 31));
  const [groupMode, setGroupMode] = useState<GroupMode>(GroupMode.DAY);
  
  const fromZoned = from?.toDate(ZONE_ID);
  const toZoned = to?.toDate(ZONE_ID);
  
  const loadAppointments = async () => {
    setLoading(true);
    try {
      const appointments = await appointmentsService.list({
        filters: {
          from: fromZoned,
          to: toZoned,
          professionalId: hasPrivileged ? professional?.id : undefined,
          canceled: false,
          professionalType,
        }
      });
      setAppointments(appointments);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadAppointments();
  }, [from, to, professional, professionalType]);
  
  const range = {from: fromZoned, to: toZoned};
  
  const [allData, presentialData, virtualData] = useMemo(() => [
    appointmentsToData(appointments, groupMode, range),
    appointmentsToData(appointments.filter(a => a.type === AppointmentType.PRESENTIAL), groupMode, range),
    appointmentsToData(appointments.filter(a => a.type === AppointmentType.VIRTUAL), groupMode, range),
  ], [appointments, from, to, groupMode]);
  
  return (
    <Card>
      <CardContent>
        <div className="flex flex-wrap gap-4 items-center justify-center my-5">
          {(user && userService.hasPrivilegedUser(user)) && <>
            <SelectProfessionalType
              value={professionalType}
              onChange={setProfessionalType}
              disabled={professional !== undefined}
            />
            <div className="w-60">
              <UserSelect
                key={professionalType}
                selectItemText="Profesional"
                searchPlaceholder="Buscar profesional"
                value={professional}
                onSelect={setProfessional}
                filters={{
                  authorities: professionalType ? [professionalType] : userService.professionalAuthorities,
                }}
              />
            </div>
          </>}
          <div className="grid gap-2">
            <DatePicker<CalendarDate>
              placeHolder="Desde"
              value={from}
              defaultValue={from}
              onChange={setFrom}
            />
          </div>
          <div className="grid gap-2">
            <DatePicker<CalendarDate>
              placeHolder="Hasta"
              value={to}
              defaultValue={to}
              onChange={setTo}
            />
          </div>
          <div className="w-60">
            <SelectGroupMode value={groupMode} onChange={setGroupMode}/>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="col-span-1 md:col-span-2">
            <AppointmentsAreaChart
              title="Todas las citas"
              loading={loading}
              data={allData}
              groupMode={groupMode}
            />
          </div>
          <div className="col-span-1">
            <AppointmentsAreaChart
              title="Citas Presenciales"
              loading={loading}
              data={presentialData}
              groupMode={groupMode}
            />
          </div>
          <div className="col-span-1">
            <AppointmentsAreaChart
              title="Citas Virtuales"
              loading={loading}
              data={virtualData}
              groupMode={groupMode}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface SelectProfessionalTypeProps {
  value?: Authority;
  onChange: (value?: Authority.LEGAL_PROFESSIONAL | Authority.MEDICAL_PROFESSIONAL) => void;
  disabled: boolean;
}

function SelectProfessionalType({value, onChange, disabled}: Readonly<SelectProfessionalTypeProps>) {
  return (
    <Select
      disabled={disabled}
      value={value ?? "ANY"}
      onValueChange={(value) => value === "ANY" ? onChange(undefined) : onChange(value as Authority.LEGAL_PROFESSIONAL | Authority.MEDICAL_PROFESSIONAL)}
    >
      <SelectTrigger className="w-40">
        <SelectValue placeholder="Tipo de profesional"/>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={"ANY"}>
          <p>Cualquiera</p>
        </SelectItem>
        <SelectItem value={Authority.MEDICAL_PROFESSIONAL}>
          <p>Médico</p>
        </SelectItem>
        <SelectItem value={Authority.LEGAL_PROFESSIONAL}>
          <p>Abogado</p>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}

const crossHairAppointmentCountUpdater = (series: ISeriesApi<"Area">, groupMode: GroupMode, updater: (value: string) => void) => {
  return (param: any) => {
    const serie: AreaData | undefined = param.seriesData.get(series);
    
    if (serie && typeof serie.time === 'string') {
      const date = new Date(serie.time);
      const formattedDate = {
        [GroupMode.YEAR]: date.getFullYear(),
        [GroupMode.MONTH]: `${date.toLocaleDateString('es-ES', {month: 'long'})} ${date.getFullYear()}`,
        [GroupMode.WEEK]: `Semana del ${date.toLocaleDateString('es-ES', {day: 'numeric', month: 'long'})}`,
        [GroupMode.DAY]: date.toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
      }[groupMode] || 'Fecha';
      
      updater(`${formattedDate}: ${serie.value} citas`);
    }
  };
}

interface AppointmentsAreaChartProps {
  title: string;
  loading: boolean;
  data: AreaData[];
  groupMode: GroupMode;
}

function AppointmentsAreaChart({title, loading, data, groupMode}: Readonly<AppointmentsAreaChartProps>) {
  
  const {open} = useSidebar();
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const legendContainerRef = useRef<HTMLParagraphElement | null>(null);
  const [chart, setChart] = useState<ReturnType<typeof createChart> | null>(null);
  
  
  useEffect(() => {
    const current = chartContainerRef.current;
    if (!current) return;
    
    const handleResize = () => {
      chart.applyOptions({width: current.clientWidth,});
    };
    
    const chart = createChart(current, {
      ...chartConfig,
      width: current.clientWidth,
    });
    
    setChart(chart);
    chart.timeScale().fitContent();
    
    const series = chart.addSeries(AreaSeries, appointmenAreaConfig);
    series.setData(data);
    
    window.addEventListener('resize', handleResize);
    
    chart.subscribeCrosshairMove(crossHairAppointmentCountUpdater(series, groupMode, (value) => {
      legendContainerRef.current!.textContent = value;
    }));
    
    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [data]);
  
  useEffect(() => {
    const current = chartContainerRef.current;
    if (chart && current) {
      chart.applyOptions({width: current.clientWidth,});
      
    }
  }, [open]);
  
  return (
    <Card>
      <CardHeader>
        {title}
      </CardHeader>
      <CardContent>
        <div
          className="relative w-full"
          ref={chartContainerRef}
        >
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            {loading && <LoaderCircle className="w-5 h-5 animate-spin"/>}
          </div>
          <div className="absolute top-2 left-2">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3"/>
              <p ref={legendContainerRef} className="text-sm font-semibold"></p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export interface SelectGroupModeProps {
  value?: GroupMode;
  onChange: (value: GroupMode) => void;
}

export function SelectGroupMode({value, onChange}: Readonly<SelectGroupModeProps>) {
  return (
    <Select
      value={value}
      onValueChange={(value) => onChange(value as GroupMode)}
    >
      <SelectTrigger className="w-40">
        <SelectValue placeholder="Tipo de cita"/>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="DAY">
          <p>Día</p>
        </SelectItem>
        <SelectItem value="WEEK">
          <p>Semana</p>
        </SelectItem>
        <SelectItem value="MONTH">
          <p>Mes</p>
        </SelectItem>
        <SelectItem value="YEAR">
          <p>Año</p>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}

function appointmentsToData(
  appointments: Appointment[],
  groupMode: GroupMode,
  range: { from?: Date, to?: Date }
): AreaData[] {
  const now = new Date();
  const effectiveTo = range.to && range.to > now ? now : range.to;
  
  const sorted = [...appointments].sort((a, b) => a.date.getTime() - b.date.getTime());
  
  const groupedData = new Map<string, number>();
  const dateGenerator = createDateGenerator(groupMode);
  
  const {from} = range;
  if (from && effectiveTo) {
    let currentDate = new Date(from);
    while (currentDate <= effectiveTo) {
      const groupKey = dateGenerator(currentDate);
      groupedData.set(groupKey, 0);
      currentDate = getNextDate(currentDate, groupMode);
    }
  }
  
  sorted.forEach(appointment => {
    const groupKey = dateGenerator(appointment.date);
    groupedData.set(groupKey, (groupedData.get(groupKey) ?? 0) + 1);
  });
  
  return Array
  .from(groupedData, ([time, value]) => ({time, value}))
  .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
}

function createDateGenerator(groupMode: GroupMode): (date: Date) => string {
  switch (groupMode) {
    case GroupMode.YEAR:
      return (date) => new Date(date.getFullYear(), 0, 1).toISOString().split('T')[0];
    case GroupMode.MONTH:
      return (date) => new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
    case GroupMode.WEEK:
      return (date) => {
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - date.getDay());
        return startOfWeek.toISOString().split('T')[0];
      };
    case GroupMode.DAY:
    default:
      return (date) => date.toISOString().split('T')[0];
  }
}

function getNextDate(date: Date, groupMode: GroupMode): Date {
  const newDate = new Date(date);
  switch (groupMode) {
    case GroupMode.YEAR:
      newDate.setFullYear(newDate.getFullYear() + 1);
      break;
    case GroupMode.MONTH:
      newDate.setMonth(newDate.getMonth() + 1);
      break;
    case GroupMode.WEEK:
      newDate.setDate(newDate.getDate() + 7);
      break;
    case GroupMode.DAY:
    default:
      newDate.setDate(newDate.getDate() + 1);
      break;
  }
  return newDate;
}

enum GroupMode {
  DAY = 'DAY',
  WEEK = 'WEEK',
  MONTH = 'MONTH',
  YEAR = 'YEAR',
}
