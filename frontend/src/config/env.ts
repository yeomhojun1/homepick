export const env = {
  apiUrl: (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:4001',
} as const;
