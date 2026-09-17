import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getMe } from '@/api/auth.api';
import { useAuthStore } from '@/store/useAuthStore';
import Layout from '@/components/Layout';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import HomePage from '@/pages/HomePage';
import RequestDetailPage from '@/pages/RequestDetailPage';
import MyRequestsPage from '@/pages/MyRequestsPage';
import MyBookingsPage from '@/pages/MyBookingsPage';
import ProfilePage from '@/pages/ProfilePage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

function PrivateRoute({ children }: { children: JSX.Element }): JSX.Element {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isBootstrapping = useAuthStore((s) => s.isBootstrapping);
  if (isBootstrapping) {
    return <div className="p-8 text-center text-gray-500">불러오는 중...</div>;
  }
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

export default function App(): JSX.Element {
  const isBootstrapping = useAuthStore((s) => s.isBootstrapping);
  const setUser = useAuthStore((s) => s.setUser);
  const finishBootstrap = useAuthStore((s) => s.finishBootstrap);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  useEffect(() => {
    if (!isBootstrapping) return;
    let cancelled = false;
    void getMe()
      .then((restored) => {
        if (!cancelled) setUser(restored);
      })
      .catch(() => {
        if (!cancelled) clearAuth();
      })
      .finally(() => {
        if (!cancelled) finishBootstrap();
      });
    return () => {
      cancelled = true;
    };
  }, [isBootstrapping, setUser, clearAuth, finishBootstrap]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <HomePage />
                </PrivateRoute>
              }
            />
            <Route
              path="/requests/:id"
              element={
                <PrivateRoute>
                  <RequestDetailPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/my-requests"
              element={
                <PrivateRoute>
                  <MyRequestsPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/my-bookings"
              element={
                <PrivateRoute>
                  <MyBookingsPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <ProfilePage />
                </PrivateRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
