import {isAxiosError} from "axios";
import {isAccessTokenError} from "@/services/auth-service.ts";

export interface ErrorTitle {
  title: string;
  description: string;
}

type ProblemDetails<TExtensions = Record<never, never>> = {
  title: string;
  status: number;
  detail: string;
  instance: string;
  type: string;
} & TExtensions;

export function isProblemDetails<TExtensions = Record<never, never>>(
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


export function dispatchAxiosError(error: unknown, setError: (error: ErrorTitle) => void) {

  if (!isAxiosError(error)) {
    setError({title: "Error inesperado", description: error?.toString() ?? "No se pudo conectar al servidor"});
    return;
  }

  const response = error.response;
  if (!response) {
    setError({title: "Error.", description: "No se pudo conectar al servidor"});
    return;
  }
  const body = response.data;

  if (isProblemDetails(body)) {
    setError({title: body.title, description: body.detail});
    return;
  }

  if (typeof body === 'string') {
    setError({title: "Error", description: body});
    return;
  }

  if (isAccessTokenError(body)) {
    setError({title: body.error, description: body.error_description});
    return;
  }
  setError({title: "Error", description: body?.toString() ?? "No se pudo conectar al servidor"});
}