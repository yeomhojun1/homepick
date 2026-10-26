import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMyBookings, completeBooking } from '@/api/bookings.api';
import { useAuthStore } from '@/store/useAuthStore';
import ReviewSection from '@/components/ReviewSection';
import type { Booking } from '@/types';

const STATUS_LABELS: Record<Booking['status'], string> = {
  confirmed: '예약확정',
  in_progress: '진행중',
  completed: '완료',
  cancelled: '취소',
};

export default function MyBookingsPage(): JSX.Element {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: getMyBookings,
  });

  const completeMutation = useMutation({
    mutationFn: (bookingId: number) => completeBooking(bookingId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
    },
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">내 예약</h1>
      {isLoading ? (
        <p className="text-center text-gray-500">로딩 중...</p>
      ) : bookings.length === 0 ? (
        <p className="text-center text-gray-500 py-12">예약 내역이 없습니다.</p>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div key={booking.id} className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-start justify-between">
                <div>
                  {booking.serviceRequest && (
                    <h3 className="font-semibold">{booking.serviceRequest.title}</h3>
                  )}
                  <p className="text-sm text-gray-500 mt-1">
                    예약일: {new Date(booking.scheduledAt).toLocaleDateString()}
                  </p>
                  {user?.role === 'customer' && booking.worker && (
                    <p className="text-sm text-gray-600 mt-1">기사: {booking.worker.name}</p>
                  )}
                  {user?.role === 'worker' && booking.customer && (
                    <p className="text-sm text-gray-600 mt-1">고객: {booking.customer.name}</p>
                  )}
                </div>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {STATUS_LABELS[booking.status]}
                </span>
              </div>
              {user?.role === 'worker' && booking.status === 'confirmed' && (
                <button
                  onClick={() => completeMutation.mutate(booking.id)}
                  disabled={completeMutation.isPending}
                  className="mt-3 bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50"
                >
                  완료 처리
                </button>
              )}
              {user && booking.status === 'completed' && (
                <ReviewSection booking={booking} me={user} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
