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


export function extractError(error: unknown): ErrorTitle {

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
  return {title: "Error", description: body?.toString() ?? "No se pudo conectar al servidor"};
}