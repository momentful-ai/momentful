import { Project } from '../../types';
import { database } from '../../lib/database';
import { FolderOpen } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { useSignedUrls } from '../../hooks/useSignedUrls';


export function ProjectPreviewCollage({ project }: { project: Project }) {
    const previewImages = useMemo(() => project.previewImages || [], [project.previewImages]);
    const imageCount = previewImages.length;
    const { preloadSignedUrls } = useSignedUrls();
    const [imageUrls, setImageUrls] = useState<Record<string, string>>({});

    // Preload signed URLs for all preview images
    useEffect(() => {
      if (previewImages.length > 0) {
        preloadSignedUrls('user-uploads', previewImages).then(setImageUrls);
      }
    }, [previewImages, preloadSignedUrls]);

    const getImageUrl = (storagePath: string) => {
      return imageUrls[storagePath] || database.storage.getPublicUrl('user-uploads', storagePath);
    };
  
    const renderImage = (path: string, alt: string, className = '') => (
      <img
        src={getImageUrl(path)}
        alt={alt}
        className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ${className}`}
      />
    );
  
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
  