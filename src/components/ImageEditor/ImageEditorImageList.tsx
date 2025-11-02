import { useState } from 'react';
import { Edit2, Video, Loader2 } from 'lucide-react';
import { EditedImage } from '../../types';

interface ImageEditorImageListProps {
  editedImages: EditedImage[];
  isLoading?: boolean;
  selectedImageId?: string | null;
  onSelectImage: (image: EditedImage) => void;
  onEditImage?: (image: EditedImage) => void;
  onNavigateToVideo?: (imageId: string) => void;
}

export function ImageEditorImageList({
  editedImages,
  isLoading = false,
  selectedImageId,
  onSelectImage,
  onEditImage,
  onNavigateToVideo,
}: ImageEditorImageListProps) {
  const [hoveredImageId, setHoveredImageId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="border-t border-border pt-4 mt-4">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
        </div>
      </div>
    );
  }

  if (editedImages.length === 0) {
    return (
      <div className="border-t border-border pt-4 mt-4">
        <div className="text-center py-8">
          <p className="text-muted-foreground text-sm mb-2">No editing history yet</p>
          <p className="text-xs text-muted-foreground/70">Generated images will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-border pt-4 mt-4">
      <h3 className="text-sm font-medium text-foreground mb-3">Editing History ({editedImages.length})</h3>
      <div className="grid grid-cols-2 gap-2">
        {editedImages.map((image) => {
          const isSelected = selectedImageId === image.id;
          const isHovered = hoveredImageId === image.id;

          return (
            <div
              key={image.id}
              onClick={() => onSelectImage(image)}
              onMouseEnter={() => setHoveredImageId(image.id)}
              onMouseLeave={() => setHoveredImageId(null)}
              className={`relative aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition-all hover:scale-105 hover:shadow-lg ${
                isSelected ? 'border-primary ring-2 ring-primary' : 'border-border'
              }`}
            >
              <img
                src={image.edited_url}
                alt={image.prompt.substring(0, 30)}
                className="w-full h-full object-cover pointer-events-none"
                draggable={false}
              />
              
              {/* Overlay with actions on hover */}
              {isHovered && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-2 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectImage(image);
                      onEditImage?.(image);
                    }}
                    className="p-2 bg-primary hover:bg-primary/90 rounded-lg transition-colors"
                    title="Edit this image"
                  >
                    <Edit2 className="w-4 h-4 text-primary-foreground" />
                  </button>
                  {onNavigateToVideo && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigateToVideo(image.id);
                      }}
                      className="p-2 bg-primary hover:bg-primary/90 rounded-lg transition-colors"
                      title="Generate video from this image"
                    >
                      <Video className="w-4 h-4 text-primary-foreground" />
                    </button>
                  )}
                </div>
              )}

              {/* Selection indicator */}
              {isSelected && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-primary-foreground rounded-full" />
                </div>
              )}

              {/* Prompt preview */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                <p className="text-xs text-white truncate">{image.prompt.substring(0, 40)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


