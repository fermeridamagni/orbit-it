import { defineConfig } from 'vitest/config';
import { alias } from './build.config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.{test}.ts'],
    exclude: ['node_modules', 'dist', '.turbo'],
    alias,
  },
});
