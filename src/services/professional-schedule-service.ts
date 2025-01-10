import apiClient from "@/lib/axios.ts";
import {Entity} from "@/lib/crud.ts";
import {User} from "@/services/user-service.ts";
import {restCrud} from "@/lib/rest-crud.ts";
import {format, parseISO} from "date-fns";

const resource = '/professional-schedule';

export interface ProfessionalSchedule extends Entity<number> {
  date: Date;
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

async function createAll(data: ProfessionalScheduleDto[]): Promise<ProfessionalSchedule[]> {
  const response = await apiClient.post<any[]>(
    `${resource}/all`,
    data
  );

  return response.data.map(modelTransformer);
}

async function byProfessionalId(professionalId: number, from: Date, to: Date): Promise<ProfessionalSchedule[]> {
  const response = await apiClient.get<ProfessionalSchedule[]>(
    `${resource}/professional/${professionalId}`,
    {
      params: {
        from: format(from, 'yyyy-MM-dd'),
        to: format(to, 'yyyy-MM-dd'),
      },
    }
  );

  return response.data.map(modelTransformer);
}

function modelTransformer(model: any): ProfessionalSchedule {
  return {
    ...model,
    date: parseISO(model.date),
  };
}


const crudOperations = restCrud<ProfessionalSchedule, ProfessionalScheduleDto, number>(
  apiClient,
  resource,
  {modelTransformer}
);


export const professionalScheduleService = {
  ...crudOperations,
  createAll,
  getByProfessional: byProfessionalId,
}