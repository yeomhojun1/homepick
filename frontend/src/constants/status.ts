import type { ServiceRequest } from '@/types';

export const SERVICE_REQUEST_STATUS_LABELS: Record<
  ServiceRequest['status'],
  string
> = {
  open: '모집중',
  quoted: '견적접수',
  booked: '예약완료',
  completed: '완료',
  cancelled: '취소',
};

export const SERVICE_REQUEST_STATUS_COLORS: Record<
  ServiceRequest['status'],
  string
> = {
  open: 'bg-green-100 text-green-800',
  quoted: 'bg-blue-100 text-blue-800',
  booked: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
};
