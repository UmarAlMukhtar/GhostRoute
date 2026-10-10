import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    maxWorkers: 2,
    testTimeout: 30000,
    include: ['tests/unit/**/*.test.ts'],
  },
});
