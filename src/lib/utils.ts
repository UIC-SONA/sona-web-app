import {clsx, type ClassValue} from "clsx"
import {twMerge} from "tailwind-merge"
import {Dispatch, SetStateAction} from "react";
import {DateValue} from "react-aria-components";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function dispatchAsyncStates<T>(
  fetcher: () => Promise<T>,
  setValues: Dispatch<SetStateAction<T>>,
  setLoading: Dispatch<SetStateAction<boolean>>,
) {
  setLoading(true);
  fetcher().then(setValues).finally(() => setLoading(false));
}

export function getCSSVariableValue(variableName: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();
}

export function getPeriod(number?: number): string {
  if (number === undefined) return "";
  return number < 12 ? "AM" : "PM";
}

export function onlyDate(value: DateValue): Date {
  return new Date(value.year, value.month - 1, value.day);
}

interface QueryParams {
  [key: string]: string | number | boolean;
}

export function buildUrl(baseUrl: string, route: string, params?: QueryParams): string {
  const url = new URL(route, baseUrl);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value.toString());
    });
  }

  return url.toString();
}

