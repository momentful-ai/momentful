import { Download, Share2, Film, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { GeneratedVideo } from '../types';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { formatDate } from '../lib/utils';

interface GeneratedVideosViewProps {
  videos: GeneratedVideo[];
  viewMode: 'grid' | 'list';
  onExport: (video: GeneratedVideo) => void;
  onPublish: (video: GeneratedVideo) => void;
}

export function GeneratedVideosView({
  videos,
  viewMode,
  onExport,
  onPublish,
}: GeneratedVideosViewProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing':
        return <Clock className="w-3 h-3" />;
      case 'completed':
        return <CheckCircle className="w-3 h-3" />;
      case 'failed':
        return <AlertCircle className="w-3 h-3" />;
      default:
        return <Film className="w-3 h-3" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'processing':
        return 'default';
      case 'completed':
        return 'default';
      case 'failed':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  if (videos.length === 0) {
    return (
      <Card className="border-2 border-dashed p-12 text-center">
        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
          <Film className="w-10 h-10 text-muted-foreground" />
        </div>
        <h3 className="text-2xl font-semibold mb-3">
          No generated videos yet
        </h3>
        <p className="text-muted-foreground max-w-md mx-auto text-lg">
          Create professional marketing videos from your edited images.
        </p>
      </Card>
    );
  }

  return (
    <div className={viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 gap-4' : 'space-y-2'}>
      {videos.map((video) => (
        <Card key={video.id} className="group overflow-hidden hover-lift hover-glow">
          <div className="aspect-video bg-black relative">
            {video.status === 'processing' ? (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">Processing video...</p>
                </div>
              </div>
            ) : video.status === 'failed' ? (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <div className="text-center">
                  <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">Video generation failed</p>
                </div>
              </div>
            ) : video.storage_path ? (
              <video
                src={video.storage_path}
                controls
                className="w-full h-full object-contain"
                preload="metadata"
                onError={(e) => {
                  console.error('Video failed to load:', e);
                  const video = e.target as HTMLVideoElement;
                  console.error('Video src:', video.src);
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <div className="text-center">
                  <Film className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">Video not available</p>
                </div>
              </div>
            )}
            {video.status === 'completed' && (
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                <Button
                  onClick={() => onExport(video)}
                  size="icon"
                  variant="secondary"
                  className="glass shadow-lg h-9 w-9"
                  title="Export video"
                >
                  <Download className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => onPublish(video)}
                  size="icon"
                  variant="secondary"
                  className="glass shadow-lg h-9 w-9"
                  title="Publish to social"
                >
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Badge variant={getStatusVariant(video.status)} className="gap-1">
                {getStatusIcon(video.status)}
                {video.status === 'processing' && 'Processing'}
                {video.status === 'completed' && `${video.duration || 0}s`}
                {video.status === 'failed' && 'Failed'}
              </Badge>
              <Badge variant="outline">{video.aspect_ratio}</Badge>
            </div>
            {video.name && (
              <p className="text-sm font-medium mb-2 line-clamp-2">
                {video.name}
              </p>
            )}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{video.ai_model}</span>
              <span>{formatDate(video.created_at)}</span>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
