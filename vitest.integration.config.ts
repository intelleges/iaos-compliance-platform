/**
 * Vitest Integration Test Configuration
 * Based on INT.DOC.23 Section 1.1 - Test Framework Configuration
 */

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/integration/**/*.test.ts'],
    setupFiles: ['./test/integration/setup.ts'],
    globalSetup: './test/integration/globalSetup.ts',
    globalTeardown: './test/integration/globalTeardown.ts',
    testTimeout: 30000, // 30 seconds per test
    hookTimeout: 60000, // 60 seconds for setup/teardown hooks
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true, // Run tests sequentially to avoid database conflicts
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['server/**/*.ts'],
      exclude: [
        'server/**/*.test.ts',
        'server/_core/**',
        'test/**',
      ],
    },
  },
});
