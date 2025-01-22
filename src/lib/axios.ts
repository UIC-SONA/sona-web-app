import axios from 'axios';
import {
  isAccessToken,
  updateAndLoadAccessToken
} from "@/services/auth-service.ts";
import {API_URL} from "@/constans.ts";


const apiClient = axios.create({
  baseURL: API_URL
});

apiClient.interceptors.request.use(
  async (config) => {
    const token = await updateAndLoadAccessToken();
    if (isAccessToken(token)) {
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