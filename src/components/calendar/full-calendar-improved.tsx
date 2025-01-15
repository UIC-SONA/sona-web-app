import "@/styles/calendar.css";
import {
  DayCellContentArg,
  DayHeaderContentArg,
  EventContentArg,
} from "@fullcalendar/core/index.js";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import multiMonthPlugin from "@fullcalendar/multimonth";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";

import {
  ComponentProps,
  forwardRef
} from "react";

import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip.tsx";

type EventItemProps = {
  info: EventContentArg;
};

type DayHeaderProps = {
  info: DayHeaderContentArg;
};

type DayRenderProps = {
  info: DayCellContentArg;
};

const FullCalendarImproved = forwardRef<FullCalendar, ComponentProps<typeof FullCalendar>>((props, ref) => {

    const {datesSet, ...rest} = props;

    return <FullCalendar
      ref={ref}
      timeZone="local"
      plugins={[
        dayGridPlugin,
        timeGridPlugin,
        multiMonthPlugin,
        interactionPlugin,
        listPlugin,
      ]}
      initialView="timeGridWeek"
      headerToolbar={false}
      allDaySlot={false}
      firstDay={1}
      height="32vh"
      displayEventEnd={true}
      windowResizeDelay={0}
      slotLabelFormat={{
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }}
      eventTimeFormat={{
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }}
      eventBorderColor={"black"}
      contentHeight={"auto"}
      expandRows={true}
      eventClassNames="overflow-hidden w-full rounded-md transform transition-all duration-200 hover:scale-[1.02]"
      dayCellContent={(dayInfo) => <DayRender info={dayInfo}/>}
      eventContent={(eventInfo) => <EventItem info={eventInfo}/>}
      dayHeaderContent={(headerInfo) => <DayHeader info={headerInfo}/>}
      datesSet={(dates) => {
        if (datesSet) {
          datesSet(dates)
        }
      }}
      nowIndicator
      editable
      selectable
      {...rest}
    />;
  }
);

const EventItem = ({info}: EventItemProps) => {
  const {event, backgroundColor, textColor} = info;
  const {tooltipContent} = event.extendedProps;
  const [left, right] = info.timeText.split(" - ");


  const MonthViewContent = () => (
    <div
      style={{backgroundColor: backgroundColor, color: textColor}}
      className="flex flex-col rounded-md w-full px-2 py-1"
    >
      <p className="font-semibold line-clamp-1 w-11/12 text-[0.5rem] sm:text-[0.6rem] md:text-xs">
        {event.title}
      </p>
      <p className="text-[0.5rem] sm:text-[0.6rem] md:text-xs">{left}</p>
      <p className="text-[0.5rem] sm:text-[0.6rem] md:text-xs">{right}</p>
    </div>
  );

  const WeekViewContent = () => (
    <div
      style={{backgroundColor: backgroundColor, color: textColor}}
      className="flex flex-col space-y-0 p-1 rounded-md"
    >
      <p className="font-semibold w-full line-clamp-1 mb-2 text-[0.5rem] sm:text-[0.6rem] md:text-xs">
        {event.title}
      </p>
      <p className="line-clamp-1 text-[0.5rem] sm:text-[0.6rem] md:text-xs">
        {`${left} - ${right}`}
      </p>
    </div>
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="overflow-hidden"
          >
            {info.view.type === "dayGridMonth" ? <MonthViewContent/> : <WeekViewContent/>}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" {...(tooltipContent?.props || {})}>
          {(tooltipContent?.child) ? tooltipContent.child : (
            <div className="flex flex-col space-y-2 ">
              <p className="font-semibold">{event.title}</p>
              <p>{`${left} - ${right}`}</p>
            </div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const DayHeader = ({info}: DayHeaderProps) => {
  const [weekday] = info.text.split(" ");

  if (info.view.type == "timeGridDay") {
    return (
      <div className="flex items-center h-full overflow-hidden">
        <div className="flex flex-col rounded-sm">
          <p>
            {info.date.toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
      </div>
    );
  }

  if (info.view.type == "timeGridWeek") {
    return (
      <div className="flex items-center h-full overflow-hidden">
        <div className="flex flex-col space-y-0.5 rounded-sm items-center w-full text-xs sm:text-sm md:text-md">
          <p className="flex font-semibold">{weekday}</p>
          {info.isToday ? (
            <div className="flex bg-black dark:bg-white h-6 w-6 rounded-full items-center justify-center text-xs sm:text-sm md:text-md">
              <p className="font-light dark:text-black text-white">
                {info.date.getDate()}
              </p>
            </div>
          ) : (
            <div className="h-6 w-6 rounded-full items-center justify-center">
              <p className="font-light">{info.date.getDate()}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center h-full overflow-hidden">
      <div className="flex flex-col rounded-sm">
        <p>{weekday}</p>
      </div>
    </div>
  );
};

const DayRender = ({info}: DayRenderProps) => {
  return (
    <div className="flex">
      {info.view.type == "dayGridMonth" && info.isToday ? (
        <div className="flex h-7 w-7 rounded-full bg-black dark:bg-white items-center justify-center text-sm text-white dark:text-black">
          {info.dayNumberText}
        </div>
      ) : (
        <div className="flex h-7 w-7 rounded-full items-center justify-center text-sm">
          {info.dayNumberText}
        </div>
      )}
    </div>
  );
};

export default FullCalendarImproved;