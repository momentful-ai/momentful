import { MediaAsset } from '../../types';
import { UnifiedMediaGrid } from '../shared/UnifiedMediaGrid';
import { MediaCardItem } from '../shared/MediaCard';

interface MediaLibraryViewProps {
  assets: MediaAsset[];
  viewMode: 'grid' | 'list';
  isUploading: boolean;
  projectId: string;
  onDrop: (files: File[]) => void;
  onEditImage?: (asset: MediaAsset, projectId: string) => void;
  onRequestDelete: (assetId: string, storagePath: string) => void;
  onDownload?: (asset: MediaAsset) => void;
  getAssetUrl: (storagePath: string) => Promise<string>;
}

export function MediaLibraryView({
  assets,
  viewMode,
  isUploading,
  projectId,
  onDrop,
  onEditImage,
  onRequestDelete,
  onDownload,
  getAssetUrl,
}: MediaLibraryViewProps) {
  // Wrappers to adapt to UnifiedMediaGrid interface
  const handleEditImage = (item: MediaCardItem) => {
    if ('file_type' in item && onEditImage) {
      onEditImage(item, projectId);
    }
  };

  const handleDelete = (item: MediaCardItem) => {
    if ('file_type' in item) {
      onRequestDelete(item.id, item.storage_path);
    }
  };

  const handleDownload = (item: MediaCardItem) => {
    if ('file_type' in item && onDownload) {
      onDownload(item);
    }
  };

  return (
    <UnifiedMediaGrid
      items={assets}
      viewMode={viewMode}
      isUploading={isUploading}
      onDrop={onDrop}
      onEditImage={onEditImage ? handleEditImage : undefined}
      onDelete={handleDelete}
      onDownload={onDownload ? handleDownload : undefined}
      getAssetUrl={getAssetUrl}
      emptyState={{
        title: 'No uploaded images yet',
        description: 'Upload images to get started with your project',
      }}
    />
  );
}
