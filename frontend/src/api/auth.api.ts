import { apiClient } from './client';
import type { ApiResponse, User } from '@/types';

interface LoginPayload {
  email: string;
  password: string;
}

interface RegisterPayload {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role: 'customer' | 'worker';
}

interface AuthResponse {
  accessToken: string;
  user: User;
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const { data } = await apiClient.post<ApiResponse<AuthResponse>>('/api/v1/auth/login', payload);
  return data.data;
}

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  const { data } = await apiClient.post<ApiResponse<AuthResponse>>('/api/v1/auth/register', payload);
  return data.data;
}

export async function getMe(): Promise<User> {
  const { data } = await apiClient.get<ApiResponse<User>>('/api/v1/auth/me');
  return data.data;
}

export async function updateMe(payload: Partial<Pick<User, 'name' | 'phone' | 'fcmToken'>>): Promise<User> {
  const { data } = await apiClient.patch<ApiResponse<User>>('/api/v1/auth/me', payload);
  return data.data;
}
