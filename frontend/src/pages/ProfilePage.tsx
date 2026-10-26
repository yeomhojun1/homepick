import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { updateMe } from '@/api/auth.api';
import { getUserReviews } from '@/api/reviews.api';
import { useAuthStore } from '@/store/useAuthStore';

export default function ProfilePage(): JSX.Element {
  const { user, setAuth, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: user?.name ?? '',
    phone: user?.phone ?? '',
  });
  const [saved, setSaved] = useState(false);

  const { data: receivedReviews = [] } = useQuery({
    queryKey: ['reviews', user?.id],
    queryFn: () => getUserReviews(user?.id ?? 0),
    enabled: !!user,
  });

  const updateMutation = useMutation({
    mutationFn: () => updateMe({ name: form.name, phone: form.phone }),
    onSuccess: (updatedUser) => {
      const token = localStorage.getItem('accessToken') ?? '';
      setAuth(updatedUser, token);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const handleLogout = (): void => {
    clearAuth();
    navigate('/login');
  };

  if (!user) return <div className="p-8 text-center">로그인이 필요합니다.</div>;

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">프로필</h1>
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-4">
          <p className="text-sm text-gray-500">이메일</p>
          <p className="font-medium">{user.email}</p>
        </div>
        <div className="mb-4">
          <p className="text-sm text-gray-500">역할</p>
          <p className="font-medium">{user.role === 'customer' ? '고객' : '기사'}</p>
        </div>

        {saved && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded mb-4 text-sm">
            저장되었습니다.
          </div>
        )}

        <form
          onSubmit={(e) => { e.preventDefault(); updateMutation.mutate(); }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
            <input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">전화번호</label>
            <input
              value={form.phone}
              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {updateMutation.isPending ? '저장 중...' : '저장'}
          </button>
        </form>

        <button
          onClick={handleLogout}
          className="w-full mt-4 bg-gray-100 text-gray-700 py-2 rounded-md hover:bg-gray-200"
        >
          로그아웃
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mt-6">
        <h2 className="text-lg font-semibold mb-3">받은 리뷰 ({receivedReviews.length})</h2>
        {receivedReviews.length === 0 ? (
          <p className="text-sm text-gray-500">아직 받은 리뷰가 없습니다.</p>
        ) : (
          <ul className="space-y-3">
            {receivedReviews.map((review) => (
              <li key={review.id} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                <p className="text-yellow-500 text-sm">
                  {'★'.repeat(review.rating) + '☆'.repeat(5 - review.rating)}
                </p>
                {review.comment && <p className="text-sm text-gray-700 mt-1">{review.comment}</p>}
                <p className="text-xs text-gray-400 mt-1">
                  {review.reviewer?.name ?? '익명'} · {new Date(review.createdAt).toLocaleDateString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
