import { apiClient } from './client';
import type { ApiResponse, Review } from '@/types';

interface CreateReviewPayload {
  rating: number;
  comment?: string;
  targetId: number;
}

export async function createReview(bookingId: number, payload: CreateReviewPayload): Promise<Review> {
  const { data } = await apiClient.post<ApiResponse<Review>>(
    `/api/v1/bookings/${bookingId}/reviews`,
    payload,
  );
  return data.data;
}

export async function getUserReviews(userId: number): Promise<Review[]> {
  const { data } = await apiClient.get<ApiResponse<Review[]>>(`/api/v1/users/${userId}/reviews`);
  return data.data;
}
