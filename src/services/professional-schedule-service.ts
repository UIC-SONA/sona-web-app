import apiClient from "@/lib/axios.ts";
import {CrudOperations, Entity, Page, PageQuery, pageQueryToParams} from "@/lib/crud.ts";
import {User} from "@/services/user-service.ts";

export interface ProfessionalSchedule extends Entity<number> {
  date: string;
  fromHour: number;
  toHour: number;
  professional: User;
}

export interface ProfessionalScheduleDto {
  date: Date;
  fromHour: number;
  toHour: number;
  professionalId: number;
}

const resource = '/professional-schedule';

export async function pageProfessionalSchedule(query: PageQuery): Promise<Page<ProfessionalSchedule>> {
  const response = await apiClient.get<Page<ProfessionalSchedule>>(
    resource,
    {
      params: pageQueryToParams(query),
    }
  );

  return response.data;
}

export async function findProfessionalSchedule(id: number): Promise<ProfessionalSchedule> {
  const response = await apiClient.get<ProfessionalSchedule>(
    `${resource}/${id}`,
  );

  return response.data;
}

export async function findManyProfessionalSchedule(ids: number[]): Promise<ProfessionalSchedule[]> {
  const response = await apiClient.get<ProfessionalSchedule[]>(
    `${resource}/many`,
    {
      params: new URLSearchParams({
        ids: ids.join(','),
      }),
    }
  );

  return response.data;
}

export async function countProfessionalSchedule(): Promise<number> {
  const response = await apiClient.get<number>(
    `${resource}/count`,
  );

  return response.data;
}

export async function existProfessionalSchedule(id: number): Promise<boolean> {
  const response = await apiClient.get<boolean>(
    `${resource}/exist/${id}`,
  );

  return response.data;
}

export async function createProfessionalSchedule(entity: ProfessionalScheduleDto): Promise<ProfessionalSchedule> {
  const response = await apiClient.post<ProfessionalSchedule>(
    resource,
    entity,
  );

  return response.data;
}

export async function updateProfessionalSchedule(id: number, entity: ProfessionalScheduleDto): Promise<ProfessionalSchedule> {
  const response = await apiClient.put<ProfessionalSchedule>(
    `${resource}/${id}`,
    entity,
  );
  return response.data;
}


export async function deleteProfessionalSchedule(id: number): Promise<void> {
  await apiClient.delete<void>(
    `${resource}/${id}`,
  );
}

export async function getSchedulesByProfessionalId(professionalId: number, from: Date, to: Date): Promise<ProfessionalSchedule[]> {
  const response = await apiClient.get<ProfessionalSchedule[]>(
    `${resource}/professional/${professionalId}`,
    {
      params: {
        from: from.toISOString().split('T')[0],
        to: to.toISOString().split('T')[0],
      },
    }
  );

  return response.data;
}


export const operationProfessionalSchedule: CrudOperations<ProfessionalSchedule, ProfessionalScheduleDto, number> = {
  page: pageProfessionalSchedule,
  find: findProfessionalSchedule,
  findMany: findManyProfessionalSchedule,
  count: countProfessionalSchedule,
  exist: existProfessionalSchedule,
  create: createProfessionalSchedule,
  update: updateProfessionalSchedule,
  delete: deleteProfessionalSchedule,
};