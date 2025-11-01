import { useState } from 'react';
import { ConfirmDialog } from '../ConfirmDialog';
import { useToast } from '../../hooks/useToast';
import { useMediaAssets } from '../../hooks/useMediaAssets';
import { useUploadMedia } from '../../hooks/useUploadMedia';
import { useDeleteMediaAsset } from '../../hooks/useDeleteMediaAsset';
import { MediaLibrarySkeleton } from '../LoadingSkeleton';
import { getAssetUrl } from '../../lib/media';
import { MediaLibraryView } from './MediaLibraryView';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { MediaAsset } from '../../types';
import { downloadFile } from '../../lib/download';

interface MediaLibraryProps {
  projectId: string;
  onEditImage?: (asset: MediaAsset, projectId: string) => void;
  viewMode?: 'grid' | 'list';
}

export function MediaLibrary({ projectId, onEditImage, viewMode = 'grid' }: MediaLibraryProps) {
  const { showToast } = useToast();
  const [assetToDelete, setAssetToDelete] = useState<{ id: string; path: string } | null>(null);

  // Use React Query hooks
  const { data: assets = [], isLoading, error } = useMediaAssets(projectId);
  const uploadMutation = useUploadMedia();
  const deleteMutation = useDeleteMediaAsset();

  const handleFileUpload = (files: File[]) => {
    uploadMutation.mutate(
      { projectId, files },
      {
        onError: (error) => {
          showToast(error.message || 'Failed to upload files', 'error');
        },
      }
    );
  };

  const confirmDeleteAsset = () => {
    if (!assetToDelete) return;

    deleteMutation.mutate(
      {
        assetId: assetToDelete.id,
        storagePath: assetToDelete.path,
        projectId,
      },
      {
        onSuccess: () => {
          showToast('Asset deleted successfully', 'success');
        },
        onError: () => {
          showToast('Failed to delete asset. Please try again.', 'error');
        },
      }
    );
    setAssetToDelete(null);
  };

  const handleDownload = async (asset: MediaAsset) => {
    try {
      const url = getAssetUrl(asset.storage_path);
      await downloadFile(url, asset.file_name);
      showToast(`Downloaded ${asset.file_name}`, 'success');
    } catch (error) {
      console.error('Error downloading asset:', error);
      showToast(`Failed to download ${asset.file_name}`, 'error');
    }
  };


  if (isLoading) {
    return <MediaLibrarySkeleton />;
  }

  if (error) {
    return (
      <Card className="p-8 text-center">
        <p className="text-destructive mb-4">Failed to load media assets</p>
        <Button onClick={() => window.location.reload()}>
          Retry
        </Button>
      </Card>
    );
  }

  return (
    <>
      <MediaLibraryView
        assets={assets}
        viewMode={viewMode}
        isUploading={uploadMutation.isPending}
        onDrop={handleFileUpload}
        onEditImage={onEditImage}
        onRequestDelete={(assetId, storagePath) => {
          setAssetToDelete({ id: assetId, path: storagePath });
        }}
        onDownload={handleDownload}
        getAssetUrl={getAssetUrl}
      />

      {assetToDelete && (
        <ConfirmDialog
          title="Delete Asset"
          message="Are you sure you want to delete this asset? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          type="danger"
          onConfirm={confirmDeleteAsset}
          onCancel={() => setAssetToDelete(null)}
        />
      )}
    </>
  );
}
