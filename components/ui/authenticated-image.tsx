'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Loader2, ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AuthenticatedImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
  loading?: 'eager' | 'lazy';
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

/**
 * AuthenticatedImage component that fetches images with proper authentication.
 *
 * For API URLs that require authentication, this component:
 * 1. Fetches the image with Authorization header
 * 2. Creates a blob URL from the response
 * 3. Renders the blob URL in an img tag
 * 4. Cleans up the blob URL on unmount
 *
 * For data URLs, external URLs, and placeholder images, renders directly.
 */
export function AuthenticatedImage({
  src,
  alt,
  className,
  fallbackSrc = '/placeholder-screenshot.svg',
  loading = 'lazy',
  onLoad,
  onError,
}: AuthenticatedImageProps) {
  const { getToken, isSignedIn } = useAuth();
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Determine if the URL requires authentication
  const requiresAuth = useCallback((url: string): boolean => {
    // Data URLs don't need auth
    if (url.startsWith('data:')) return false;
    // Placeholder images don't need auth
    if (url.startsWith('/')) return false;
    // External URLs (not our API) don't need auth
    if (url.startsWith('http://') || url.startsWith('https://')) {
      // Check if it's our API endpoint
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://argus-brain-production.up.railway.app';
      return url.startsWith(apiUrl);
    }
    return false;
  }, []);

  useEffect(() => {
    let isMounted = true;
    let blobUrl: string | null = null;

    async function fetchImage() {
      if (!src) {
        setImageSrc(fallbackSrc);
        setIsLoading(false);
        return;
      }

      // If the URL doesn't require auth, use it directly
      if (!requiresAuth(src)) {
        setImageSrc(src);
        setIsLoading(false);
        return;
      }

      // Need to fetch with authentication
      try {
        setIsLoading(true);
        setHasError(false);

        const token = await getToken();
        if (!token) {
          console.warn('[AuthenticatedImage] No auth token available');
          setImageSrc(fallbackSrc);
          setHasError(true);
          setIsLoading(false);
          return;
        }

        const response = await fetch(src, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
        }

        const blob = await response.blob();
        blobUrl = URL.createObjectURL(blob);

        if (isMounted) {
          setImageSrc(blobUrl);
          setIsLoading(false);
        } else {
          // Clean up if component unmounted during fetch
          URL.revokeObjectURL(blobUrl);
        }
      } catch (error) {
        console.error('[AuthenticatedImage] Error fetching image:', error);
        if (isMounted) {
          setImageSrc(fallbackSrc);
          setHasError(true);
          setIsLoading(false);
          onError?.(error instanceof Error ? error : new Error(String(error)));
        }
      }
    }

    fetchImage();

    return () => {
      isMounted = false;
      // Clean up blob URL on unmount
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [src, fallbackSrc, getToken, requiresAuth, onError]);

  // Handle image load
  const handleLoad = useCallback(() => {
    onLoad?.();
  }, [onLoad]);

  // Handle image error (for direct URLs that fail)
  const handleError = useCallback(() => {
    setImageSrc(fallbackSrc);
    setHasError(true);
    onError?.(new Error('Image failed to load'));
  }, [fallbackSrc, onError]);

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center bg-muted', className)}>
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (hasError && !imageSrc) {
    return (
      <div className={cn('flex items-center justify-center bg-muted', className)}>
        <ImageOff className="h-4 w-4 text-muted-foreground" />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imageSrc || fallbackSrc}
      alt={alt}
      className={className}
      loading={loading}
      onLoad={handleLoad}
      onError={handleError}
    />
  );
}
