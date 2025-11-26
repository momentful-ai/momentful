import { useState, useEffect } from 'react';
import { Trash2, Clock, Wand2, Download } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { mergeName, formatFileSize, formatDuration, formatDate } from '../../lib/utils';
import { MediaAsset, EditedImage } from '../../types';
import { VideoPlayer } from '../VideoPlayer';

export type MediaCardItem = MediaAsset | EditedImage;

interface MediaCardProps {
  item: MediaCardItem;
  viewMode: 'grid' | 'list';
  isSelected?: boolean;
  onClick?: () => void;
  onEditImage?: (item: MediaAsset | EditedImage) => void;
  onDownload?: (item: MediaCardItem) => void;
  onDelete?: (item: MediaCardItem) => void;
  getAssetUrl: (storagePath: string) => Promise<string>;
  showTypeLabel?: boolean;
}

function isMediaAsset(item: MediaCardItem): item is MediaAsset {
  return 'file_type' in item;
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
  const [thumbnailUrl, setThumbnailUrl] = useState<string>('');
  const [isUrlLoading, setIsUrlLoading] = useState(false);

  // Extract data based on item type
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
  let storagePath: string | undefined;

  if (isMediaAsset(item)) {
    storagePath = item.thumbnail_url ? undefined : item.storage_path;
    altText = item.file_name;
    isImage = item.file_type === 'image';
    duration = item.duration;
    fileName = item.file_name;
    fileSize = item.file_size;
    width = item.width;
    height = item.height;
    createdAt = item.created_at;
    typeLabel = showTypeLabel ? 'Original' : undefined;
    editTarget = item;
  } else {
    // EditedImage
    if (item.edited_url) {
      // thumbnailUrl will be set in useEffect
    } else {
      storagePath = item.storage_path;
    }
    altText = item.prompt;
    isImage = true;
    fileName = undefined;
    fileSize = undefined;
    width = item.width;
    height = item.height;
    prompt = item.prompt;
    aiModel = item.ai_model;
    createdAt = item.created_at;
    typeLabel = showTypeLabel ? 'Edited' : undefined;
    editTarget = item;
  }

  // Load signed URL if needed
  useEffect(() => {
    // Handle pre-computed URLs first
    if (isMediaAsset(item) && item.thumbnail_url) {
      setThumbnailUrl(item.thumbnail_url);
      setIsUrlLoading(false);
      return;
    } else if (!isMediaAsset(item) && item.edited_url) {
      setThumbnailUrl(item.edited_url);
      setIsUrlLoading(false);
      return;
    }

    // If we have a storagePath, load signed URL
    if (storagePath) {
      setIsUrlLoading(true);
      getAssetUrl(storagePath)
        .then(setThumbnailUrl)
        .catch((error) => {
          console.error('Failed to load asset URL:', error);
          setThumbnailUrl('');
        })
        .finally(() => setIsUrlLoading(false));
    } else {
      setThumbnailUrl('');
      setIsUrlLoading(false);
    }
  }, [item, storagePath, getAssetUrl]);

  const canEdit = Boolean(isImage && onEditImage && editTarget);
  const shouldShowEditOverlay = canEdit;

  // Determine if this is an EditedImage that needs source lookup
  const editHandler = canEdit && onEditImage && editTarget ? () => onEditImage(editTarget) : undefined;

  const cardClassName = mergeName(
    'group relative overflow-hidden transition-all animate-slide-up cursor-pointer hover-lift hover-glow',
    isSelected ? 'ring-2 ring-primary shadow-xl' : 'hover:ring-2 hover:ring-primary/50',
    viewMode === 'list' ? 'flex flex-row' : 'flex flex-col',
  );

  const imageContainerClassName = mergeName(
    'overflow-hidden relative',
    viewMode === 'grid' ? 'w-full aspect-square' : 'w-32 h-32 flex-shrink-0'
  );

  return (
    <Card
      className={mergeName(cardClassName, 'w-full h-full')}
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
          <div className="w-full h-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform duration-300">
            {isUrlLoading ? (
              <div className="flex items-center justify-center w-full h-full">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : thumbnailUrl ? (
              <img
                src={thumbnailUrl}
                alt={altText}
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <div className="flex items-center justify-center w-full h-full text-muted-foreground">
                Failed to load image
              </div>
            )}
          </div>
        ) : (
          <div className="relative w-full h-full">
            {isUrlLoading ? (
              <div className="flex items-center justify-center w-full h-full">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : thumbnailUrl ? (
              <VideoPlayer videoUrl={thumbnailUrl} />
            ) : (
              <div className="flex items-center justify-center w-full h-full text-muted-foreground">
                Failed to load video
              </div>
            )}
            {duration && !isUrlLoading && (
              <Badge className="absolute bottom-2 right-2 gap-1 shadow-lg z-10">
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
