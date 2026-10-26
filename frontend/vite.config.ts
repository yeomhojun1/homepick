import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // 데모 빌드(VITE_DEMO=true)는 GitHub Pages 하위 경로(/homepick/)에 올라간다.
  const isDemo = env.VITE_DEMO === 'true';

  return {
    base: isDemo ? '/homepick/' : '/',
    // 값이 없을 때도 빈 문자열로 고정해 두면 실서버 빌드에서 데모 코드가 통째로 빠진다.
    define: {
      'import.meta.env.VITE_DEMO': JSON.stringify(env.VITE_DEMO ?? ''),
    },
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 3001,
    },
  };
});
