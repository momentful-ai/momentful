import { VIDEO_CAMERA_MOVEMENTS } from '../../lib/media';

interface CameraMovementSelectorProps {
  cameraMovement: string;
  onCameraMovementChange: (movement: string) => void;
}

export function CameraMovementSelector({ cameraMovement, onCameraMovementChange }: CameraMovementSelectorProps) {
  return (
    <div className="p-6">
      <h3 className="font-semibold text-foreground mb-4">Camera Movement</h3>
      <div className="space-y-1.5">
        {VIDEO_CAMERA_MOVEMENTS.map((camera) => (
          <button
            key={camera.id}
            onClick={() => onCameraMovementChange(camera.id)}
            className={`w-full text-left p-2.5 rounded-lg border transition-all hover:scale-[1.02] ${
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

