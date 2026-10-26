import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { login } from '@/api/auth.api';
import { useAuthStore } from '@/store/useAuthStore';
import { DEMO_CUSTOMER_EMAIL, DEMO_PASSWORD, DEMO_WORKER_EMAIL } from './seed';
import { resetDemoDb } from './mockAdapter';

export type DemoRole = 'customer' | 'worker';

interface DemoAccount {
  switchTo: (role: DemoRole) => Promise<void>;
  resetData: () => void;
  isSwitching: boolean;
}

export function useDemoAccount(): DemoAccount {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [isSwitching, setIsSwitching] = useState(false);

  const switchTo = async (role: DemoRole): Promise<void> => {
    setIsSwitching(true);
    try {
      const result = await login({
        email: role === 'customer' ? DEMO_CUSTOMER_EMAIL : DEMO_WORKER_EMAIL,
        password: DEMO_PASSWORD,
      });
      queryClient.clear();
      setAuth(result.user, result.accessToken);
      navigate('/');
    } finally {
      setIsSwitching(false);
    }
  };

  const resetData = (): void => {
    resetDemoDb();
    localStorage.removeItem('accessToken');
    window.location.reload();
  };

  return { switchTo, resetData, isSwitching };
}
