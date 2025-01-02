import FullCalendar from "@fullcalendar/react";
import {RefObject} from "react";

export type CalendarRef = RefObject<FullCalendar | null>;

// setting earliest / latest available time in minutes since Midnight
export const earliestTime = 540;
export const latestTime = 1320;