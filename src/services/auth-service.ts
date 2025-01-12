import axios from 'axios';
import {jwtDecode, JwtPayload} from "jwt-decode";


const TOKEN_END_POINT = import.meta.env.VITE_TOKEN_ENDPOINT as string;
const INTROSPECTION_ENDPOINT = import.meta.env.VITE_INTROSPECTION_ENDPOINT as string;
const USER_INFO_ENDPOINT = import.meta.env.VITE_USERINFO_ENDPOINT as string;
const END_SESSION_ENDPOINT = import.meta.env.VITE_END_SESSION_ENDPOINT as string;
const CLIENT_ID = import.meta.env.VITE_CLIENT_ID as string;
const CLIENT_SECRET = import.meta.env.VITE_CLIENT_SECRET as string;
const ACCESS_TOKEN_KEY = 'access_token';

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

export function isAccessToken(token: unknown): token is AccessToken {
  return (
    typeof token === 'object' &&
    token !== null &&
    'access_token' in token &&
    'expires_in' in token &&
    'refresh_token' in token &&
    'token_type' in token &&
    'scope' in token
  );
}

export function isAccessTokenError(error: unknown): error is AccessTokenError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'error' in error &&
    'error_description' in error
  );
}

const introspectAuthorization = btoa(`${CLIENT_ID}:${CLIENT_SECRET}`);
const introspectAuthorizationHeader = `Basic ${introspectAuthorization}`;

export async function login(username: string, password: string): Promise<AccessToken> {
  const response = await axios.post<AccessToken>(
    TOKEN_END_POINT,
    new URLSearchParams({
      grant_type: 'password',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
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
    END_SESSION_ENDPOINT,
    new URLSearchParams({
      "client_id": CLIENT_ID,
      "client_secret": CLIENT_SECRET,
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
    USER_INFO_ENDPOINT,
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
      INTROSPECTION_ENDPOINT,
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
    TOKEN_END_POINT,
    new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: accessToken.refresh_token,
    }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );
  console.log("refresh response", response);
  return response.data;
}

function isExpiredTime(expiration: number): boolean {
  return expiration < Date.now();
}

export function isExpired(accessToken: AccessToken): boolean {
  const decoded: JwtPayload = jwtDecode(accessToken.access_token);
  return isExpiredTime(decoded.exp as number * 1000);
}

export function canRefresh(accessToken: AccessToken): boolean {
  if (!accessToken.refresh_token) {
    return false;
  }
  const decoded: JwtPayload = jwtDecode(accessToken.refresh_token);
  return !isExpiredTime(decoded.exp as number * 1000);
}

export enum RefreshTokenBadResult {
  NO_TOKEN,
  EXPIRED_TOKEN,
}

export async function updateAndLoadAccessToken(): Promise<AccessToken | RefreshTokenBadResult> {
  const storedToken = loadAccessToken();
  if (storedToken) {
    if (!isExpired(storedToken)) {
      return storedToken;
    }
    if (canRefresh(storedToken)) {
      const refreshedToken = await refresh(storedToken);
      saveAccessToken(refreshedToken);
      return refreshedToken;
    } else {
      clearAccessToken();
      return RefreshTokenBadResult.EXPIRED_TOKEN;
    }
  }
  return RefreshTokenBadResult.NO_TOKEN;
}

export function loadAccessToken(): AccessToken | null {
  const storedToken = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (storedToken) {
    return JSON.parse(storedToken) as AccessToken;
  }
  return null;
}

export function saveAccessToken(token: AccessToken) {
  localStorage.setItem(ACCESS_TOKEN_KEY, JSON.stringify(token));
}

export function clearAccessToken() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
}
