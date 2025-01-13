import apiClient from "@/lib/axios.ts";
import {Message} from "@/lib/types.ts";
import {restCrud} from "@/lib/rest-crud.ts";
import {Entity} from "@/lib/crud.ts";

const resource = '/user';

export interface BaseUser {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface SingUp extends BaseUser {
  password: string;
}


export enum Authority {
  ADMIN = "ADMIN",
  ADMINISTRATIVE = "ADMINISTRATIVE",
  MEDICAL_PROFESSIONAL = "MEDICAL_PROFESSIONAL",
  LEGAL_PROFESSIONAL = "LEGAL_PROFESSIONAL",
  USER = "USER",
}

export interface User extends Entity<number> {
  keycloakId: string;
  profilePicturePath: string;
  username: string;
  firstName: string;
  lastName: string;
  enabled: boolean;
  email: string;
  authorities: Authority[];
}

export interface UserDto extends BaseUser {
  authoritiesToAdd: Authority[];
  authoritiesToRemove: Authority[];
  password: string | undefined;
}


export interface UserFilter {
  authorities: Authority[];
}


async function singUp(signUp: SingUp): Promise<Message> {
  const response = await apiClient.post<Message>(
    `${resource}/sign-up`,
    signUp,
  );

  return response.data;
}

async function profilePicture(): Promise<string> {
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

function profilePicturePath(userId: number): string {
  return apiClient.defaults.baseURL + `${resource}/${userId}/profile-picture`;
}

async function saveProfilePicture(file: File): Promise<Message> {
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

async function deleteProfilePicture(): Promise<Message> {
  const response = await apiClient.delete<Message>(
    `${resource}/profile-picture`,
  );

  return response.data;
}

async function profile(): Promise<User> {
  const response = await apiClient.get<User>(
    `${resource}/profile`,
  );

  return response.data;
}

async function enable(id: number, enabled: boolean): Promise<Message> {
  const response = await apiClient.put<Message>(
    `${resource}/enable`,
    null,
    {
      params: {
        id,
        value: enabled,
      },
    }
  );

  return response.data;
}

async function mapUsers(ids: number[]): Promise<{ [key: number]: User }> {
  const response = await apiClient.get<{ [key: number]: User }>(
    `${resource}/map`,
    {
      params: {
        ids: ids.join(','),
      },
    }
  );

  return response.data;
}

function getAuthorityName(authority: Authority): string {
  switch (authority) {
    case Authority.ADMIN:
      return "Administrador";
    case Authority.ADMINISTRATIVE:
      return "Administrativo";
    case Authority.MEDICAL_PROFESSIONAL:
      return "Profesional Médico";
    case Authority.LEGAL_PROFESSIONAL:
      return "Profesional Legal";
    case Authority.USER:
      return "Usuario";
  }
}


const crudOperations = restCrud<User, UserDto, number, UserFilter>(apiClient, resource)

export const userService = {
  ...crudOperations,
  profile,
  profilePicture,
  profilePicturePath,
  saveProfilePicture,
  deleteProfilePicture,
  singUp,
  getAuthorityName,
  enable,
  mapUsers,
};