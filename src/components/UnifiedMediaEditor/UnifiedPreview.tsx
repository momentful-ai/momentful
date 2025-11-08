import { motion } from 'framer-motion';
import { Film, X } from 'lucide-react';
import { MediaEditorMode, SelectedSource } from './types';
import { VideoPlayer } from '../VideoPlayer';

interface UnifiedPreviewProps {
  mode: MediaEditorMode;

  // Image mode props
  originalImageUrl?: string | null;
  editedImageUrl?: string | null;
  showComparison?: boolean;
  fileName?: string;

  // Video mode props
  aspectRatio?: '16:9' | '9:16' | '1:1' | '4:5';
  generatedVideoUrl?: string | null;
  videoError?: boolean;
  isGenerating?: boolean;
  selectedSources?: SelectedSource[];
  onRemoveSource?: (id: string) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onRetryVideo?: () => void;
}

function ImagePreview({
  originalImageUrl,
  editedImageUrl,
  showComparison,
  fileName,
}: {
  originalImageUrl: string;
  editedImageUrl: string | null;
  showComparison: boolean;
  fileName: string;
}) {
  const shouldShowComparison = showComparison && !!editedImageUrl && editedImageUrl !== originalImageUrl;

  return (
    <div className="h-full bg-card overflow-hidden">
      <div className="h-full flex items-center justify-center">
        <div className="w-full h-full flex items-center justify-center">
          {!shouldShowComparison ? (
            <div className="flex items-center justify-center w-full h-full animate-fade-in">
              <img
                src={originalImageUrl}
                alt={fileName}
                className="max-w-full max-h-full rounded-xl transition-transform hover:scale-105"
                style={{ objectFit: 'contain' }}
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-6 w-full h-full animate-fade-in">
              <div className="flex flex-col items-center justify-center">
                <div className="mb-2 text-sm font-medium text-muted-foreground">
                  Original
                </div>
                <div className="flex-1 flex items-center justify-center w-full">
                  <img
                    src={originalImageUrl}
                    alt="Original"
                    className="max-w-full max-h-full rounded-xl"
                    style={{ objectFit: 'contain' }}
                  />
                </div>
              </div>
              <div className="flex flex-col items-center justify-center">
                <div className="mb-2 text-sm font-medium text-muted-foreground">
                  AI Edited
                </div>
                <div className="flex-1 flex items-center justify-center w-full">
                  <img
                    src={editedImageUrl || originalImageUrl}
                    alt="Edited"
                    className="max-w-full max-h-full rounded-xl"
                    style={{ objectFit: 'contain' }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function VideoPreview({
  aspectRatio,
  generatedVideoUrl,
  videoError,
  isGenerating,
  selectedSources,
  onRemoveSource,
  onDragOver,
  onDrop,
  onRetryVideo,
}: {
  aspectRatio: '16:9' | '9:16' | '1:1' | '4:5';
  generatedVideoUrl: string | null;
  videoError: boolean;
  isGenerating: boolean;
  selectedSources: SelectedSource[];
  onRemoveSource?: (id: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onRetryVideo: () => void;
}) {
  return (
    <div className="h-full p-6 relative" onDragOver={onDragOver} onDrop={onDrop}>
      {/* Stacked Source Images - Vertically centered */}
      {selectedSources.length > 0 && (
        <div className="absolute left-6 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-10">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Source Images</h3>
          <div className="relative" style={{ width: '160px', height: `${160 + (selectedSources.length - 1) * 12}px` }}>
            {selectedSources.map((source, index) => (
              <div
                key={source.id}
                className="absolute group rounded-lg overflow-hidden border-2 border-border hover:border-primary transition-all shadow-lg"
                style={{
                  width: '160px',
                  height: '160px',
                  top: `${index * 12}px`,
                  left: `${index * 12}px`,
                  zIndex: selectedSources.length - index,
                }}
              >
                <div className="w-full h-full flex items-center justify-center bg-muted">
                  {source.thumbnail ? (
                    <img
                      src={source.thumbnail}
                      alt={source.name}
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <Film className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>
                {onRemoveSource && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveSource(source.id);
                    }}
                    className="absolute top-2 right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-destructive/90"
                    title="Remove source"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
                <div className="absolute bottom-2 left-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded truncate">
                  {source.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Video Preview - Maximize available space while respecting aspect ratio */}
      <div className="h-full flex items-center justify-center">
        <div className={`flex items-center justify-center h-full ${
          selectedSources.length > 0 ? 'w-[calc(100%-200px)]' : 'w-full'
        }`}>
          <div
            className={`bg-muted rounded-xl flex items-center justify-center animate-fade-in overflow-hidden ${
              aspectRatio === '16:9' ? 'aspect-video w-full max-h-full' :
              aspectRatio === '9:16' ? 'aspect-[9/16] h-full max-w-full' :
              aspectRatio === '1:1' ? 'aspect-square w-full max-h-full' :
              'aspect-[4/5] w-full max-h-full'
            }`}
            style={{
              minWidth: '200px',
              minHeight: '200px'
            }}
          >
            {generatedVideoUrl && !videoError ? (
              <VideoPlayer
                videoUrl={generatedVideoUrl}
                aspectRatio={aspectRatio === '16:9' ? 16/9 :
                            aspectRatio === '9:16' ? 9/16 :
                            aspectRatio === '1:1' ? 1 :
                            4/5}
              />
            ) : (
              <div className="text-center p-8 w-full h-full flex flex-col items-center justify-center">
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
    </div>
  );
}

export function UnifiedPreview({
  mode,
  originalImageUrl,
  editedImageUrl,
  showComparison,
  fileName,
  aspectRatio,
  generatedVideoUrl,
  videoError,
  isGenerating,
  selectedSources,
  onRemoveSource,
  onDragOver,
  onDrop,
  onRetryVideo,
}: UnifiedPreviewProps) {
  return (
    <motion.div
      className="h-full overflow-hidden"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      {mode === 'image-edit' ? (
        originalImageUrl && fileName ? (
          <ImagePreview
            originalImageUrl={originalImageUrl}
            editedImageUrl={editedImageUrl || null}
            showComparison={showComparison || false}
            fileName={fileName}
          />
        ) : (
          <div className="h-full flex items-center justify-center">
            <p className="text-muted-foreground">No image selected</p>
          </div>
        )
      ) : (
        <VideoPreview
          aspectRatio={aspectRatio || '9:16'}
          generatedVideoUrl={generatedVideoUrl || null}
          videoError={videoError || false}
          isGenerating={isGenerating || false}
          selectedSources={selectedSources || []}
          onRemoveSource={onRemoveSource}
          onDragOver={onDragOver || (() => {})}
          onDrop={onDrop || (() => {})}
          onRetryVideo={onRetryVideo || (() => {})}
        />
      )}
    </motion.div>
  );
}