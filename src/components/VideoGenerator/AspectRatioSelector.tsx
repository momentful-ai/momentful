import { VIDEO_ASPECT_RATIOS } from '../../lib/media';

interface AspectRatioSelectorProps {
  aspectRatio: '16:9' | '9:16' | '1:1' | '4:5';
  onAspectRatioChange: (ratio: '16:9' | '9:16' | '1:1' | '4:5') => void;
}

export function AspectRatioSelector({ aspectRatio, onAspectRatioChange }: AspectRatioSelectorProps) {
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

