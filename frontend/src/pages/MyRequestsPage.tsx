import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getMyServiceRequests } from '@/api/service-requests.api';
import type { ServiceRequest } from '@/types';

const STATUS_LABELS: Record<ServiceRequest['status'], string> = {
  open: '모집중',
  quoted: '견적접수',
  booked: '예약완료',
  completed: '완료',
  cancelled: '취소',
};

export default function MyRequestsPage(): JSX.Element {
  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['my-service-requests'],
    queryFn: getMyServiceRequests,
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">내 의뢰 목록</h1>
      {isLoading ? (
        <p className="text-center text-gray-500">로딩 중...</p>
      ) : requests.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">등록한 의뢰가 없습니다.</p>
          <Link to="/" className="text-blue-600 hover:underline">의뢰 등록하기</Link>
        </div>
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
                  <h3 className="font-semibold">{req.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{req.address}</p>
                  {req.category && (
                    <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded mt-2 inline-block">
                      {req.category.name}
                    </span>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(req.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                  {STATUS_LABELS[req.status]}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
