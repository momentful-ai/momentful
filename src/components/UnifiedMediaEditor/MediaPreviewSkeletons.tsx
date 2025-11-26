import { MediaSkeleton } from '../MediaSkeleton';

interface ImagePreviewSkeletonProps {
  className?: string;
}

export function ImagePreviewSkeleton({ className = '' }: ImagePreviewSkeletonProps) {
  return (
    <MediaSkeleton className={className} rounded="xl" type="image" />
  );
}

interface VideoPreviewSkeletonProps {
  aspectRatio: '16:9' | '9:16' | '1:1' | '4:5';
  className?: string;
}

export function VideoPreviewSkeleton({ aspectRatio, className = '' }: VideoPreviewSkeletonProps) {
  // aspectRatio is handled by parent container, kept for API consistency
  void aspectRatio;

  return (
    <MediaSkeleton className={`absolute inset-0 ${className}`} type="video" rounded="none" />
  );
}

