export const env = {
  apiUrl: (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:4001',
} as const;

/** VITE_DEMO=true 로 빌드할 때만 true. 브라우저 안 가짜 API 로 동작하는 데모 모드. */
export const isDemo = import.meta.env.VITE_DEMO === 'true';
