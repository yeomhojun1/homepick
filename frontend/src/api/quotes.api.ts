import { apiClient } from './client';
import type { ApiResponse, Quote, Booking } from '@/types';

interface CreateQuotePayload {
  price: number;
  message: string;
  estimatedHours?: number;
}

export async function createQuote(requestId: number, payload: CreateQuotePayload): Promise<Quote> {
  const { data } = await apiClient.post<ApiResponse<Quote>>(
    `/api/v1/service-requests/${requestId}/quotes`,
    payload,
  );
  return data.data;
}

export async function getQuotes(requestId: number): Promise<Quote[]> {
  const { data } = await apiClient.get<ApiResponse<Quote[]>>(
    `/api/v1/service-requests/${requestId}/quotes`,
  );
  return data.data;
}

export async function acceptQuote(quoteId: number): Promise<Booking> {
  const { data } = await apiClient.patch<ApiResponse<Booking>>(`/api/v1/quotes/${quoteId}/accept`);
  return data.data;
}

export async function rejectQuote(quoteId: number): Promise<Quote> {
  const { data } = await apiClient.patch<ApiResponse<Quote>>(`/api/v1/quotes/${quoteId}/reject`);
  return data.data;
}
