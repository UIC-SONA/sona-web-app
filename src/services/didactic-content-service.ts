import apiClient from "@/lib/axios.ts";
import {CrudOperations, Page, PageQuery, pageQueryToQueryParams} from "@/lib/crud.ts";
import {Buffer} from "buffer";

export interface DidaticContent {
  id: string;
  title: string;
  content: string;
  image: string;
}

export interface DidaticContentDto {
  title: string;
  content: string;
  image: File | undefined;
}

const resource = '/content/didactic';

export async function didacticContentImage(id: string): Promise<string> {
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

export async function pageDidacticContent(query: PageQuery): Promise<Page<DidaticContent>> {
  const response = await apiClient.get<Page<DidaticContent>>(
    resource,
    {
      params: pageQueryToQueryParams(query),
    }
  );

  return response.data;
}

export async function findDidacticContent(id: string): Promise<DidaticContent> {
  const response = await apiClient.get<DidaticContent>(
    `${resource}/${id}`,
  );

  return response.data;
}

export async function findManyDidacticContent(ids: string[]): Promise<DidaticContent[]> {
  const response = await apiClient.get<DidaticContent[]>(
    `${resource}/many`,
    {
      params: new URLSearchParams({
        ids: ids.join(','),
      }),
    }
  );

  return response.data;
}

export async function countDidacticContent(): Promise<number> {
  const response = await apiClient.get<number>(
    `${resource}/count`,
  );

  return response.data;
}

export async function existDidacticContent(id: string): Promise<boolean> {
  const response = await apiClient.get<boolean>(
    `${resource}/exist/${id}`,
  );

  return response.data;
}

function dtoToFormData(entity: DidaticContentDto): FormData {
  const formData = new FormData();
  formData.append('title', entity.title);
  formData.append('content', entity.content);
  if (entity.image) formData.append('image', entity.image);
  return formData;
}

export async function createDidacticContent(entity: DidaticContentDto): Promise<DidaticContent> {
  const formData = dtoToFormData(entity);
  const response = await apiClient.post<DidaticContent>(
    resource,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  return response.data;
}

export async function updateDidacticContent(id: string, entity: DidaticContentDto): Promise<DidaticContent> {
  const formData = dtoToFormData(entity);
  const response = await apiClient.put<DidaticContent>(
    `${resource}/${id}`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  return response.data;
}


export async function deleteDidacticContent(id: string): Promise<void> {
  await apiClient.delete<void>(
    `${resource}/${id}`,
  );
}


export const operationDidacticContent: CrudOperations<DidaticContent, DidaticContentDto, string> = {
  page: pageDidacticContent,
  find: findDidacticContent,
  findMany: findManyDidacticContent,
  count: countDidacticContent,
  exist: existDidacticContent,
  create: createDidacticContent,
  update: updateDidacticContent,
  delete: deleteDidacticContent,
};