/**
 * Image optimization components for A1Lifter
 * Implements lazy loading React components
 */

import { useEffect, useState } from 'react';
import { getOptimalImageFormat, generateSrcSet } from './imageUtils';
import { useLazyImage } from '../hooks/useLazyImage';

// Optimized Image component
interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  placeholder?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = '',
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  priority = false,
  placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PC9zdmc+',
  onLoad,
  onError,
}) => {
  const { imgRef, src: lazySrc, isLoaded } = useLazyImage(src, {
    threshold: priority ? 1 : 0.1,
    rootMargin: priority ? '0px' : '50px',
  });

  const [optimalFormat, setOptimalFormat] = useState<string>('jpg');

  useEffect(() => {
    getOptimalImageFormat().then(setOptimalFormat);
  }, []);

  const responsiveSizes = [320, 640, 768, 1024, 1280, 1920];
  const srcSet = lazySrc ? generateSrcSet(lazySrc, responsiveSizes, optimalFormat) : '';

  return (
    <img
      ref={imgRef}
      src={isLoaded ? lazySrc || undefined : placeholder}
      srcSet={isLoaded ? srcSet : undefined}
      sizes={sizes}
      alt={alt}
      className={`transition-opacity duration-300 ${
        isLoaded ? 'opacity-100' : 'opacity-0'
      } ${className}`}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      onLoad={onLoad}
      onError={onError}
      style={{
        filter: isLoaded ? 'none' : 'blur(5px)',
      }}
    />
  );
};