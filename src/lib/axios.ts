import axios from 'axios';
import {
  updateAndLoadAccessToken
} from "@/services/auth-service.ts";

const apiUrl = import.meta.env.VITE_API_URL as string;

console.log(apiUrl)

const apiClient = axios.create({
  baseURL: apiUrl
});

apiClient.interceptors.request.use(
  async (config) => {
    const token = await updateAndLoadAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token.access_token}`;
    }
    return config;
  },
  (error) => {
    console.error('Error setting token:', error);
    return Promise.reject(error);
  }
);

export default apiClient;