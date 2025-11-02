import { useState } from 'react';
import { Download, Trash2, Image as ImageIcon } from 'lucide-react';
import { EditedImage } from '../../types';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { formatDate } from '../../lib/utils';
import { useEditedImages } from '../../hooks/useEditedImages';
import { useDeleteEditedImage } from '../../hooks/useDeleteEditedImage';
import { useToast } from '../../hooks/useToast';
import { ConfirmDialog } from '../ConfirmDialog';
import { MediaLibrarySkeleton } from '../LoadingSkeleton';

interface EditedImagesViewProps {
  projectId: string;
  viewMode: 'grid' | 'list';
  onExport: (image: EditedImage) => void;
}

export function EditedImagesView({
  projectId,
  viewMode,
  onExport,
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
        <Card key={image.id} className="group overflow-hidden hover-lift hover-glow">
          <div className="aspect-square bg-muted relative">
            <img
              src={image.edited_url}
              alt="Edited"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onExport(image);
                }}
                size="icon"
                variant="secondary"
                className="glass shadow-lg h-9 w-9"
                title="Download image"
              >
                <Download className="w-4 h-4" />
              </Button>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  setImageToDelete({ id: image.id, storagePath: image.storage_path });
                }}
                size="icon"
                variant="destructive"
                className="shadow-lg h-9 w-9"
                title="Delete image"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="p-4">
            <p className="text-sm font-medium mb-2 line-clamp-2">
              {image.prompt}
            </p>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <Badge variant="secondary">{image.ai_model}</Badge>
              <span>{formatDate(image.created_at)}</span>
            </div>
            {image.context && typeof image.context === 'object' && Object.keys(image.context).length > 0 && (
              <p className="text-xs text-muted-foreground mt-2 line-clamp-1">
                {JSON.stringify(image.context)}
              </p>
            )}
          </div>
        </Card>
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
