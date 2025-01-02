"use client";

import {cn} from "@/lib/utils";
import {CalendarRef} from "@/utils/data";
import {Button} from "@/components/ui/button";
import {
  goNext,
  goPrev,
  goToday,
  handleDayChange,
  handleMonthChange,
  handleYearChange,
  setView,
} from "@/utils/calendar-utils";
import {useState} from "react";
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

interface CalendarNavProps {
  calendarRef: CalendarRef;
  viewedDate: Date;
}

export default function EventCalendarNav(
  {
    calendarRef,
    viewedDate,
  }: Readonly<CalendarNavProps>
) {
  const [currentView, setCurrentView] = useState("timeGridWeek");

  const selectedDay = viewedDate.getDate();
  const selectedMonth = viewedDate.getMonth() + 1;
  const selectedYear = viewedDate.getFullYear();

  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();

  const [daySelectOpen, setDaySelectOpen] = useState(false);
  const [monthSelectOpen, setMonthSelectOpen] = useState(false);


  const days = getDaysInMonth(daysInMonth);
  const months = getMonths("es");

  return (
    <div className="flex flex-wrap min-w-full justify-center gap-3 px-10 ">
      <div className="flex flex-row space-x-1">
        {/* Navigate to previous date interval */}

        <Button
          variant="ghost"
          className="w-8"
          type="button"
          onClick={() => goPrev(calendarRef)}
        >
          <ChevronLeft className="h-4 w-4"/>
        </Button>

        {/* Day Lookup */}

        {/*<CommandDialog*/}
        {/*  */}
        {/*>*/}

        {/*</CommandDialog>*/}

        {currentView == "timeGridDay" && (
          <Popover open={daySelectOpen} onOpenChange={setDaySelectOpen} modal={true}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-20 justify-between text-xs font-semibold"
              >
                {selectedDay
                  ? days.find((day) => day === selectedDay)
                  : "Select day..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50"/>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
              <Command>
                <CommandInput  onKeyDown={(e) => e.stopPropagation()} placeholder="Buscar día..."/>
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

        {/* Month Lookup */}


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
              <CommandInput placeholder="Search month..."/>
              <CommandList>
                <CommandEmpty>No month found.</CommandEmpty>
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

        {/* Year Lookup */}

        <Input
          className="w-[75px] md:w-[85px] text-xs md:text-sm font-semibold"
          type="number"
          value={selectedYear}
          onChange={(value) => handleYearChange(calendarRef, viewedDate, value)}
        />

        {/* Navigate to next date interval */}

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
        {/* Button to go to current date */}

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
                <p className="text-xs md:text-sm">Day</p>
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
                <p className="text-xs md:text-sm">Week</p>
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
                <p className="text-xs md:text-sm">Month</p>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/*<EventAddForm start={start} end={end}/>*/}
      </div>
    </div>
  );
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
