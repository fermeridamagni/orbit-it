import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/tests/**/*.{test}.ts'],
    exclude: ['node_modules', 'dist', '.turbo'],
    alias: {
      '@': resolve(__dirname, './src'),
      '@lib': resolve(__dirname, './src/lib'),
      '@schemas': resolve(__dirname, './src/schemas'),
    },
  },
});
