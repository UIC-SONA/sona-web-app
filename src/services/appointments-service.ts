import {Entity, PageQuery} from "@/lib/crud.ts";
import {Authority, User} from "@/services/user-service.ts";
import {pageQueryToParams, restRead} from "@/lib/rest-crud.ts";
import apiClient from "@/lib/axios.ts";
import {format} from "date-fns";

const resource = '/appointment';

export interface Appointment extends Entity<number> {
  date: Date;
  hour: number;
  canceled: boolean;
  cancellationReason?: string;
  type: AppointmentType;
  professional: User;
  attendant: User;
  range: AppointmentsRange;
}

export interface AppointmentFilters {
  professionalId: number;
  professionalType: Authority.MEDICAL_PROFESSIONAL | Authority.LEGAL_PROFESSIONAL;
  userId: number;
  canceled: boolean;
  type: AppointmentType;
  from: Date;
  to: Date;
}

export enum AppointmentType {
  PRESENTIAL = 'PRESENTIAL',
  VIRTUAL = 'VIRTUAL',
}

export interface AppointmentsRange {
  from: Date;
  to: Date;
}

async function getAppointmentsRangesByProfessional(professionalId: number, from: Date, to: Date): Promise<AppointmentsRange[]> {
  const response = await apiClient.get<AppointmentsRange[]>(
    `${resource}/professional/${professionalId}/ranges`,
    {
      params: {
        from: from.toISOString().split('T')[0],
        to: to.toISOString().split('T')[0],
      },
    }
  );

  return response.data;
}

function getAppointmentTypeName(type: AppointmentType): string {
  switch (type) {
    case AppointmentType.PRESENTIAL:
      return 'Presencial';
    case AppointmentType.VIRTUAL:
      return 'Virtual';
  }
}

function filtersTransformer(filters: Partial<AppointmentFilters>): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.professionalId) params.append('professionalId', filters.professionalId.toString());
  if (filters.userId) params.append('userId', filters.userId.toString());
  if (filters.canceled) params.append('canceled', filters.canceled.toString());
  if (filters.type) params.append('type', filters.type);
  if (filters.from) params.append('from', format(filters.from, 'yyyy-MM-dd'));
  if (filters.to) params.append('to', format(filters.to, 'yyyy-MM-dd'));
  if (filters.professionalType) params.append('professionalType', filters.professionalType);
  return params;
}

function modelTransformer(appointment: any): Appointment {
  return {
    ...appointment,
    date: new Date(appointment.date),
    range: {
      from: new Date(appointment.range.from),
      to: new Date(appointment.range.to),
    },
  };
}

async function list(query: Omit<PageQuery<AppointmentFilters>, "page" | "size">): Promise<Appointment[]> {
  const response = await apiClient.get<any[]>(`${resource}/list`, {
    params: pageQueryToParams(query, filtersTransformer),
  });

  return response.data.map(modelTransformer);
}

const readOperations = restRead<Appointment, number, AppointmentFilters>(apiClient, resource, {
  filtersTransformer,
  modelTransformer,
});

export const appointmentsService = {
  ...readOperations,
  list,
  getAppointmentsRangesByProfessional,
  getAppointmentTypeName,
}