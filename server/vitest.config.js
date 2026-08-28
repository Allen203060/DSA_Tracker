import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.js'],
    hookTimeout: 120000, // 2 minutes to allow initial Mongo binary download on slow connections
    testTimeout: 30000,
  },
});
