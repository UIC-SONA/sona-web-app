import {isAxiosError} from "axios";
import {isAccessTokenError} from "@/services/auth-service.ts";
import {
  FieldPath,
  FieldValues
} from "react-hook-form";

export interface ErrorTitle {
  title: string;
  description: string;
}

type ProblemDetails<TExtensions = object> = {
  title: string;
  status: number;
  detail: string;
  instance: string;
  type: string;
} & TExtensions;

export function isProblemDetails<TExtensions = object>(
  obj: unknown
): obj is ProblemDetails<TExtensions> {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    'title' in obj &&
    'status' in obj &&
    'detail' in obj &&
    'instance' in obj &&
    'type' in obj &&
    typeof obj.title === 'string' &&
    typeof obj.status === 'number' &&
    typeof obj.detail === 'string' &&
    typeof obj.instance === 'string' &&
    typeof obj.type === 'string'
  );
}

export type ValidationError = {
  field: string;
  messages: string[];
}

export type ValidationErrorFieldValues<T extends FieldValues, V extends FieldPath<T> = FieldPath<T>> = {
  field: V;
  messages: string[];
}

export function extractProblemDetails(error: unknown): ProblemDetails | undefined {
  if (!isAxiosError(error)) return;

  const response = error.response;
  if (!response) return;

  const body = response.data;

  if (isProblemDetails(body)) {
    return body;
  }
}

export function extractError(error: unknown): ErrorTitle {
  const err = extractOptionalError(error);
  if (err) return err;
  return {title: "Error", description: "No se pudo conectar al servidor"};
}

export function extractOptionalError(error: unknown): ErrorTitle | undefined {
  if (!isAxiosError(error)) {
    return {title: "Error inesperado", description: error?.toString() ?? "No se pudo conectar al servidor"}
  }

  const response = error.response;
  if (!response) {
    return {title: "Error.", description: "No se pudo conectar al servidor"};
  }

  const body = response.data;

  if (isProblemDetails(body)) {
    return {title: body.title, description: body.detail};
  }

  if (typeof body === 'string') {
    return {title: "Error", description: body};
  }

  if (isAccessTokenError(body)) {
    return {title: body.error, description: body.error_description};
  }
}