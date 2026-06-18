import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps): JSX.Element {
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = (): void => {
    clearAuth();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-blue-600">Homepick</Link>
          {isAuthenticated ? (
            <div className="flex items-center gap-4">
              <Link to="/" className="text-sm text-gray-600 hover:text-gray-900">의뢰 목록</Link>
              {user?.role === 'customer' && (
                <Link to="/my-requests" className="text-sm text-gray-600 hover:text-gray-900">내 의뢰</Link>
              )}
              <Link to="/my-bookings" className="text-sm text-gray-600 hover:text-gray-900">예약</Link>
              <Link to="/profile" className="text-sm text-gray-600 hover:text-gray-900">{user?.name}</Link>
              <button
                onClick={handleLogout}
                className="text-sm text-red-500 hover:text-red-700"
              >
                로그아웃
              </button>
            </div>
          ) : (
            <div className="flex gap-3">
              <Link to="/login" className="text-sm text-gray-600 hover:text-gray-900">로그인</Link>
              <Link to="/register" className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">회원가입</Link>
            </div>
          )}
        </div>
      </nav>
      <main>{children}</main>
    </div>
  );
}
