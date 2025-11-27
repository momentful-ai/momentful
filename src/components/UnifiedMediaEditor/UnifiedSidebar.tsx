import { motion } from 'framer-motion';
import { Crop, Clock } from 'lucide-react';
import { MediaEditorMode } from './types';
import { ResizableSidebar } from '../shared/ResizableSidebar';
import { IMAGE_ASPECT_RATIOS, VIDEO_ASPECT_RATIOS, VIDEO_CAMERA_MOVEMENTS } from '../../lib/media';


interface UnifiedSidebarProps {
  mode: MediaEditorMode;

  // Image mode props
  selectedRatio?: string;
  onRatioChange?: (ratio: string) => void;

  // Video mode props
  // Video mode props
  duration?: number;
  aspectRatio?: '16:9' | '9:16' | '1:1' | '4:5';
  cameraMovement?: string;
  onDurationChange?: (duration: number) => void;
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
            className={`p-2.5 rounded-lg border text-left transition-all hover:scale-[1.02] ${selectedRatio === ratio.id
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

function DurationSelector({
  duration,
  onDurationChange,
}: {
  duration: number;
  onDurationChange: (duration: number) => void;
}) {
  const durations = [4, 6, 8];
  return (
    <div className="p-6 border-b border-border">
      <div className="flex items-center gap-2 mb-2">
        <Clock className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-foreground">Duration</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Choose the duration for your video
      </p>
      <div className="grid grid-cols-3 gap-1.5">
        {durations.map((d) => (
          <button
            key={d}
            onClick={() => onDurationChange(d)}
            className={`p-2.5 rounded-lg border text-center transition-all hover:scale-[1.02] ${duration === d
              ? 'border-primary bg-primary/10'
              : 'border-border hover:border-border/70'
              }`}
          >
            <div className="font-medium text-foreground text-sm">
              {d}s
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
            className={`p-2.5 rounded-lg border text-left transition-all hover:scale-[1.02] ${aspectRatio === ratio.id
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
            className={`p-2.5 rounded-lg border text-left transition-all hover:scale-[1.02] ${cameraMovement === camera.id
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
  onRatioChange,
  duration,
  aspectRatio,
  cameraMovement,
  onDurationChange,
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
          <ImageEditorAspectRatioSelector
            selectedRatio={selectedRatio || '1:1'}
            onRatioChange={onRatioChange || (() => { })}
          />
        ) : (
          <>
            <DurationSelector
              duration={duration || 4}
              onDurationChange={onDurationChange || (() => { })}
            />
            <VideoAspectRatioSelector
              aspectRatio={aspectRatio || '9:16'}
              onAspectRatioChange={onAspectRatioChange || (() => { })}
            />
            <CameraMovementSelector
              cameraMovement={cameraMovement || 'dynamic'}
              onCameraMovementChange={onCameraMovementChange || (() => { })}
            />
          </>
        )}
      </ResizableSidebar>
    </motion.div>
  );
}