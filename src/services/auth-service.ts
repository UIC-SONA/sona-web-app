import axios from 'axios';
import {jwtDecode} from "jwt-decode";


const tokenEndpoint = import.meta.env.VITE_TOKEN_ENDPOINT as string;
const introspectionEndpoint = import.meta.env.VITE_INTROSPECTION_ENDPOINT as string;
const userInfoEndpoint = import.meta.env.VITE_USERINFO_ENDPOINT as string;
const endSessionEndpoint = import.meta.env.VITE_END_SESSION_ENDPOINT as string;
const clientId = import.meta.env.VITE_CLIENT_ID as string;
const clientSecret = import.meta.env.VITE_CLIENT_SECRET as string;

export interface AccessToken {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  token_type: string;
  scope: string;
}

export interface UserInfo {
  sub: string;
  preferred_username: string;
  email: string;
}

export interface AccessTokenError {
  error: string;
  error_description: string;
}

export function isAccessTokenError(error: unknown): error is AccessTokenError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'error' in error &&
    'error_description' in error
  );
}

const introspectAuthorization = btoa(`${clientId}:${clientSecret}`);
const introspectAuthorizationHeader = `Basic ${introspectAuthorization}`;

export async function login(username: string, password: string): Promise<AccessToken> {
  const response = await axios.post<AccessToken>(
    tokenEndpoint,
    new URLSearchParams({
      grant_type: 'password',
      client_id: clientId,
      client_secret: clientSecret,
      username,
      password,
      scope: 'openid',
    }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );

  return response.data;
}

export async function logout(accessToken: AccessToken) {
  await axios.post(
    endSessionEndpoint,
    new URLSearchParams({
      "client_id": clientId,
      "client_secret": clientSecret,
      "refresh_token": accessToken.refresh_token,
    }),
    {
      headers: {
        Authorization: `Bearer ${accessToken.access_token}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );
}

export async function userInfo(accessToken: AccessToken): Promise<UserInfo> {
  const response = await axios.get<UserInfo>(
    userInfoEndpoint,
    {
      headers: {
        Authorization: `Bearer ${accessToken.access_token}`,
      },
    }
  );

  return response.data;
}

export async function introspect(accessToken: AccessToken): Promise<boolean> {
  try {
    const response = await axios.post(
      introspectionEndpoint,
      new URLSearchParams({
        token: accessToken.access_token,
      }),
      {
        headers: {
          Authorization: introspectAuthorizationHeader,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    return response.data.active;
  } catch (error) {
    console.error(error);
    return false;
  }
}

export async function refresh(accessToken: AccessToken): Promise<AccessToken> {
  const response = await axios.post<AccessToken>(
    tokenEndpoint,
    new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: accessToken.refresh_token,
    }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );

  return response.data;
}

export function isExpired(accessToken: AccessToken): boolean {
  const decoded = jwtDecode(accessToken.access_token);
  const expiration = decoded.exp as number * 1000;
  return expiration * 1000 < Date.now();
}

export function canRefresh(accessToken: AccessToken): boolean {
  if (!accessToken.refresh_token) {
    return false;
  }
  return isExpired(accessToken) && !isExpired(accessToken);
}
