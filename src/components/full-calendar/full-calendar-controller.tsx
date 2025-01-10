"use client";

import {cn} from "@/lib/utils";
import {Button} from "@/components/ui/button";
import {
  CalendarRef,
  goNext,
  goPrev,
  goToday,
  handleDayChange,
  handleMonthChange,
  handleYearChange,
  setView,
} from "@/utils/calendar-utils";
import {ComponentProps, useEffect, useState} from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  GalleryVertical,
  Table,
  Tally3,
} from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import {Input} from "@/components/ui/input";
import {Tabs, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {DatesSetArg} from "@fullcalendar/core";

interface CalendarState {
  selectedDay: number;
  selectedMonth: number;
  selectedYear: number;
  daysInMonth: number;
  days: number[];
  months: MonthRepresation[];
}


interface CalendarNavProps extends ComponentProps<"div"> {
  calendarRef: CalendarRef;
}

export default function FullCalendarController(
  {
    calendarRef,
    className,
    ...props
  }: Readonly<CalendarNavProps>
) {

  const [viewedDate, setViewedDate] = useState(new Date());
  const [currentView, setCurrentView] = useState("timeGridWeek");
  const [daySelectOpen, setDaySelectOpen] = useState(false);
  const [monthSelectOpen, setMonthSelectOpen] = useState(false);
  const [state, setState] = useState<CalendarState>(getCalendarState(viewedDate));


  const {selectedDay, selectedMonth, selectedYear, days, months} = state;

  useEffect(() => {
    if (!calendarRef.current) return;

    const calendarApi = calendarRef.current.getApi();
    calendarApi.on("datesSet", (info: DatesSetArg) => {
      setViewedDate(info.start);
    });

  }, [calendarRef]);

  useEffect(() => {
    setState(getCalendarState(viewedDate));
  }, [viewedDate]);

  return (
    <div
      className={cn("flex flex-wrap min-w-full justify-center gap-3 ", className)}
      {...props}
    >
      <div className="flex flex-row space-x-1">
        <Button
          variant="ghost"
          className="w-8"
          type="button"
          onClick={() => goPrev(calendarRef)}
        >
          <ChevronLeft className="h-4 w-4"/>
        </Button>
        {currentView == "timeGridDay" && (
          <Popover open={daySelectOpen} onOpenChange={setDaySelectOpen} modal={true}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-20 justify-between text-xs font-semibold"
              >
                {selectedDay
                  ? days.find((day) => day === selectedDay)
                  : "Seleccione un dia"
                }
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50"/>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
              <Command>
                <CommandInput onKeyDown={(e) => e.stopPropagation()} placeholder="Buscar día..."/>
                <CommandList>
                  <CommandEmpty>No day found.</CommandEmpty>
                  <CommandGroup>
                    {days.map((day) => (
                      <CommandItem
                        key={day}
                        value={day.toString()}
                        onSelect={(currentValue) => {
                          handleDayChange(
                            calendarRef,
                            viewedDate,
                            currentValue
                          );
                          setDaySelectOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedDay === day
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        {day}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        )}

        <Popover open={monthSelectOpen} onOpenChange={setMonthSelectOpen} modal={true}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="flex w-[105px] justify-between overflow-hidden p-2 text-xs font-semibold md:text-sm md:w-[120px]"
            >
              {selectedMonth
                ? months.find((month) => month.ordinal === selectedMonth)?.value
                : "Seleccione un Mes..."
              }
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50"/>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0">
            <Command>
              <CommandInput placeholder="Buscar mes..."/>
              <CommandList>
                <CommandEmpty>No se encontraron meses</CommandEmpty>
                <CommandGroup>
                  {months.map((month) => (
                    <CommandItem
                      key={month.ordinal}
                      value={month.value}
                      onSelect={() => {
                        handleMonthChange(
                          calendarRef,
                          viewedDate,
                          month.ordinal
                        );
                        setMonthSelectOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedMonth === month.ordinal ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {month.value}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <Input
          className="w-[75px] md:w-[85px] text-xs md:text-sm font-semibold bg-background"
          type="number"
          value={selectedYear}
          onChange={(value) => handleYearChange(calendarRef, viewedDate, value)}
        />

        <Button
          variant="ghost"
          className="w-8"
          type="button"
          onClick={() => {
            goNext(calendarRef);
          }}
        >
          <ChevronRight className="h-4 w-4"/>
        </Button>
      </div>

      <div className="flex flex-wrap gap-3 justify-center">
        <Button
          className=" text-xs md:text-sm"
          variant="outline"
          type="button"
          onClick={() => {
            goToday(calendarRef);
          }}
        >
          Hoy
        </Button>

        <Tabs defaultValue="timeGridWeek">
          <TabsList className="flex w-44 md:w-64">
            <TabsTrigger
              value="timeGridDay"
              onClick={() => setView(calendarRef, "timeGridDay", setCurrentView)}
              className={`space-x-1 ${
                currentView === "timeGridDay" ? "w-1/2" : "w-1/4"
              }`}
            >
              <GalleryVertical className="h-5 w-5"/>
              {currentView === "timeGridDay" && (
                <p className="text-xs md:text-sm">Dia</p>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="timeGridWeek"
              onClick={() => setView(calendarRef, "timeGridWeek", setCurrentView)}
              className={`space-x-1 ${
                currentView === "timeGridWeek" ? "w-1/2" : "w-1/4"
              }`}
            >
              <Tally3 className="h-5 w-5"/>
              {currentView === "timeGridWeek" && (
                <p className="text-xs md:text-sm">Semana</p>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="dayGridMonth"
              onClick={() => setView(calendarRef, "dayGridMonth", setCurrentView)}
              className={`space-x-1 ${
                currentView === "dayGridMonth" ? "w-1/2" : "w-1/4"
              }`}
            >
              <Table className="h-5 w-5 rotate-90"/>
              {currentView === "dayGridMonth" && (
                <p className="text-xs md:text-sm">Mes</p>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/*<EventAddForm start={start} end={end}/>*/}
      </div>
    </div>
  );
}

function getCalendarState(viewedDate: Date) {
  const selectedDay = viewedDate.getDate();
  const selectedMonth = viewedDate.getMonth() + 1;
  const selectedYear = viewedDate.getFullYear();
  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const days = getDaysInMonth(daysInMonth);
  const months = getMonths("es");

  return {
    selectedDay,
    selectedMonth,
    selectedYear,
    daysInMonth,
    days,
    months,
  };
}

interface MonthRepresation {
  ordinal: number,
  value: string
}

function getMonths(locale: string): MonthRepresation[] {

  const formatter = new Intl.DateTimeFormat(locale, {month: "long"});

  return Array.from({length: 12}, (_, i) => {
    return {
      ordinal: i + 1,
      value: formatter.format(new Date(2021, i, 1)),
    };
  });
}


function getDaysInMonth(daysInMonth: number): number[] {
  return Array.from({length: daysInMonth}, (_, i) => i + 1);
}
