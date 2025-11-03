import { Trash2, Film, Clock, Wand2, Download } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { mergeName, formatFileSize, formatDuration, formatDate } from '../../lib/utils';
import { MediaAsset, EditedImage, GeneratedVideo } from '../../types';
import { TimelineNode } from '../../types/timeline';

export type MediaCardItem = MediaAsset | EditedImage | GeneratedVideo | TimelineNode;

interface MediaCardProps {
  item: MediaCardItem;
  viewMode: 'grid' | 'list' | 'timeline';
  isSelected?: boolean;
  onClick?: () => void;
  onEditImage?: (item: MediaAsset | EditedImage) => void;
  onDownload?: (item: MediaCardItem) => void;
  onDelete?: (item: MediaCardItem) => void;
  getAssetUrl: (storagePath: string) => string;
  showTypeLabel?: boolean;
}

function isTimelineNode(item: MediaCardItem): item is TimelineNode {
  return typeof item === 'object' && 'type' in item && 'data' in item;
}

function isMediaAsset(item: MediaCardItem): item is MediaAsset {
  return !isTimelineNode(item) && 'file_type' in item;
}

function isEditedImage(item: MediaCardItem): item is EditedImage {
  return !isTimelineNode(item) && 'prompt' in item && 'edited_url' in item;
}

function isGeneratedVideo(item: MediaCardItem): item is GeneratedVideo {
  return !isTimelineNode(item) && !isMediaAsset(item) && !isEditedImage(item) && 'storage_path' in item && 'name' in item;
}

