import axios from 'axios';
import { env } from '@/config/env';

export const apiClient = axios.create({
  baseURL: env.apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const AUTH_ATTEMPT_PATHS = ['/api/v1/auth/login', '/api/v1/auth/register'];

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const url = error.config?.url ?? '';
      const isAuthAttempt = AUTH_ATTEMPT_PATHS.some((path) => url.includes(path));
      if (!isAuthAttempt) {
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export function getErrorStatus(error: unknown): number | undefined {
  return axios.isAxiosError(error) ? error.response?.status : undefined;
}

export function getErrorMessage(error: unknown): string | undefined {
  if (!axios.isAxiosError(error)) return undefined;
  const data = error.response?.data as { message?: unknown } | undefined;
  return typeof data?.message === 'string' ? data.message : undefined;
}
