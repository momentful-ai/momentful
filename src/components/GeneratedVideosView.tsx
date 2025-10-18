import { Download, Share2, Film } from 'lucide-react';
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
            <video
              src={video.video_url}
              controls
              className="w-full h-full"
            />
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
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Badge variant="secondary" className="gap-1">
                <Film className="w-3 h-3" />
                {video.duration}s
              </Badge>
              <Badge variant="outline">{video.aspect_ratio}</Badge>
            </div>
            {video.prompt && (
              <p className="text-sm font-medium mb-2 line-clamp-2">
                {video.prompt}
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
