import { defineConfig } from 'vitest/config';
import * as path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/main/core/vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/main/core/**/*.ts'],
      exclude: [
        'node_modules/',
        'dist/',
        'dist-electron/',
        '**/*.test.ts',
        '**/*.spec.ts',
        'src/renderer/',
        'src/main/core/vitest.setup.ts'
      ],
      all: true,
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80
    },
    include: ['src/main/core/**/*.test.ts'],
    exclude: ['node_modules/', 'dist/', 'dist-electron/']
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src/main')
    }
  }
});
