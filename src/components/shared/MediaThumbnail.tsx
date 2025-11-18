import { useState } from 'react';
import { Film } from 'lucide-react';
import { useSignedUrls } from '../../hooks/useSignedUrls';

export interface MediaThumbnailProps {
  // Direct URL (for edited images, external URLs)
  src?: string;
  // Storage path (for media assets that need signed URLs)
  storagePath?: string;
  // Alt text
  alt: string;
  // CSS classes
  className?: string;
  // Optional: bucket override (defaults to 'user-uploads')
  bucket?: string;
  // Optional: draggable (defaults to false)
  draggable?: boolean;
}


export function MediaThumbnail({
  src,
  storagePath,
  alt,
  className = '',
  bucket = 'user-uploads',
  draggable = false,
}: MediaThumbnailProps) {
  const { useSignedUrl } = useSignedUrls();
  const [imageLoadError, setImageLoadError] = useState(false);

  // Always call the hook at the top level to follow rules of hooks
  const signedUrlQuery = useSignedUrl(bucket, storagePath || '');

  // Handle pre-computed URLs first (edited images, external URLs)
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        draggable={draggable}
        onError={() => setImageLoadError(true)}
        onLoad={() => setImageLoadError(false)}
      />
    );
  }

  // Handle storage paths that need signed URLs
  if (storagePath) {
    if (signedUrlQuery.isLoading) {
      return (
        <div className="flex items-center justify-center w-full h-full">
          <div
            className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"
            data-testid="spinner"
          />
        </div>
      );
    }

    if (signedUrlQuery.data && !imageLoadError) {
      return (
        <img
          src={signedUrlQuery.data}
          alt={alt}
          className={className}
          draggable={draggable}
          onError={() => setImageLoadError(true)}
          onLoad={() => setImageLoadError(false)}
        />
      );
    }
  }

  // Fallback for no image available
  return (
    <div className="flex items-center justify-center w-full h-full text-muted-foreground">
      <Film className="w-8 h-8" />
    </div>
  );
}
