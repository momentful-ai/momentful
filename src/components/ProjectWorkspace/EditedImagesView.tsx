import { useState, useCallback } from 'react';
import { EditedImage, MediaAsset } from '../../types';
import { useEditedImages } from '../../hooks/useEditedImages';
import { useDeleteEditedImage } from '../../hooks/useDeleteEditedImage';
import { useToast } from '../../hooks/useToast';
import { ConfirmDialog } from '../ConfirmDialog';
import { MediaLibrarySkeleton } from '../LoadingSkeleton';
import { useSignedUrls } from '../../hooks/useSignedUrls';
import { UnifiedMediaGrid } from '../shared/UnifiedMediaGrid';
import { MediaCardItem } from '../shared/MediaCard';

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
  const signedUrls = useSignedUrls();

  // Create getAssetUrl function using the useSignedUrls hook
  const getAssetUrl = useCallback(async (storagePath: string): Promise<string> => {
    return await signedUrls.getSignedUrl('user-uploads', storagePath);
  }, [signedUrls]);

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

  // Wrappers for UnifiedMediaGrid
  const handleEditImage = (item: MediaCardItem) => {
    if (onEditImage) {
      onEditImage(item, projectId);
    }
  };

  const handleDelete = (item: MediaCardItem) => {
    if ('edited_url' in item) {
      // It's an EditedImage
      setImageToDelete({ id: item.id, storagePath: item.storage_path });
    }
  };

  const handleDownload = (item: MediaCardItem) => {
    if ('edited_url' in item) {
      onExport(item);
    }
  };

  if (isLoading) {
    return <MediaLibrarySkeleton />;
  }

  return (
    <>
      <UnifiedMediaGrid
        items={images}
        viewMode={viewMode}
        onEditImage={onEditImage ? handleEditImage : undefined}
        onDelete={handleDelete}
        onDownload={handleDownload}
        getAssetUrl={getAssetUrl}
        emptyState={{
          title: 'No edited images yet',
          description: 'Use AI to edit your product images with text prompts and context.',
        }}
      />
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
    </>
  );
}
