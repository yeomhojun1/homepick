import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '@/api/auth.api';
import { getErrorMessage, getErrorStatus } from '@/api/client';
import { useAuthStore } from '@/store/useAuthStore';
import { isDemo } from '@/config/env';
import DemoLoginButtons from '@/demo/DemoLoginButtons';

export default function LoginPage(): JSX.Element {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const result = await login({ email, password });
      setAuth(result.user, result.accessToken);
      navigate('/');
    } catch (err) {
      const status = getErrorStatus(err);
      if (status === undefined) {
        setError('서버에 연결할 수 없습니다. 백엔드가 실행 중인지 확인해 주세요.');
      } else if (status === 401) {
        setError('이메일 또는 비밀번호가 올바르지 않습니다.');
      } else {
        setError(
          getErrorMessage(err) ?? '로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.',
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6 text-blue-600">Homepick</h1>
        <h2 className="text-xl font-semibold mb-4">로그인</h2>
        {isDemo && <DemoLoginButtons />}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        <form onSubmit={(e) => { void handleSubmit(e); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? '로그인 중...' : '로그인'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-600 mt-4">
          계정이 없으신가요?{' '}
          <Link to="/register" className="text-blue-600 hover:underline">
            회원가입
          </Link>
        </p>
      </div>
    </div>
  );
}
