import { Film, Trash2 } from 'lucide-react';
import { SelectedSource } from './types';

interface VideoGeneratorPreviewProps {
  aspectRatio: '16:9' | '9:16' | '1:1' | '4:5';
  generatedVideoUrl: string | null;
  videoError: boolean;
  isGenerating: boolean;
  selectedSources: SelectedSource[];
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onRemoveSource: (id: string) => void;
  onRetryVideo: () => void;
  onVideoError: () => void;
}

export function VideoGeneratorPreview({
  aspectRatio,
  generatedVideoUrl,
  videoError,
  isGenerating,
  selectedSources,
  onDragOver,
  onDrop,
  onRemoveSource,
  onRetryVideo,
  onVideoError,
}: VideoGeneratorPreviewProps) {
  return (
    <div className="bg-card flex flex-col max-h-[70vh] overflow-hidden" onDragOver={onDragOver} onDrop={onDrop}>
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          <div
            className={`bg-muted rounded-xl flex items-center justify-center animate-fade-in overflow-hidden ${
              aspectRatio === '16:9' ? 'aspect-video max-w-4xl' :
              aspectRatio === '9:16' ? 'aspect-[9/16] max-w-md max-h-[600px]' :
              aspectRatio === '1:1' ? 'aspect-square max-w-2xl max-h-[600px]' :
              'aspect-[4/5] max-w-xl max-h-[600px]'
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
              <div className="text-center p-8">
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

          {selectedSources.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-foreground mb-3">
                Source Media ({selectedSources.length})
              </h3>
              <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                {selectedSources.map((source, index) => (
                  <div
                    key={source.id}
                    className="relative aspect-square bg-muted rounded-lg overflow-hidden group animate-scale-in hover:scale-105 transition-transform"
                  >
                    {source.thumbnail ? (
                      <img
                        src={source.thumbnail}
                        alt={source.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Film className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        onClick={() => onRemoveSource(source.id)}
                        className="p-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-white" />
                      </button>
                    </div>
                    <div className="absolute top-2 left-2 bg-foreground/80 text-background text-xs px-2 py-1 rounded">
                      {index + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

