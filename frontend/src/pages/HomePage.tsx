import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getServiceRequests } from '@/api/service-requests.api';
import { getCategories } from '@/api/categories.api';
import { createServiceRequest } from '@/api/service-requests.api';
import { useAuthStore } from '@/store/useAuthStore';
import {
  SERVICE_REQUEST_STATUS_COLORS,
  SERVICE_REQUEST_STATUS_LABELS,
} from '@/constants/status';

export default function HomePage(): JSX.Element {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    categoryId: '',
    title: '',
    description: '',
    address: '',
    preferredDate: '',
  });

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['service-requests'],
    queryFn: getServiceRequests,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  const createMutation = useMutation({
    mutationFn: createServiceRequest,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['service-requests'] });
      setShowForm(false);
      setForm({ categoryId: '', title: '', description: '', address: '', preferredDate: '' });
    },
  });

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    createMutation.mutate({
      categoryId: parseInt(form.categoryId, 10),
      title: form.title,
      description: form.description,
      address: form.address,
      preferredDate: form.preferredDate || undefined,
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">의뢰 목록</h1>
        {user?.role === 'customer' && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            의뢰 등록
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-lg font-semibold mb-4">새 의뢰 등록</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
              <select
                value={form.categoryId}
                onChange={(e) => setForm((p) => ({ ...p, categoryId: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                required
              >
                <option value="">선택하세요</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
              <input
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                required
                minLength={2}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">상세 설명</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                rows={3}
                required
                minLength={10}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">주소</label>
              <input
                value={form.address}
                onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">희망 날짜 (선택)</label>
              <input
                type="datetime-local"
                value={form.preferredDate}
                onChange={(e) => setForm((p) => ({ ...p, preferredDate: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {createMutation.isPending ? '등록 중...' : '등록'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
              >
                취소
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <p className="text-center text-gray-500">로딩 중...</p>
      ) : requests.length === 0 ? (
        <p className="text-center text-gray-500">등록된 의뢰가 없습니다.</p>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <Link
              key={req.id}
              to={`/requests/${req.id}`}
              className="block bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{req.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{req.address}</p>
                  {req.category && (
                    <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded mt-2 inline-block">
                      {req.category.name}
                    </span>
                  )}
                </div>
                <span className={`text-xs px-2 py-1 rounded ${SERVICE_REQUEST_STATUS_COLORS[req.status]}`}>
                  {SERVICE_REQUEST_STATUS_LABELS[req.status]}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
