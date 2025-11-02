import { TimelineNode } from '../../types/timeline';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';

interface TimelineNodeProps {
  node: TimelineNode;
  index: number;
  total: number;
}

export function TimelineNodeComponent({ node }: TimelineNodeProps) {
  const { type, data } = node;

  const getThumbnail = () => {
    switch (type) {
      case 'media_asset':
        return data.thumbnail_url || 'placeholder-image.jpg';
      case 'edited_image':
        return data.edited_url;
      case 'generated_video':
        return data.thumbnail_url || 'video-placeholder.jpg';
    }
  };

  const getTypeLabel = () => {
    switch (type) {
      case 'media_asset': return 'Original';
      case 'edited_image': return 'Edited';
      case 'generated_video': return 'Video';
    }
  };

  const getMetadata = () => {
    switch (type) {
      case 'edited_image':
        return (
          <>
            <p className="text-sm">Prompt: {data.prompt.substring(0, 50)}</p>
            <p className="text-xs text-muted">Model: {data.ai_model}</p>
          </>
        );
      case 'generated_video':
        return (
          <>
            <p className="text-sm">Duration: {data.duration}s</p>
            <p className="text-xs text-muted">Model: {data.ai_model}</p>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Card id={`node-${data.id}`} className="w-48 h-64 flex flex-col items-center p-2 relative">
      <Badge className="absolute top-2 left-2">{getTypeLabel()}</Badge>
      <img 
        src={getThumbnail()} 
        alt={
          type === 'media_asset' ? data.file_name :
          type === 'edited_image' ? data.prompt :
          data.name || 'Timeline node'
        } 
        className="w-full h-32 object-cover rounded"
      />
      <div className="mt-2 text-center">
        <p className="font-medium text-sm truncate">
          {type === 'media_asset' ? data.file_name :
           type === 'edited_image' ? data.prompt.substring(0, 20) :
           data.name?.substring(0, 20) || 'Untitled'}
        </p>
        {getMetadata()}
        <p className="text-xs text-muted mt-1">
          {new Date(data.created_at).toLocaleString()}
        </p>
      </div>
    </Card>
  );
}
