import { VIDEO_SCENE_TYPES } from '../../lib/media';

interface SceneTypeSelectorProps {
  sceneType: string;
  onSceneTypeChange: (sceneType: string) => void;
}

export function SceneTypeSelector({ sceneType, onSceneTypeChange }: SceneTypeSelectorProps) {
  return (
    <div className="p-6 border-b border-border">
      <h3 className="font-semibold text-foreground mb-4">Scene Type</h3>
      <div className="space-y-1.5">
        {VIDEO_SCENE_TYPES.map((scene) => (
          <button
            key={scene.id}
            onClick={() => onSceneTypeChange(scene.id)}
            className={`w-full text-left p-2.5 rounded-lg border transition-all hover:scale-[1.02] ${
              sceneType === scene.id
                ? 'border-primary bg-primary/10'
                : 'border-border hover:border-border/70'
            }`}
          >
            <div className="font-medium text-foreground text-sm mb-0.5">
              {scene.label}
            </div>
            <div className="text-xs text-muted-foreground">
              {scene.description}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

