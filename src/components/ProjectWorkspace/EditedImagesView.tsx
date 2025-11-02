import { useState, useCallback } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { EditedImage, MediaAsset } from '../../types';
import { Card } from '../ui/card';
import { useEditedImages } from '../../hooks/useEditedImages';
import { useDeleteEditedImage } from '../../hooks/useDeleteEditedImage';
import { useToast } from '../../hooks/useToast';
import { ConfirmDialog } from '../ConfirmDialog';
import { MediaLibrarySkeleton } from '../LoadingSkeleton';
import { MediaCard } from '../shared/MediaCard';
import { getAssetUrl } from '../../lib/media';

interface EditedImagesViewProps {
  projectId: string;
  viewMode: 'grid' | 'list';
  onExport: (image: EditedImage) => void;
  onEditImage?: (asset: MediaAsset | EditedImage, projectId: string) => void;
}

export function EditedImagesView({
  projectId,
  viewMode,
  onExport,
  onEditImage,
}: EditedImagesViewProps) {
  const { data: images = [], isLoading } = useEditedImages(projectId);
  const { showToast } = useToast();
  const [imageToDelete, setImageToDelete] = useState<{ id: string; storagePath: string } | null>(null);
  const deleteMutation = useDeleteEditedImage();

  const confirmDeleteImage = () => {
    if (!imageToDelete) return;

    deleteMutation.mutate(
      {
        imageId: imageToDelete.id,
        storagePath: imageToDelete.storagePath,
        projectId,
      },
      {
        onSuccess: () => {
          showToast('Image deleted successfully', 'success');
        },
        onError: () => {
          showToast('Failed to delete image. Please try again.', 'error');
        },
      }
    );
    setImageToDelete(null);
  };

  // Handle Edit with AI - for EditedImage, use it directly; for MediaAsset, use it directly
  const handleEditImage = useCallback((item: MediaAsset | EditedImage) => {
    if (!onEditImage) return;
    
    // Pass the item directly to onEditImage
    // If it's an EditedImage, the ImageEditor will use it as the source
    // If it's a MediaAsset, it will use it as the source
    onEditImage(item, projectId);
  }, [onEditImage, projectId]);

  if (isLoading) {
    return <MediaLibrarySkeleton />;
  }

  if (images.length === 0) {
    return (
      <Card className="border-2 border-dashed p-12 text-center">
        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
          <ImageIcon className="w-10 h-10 text-muted-foreground" />
        </div>
        <h3 className="text-2xl font-semibold mb-3">
          No edited images yet
        </h3>
        <p className="text-muted-foreground max-w-md mx-auto text-lg">
          Use AI to edit your product images with text prompts and context.
        </p>
      </Card>
    );
  }

  return (
    <div className={viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4' : 'space-y-2'}>
      {images.map((image) => (
        <MediaCard
          key={image.id}
          item={image}
          viewMode={viewMode}
          onEditImage={onEditImage ? handleEditImage : undefined}
          onDownload={() => onExport(image)}
          onDelete={() => setImageToDelete({ id: image.id, storagePath: image.storage_path })}
          getAssetUrl={getAssetUrl}
        />
      ))}
      {imageToDelete && (
        <ConfirmDialog
          title="Delete Image"
          message="Are you sure you want to delete this edited image? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          type="danger"
          onConfirm={confirmDeleteImage}
          onCancel={() => setImageToDelete(null)}
        />
      )}
    </div>
  );
}
