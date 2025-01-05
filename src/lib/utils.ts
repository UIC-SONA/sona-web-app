import {clsx, type ClassValue} from "clsx"
import {twMerge} from "tailwind-merge"
import {Dispatch, SetStateAction} from "react";

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