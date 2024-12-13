import apiClient from "@/lib/axios.ts";
import {Message} from "@/lib/types.ts";
import {CrudOperations, Listable, Page, Pageable, PageQuery, pageQueryToQueryParams} from "@/lib/crud.ts";
import {Buffer} from "buffer";

export interface Tip {
  id: string;
  title: string;
  summary: string;
  description: string;
  tags: string[];
  image: string;
  active: boolean;
}

export interface TipDto {
  title: string;
  summary: string;
  description: string;
  tags: string[];
  image: string;
  active: boolean;
  file: File;
}

const resource = '/content/tips';

export async function tipImage(id: string): Promise<string> {
  const response = await apiClient.get<string>(
    `${resource}/${id}/image`,
    {
      responseType: 'arraybuffer',
    }
  );
  const contentType = response.headers['content-type']; // Obtener el tipo de contenido
  const base64 = Buffer.from(response.data, 'binary').toString('base64');
  return `data:${contentType};base64,${base64}`;
}

export async function deleteTipImage(id: string): Promise<Message> {
  const response = await apiClient.delete<Message>(
    `${resource}/${id}/image`,
  );

  return response.data;
}

export async function listActiveTips(): Promise<Tip[]> {
  const response = await apiClient.get<Tip[]>(
    `${resource}/active`,
  );

  return response.data;
}

export async function pageActiveTips(query: PageQuery): Promise<Page<Tip>> {
  const response = await apiClient.get<Page<Tip>>(
    `${resource}/active/page`,
    {
      params: pageQueryToQueryParams(query),
    }
  );

  return response.data;
}


export async function listTip(search?: string): Promise<Tip[]> {
  const response = await apiClient.get<Tip[]>(
    `${resource}`,
    {
      params: {
        search,
      },
    }
  );

  return response.data;
}


export async function pageTip(query: PageQuery): Promise<Page<Tip>> {
  const response = await apiClient.get<Page<Tip>>(
    `${resource}/page`,
    {
      params: pageQueryToQueryParams(query),
    }
  );

  return response.data;
}

export async function findTip(id: string): Promise<Tip> {
  const response = await apiClient.get<Tip>(
    `${resource}/${id}`,
  );

  return response.data;
}

export async function findManyTip(ids: string[]): Promise<Tip[]> {
  const response = await apiClient.get<Tip[]>(
    `${resource}/many`,
    {
      params: new URLSearchParams({
        ids: ids.join(','),
      }),
    }
  );

  return response.data;
}

export async function countTip(): Promise<number> {
  const response = await apiClient.get<number>(
    `${resource}/count`,
  );

  return response.data;
}

export async function existTip(id: string): Promise<boolean> {
  const response = await apiClient.get<boolean>(
    `${resource}/exist/${id}`,
  );

  return response.data;
}

export async function createTip(entity: TipDto): Promise<Tip> {
  const response = await apiClient.post<Tip>(
    `${resource}`,
    entity,
  );

  return response.data;
}

export async function updateTip(id: string, entity: TipDto): Promise<Tip> {
  const response = await apiClient.put<Tip>(
    `${resource}/${id}`,
    entity,
  );

  return response.data;
}


export async function deleteTip(id: string): Promise<void> {
  await apiClient.delete<void>(
    `${resource}/${id}`,
  );
}


export const operationTips: CrudOperations<Tip, TipDto, string> = {
  list: listTip,
  page: pageTip,
  find: findTip,
  findMany: findManyTip,
  count: countTip,
  exist: existTip,
  create: createTip,
  update: updateTip,
  delete: deleteTip,
};

export const operationActiveTips: Listable<Tip> & Pageable<Tip> = {
  list: listActiveTips,
  page: pageActiveTips,
}