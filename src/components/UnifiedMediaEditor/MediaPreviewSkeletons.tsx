interface ImagePreviewSkeletonProps {
  className?: string;
}

export function ImagePreviewSkeleton({ className = '' }: ImagePreviewSkeletonProps) {
  return (
    <div className={`relative overflow-hidden rounded-xl bg-muted ${className}`}>
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.1) 40%, rgba(255, 255, 255, 0.3) 50%, rgba(255, 255, 255, 0.1) 60%, transparent 100%)',
          backgroundSize: '200% 100%',
          backgroundPosition: '-200% 0',
          animation: 'shimmer 2s linear infinite',
        }}
      />
    </div>
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
    <div className={`absolute inset-0 ${className}`}>
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.1) 40%, rgba(255, 255, 255, 0.3) 50%, rgba(255, 255, 255, 0.1) 60%, transparent 100%)',
          backgroundSize: '200% 100%',
          backgroundPosition: '-200% 0',
          animation: 'shimmer 2s linear infinite',
        }}
      />
    </div>
  );
}

