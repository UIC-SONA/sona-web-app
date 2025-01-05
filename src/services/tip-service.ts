import apiClient from "@/lib/axios.ts";
import {Message} from "@/lib/types.ts";
import {Buffer} from "buffer";
import {CrudHeadersConfig, restCrud} from "@/lib/rest-crud.ts";

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
  image: File | undefined;
  active: boolean;
}

const resource = '/content/tips';

async function getImage(id: string): Promise<string> {
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

async function deleteImage(id: string): Promise<Message> {
  const response = await apiClient.delete<Message>(
    `${resource}/${id}/image`,
  );

  return response.data;
}

function dtoTranformer(dto: TipDto): FormData {
  const formData = new FormData();
  formData.append('title', dto.title);
  formData.append('summary', dto.summary);
  formData.append('description', dto.description);
  formData.append('tags', new Blob([JSON.stringify(dto.tags)], {type: 'application/json'}));
  if (dto.image) formData.append('image', dto.image);
  formData.append('active', dto.active.toString());
  return formData;
}

const headers: CrudHeadersConfig = {
  creatable: {
    'Content-Type': 'multipart/form-data',
  },
  updatable: {
    'Content-Type': 'multipart/form-data',
  },
};

const crudOperations = restCrud<Tip, TipDto, string>(
  apiClient,
  resource,
  {
    headers,
    dtoTranformer
  }
);

export const tipsService = {
  ...crudOperations,
  getImage,
  deleteImage,
};