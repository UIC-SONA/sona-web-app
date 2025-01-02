"use client";

import {ChangeEvent, Dispatch, SetStateAction} from "react";
import {CalendarRef} from "./data";

export function goPrev(calendarRef: CalendarRef) {
  const calendarApi = calendarRef.current!.getApi();
  calendarApi.prev();
}

export function goNext(calendarRef: CalendarRef) {
  const calendarApi = calendarRef.current!.getApi();
  calendarApi.next();
}

export function goToday(calendarRef: CalendarRef) {
  const calendarApi = calendarRef.current!.getApi();
  calendarApi.today();
}

export function handleDayChange(
  calendarRef: CalendarRef,
  currentDate: Date,
  day: string
) {
  const calendarApi = calendarRef.current!.getApi();
  const newDate = currentDate.setDate(Number(day));
  calendarApi.gotoDate(newDate);
}

export function handleMonthChange(
  calendarRef: CalendarRef,
  currentDate: Date,
  month: number
) {
  const calendarApi = calendarRef.current!.getApi();
  const newDate = new Date(currentDate);
  newDate.setMonth(month - 1);
  calendarApi.gotoDate(newDate);
}

export function handleYearChange(
  calendarRef: CalendarRef,
  currentDate: Date,
  e: ChangeEvent<HTMLInputElement>
) {
  const calendarApi = calendarRef.current!.getApi();
  const newDate = currentDate.setFullYear(Number(e.target.value));
  calendarApi.gotoDate(newDate);
}

export function setView(
  calendarRef: CalendarRef,
  viewName: string,
  setCurrentView: Dispatch<SetStateAction<string>>
) {
  const calendarApi = calendarRef.current!.getApi();
  setCurrentView(viewName);
  calendarApi.changeView(viewName);
}
