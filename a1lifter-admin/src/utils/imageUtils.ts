/**
 * Image optimization utilities for A1Lifter
 * Implements format detection and responsive image helpers
 */

// Image format support detection
const supportsWebP = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const webP = new Image();
    webP.onload = webP.onerror = () => {
      resolve(webP.height === 2);
    };
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
};

const supportsAVIF = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const avif = new Image();
    avif.onload = avif.onerror = () => {
      resolve(avif.height === 2);
    };
    avif.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A=';
  });
};

// Image format support cache
let webpSupport: boolean | null = null;
let avifSupport: boolean | null = null;

export const getOptimalImageFormat = async (): Promise<'avif' | 'webp' | 'jpg'> => {
  if (avifSupport === null) {
    avifSupport = await supportsAVIF();
  }
  if (webpSupport === null) {
    webpSupport = await supportsWebP();
  }

  if (avifSupport) return 'avif';
  if (webpSupport) return 'webp';
  return 'jpg';
};

// Responsive image sizes
export const getResponsiveImageSrc = (baseSrc: string, width: number, format?: string): string => {
  const ext = format || 'jpg';
  const baseUrl = baseSrc.replace(/\.[^/.]+$/, '');
  return `${baseUrl}_${width}w.${ext}`;
};

// Generate srcSet for responsive images
export const generateSrcSet = (baseSrc: string, sizes: number[], format?: string): string => {
  return sizes
    .map(size => `${getResponsiveImageSrc(baseSrc, size, format)} ${size}w`)
    .join(', ');
};

// Preload critical images
export const preloadImage = (src: string, format?: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = format ? getResponsiveImageSrc(src, 1920, format) : src;
    link.onload = () => resolve();
    link.onerror = reject;
    document.head.appendChild(link);
  });
};

// Critical CSS for above-the-fold images
export const injectCriticalImageCSS = () => {
  const style = document.createElement('style');
  style.textContent = `
    .critical-image {
      content-visibility: auto;
      contain-intrinsic-size: 300px 200px;
    }
    .lazy-image {
      content-visibility: auto;
      contain-intrinsic-size: 300px 200px;
      transition: opacity 0.3s ease-in-out;
    }
    .lazy-image[data-loaded="false"] {
      opacity: 0;
    }
    .lazy-image[data-loaded="true"] {
      opacity: 1;
    }
  `;
  document.head.appendChild(style);
};