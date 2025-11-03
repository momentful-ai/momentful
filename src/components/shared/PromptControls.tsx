import { Wand2, Play } from 'lucide-react';
import { ReactNode } from 'react';
import { mergeName } from '../../lib/utils';

interface PromptControlsProps {
  prompt: string;
  isGenerating: boolean;
  canGenerate?: boolean;
  generateLabel?: string;
  generatingLabel?: string;
  placeholder?: string;
  context?: string;
  onContextChange?: (context: string) => void;
  onPromptChange: (prompt: string) => void;
  onGenerate: () => void;
  icon?: 'wand' | 'play';
  additionalInfo?: string;
  errorMessage?: string;
  children?: ReactNode;
  fullHeight?: boolean;
}

export function PromptControls({
  prompt,
  isGenerating,
  canGenerate = true,
  generateLabel = 'Generate',
  generatingLabel = 'Generating...',
  placeholder = 'Describe your vision...',
  context,
  onContextChange,
  onPromptChange,
  onGenerate,
  icon = 'wand',
  errorMessage,
  children,
  fullHeight = false,
}: PromptControlsProps) {
  const IconComponent = icon === 'play' ? Play : Wand2;

  return (
    <div className={mergeName('border-t border-border bg-card p-6', fullHeight && 'h-full flex flex-col overflow-hidden')}>
      <div className={mergeName('max-w-5xl mx-auto flex flex-col gap-4', fullHeight && 'flex-1 overflow-hidden')}>
        {children && (
          <div className={mergeName(fullHeight && 'flex-1 overflow-y-auto pr-2 -mr-2 space-y-4', !fullHeight && 'space-y-4')}>
            {children}
          </div>
        )}

        <div>
          <textarea
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            placeholder={placeholder}
            className="w-full h-24 px-4 py-3 bg-background text-foreground placeholder-muted-foreground border border-input rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          />
        </div>

        <div className="flex gap-3">
          {onContextChange && (
            <input
              type="text"
              value={context || ''}
              onChange={(e) => onContextChange(e.target.value)}
              placeholder="Optional context about the image..."
              className="flex-1 px-4 py-3 bg-background text-foreground placeholder-muted-foreground border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            />
          )}
          <button
            onClick={onGenerate}
            disabled={!canGenerate || isGenerating}
            className={`${
              onContextChange ? '' : 'flex-1'
            } flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 disabled:bg-muted disabled:cursor-not-allowed text-primary-foreground px-6 py-3 rounded-lg font-medium transition-all hover:scale-105 hover:shadow-lg active:scale-95 whitespace-nowrap`}
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground" />
                <span>{generatingLabel}</span>
              </>
            ) : (
              <>
                <IconComponent className="w-5 h-5" />
                <span>{generateLabel}</span>
              </>
            )}
          </button>
        </div>

        {errorMessage && (
          <p className="text-xs text-destructive text-center">{errorMessage}</p>
        )}
      </div>
    </div>
  );
}

