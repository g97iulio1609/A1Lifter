import { withSentryConfig } from '@sentry/nextjs'

const rawCdnUrl = process.env.NEXT_PUBLIC_CDN_URL || process.env.CDN_URL || ''

let assetPrefix: string | undefined
const remoteImagePatterns: { protocol: 'http' | 'https'; hostname: string; pathname: string }[] = []

if (rawCdnUrl) {
  try {
    const sanitizedUrl = rawCdnUrl.replace(/\/$/, '')
    const parsed = new URL(sanitizedUrl)
    const protocol = parsed.protocol.replace(':', '')

    if (protocol === 'http' || protocol === 'https') {
      assetPrefix = sanitizedUrl

      const pathname = parsed.pathname === '/' ? '/**' : `${parsed.pathname.replace(/\/$/, '')}/**`
      remoteImagePatterns.push({
        protocol,
        hostname: parsed.hostname,
        pathname,
      })
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('Invalid CDN URL provided. Ignoring asset prefix configuration.', error)
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable experimental features for production optimization
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },

  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 3600,
    remotePatterns: remoteImagePatterns,
  },

  assetPrefix,

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/image',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
        ],
      },
      {
        source: '/:path*\\.(js|css)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=2592000, stale-while-revalidate=86400',
          },
        ],
      },
      {
        source: '/:path*\\.(svg|png|jpg|jpeg|gif|ico|webp|avif|ttf|woff|woff2)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=604800, stale-while-revalidate=86400',
          },
        ],
      },
    ]
  },

  // Performance optimizations
  poweredByHeader: false,
  reactStrictMode: true,

  // Redirects for better UX
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/dashboard',
        permanent: true,
      },
      {
        source: '/login',
        destination: '/auth/signin',
        permanent: true,
      },
    ]
  },
}

// Wrap with Sentry if DSN is configured
export default process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG || "a1lifter",
      project: process.env.SENTRY_PROJECT || "a1lifter-nextjs",
      silent: !process.env.CI,
      widenClientFileUpload: true,
      reactComponentAnnotation: {
        enabled: true,
      },
      tunnelRoute: "/monitoring",
      disableLogger: true,
      automaticVercelMonitors: true,
    })
  : nextConfig
