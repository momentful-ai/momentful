import { Trash2, Film, Clock, Wand2, Download } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { mergeName, formatFileSize, formatDuration } from '../../lib/utils';
import { MediaAsset } from '../../types';

interface MediaItemCardProps {
  asset: MediaAsset;
  isSelected: boolean;
  viewMode: 'grid' | 'list';
  onClick: () => void;
  onEditImage?: (asset: MediaAsset) => void;
  onRequestDelete: () => void;
  onDownload?: (asset: MediaAsset) => void;
  getAssetUrl: (storagePath: string) => string;
}

export function MediaItemCard({
  asset,
  isSelected,
  viewMode,
  onClick,
  onEditImage,
  onRequestDelete,
  onDownload,
  getAssetUrl,
}: MediaItemCardProps) {

  return (
    <Card
      className={mergeName(
        'group relative overflow-hidden cursor-pointer hover-lift hover-glow transition-all animate-slide-up w-full h-full',
        isSelected
          ? 'ring-2 ring-primary shadow-xl'
          : 'hover:ring-2 hover:ring-primary/50',
        viewMode === 'list' ? 'flex flex-row' : 'flex flex-col'
      )}
      style={{
        animationDelay: `${Math.random() * 100}ms`,
        animationFillMode: 'backwards'
      }}
      onClick={onClick}
    >
      <div className={mergeName(
        'overflow-hidden relative',
        viewMode === 'grid' ? 'w-full aspect-square' : 'w-32 h-32 flex-shrink-0'
      )}>
        {asset.file_type === 'image' ? (
          <div className="w-full h-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform duration-300">
            <img
              src={getAssetUrl(asset.storage_path)}
              alt={asset.file_name}
              className="max-w-full max-h-full object-contain"
            />
          </div>
        ) : (
          <div className="relative w-full h-full">
            <video
              src={getAssetUrl(asset.storage_path)}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <Film className="w-12 h-12 text-white drop-shadow-lg" />
            </div>
            {asset.duration && (
              <Badge className="absolute bottom-2 right-2 gap-1 shadow-lg">
                <Clock className="w-3 h-3" />
                {formatDuration(asset.duration)}
              </Badge>
            )}
          </div>
        )}

        {asset.file_type === 'image' && onEditImage && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
            <div className="flex items-center gap-2 text-white font-medium text-sm">
              <Wand2 className="w-4 h-4" />
              Edit with AI
            </div>
          </div>
        )}

        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
          {onDownload && (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onDownload(asset);
              }}
              size="icon"
              variant="secondary"
              className="glass shadow-lg h-9 w-9"
              title="Download"
            >
              <Download className="w-4 h-4" />
            </Button>
          )}
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onRequestDelete();
            }}
            size="icon"
            variant="destructive"
            className="shadow-lg h-8 w-8"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className={mergeName('p-3', viewMode === 'list' && 'flex-1 flex flex-col justify-center')}>
        <p className="text-sm font-medium truncate mb-1" title={asset.file_name}>
          {asset.file_name}
        </p>
        <div className={mergeName(
          'flex items-center gap-2',
          viewMode === 'grid' ? 'justify-between' : 'flex-wrap'
        )}>
          <Badge variant="secondary" className="text-xs">
            {formatFileSize(asset.file_size)}
          </Badge>
          {asset.width && asset.height && (
            <span className="text-xs text-muted-foreground">
              {asset.width} × {asset.height}
            </span>
          )}
          {viewMode === 'list' && asset.duration && (
            <Badge variant="secondary" className="text-xs">
              <Clock className="w-3 h-3 mr-1" />
              {formatDuration(asset.duration)}
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
}