export function MediaCard({
  item,
  viewMode,
  isSelected = false,
  onClick,
  onEditImage,
  onDownload,
  onDelete,
  getAssetUrl,
  showTypeLabel = false,
}: MediaCardProps) {
  // Extract data based on item type
  let thumbnailUrl: string;
  let altText: string;
  let isImage = false;
  let duration: number | undefined;
  let fileName: string | undefined;
  let fileSize: number | undefined;
  let width: number | undefined;
  let height: number | undefined;
  let prompt: string | undefined;
  let aiModel: string | undefined;
  let createdAt: string;
  let typeLabel: string | undefined;
  let editTarget: MediaAsset | EditedImage | undefined;

  if (isTimelineNode(item)) {
    const { type, data } = item;
    
    if (type === 'media_asset') {
      thumbnailUrl = data.thumbnail_url || getAssetUrl(data.storage_path);
      altText = data.file_name;
      isImage = data.file_type === 'image';
      duration = data.duration;
      fileName = data.file_name;
      fileSize = data.file_size;
      width = data.width;
      height = data.height;
      createdAt = data.created_at;
      typeLabel = showTypeLabel ? 'Original' : undefined;
      editTarget = data;
    } else if (type === 'edited_image') {
      thumbnailUrl = data.edited_url;
      altText = data.prompt;
      isImage = true;
      fileName = undefined;
      fileSize = undefined;
      width = data.width;
      height = data.height;
      prompt = data.prompt;
      aiModel = data.ai_model;
      createdAt = data.created_at;
      typeLabel = showTypeLabel ? 'Edited' : undefined;
      editTarget = data;
    } else {
      // generated_video
      thumbnailUrl = data.thumbnail_url || (data.storage_path ? getAssetUrl(data.storage_path) : '');
      altText = data.name || 'Video';
      isImage = false;
      duration = data.duration;
      fileName = data.name;
      createdAt = data.created_at;
      typeLabel = showTypeLabel ? 'Video' : undefined;
    }
  } else if (isMediaAsset(item)) {
    thumbnailUrl = item.thumbnail_url || getAssetUrl(item.storage_path);
    altText = item.file_name;
    isImage = item.file_type === 'image';
    duration = item.duration;
    fileName = item.file_name;
    fileSize = item.file_size;
    width = item.width;
    height = item.height;
    createdAt = item.created_at;
    editTarget = item;
  } else if (isEditedImage(item)) {
    // EditedImage
    thumbnailUrl = item.edited_url;
    altText = item.prompt;
    isImage = true;
    fileName = undefined;
    fileSize = undefined;
    width = item.width;
    height = item.height;
    prompt = item.prompt;
    aiModel = item.ai_model;
    createdAt = item.created_at;
    editTarget = item;
  } else if (isGeneratedVideo(item)) {
    // GeneratedVideo
    const videoItem = item as GeneratedVideo;
    thumbnailUrl = videoItem.thumbnail_url || (videoItem.storage_path ? getAssetUrl(videoItem.storage_path) : '');
    altText = videoItem.name || 'Video';
    isImage = false;
    duration = videoItem.duration;
    fileName = videoItem.name;
    createdAt = videoItem.created_at;
  } else {
    // Fallback - shouldn't happen
    thumbnailUrl = '';
    altText = 'Unknown';
    isImage = false;
    createdAt = new Date().toISOString();
  }

  const canEdit = Boolean(isImage && onEditImage && editTarget);
  const shouldShowEditOverlay = canEdit;

  // Determine if this is an EditedImage that needs source lookup
  const editHandler = canEdit && onEditImage && editTarget ? () => onEditImage(editTarget) : undefined;

  const cardClassName = mergeName(
    'group relative overflow-hidden transition-all animate-slide-up cursor-pointer hover-lift hover-glow',
    isSelected ? 'ring-2 ring-primary shadow-xl' : 'hover:ring-2 hover:ring-primary/50',
    viewMode === 'list' && 'flex flex-row',
  );

  const imageContainerClassName = mergeName(
    'bg-muted overflow-hidden relative',
    viewMode === 'grid' ? 'aspect-square' : 'w-32 h-32 flex-shrink-0'
  );

  return (
    <Card
      className={cardClassName}
      style={{
        animationDelay: `${Math.random() * 100}ms`,
        animationFillMode: 'backwards'
      }}
      onClick={onClick}
    >
      {showTypeLabel && typeLabel && (
        <Badge className="absolute top-2 left-2 z-10">{typeLabel}</Badge>
      )}

      <div className={imageContainerClassName}>
        {isImage ? (
          <img
            src={thumbnailUrl}
            alt={altText}
            className={mergeName(
              'w-full h-full object-cover',
              viewMode !== 'timeline' && 'transition-transform duration-300 group-hover:scale-110'
            )}
          />
        ) : (
          <div className="relative w-full h-full">
            <video
              src={thumbnailUrl}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <Film className={mergeName(viewMode === 'timeline' ? 'w-8 h-8' : 'w-12 h-12', 'text-white drop-shadow-lg')} />
            </div>
            {duration && viewMode !== 'timeline' && (
              <Badge className="absolute bottom-2 right-2 gap-1 shadow-lg">
                <Clock className="w-3 h-3" />
                {formatDuration(duration)}
              </Badge>
            )}
          </div>
        )}

        {shouldShowEditOverlay && editHandler && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Button
              onClick={(e) => {
                e.stopPropagation();
                editHandler();
              }}
              size="sm"
              variant="secondary"
              className="glass shadow-lg"
            >
              <Wand2 className="w-4 h-4 mr-2" />
              Edit with AI
            </Button>
          </div>
        )}

        {(onDownload || onDelete) && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
            {onDownload && (
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onDownload(item);
                }}
                size="icon"
                variant="secondary"
                className="glass shadow-lg h-9 w-9"
                title="Download"
              >
                <Download className="w-4 h-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(item);
                }}
                size="icon"
                variant="destructive"
                className="shadow-lg h-8 w-8"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}

      </div>

      {/* Metadata section */}
      <div className={mergeName('p-3 w-full', viewMode === 'list' && 'flex-1 flex flex-col justify-center')}>
        {prompt ? (
          <>
            <p className="text-sm font-medium mb-2 line-clamp-2" title={prompt}>
              {prompt}
            </p>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              {aiModel && <Badge variant="secondary">{aiModel}</Badge>}
              <span>{formatDate(createdAt)}</span>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm font-medium truncate mb-1" title={fileName}>
              {fileName || 'Untitled'}
            </p>
            <div className={mergeName(
              'flex items-center gap-2',
              viewMode === 'grid' ? 'justify-between' : 'flex-wrap'
            )}>
              {fileSize && (
                <Badge variant="secondary" className="text-xs">
                  {formatFileSize(fileSize)}
                </Badge>
              )}
              {width && height && (
                <span className="text-xs text-muted-foreground">
                  {width} × {height}
                </span>
              )}
              {duration !== undefined && duration > 0 && (
                <Badge variant="secondary" className="text-xs">
                  <Clock className="w-3 h-3 mr-1" />
                  {formatDuration(duration)}
                </Badge>
              )}
            </div>
          </>
        )}
      </div>
    </Card>
  );
}

