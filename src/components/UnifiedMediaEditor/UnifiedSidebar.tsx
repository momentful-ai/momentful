import { motion } from 'framer-motion';
import { Crop, History, Sparkles } from 'lucide-react';
import { MediaEditorMode } from './types';
import { VersionHistoryItem } from './types';
import { ResizableSidebar } from '../shared/ResizableSidebar';
import { IMAGE_ASPECT_RATIOS, VIDEO_ASPECT_RATIOS, VIDEO_CAMERA_MOVEMENTS } from '../../lib/media';
import { videoModels } from '../../data/aiModels';
import { imageModels } from '../../data/aiModels';
import { AIModel } from '../../types';

interface UnifiedSidebarProps {
  mode: MediaEditorMode;

  // Image mode props
  selectedRatio?: string;
  versions?: VersionHistoryItem[];
  onRatioChange?: (ratio: string) => void;

  // Video mode props
  selectedModel?: string;
  aspectRatio?: '16:9' | '9:16' | '1:1' | '4:5';
  cameraMovement?: string;
  onModelChange?: (model: string) => void;
  onAspectRatioChange?: (ratio: '16:9' | '9:16' | '1:1' | '4:5') => void;
  onCameraMovementChange?: (movement: string) => void;
}

function ImageEditorAspectRatioSelector({
  selectedRatio,
  onRatioChange,
}: {
  selectedRatio: string;
  onRatioChange: (ratio: string) => void;
}) {
  return (
    <div className="p-6 border-b border-border">
      <div className="flex items-center gap-2 mb-2">
        <Crop className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-foreground">Aspect Ratio</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Choose the output aspect ratio for your edited image
      </p>
      <div className="grid grid-cols-2 gap-1.5">
        {IMAGE_ASPECT_RATIOS.map((ratio) => (
          <button
            key={ratio.id}
            onClick={() => onRatioChange(ratio.id)}
            className={`p-2.5 rounded-lg border text-left transition-all hover:scale-[1.02] ${
              selectedRatio === ratio.id
                ? 'border-primary bg-primary/10'
                : 'border-border hover:border-border/70'
            }`}
          >
            <div className="font-medium text-foreground text-sm mb-0.5">
              {ratio.label}
            </div>
            <div className="text-xs text-muted-foreground">
              {ratio.description}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function VersionHistory({ versions }: { versions: VersionHistoryItem[] }) {
  if (versions.length === 0) {
    return null;
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-2 mb-3">
        <History className="w-4 h-4 text-muted-foreground" />
        <h4 className="text-sm font-medium text-foreground">Version History</h4>
      </div>
      <div className="space-y-2">
        {versions.map((version, index) => (
          <div
            key={index}
            className="bg-muted rounded-lg p-3 text-xs animate-slide-up hover:bg-muted/70 transition-colors"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-foreground">
                Version {versions.length - index}
              </span>
              <span className="text-muted-foreground">
                {new Date(version.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <p className="text-muted-foreground mb-1">{version.prompt}</p>
            <p className="text-muted-foreground/70">
              Model: {imageModels.find((m) => m.id === version.model)?.name}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function AIModelSelector({
  models,
  selectedModel,
  description = 'Choose the best AI model for your needs',
  onModelChange,
}: {
  models: AIModel[];
  selectedModel: string;
  description?: string;
  onModelChange: (modelId: string) => void;
}) {
  return (
    <div className="p-6 border-b border-border">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-foreground">AI Model</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-4">{description}</p>

      <div className="space-y-1.5">
        {models.map((model) => (
          <button
            key={model.id}
            onClick={() => onModelChange(model.id)}
            className={`w-full text-left p-2.5 rounded-lg border transition-all hover:scale-[1.02] ${
              selectedModel === model.id
                ? 'border-primary bg-primary/10'
                : 'border-border hover:border-border/70'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-foreground text-sm mb-0.5">
                  {model.name}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{model.description}</p>
              </div>
              {selectedModel === model.id && (
                <div className="w-4 h-4 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-1.5 h-1.5 bg-primary-foreground rounded-full" />
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function VideoAspectRatioSelector({
  aspectRatio,
  onAspectRatioChange,
}: {
  aspectRatio: '16:9' | '9:16' | '1:1' | '4:5';
  onAspectRatioChange: (ratio: '16:9' | '9:16' | '1:1' | '4:5') => void;
}) {
  return (
    <div className="p-6 border-b border-border">
      <h3 className="font-semibold text-foreground mb-4">Aspect Ratio</h3>
      <div className="grid grid-cols-2 gap-1.5">
        {VIDEO_ASPECT_RATIOS.map((ratio) => (
          <button
            key={ratio.id}
            onClick={() => onAspectRatioChange(ratio.id as '16:9' | '9:16' | '1:1' | '4:5')}
            className={`p-2.5 rounded-lg border text-left transition-all hover:scale-[1.02] ${
              aspectRatio === ratio.id
                ? 'border-primary bg-primary/10'
                : 'border-border hover:border-border/70'
            }`}
          >
            <div className="font-medium text-foreground text-sm mb-0.5">
              {ratio.label}
            </div>
            <div className="text-xs text-muted-foreground">
              {ratio.description}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function CameraMovementSelector({
  cameraMovement,
  onCameraMovementChange,
}: {
  cameraMovement: string;
  onCameraMovementChange: (movement: string) => void;
}) {
  return (
    <div className="p-6">
      <h3 className="font-semibold text-foreground mb-4">Camera Movement</h3>
      <div className="grid grid-cols-2 gap-1.5">
        {VIDEO_CAMERA_MOVEMENTS.map((camera) => (
          <button
            key={camera.id}
            onClick={() => onCameraMovementChange(camera.id)}
            className={`p-2.5 rounded-lg border text-left transition-all hover:scale-[1.02] ${
              cameraMovement === camera.id
                ? 'border-primary bg-primary/10'
                : 'border-border hover:border-border/70'
            }`}
          >
            <div className="font-medium text-foreground text-sm mb-0.5">
              {camera.label}
            </div>
            <div className="text-xs text-muted-foreground">
              {camera.description}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export function UnifiedSidebar({
  mode,
  selectedRatio,
  versions,
  onRatioChange,
  selectedModel,
  aspectRatio,
  cameraMovement,
  onModelChange,
  onAspectRatioChange,
  onCameraMovementChange,
}: UnifiedSidebarProps) {
  return (
    <motion.div
      className="h-full flex-shrink-0"
      initial={{ x: 320 }}
      animate={{ x: 0 }}
      exit={{ x: 320 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <ResizableSidebar defaultWidth={320} minWidth={250} maxWidth={600} side="right">
        {mode === 'image-edit' ? (
          <>
            <ImageEditorAspectRatioSelector
              selectedRatio={selectedRatio || '1:1'}
              onRatioChange={onRatioChange || (() => {})}
            />
            <VersionHistory versions={versions || []} />
          </>
        ) : (
          <>
            <AIModelSelector
              models={videoModels}
              selectedModel={selectedModel || 'gen-3-alpha-turbo'}
              description="Choose the best AI model for your video"
              onModelChange={onModelChange || (() => {})}
            />
            <VideoAspectRatioSelector
              aspectRatio={aspectRatio || '9:16'}
              onAspectRatioChange={onAspectRatioChange || (() => {})}
            />
            <CameraMovementSelector
              cameraMovement={cameraMovement || 'dynamic'}
              onCameraMovementChange={onCameraMovementChange || (() => {})}
            />
          </>
        )}
      </ResizableSidebar>
    </motion.div>
  );
}