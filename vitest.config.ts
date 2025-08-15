import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    globals: true,
    setupFiles: [],
    coverage: {
      enabled: false,
    },
  },
  esbuild: {
    target: 'es2020',
  },
});
