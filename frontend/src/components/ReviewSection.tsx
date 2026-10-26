import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createReview, getUserReviews } from '@/api/reviews.api';
import { getErrorMessage } from '@/api/client';
import type { Booking, User } from '@/types';

interface ReviewSectionProps {
  booking: Booking;
  me: User;
}

function stars(rating: number): string {
  return '★'.repeat(rating) + '☆'.repeat(5 - rating);
}

/** 완료된 예약에 대해 상대방(고객↔기사)에게 리뷰를 남기거나, 이미 남긴 리뷰를 보여준다. */
export default function ReviewSection({ booking, me }: ReviewSectionProps): JSX.Element {
  const queryClient = useQueryClient();
  const targetId = me.id === booking.customerId ? booking.workerId : booking.customerId;
  const [rating, setRating] = useState('5');
  const [comment, setComment] = useState('');

  const { data: targetReviews = [], isLoading } = useQuery({
    queryKey: ['reviews', targetId],
    queryFn: () => getUserReviews(targetId),
  });

  const mutation = useMutation({
    mutationFn: () =>
      createReview(booking.id, {
        rating: parseInt(rating, 10),
        comment: comment.trim() || undefined,
        targetId,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['reviews', targetId] });
    },
  });

  if (isLoading) return <p className="mt-3 text-xs text-gray-400">리뷰 확인 중...</p>;

  const myReview = targetReviews.find((r) => r.bookingId === booking.id && r.reviewerId === me.id);
  if (myReview) {
    return (
      <div className="mt-3 bg-gray-50 rounded p-3 text-sm">
        <p className="text-gray-500 text-xs mb-1">내가 남긴 리뷰</p>
        <p className="text-yellow-500">{stars(myReview.rating)}</p>
        {myReview.comment && <p className="text-gray-700 mt-1">{myReview.comment}</p>}
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }}
      className="mt-3 bg-gray-50 rounded p-3 space-y-2"
    >
      <p className="text-sm font-medium">리뷰 남기기</p>
      {mutation.error && (
        <p className="text-xs text-red-600">
          {getErrorMessage(mutation.error) ?? '리뷰를 등록하지 못했습니다.'}
        </p>
      )}
      <div className="flex items-center gap-2">
        <label htmlFor={`rating-${booking.id}`} className="text-sm text-gray-600">별점</label>
        <select
          id={`rating-${booking.id}`}
          value={rating}
          onChange={(e) => setRating(e.target.value)}
          className="border border-gray-300 rounded px-2 py-1 text-sm"
        >
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>{stars(n)} ({n})</option>
          ))}
        </select>
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="작업은 어땠나요? (선택)"
        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
        rows={2}
      />
      <button
        type="submit"
        disabled={mutation.isPending}
        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
      >
        {mutation.isPending ? '등록 중...' : '리뷰 등록'}
      </button>
    </form>
  );
}
