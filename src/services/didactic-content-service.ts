import apiClient from "@/lib/axios.ts";
import {Buffer} from "buffer";
import {
  CrudHeadersConfig,
  restCrud
} from "@/lib/rest-crud.ts";

const resource = '/content/didactic';

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

function dtoTranformer(dto: DidaticContentDto): FormData {
  const formData = new FormData();
  formData.append('title', dto.title);
  formData.append('content', dto.content);
  if (dto.image) formData.append('image', dto.image);
  return formData;
}


const commonHeaders = {
  'Content-Type': 'multipart/form-data',
};

const headers: CrudHeadersConfig = {
  creatable: commonHeaders,
  updatable: commonHeaders,
};


const crudOperations = restCrud<DidaticContent, DidaticContentDto, string>(
  apiClient,
  resource,
  {
    headers,
    dtoTranformer,
  }
);


export const didacticContentService = {
  ...crudOperations,
  getImage,
};

