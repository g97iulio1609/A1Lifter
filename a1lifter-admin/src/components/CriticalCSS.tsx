/**
 * Critical CSS component for A1Lifter
 * Inlines critical styles for above-the-fold content to improve FCP and LCP
 */

/* eslint-disable react-refresh/only-export-components -- This module exports a hook alongside a component by design to colocate critical resource logic without affecting runtime. */
import { useEffect } from 'react';

// Critical CSS styles for above-the-fold content
const criticalStyles = `
  /* Reset and base styles */
  *, *::before, *::after {
    box-sizing: border-box;
  }
  
  html {
    line-height: 1.15;
    -webkit-text-size-adjust: 100%;
  }
  
  body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background-color: #ffffff;
    color: #1a1a1a;
  }
  
  /* Critical layout styles */
  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
  }
  
  /* Header critical styles */
  .header {
    background-color: #1a1a1a;
    color: #ffffff;
    padding: 1rem 0;
    position: sticky;
    top: 0;
    z-index: 50;
  }
  
  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .logo {
    font-size: 1.5rem;
    font-weight: 700;
    text-decoration: none;
    color: inherit;
  }
  
  /* Navigation critical styles */
  .nav {
    display: flex;
    gap: 2rem;
    list-style: none;
    margin: 0;
    padding: 0;
  }
  
  .nav-link {
    color: #ffffff;
    text-decoration: none;
    font-weight: 500;
    transition: color 0.2s ease;
  }
  
  .nav-link:hover {
    color: #3b82f6;
  }
  
  /* Main content critical styles */
  .main {
    min-height: calc(100vh - 80px);
    padding: 2rem 0;
  }
  
  /* Button critical styles */
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.75rem 1.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    border-radius: 0.375rem;
    border: none;
    cursor: pointer;
    text-decoration: none;
    transition: all 0.2s ease;
  }
  
  .btn-primary {
    background-color: #3b82f6;
    color: #ffffff;
  }
  
  .btn-primary:hover {
    background-color: #2563eb;
  }
  
  .btn-secondary {
    background-color: #6b7280;
    color: #ffffff;
  }
  
  .btn-secondary:hover {
    background-color: #4b5563;
  }
  
  /* Card critical styles */
  .card {
    background-color: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    padding: 1.5rem;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  }
  
  /* Typography critical styles */
  .h1 {
    font-size: 2.25rem;
    font-weight: 700;
    line-height: 1.2;
    margin: 0 0 1rem 0;
  }
  
  .h2 {
    font-size: 1.875rem;
    font-weight: 600;
    line-height: 1.3;
    margin: 0 0 0.75rem 0;
  }
  
  .h3 {
    font-size: 1.5rem;
    font-weight: 600;
    line-height: 1.4;
    margin: 0 0 0.5rem 0;
  }
  
  .text-lg {
    font-size: 1.125rem;
    line-height: 1.75;
  }
  
  .text-sm {
    font-size: 0.875rem;
    line-height: 1.25;
  }
  
  /* Utility critical styles */
  .flex {
    display: flex;
  }
  
  .items-center {
    align-items: center;
  }
  
  .justify-between {
    justify-content: space-between;
  }
  
  .gap-4 {
    gap: 1rem;
  }
  
  .mb-4 {
    margin-bottom: 1rem;
  }
  
  .mt-4 {
    margin-top: 1rem;
  }
  
  .p-4 {
    padding: 1rem;
  }
  
  .text-center {
    text-align: center;
  }
  
  .font-bold {
    font-weight: 700;
  }
  
  .text-blue-600 {
    color: #2563eb;
  }
  
  .text-gray-600 {
    color: #4b5563;
  }
  
  .bg-gray-50 {
    background-color: #f9fafb;
  }
  
  /* Loading states critical styles */
  .loading {
    display: inline-block;
    width: 1rem;
    height: 1rem;
    border: 2px solid #e5e7eb;
    border-top: 2px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  /* Responsive critical styles */
  @media (max-width: 768px) {
    .container {
      padding: 0 0.75rem;
    }
    
    .nav {
      gap: 1rem;
    }
    
    .h1 {
      font-size: 1.875rem;
    }
    
    .h2 {
      font-size: 1.5rem;
    }
    
    .btn {
      padding: 0.625rem 1.25rem;
      font-size: 0.8125rem;
    }
  }
  
  /* Focus styles for accessibility */
  .btn:focus,
  .nav-link:focus {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
  }
  
  /* Preload and performance hints */
  .preload-hint {
    content-visibility: auto;
    contain-intrinsic-size: 300px 200px;
  }
`;

// Font preload links
const fontPreloads = [
  {
    href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
    as: 'style',
  },
];

// Resource hints for performance
const resourceHints = [
  { rel: 'dns-prefetch', href: 'https://fonts.googleapis.com' },
  { rel: 'dns-prefetch', href: 'https://fonts.gstatic.com' },
  { rel: 'preconnect', href: 'https://fonts.googleapis.com', crossOrigin: 'anonymous' },
  { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
];

interface CriticalCSSProps {
  children?: React.ReactNode;
}

export const CriticalCSS: React.FC<CriticalCSSProps> = ({ children }) => {
  useEffect(() => {
    // Inject critical CSS
    const styleElement = document.createElement('style');
    styleElement.textContent = criticalStyles;
    styleElement.setAttribute('data-critical', 'true');
    document.head.insertBefore(styleElement, document.head.firstChild);

    // Add resource hints
    resourceHints.forEach(hint => {
      const link = document.createElement('link');
      link.rel = hint.rel;
      link.href = hint.href;
      if (hint.crossOrigin) {
        link.crossOrigin = hint.crossOrigin;
      }
      document.head.appendChild(link);
    });

    // Preload fonts
    fontPreloads.forEach(font => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = font.href;
      link.as = font.as;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });

    // Load non-critical CSS asynchronously
    const loadNonCriticalCSS = () => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = '/src/index.css'; // Main Tailwind CSS file
      link.media = 'print';
      link.onload = () => {
        link.media = 'all';
      };
      document.head.appendChild(link);
    };

    // Load non-critical CSS after page load
    if (document.readyState === 'complete') {
      loadNonCriticalCSS();
    } else {
      window.addEventListener('load', loadNonCriticalCSS);
    }

    // Cleanup function
    return () => {
      const criticalStyle = document.querySelector('style[data-critical="true"]');
      if (criticalStyle) {
        criticalStyle.remove();
      }
    };
  }, []);

  return <>{children}</>;
};

// Hook for managing critical resource loading
export const useCriticalResources = () => {
  useEffect(() => {
    // Preload critical images
    const criticalImages = [
      '/images/logo.svg',
      '/images/hero-bg.jpg',
    ];

    criticalImages.forEach(src => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      document.head.appendChild(link);
    });

    // Prefetch next page resources
    const prefetchResources = [
      '/js/judges-ui.js',
      '/js/public-ui.js',
      '/js/warmup-ui.js',
    ];

    // Prefetch after initial load
    const prefetchTimer = setTimeout(() => {
      prefetchResources.forEach(src => {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = src;
        document.head.appendChild(link);
      });
    }, 2000);

    return () => clearTimeout(prefetchTimer);
  }, []);
};

export default CriticalCSS;