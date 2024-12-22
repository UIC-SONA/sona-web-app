import apiClient from "@/lib/axios.ts";
import {Message} from "@/lib/types.ts";
import {CrudOperations, Page, PageQuery, pageQueryToQueryParams} from "@/lib/crud.ts";


export interface BaseUser {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface SingUp extends BaseUser {
  password: string;
}

export interface UserRepresentation {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  emailVerified: boolean;
  authorities: Authority[];
}


export enum Authority {
  ADMIN = "ADMIN",
  ADMINISTRATIVE = "ADMINISTRATIVE",
  PROFESSIONAL = "PROFESSIONAL",
  MEDICAL_PROFESSIONAL = "MEDICAL_PROFESSIONAL",
  LEGAL_PROFESSIONAL = "LEGAL_PROFESSIONAL",
  USER = "USER",
}

export interface User {
  id: number;
  keycloakId: string;
  profilePicturePath: string;
  representation: UserRepresentation;
  authorities: Authority[];
}

export interface UserDto extends BaseUser {
  authoritiesToAdd: Authority[];
  authoritiesToRemove: Authority[];
  password: string | undefined;
}

const resource = '/user';

export async function singUp(signUp: SingUp): Promise<Message> {
  const response = await apiClient.post<Message>(
    `${resource}/sign-up`,
    signUp,
  );

  return response.data;
}

export async function profilePicture(): Promise<string> {
  const response = await apiClient.get<string>(
    `${resource}/profile-picture`,
    {
      responseType: 'arraybuffer',
    }
  );
  const contentType = response.headers['content-type']; // Obtener el tipo de contenido
  const base64 = Buffer.from(response.data, 'binary').toString('base64');
  return `data:${contentType};base64,${base64}`;
}

export async function uploadProfilePicture(file: File): Promise<Message> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post<Message>(
    `${resource}/profile-picture`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  return response.data;
}

export async function deleteProfilePicture(): Promise<Message> {
  const response = await apiClient.delete<Message>(
    `${resource}/profile-picture`,
  );

  return response.data;
}

export async function profile(): Promise<User> {
  const response = await apiClient.get<User>(
    `${resource}/profile`,
  );

  return response.data;
}

export async function pageUser(query: PageQuery): Promise<Page<User>> {
  const response = await apiClient.get<Page<User>>(
    `${resource}`,
    {
      params: pageQueryToQueryParams(query),
    }
  );

  return response.data;
}

export async function findUser(id: number): Promise<User> {
  const response = await apiClient.get<User>(
    `${resource}/${id}`,
  );

  return response.data;
}

export async function findManyUser(ids: number[]): Promise<User[]> {
  const response = await apiClient.post<User[]>(
    `${resource}/many`,
    ids,
  );

  return response.data;
}

export async function countUser(): Promise<number> {
  const response = await apiClient.get<number>(
    `${resource}/count`,
  );

  return response.data;
}

export async function existUser(id: number): Promise<boolean> {
  const response = await apiClient.get<boolean>(
    `${resource}/exist/${id}`,
  );

  return response.data;
}

export async function createUser(entity: UserDto): Promise<User> {
  const response = await apiClient.post<User>(
    `${resource}`,
    entity,
  );

  return response.data;
}

export async function updateUser(id: number, entity: UserDto): Promise<User> {
  const response = await apiClient.put<User>(
    `${resource}/${id}`,
    entity,
  );

  return response.data;
}


export async function deleteUser(id: number): Promise<void> {
  await apiClient.delete<void>(
    `${resource}/${id}`,
  );
}


export const operationUsers: CrudOperations<User, UserDto, number> = {
  page: pageUser,
  find: findUser,
  findMany: findManyUser,
  count: countUser,
  exist: existUser,
  create: createUser,
  update: updateUser,
  delete: deleteUser,
};

