import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Performance optimizations
    target: 'es2020',
    minify: 'terser',
    // Code splitting configuration
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom'],
          'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          'ui-vendor': ['@radix-ui/react-alert-dialog'],
          'utils-vendor': ['date-fns', 'clsx', 'tailwind-merge'],
          // Feature chunks
          'judges-ui': ['./src/interface/pages/JudgesUI'],
          'public-ui': ['./src/interface/pages/PublicLiveUI'],
          'warmup-ui': ['./src/interface/pages/WarmupBackstageUI'],
          'plugins': [
            './src/domain/plugins/powerlifting/PowerliftingPlugin',
            './src/domain/plugins/WeightliftingPlugin',
            './src/domain/plugins/StrongmanPlugin',
            './src/domain/plugins/CrossFitPlugin',
            './src/domain/plugins/StreetliftingPlugin'
          ]
        },
        // Optimize chunk names
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
            ? chunkInfo.facadeModuleId.split('/').pop()?.replace('.tsx', '').replace('.ts', '')
            : 'chunk';
          return `js/${facadeModuleId}-[hash].js`;
        },
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (/\.(css)$/.test(assetInfo.name || '')) {
            return 'css/[name]-[hash].[ext]';
          }
          if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(assetInfo.name || '')) {
            return 'images/[name]-[hash].[ext]';
          }
          return 'assets/[name]-[hash].[ext]';
        }
      }
    },
    // Bundle size limits (enforce performance budgets)
    chunkSizeWarningLimit: 170, // 170KB for JS chunks
    assetsInlineLimit: 4096, // 4KB inline limit
    // Source maps for production debugging
    sourcemap: process.env.NODE_ENV === 'production' ? 'hidden' : true
  },
  // Development server optimizations
  server: {
    hmr: {
      overlay: false // Disable error overlay for better UX
    }
  },
  // CSS optimizations
  css: {
    devSourcemap: true,
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/styles/variables.scss";`
      }
    }
  },
  // Dependency optimization
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'firebase/app',
      'firebase/auth',
      'firebase/firestore',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-tabs'
    ],
    exclude: ['@vite/client', '@vite/env']
  }
})
