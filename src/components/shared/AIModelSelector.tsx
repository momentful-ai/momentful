import { Sparkles } from 'lucide-react';
import { AIModel } from '../../types';

interface AIModelSelectorProps {
  models: AIModel[];
  selectedModel: string;
  description?: string;
  onModelChange: (modelId: string) => void;
}

export function AIModelSelector({
  models,
  selectedModel,
  description = 'Choose the best AI model for your needs',
  onModelChange,
}: AIModelSelectorProps) {
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

