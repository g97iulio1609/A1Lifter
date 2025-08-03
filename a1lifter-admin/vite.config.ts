import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  css: {
    postcss: './postcss.config.js',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React ecosystem
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // Firebase
          'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
          // UI libraries
          'ui-vendor': [
            '@radix-ui/react-dialog', 
            '@radix-ui/react-dropdown-menu', 
            '@radix-ui/react-select',
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-label',
            '@radix-ui/react-progress',
            '@radix-ui/react-slot',
            '@radix-ui/react-switch',
            '@radix-ui/react-tabs',
            'lucide-react',
            'sonner'
          ],
          // Charts and data visualization
          'charts-vendor': ['recharts'],
          // Utilities
          'utils-vendor': ['date-fns', 'clsx', 'class-variance-authority', 'tailwind-merge'],
          // Forms and validation
          'forms-vendor': ['react-hook-form', '@hookform/resolvers', 'zod'],
          // Query and state management
          'query-vendor': ['@tanstack/react-query', '@tanstack/react-query-devtools'],
          // Export utilities
          'export-vendor': ['jspdf', 'jspdf-autotable', 'xlsx'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
})
