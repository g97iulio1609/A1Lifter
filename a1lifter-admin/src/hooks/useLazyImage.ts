/**
 * Lazy loading hook for images
 */

import { useEffect, useRef, useState } from 'react';

export const useLazyImage = (src: string, options: IntersectionObserverInit = {}) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setImageSrc(src);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options,
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [src, options]);

  useEffect(() => {
    if (imageSrc) {
      const img = new Image();
      img.onload = () => setIsLoaded(true);
      img.onerror = () => setIsError(true);
      img.src = imageSrc;
    }
  }, [imageSrc]);

  return {
    imgRef,
    src: imageSrc,
    isLoaded,
    isError,
  };
};