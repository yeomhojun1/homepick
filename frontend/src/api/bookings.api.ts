import { apiClient } from './client';
import type { ApiResponse, Booking } from '@/types';

export async function getMyBookings(): Promise<Booking[]> {
  const { data } = await apiClient.get<ApiResponse<Booking[]>>('/api/v1/bookings/my');
  return data.data;
}

export async function getBooking(id: number): Promise<Booking> {
  const { data } = await apiClient.get<ApiResponse<Booking>>(`/api/v1/bookings/${id}`);
  return data.data;
}

export async function completeBooking(id: number): Promise<Booking> {
  const { data } = await apiClient.patch<ApiResponse<Booking>>(`/api/v1/bookings/${id}/complete`);
  return data.data;
}
