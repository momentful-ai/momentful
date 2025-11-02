import { useState } from 'react';
import { TimelineNode } from '../../types/timeline';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Image as ImageIcon, Film } from 'lucide-react';

interface TimelineNodeProps {
  node: TimelineNode;
  index: number;
  total: number;
}

export function TimelineNodeComponent({ node }: TimelineNodeProps) {
  const { type, data } = node;
  const [imageError, setImageError] = useState(false);
  const [videoError, setVideoError] = useState(false);

  const getThumbnail = (): string | undefined => {
    switch (type) {
      case 'media_asset':
        return data.thumbnail_url || undefined;
      case 'edited_image':
        return data.edited_url || undefined;
      case 'generated_video':
        return data.thumbnail_url || undefined;
    }
  };

  const thumbnailUrl = getThumbnail();
  const hasValidUrl = !!thumbnailUrl;

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
            {data.duration !== undefined && (
              <p className="text-sm">Duration: {data.duration}s</p>
            )}
            <p className="text-xs text-muted">Model: {data.ai_model}</p>
          </>
        );
      default:
        return null;
    }
  };

  const renderMedia = () => {
    const showPlaceholder = !hasValidUrl || (type === 'generated_video' ? videoError : imageError);
    
    if (showPlaceholder) {
      return (
        <div className="w-full h-32 bg-muted rounded flex items-center justify-center">
          {type === 'generated_video' ? (
            <Film className="w-12 h-12 text-muted-foreground" />
          ) : (
            <ImageIcon className="w-12 h-12 text-muted-foreground" />
          )}
        </div>
      );
    }

    if (type === 'generated_video') {
      return (
        <div className="w-full h-32 relative rounded overflow-hidden bg-black">
          <video
            src={thumbnailUrl}
            className="w-full h-32 object-cover"
            preload="metadata"
            onError={() => setVideoError(true)}
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 pointer-events-none">
            <Film className="w-8 h-8 text-white drop-shadow-lg" />
          </div>
        </div>
      );
    }

    // This should only be reached for media_asset or edited_image types
    const altText = type === 'media_asset' 
      ? data.file_name 
      : type === 'edited_image' 
        ? data.prompt 
        : 'Timeline node';

    return (
      <img 
        src={thumbnailUrl} 
        alt={altText}
        className="w-full h-32 object-cover rounded"
        onError={() => setImageError(true)}
      />
    );
  };

  return (
    <Card id={`node-${data.id}`} className="w-48 h-64 flex flex-col items-center p-2 relative">
      <Badge className="absolute top-2 left-2 z-10">{getTypeLabel()}</Badge>
      {renderMedia()}
      <div className="mt-2 text-center">
        <p className="font-medium text-sm truncate">
          {type === 'media_asset' ? data.file_name :
           type === 'edited_image' ? data.prompt.substring(0, 20) :
           type === 'generated_video' ? (data.name?.substring(0, 20) || 'Untitled') :
           'Untitled'}
        </p>
        {getMetadata()}
        <p className="text-xs text-muted mt-1">
          {new Date(data.created_at).toLocaleString()}
        </p>
      </div>
    </Card>
  );
}
