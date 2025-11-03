import { Film } from 'lucide-react';

interface VideoGeneratorPreviewProps {
  aspectRatio: '16:9' | '9:16' | '1:1' | '4:5';
  generatedVideoUrl: string | null;
  videoError: boolean;
  isGenerating: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onRetryVideo: () => void;
  onVideoError: () => void;
}

export function VideoGeneratorPreview({
  aspectRatio,
  generatedVideoUrl,
  videoError,
  isGenerating,
  onDragOver,
  onDrop,
  onRetryVideo,
  onVideoError,
}: VideoGeneratorPreviewProps) {
  return (
    <div className="h-full p-6" onDragOver={onDragOver} onDrop={onDrop}>
      <div className="max-w-5xl mx-auto h-full flex items-center justify-center">
        <div
          className={`bg-muted rounded-xl flex items-center justify-center animate-fade-in overflow-hidden w-full ${
            aspectRatio === '16:9' ? 'aspect-video max-w-4xl' :
            aspectRatio === '9:16' ? 'aspect-[9/16] max-w-md max-h-full' :
            aspectRatio === '1:1' ? 'aspect-square max-w-2xl max-h-full' :
            'aspect-[4/5] max-w-xl max-h-full'
          }`}
        >
          {generatedVideoUrl && !videoError ? (
            <video
              key={generatedVideoUrl}
              src={generatedVideoUrl}
              controls
              className="w-full h-full object-contain rounded-xl"
              preload="metadata"
              onLoadedMetadata={(e) => {
                const video = e.target as HTMLVideoElement;
                console.log(`Video loaded - dimensions: ${video.videoWidth}x${video.videoHeight}`);
              }}
              onError={(e) => {
                console.error('Video failed to load:', e);
                const video = e.target as HTMLVideoElement;
                console.error('Video src:', video.src);
                console.error('Video error code:', video.error?.code);
                console.error('Video error message:', video.error?.message);
                onVideoError();
              }}
            />
          ) : (
            <div className="text-center p-8 w-full">
              {videoError ? (
                <>
                  <div className="w-24 h-24 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Film className="w-12 h-12 text-destructive" />
                  </div>
                  <p className="text-destructive font-medium mb-2">Video failed to load</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    The generated video could not be displayed. You can still save it to your project.
                  </p>
                  <button
                    onClick={onRetryVideo}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Try Again
                  </button>
                </>
              ) : (
                <>
                  <Film className="w-24 h-24 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {isGenerating ? 'Generating your video...' : 'Video preview will appear here'}
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

