import { apiClient } from './client';
import type { ApiResponse, ServiceRequest } from '@/types';

interface CreateServiceRequestPayload {
  categoryId: number;
  title: string;
  description: string;
  address: string;
  imageUrls?: string[];
  preferredDate?: string;
}

export async function createServiceRequest(payload: CreateServiceRequestPayload): Promise<ServiceRequest> {
  const { data } = await apiClient.post<ApiResponse<ServiceRequest>>('/api/v1/service-requests', payload);
  return data.data;
}

export async function getServiceRequests(): Promise<ServiceRequest[]> {
  const { data } = await apiClient.get<ApiResponse<ServiceRequest[]>>('/api/v1/service-requests');
  return data.data;
}

export async function getMyServiceRequests(): Promise<ServiceRequest[]> {
  const { data } = await apiClient.get<ApiResponse<ServiceRequest[]>>('/api/v1/service-requests/my');
  return data.data;
}

export async function getServiceRequest(id: number): Promise<ServiceRequest> {
  const { data } = await apiClient.get<ApiResponse<ServiceRequest>>(`/api/v1/service-requests/${id}`);
  return data.data;
}

export async function cancelServiceRequest(id: number): Promise<ServiceRequest> {
  const { data } = await apiClient.patch<ApiResponse<ServiceRequest>>(`/api/v1/service-requests/${id}/cancel`);
  return data.data;
}
