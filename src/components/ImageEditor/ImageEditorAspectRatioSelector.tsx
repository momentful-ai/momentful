import { Crop } from 'lucide-react';
import { IMAGE_ASPECT_RATIOS } from '../../lib/media';

interface ImageEditorAspectRatioSelectorProps {
  selectedRatio: string;
  onRatioChange: (ratio: string) => void;
}

export function ImageEditorAspectRatioSelector({
  selectedRatio,
  onRatioChange,
}: ImageEditorAspectRatioSelectorProps) {
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

