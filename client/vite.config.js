import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiTarget = process.env.VITE_API_TARGET || env.VITE_API_TARGET || 'http://localhost:5000';

  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    // Expose both VITE_GOOGLE_CLIENT_ID and GOOGLE_CLIENT_ID (in case framework prefix was removed in Vercel)
    define: {
      'import.meta.env.VITE_GOOGLE_CLIENT_ID': JSON.stringify(
        process.env.VITE_GOOGLE_CLIENT_ID ||
        process.env.GOOGLE_CLIENT_ID ||
        env.VITE_GOOGLE_CLIENT_ID ||
        env.GOOGLE_CLIENT_ID ||
        ''
      ),
    },
    // Proxy /api requests dynamically (http://server:5000 in Docker, http://localhost:5000 locally)
    server: {
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/setupTests.js',
    },
  };
});

