import axios from 'axios';
import {AccessToken, getStoredToken} from "@/context/auth-context.tsx";

const apiUrl = import.meta.env.VITE_API_URL as string;

console.log(apiUrl)

const apiClient = axios.create({
  baseURL: apiUrl
});

apiClient.interceptors.request.use(
  async (config) => {
    const token = getStoredToken()
    if (token) {
      const accessToken = JSON.parse(token) as AccessToken;
      config.headers.Authorization = `Bearer ${accessToken.access_token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;