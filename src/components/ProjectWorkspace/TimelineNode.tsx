import { TimelineNode as TimelineNodeType } from '../../types/timeline';
import { MediaAsset, EditedImage, GeneratedVideo } from '../../types';
import { MediaCard } from '../shared/MediaCard';
import { getAssetUrl } from '../../lib/media';

interface TimelineNodeProps {
  node: TimelineNodeType;
  index: number;
  total: number;
  onEditImage?: (asset: MediaAsset | EditedImage) => void;
  onDownload?: (item: MediaAsset | EditedImage | GeneratedVideo | TimelineNodeType) => void;
  onDelete?: (item: MediaAsset | EditedImage | GeneratedVideo | TimelineNodeType) => void;
}

export function TimelineNodeComponent({ node, onEditImage, onDownload, onDelete }: TimelineNodeProps) {
  return (
    <div id={`node-${node.data.id}`}>
      <MediaCard
        item={node}
        viewMode="timeline"
        onEditImage={onEditImage}
        onDownload={onDownload}
        onDelete={onDelete}
        getAssetUrl={getAssetUrl}
        showTypeLabel={true}
      />
    </div>
  );
}
