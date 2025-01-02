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

import {useRef, ComponentProps, useState} from "react";
import EventCalendarNav from "./event-calendar-nav.tsx";
import {earliestTime, latestTime} from "@/utils/data";
import {getDateFromMinutes} from "@/lib/utils";
import {Card} from "@/components/ui/card.tsx";

type EventItemProps = {
  info: EventContentArg;
};

type DayHeaderProps = {
  info: DayHeaderContentArg;
};

type DayRenderProps = {
  info: DayCellContentArg;
};

interface EventCalendarProps extends ComponentProps<typeof FullCalendar> {
  cardCalendarProps?: ComponentProps<typeof Card>;
}

export default function EventCalendar(
  {
    cardCalendarProps = {},
    datesSet,
    ...props
  }: Readonly<EventCalendarProps>
) {

  const calendarRef = useRef<FullCalendar | null>(null);
  const [viewedDate, setViewedDate] = useState(new Date());

  const earliestHour = getDateFromMinutes(earliestTime)
    .getHours()
    .toString()
    .padStart(2, "0");
  const earliestMin = getDateFromMinutes(earliestTime)
    .getMinutes()
    .toString()
    .padStart(2, "0");
  const latestHour = getDateFromMinutes(latestTime)
    .getHours()
    .toString()
    .padStart(2, "0");
  const latestMin = getDateFromMinutes(latestTime)
    .getMinutes()
    .toString()
    .padStart(2, "0");

  const calendarEarliestTime = `${earliestHour}:${earliestMin}`;
  const calendarLatestTime = `${latestHour}:${latestMin}`;

  return (
    <div className="space-y-5">
      <EventCalendarNav
        calendarRef={calendarRef}
        viewedDate={viewedDate}
      />
      <Card
        className="p-3"
        {...cardCalendarProps}
      >
        <FullCalendar
          ref={calendarRef}
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
          slotMinTime={calendarEarliestTime}
          slotMaxTime={calendarLatestTime}
          allDaySlot={false}
          firstDay={1}
          height={"32vh"}
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
          dayCellContent={(dayInfo) => <DayRender info={dayInfo}/>}
          eventContent={(eventInfo) => <EventItem info={eventInfo}/>}
          dayHeaderContent={(headerInfo) => <DayHeader info={headerInfo}/>}
          datesSet={(dates) => {
            setViewedDate(dates.start)
            if (datesSet) {
              datesSet(dates)
            }
          }}
          nowIndicator
          editable
          selectable
          {...props}
        />
      </Card>
    </div>
  );
}

const EventItem = ({info}: EventItemProps) => {
  const {event} = info;
  const [left, right] = info.timeText.split(" - ");

  return (
    <div className="overflow-hidden w-full">
      {info.view.type == "dayGridMonth" ? (
        <div
          style={{backgroundColor: info.backgroundColor}}
          className={`flex flex-col rounded-md w-full px-2 py-1 line-clamp-1 text-[0.5rem] sm:text-[0.6rem] md:text-xs`}
        >
          <p className="font-semibold text-gray-950 line-clamp-1 w-11/12">
            {event.title}
          </p>

          <p className="text-gray-800">{left}</p>
          <p className="text-gray-800">{right}</p>
        </div>
      ) : (
        <div className="flex flex-col space-y-0 text-[0.5rem] sm:text-[0.6rem] md:text-xs">
          <p className="font-semibold w-full text-gray-950 line-clamp-1">
            {event.title}
          </p>
          <p className="text-gray-800 line-clamp-1">{`${left} - ${right}`}</p>
        </div>
      )}
    </div>
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