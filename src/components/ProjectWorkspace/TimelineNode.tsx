import { TimelineNode as TimelineNodeType } from '../../types/timeline';
import { MediaAsset, EditedImage, GeneratedVideo } from '../../types';
import { MediaCard } from '../shared/MediaCard';
import { useSignedUrls } from '../../hooks/useSignedUrls';
import { NODE_TYPE_TO_BUCKET } from '../../lib/media';

interface TimelineNodeProps {
  node: TimelineNodeType;
  index: number;
  total: number;
  viewMode: 'grid' | 'list';
  onEditImage?: (asset: MediaAsset | EditedImage) => void;
  onDownload?: (item: MediaAsset | EditedImage | GeneratedVideo | TimelineNodeType) => void;
  onDelete?: (item: MediaAsset | EditedImage | GeneratedVideo | TimelineNodeType) => void;
}

export function TimelineNodeComponent({ node, viewMode, onEditImage, onDownload, onDelete }: TimelineNodeProps) {
  const signedUrls = useSignedUrls();

  const getAssetUrl = async (storagePath: string): Promise<string> => {
    try {
      // Get the correct bucket based on node type
      const bucket = NODE_TYPE_TO_BUCKET[node.type] || 'user-uploads';
      
      return await signedUrls.getSignedUrl(bucket, storagePath);
    } catch (error) {
      console.error('Failed to get signed URL for timeline node:', storagePath, error);
      throw error; // Don't fallback to public URLs - surface the error
    }
  };

  return (
    <div
      id={`node-${node.data.id}`}
      className={`flex-shrink-0 ${viewMode === 'list' ? 'w-[360px]' : 'w-[260px]'}`}
    >
      <MediaCard
        item={node}
        viewMode={viewMode}
        onEditImage={onEditImage}
        onDownload={onDownload}
        onDelete={onDelete}
        getAssetUrl={getAssetUrl}
        showTypeLabel={true}
      />
    </div>
  );
}
