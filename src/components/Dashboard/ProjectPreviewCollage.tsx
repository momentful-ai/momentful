import { Project } from '../../types';
import { FolderOpen } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { useSignedUrls } from '../../hooks/useSignedUrls';


export function ProjectPreviewCollage({ project }: { project: Project }) {
    const previewImages = useMemo(() => project.previewImages || [], [project.previewImages]);
    const imageCount = previewImages.length;
    const { preloadSignedUrls } = useSignedUrls();
    const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
    const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);

    // Preload signed URLs for all preview images (only once per previewImages change)
    useEffect(() => {
      // Only attempt to load if we haven't tried before and have images
      if (previewImages.length > 0 && !hasAttemptedLoad) {
        setHasAttemptedLoad(true);
        preloadSignedUrls('user-uploads', previewImages)
          .then(setImageUrls)
          .catch((error) => {
            console.error('Failed to preload preview images:', error);
            // Don't retry - set empty results to stop the loop
            setImageUrls({});
          });
      }
      // Reset hasAttemptedLoad when previewImages change
      if (previewImages.length === 0) {
        setHasAttemptedLoad(false);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [previewImages]); // Only depend on previewImages, not preloadSignedUrls

    const getImageUrl = (storagePath: string) => {
      const signedUrl = imageUrls[storagePath];
      if (!signedUrl) {
        // If signed URL is not available, return empty string to hide the image
        console.warn('Signed URL not available for preview image:', storagePath);
        return '';
      }
      return signedUrl;
    };
  
    const renderImage = (path: string, alt: string, className = '') => {
      const imageUrl = getImageUrl(path);
      if (!imageUrl) {
        return (
          <div className={`w-full h-full bg-muted flex items-center justify-center ${className}`}>
            <span className="text-xs text-muted-foreground">Image unavailable</span>
          </div>
        );
      }
      return (
        <img
          src={imageUrl}
          alt={alt}
          className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ${className}`}
        />
      );
    };
  
    if (imageCount === 0) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="relative">
            <FolderOpen className="w-16 h-16 text-muted-foreground/50" />
            <div className="absolute inset-0 bg-primary/10 blur-xl rounded-full" />
          </div>
        </div>
      );
    }
  
    if (imageCount === 1) {
      return renderImage(previewImages[0], 'Project preview');
    }
  
    if (imageCount === 2) {
      return (
        <div className="grid grid-cols-2 h-full gap-0.5">
          {previewImages.map((path, idx) => (
            <div key={idx} className="relative overflow-hidden">
              {renderImage(path, `Preview ${idx + 1}`)}
            </div>
          ))}
        </div>
      );
    }
  
    if (imageCount === 3) {
      return (
        <div className="grid grid-cols-2 h-full gap-0.5">
          <div className="relative overflow-hidden">
            {renderImage(previewImages[0], 'Preview 1')}
          </div>
          <div className="grid grid-rows-2 gap-0.5">
            {previewImages.slice(1, 3).map((path, idx) => (
              <div key={idx} className="relative overflow-hidden">
                {renderImage(path, `Preview ${idx + 2}`)}
              </div>
            ))}
          </div>
        </div>
      );
    }
  
    // 4+ images: show first 4 in 2x2 grid
    const displayImages = previewImages.slice(0, 4);
    return (
      <div className="grid grid-cols-2 grid-rows-2 h-full gap-0.5">
        {displayImages.map((path, idx) => (
          <div key={idx} className="relative overflow-hidden">
            {renderImage(path, `Preview ${idx + 1}`)}
          </div>
        ))}
      </div>
    );
  }
  