import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getServiceRequest, cancelServiceRequest } from '@/api/service-requests.api';
import { getQuotes, createQuote, acceptQuote, rejectQuote } from '@/api/quotes.api';
import { getErrorMessage } from '@/api/client';
import {
  SERVICE_REQUEST_STATUS_COLORS,
  SERVICE_REQUEST_STATUS_LABELS,
} from '@/constants/status';
import { useAuthStore } from '@/store/useAuthStore';

export default function RequestDetailPage(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const requestId = parseInt(id ?? '0', 10);
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [quoteForm, setQuoteForm] = useState({ price: '', message: '', estimatedHours: '' });

  const { data: request, isLoading } = useQuery({
    queryKey: ['service-request', requestId],
    queryFn: () => getServiceRequest(requestId),
  });

  const { data: quotes = [] } = useQuery({
    queryKey: ['quotes', requestId],
    queryFn: () => getQuotes(requestId),
    enabled: !!request,
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelServiceRequest(requestId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['service-request', requestId] });
    },
  });

  const quoteMutation = useMutation({
    mutationFn: () => createQuote(requestId, {
      price: parseInt(quoteForm.price, 10),
      message: quoteForm.message,
      estimatedHours: quoteForm.estimatedHours ? parseFloat(quoteForm.estimatedHours) : undefined,
    }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['quotes', requestId] });
      setShowQuoteForm(false);
      setQuoteForm({ price: '', message: '', estimatedHours: '' });
    },
  });

  const acceptMutation = useMutation({
    mutationFn: (quoteId: number) => acceptQuote(quoteId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['service-request', requestId] });
      void queryClient.invalidateQueries({ queryKey: ['quotes', requestId] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (quoteId: number) => rejectQuote(quoteId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['quotes', requestId] });
    },
  });

  if (isLoading) return <div className="p-8 text-center">로딩 중...</div>;
  if (!request) return <div className="p-8 text-center">의뢰를 찾을 수 없습니다.</div>;

  const isOwner = user?.id === request.customerId;
  const isWorker = user?.role === 'worker';
  const canSubmitQuote = isWorker && request.status === 'open';
  const actionError =
    cancelMutation.error ??
    quoteMutation.error ??
    acceptMutation.error ??
    rejectMutation.error;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {actionError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {getErrorMessage(actionError) ??
            '요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.'}
        </div>
      )}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <h1 className="text-2xl font-bold">{request.title}</h1>
          <span className={`text-sm px-2 py-1 rounded ${SERVICE_REQUEST_STATUS_COLORS[request.status]}`}>
            {SERVICE_REQUEST_STATUS_LABELS[request.status]}
          </span>
        </div>
        {request.category && (
          <p className="text-sm text-blue-600 mb-2">{request.category.name}</p>
        )}
        <p className="text-gray-700 mb-3">{request.description}</p>
        <p className="text-sm text-gray-500">주소: {request.address}</p>
        {request.preferredDate && (
          <p className="text-sm text-gray-500 mt-1">
            희망일: {new Date(request.preferredDate).toLocaleDateString()}
          </p>
        )}

        {isOwner && request.status === 'open' && (
          <button
            onClick={() => cancelMutation.mutate()}
            disabled={cancelMutation.isPending}
            className="mt-4 bg-red-100 text-red-700 px-4 py-2 rounded-md hover:bg-red-200 disabled:opacity-50"
          >
            의뢰 취소
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">견적 ({quotes.length})</h2>
          {canSubmitQuote && (
            <button
              onClick={() => setShowQuoteForm(!showQuoteForm)}
              className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700"
            >
              견적 제출
            </button>
          )}
        </div>

        {showQuoteForm && (
          <form
            onSubmit={(e) => { e.preventDefault(); quoteMutation.mutate(); }}
            className="bg-gray-50 p-4 rounded-md mb-4 space-y-3"
          >
            <div>
              <label className="block text-sm font-medium mb-1">견적 금액 (원)</label>
              <input
                type="number"
                value={quoteForm.price}
                onChange={(e) => setQuoteForm((p) => ({ ...p, price: e.target.value }))}
                className="w-full border border-gray-300 rounded px-3 py-2"
                required
                min={1}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">메시지</label>
              <textarea
                value={quoteForm.message}
                onChange={(e) => setQuoteForm((p) => ({ ...p, message: e.target.value }))}
                className="w-full border border-gray-300 rounded px-3 py-2"
                rows={2}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">예상 시간 (시간, 선택)</label>
              <input
                type="number"
                step="0.5"
                value={quoteForm.estimatedHours}
                onChange={(e) => setQuoteForm((p) => ({ ...p, estimatedHours: e.target.value }))}
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={quoteMutation.isPending}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                제출
              </button>
              <button
                type="button"
                onClick={() => setShowQuoteForm(false)}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
              >
                취소
              </button>
            </div>
          </form>
        )}

        {quotes.length === 0 ? (
          <p className="text-gray-500 text-sm">아직 견적이 없습니다.</p>
        ) : (
          <div className="space-y-3">
            {quotes.map((quote) => (
              <div key={quote.id} className="border border-gray-200 rounded-md p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-blue-700">
                      {quote.price.toLocaleString()}원
                    </p>
                    <p className="text-sm text-gray-600 mt-1">{quote.message}</p>
                    {quote.estimatedHours && (
                      <p className="text-xs text-gray-500 mt-1">예상 {quote.estimatedHours}시간</p>
                    )}
                    {quote.worker && (
                      <p className="text-xs text-gray-500 mt-1">기사: {quote.worker.name}</p>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    quote.status === 'accepted' ? 'bg-green-100 text-green-800' :
                    quote.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {quote.status === 'accepted' ? '수락됨' : quote.status === 'rejected' ? '거절됨' : '검토중'}
                  </span>
                </div>
                {isOwner && quote.status === 'pending' && request.status === 'open' && (
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => acceptMutation.mutate(quote.id)}
                      disabled={acceptMutation.isPending}
                      className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50"
                    >
                      수락
                    </button>
                    <button
                      onClick={() => rejectMutation.mutate(quote.id)}
                      disabled={rejectMutation.isPending}
                      className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-300 disabled:opacity-50"
                    >
                      거절
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
