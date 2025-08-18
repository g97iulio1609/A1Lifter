/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    reporter: ['verbose', 'json', 'html'],
    outputFile: {
      json: './test-results/vitest-results.json',
      html: './test-results/vitest-report.html'
    },
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: [
      'node_modules/**',
      'dist/**',
      'e2e/**',
      'playwright-report/**',
      'test-results/**',
      '**/*.d.ts'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'dist/**',
        'e2e/**',
        '**/*.d.ts',
        'src/test/**',
        'vite.config.ts',
        'vitest.config.ts'
      ],
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80
      }
    },
    testTimeout: 10000,
    retry: 2,
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/test': path.resolve(__dirname, './src/test')
    }
  },
  // Optimize deps for testing
  optimizeDeps: {
    include: [
      '@testing-library/react',
      '@testing-library/jest-dom',
      '@testing-library/user-event'
    ]
  }
})