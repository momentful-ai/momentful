import { X, Image, Video } from 'lucide-react';
import { Button } from '../ui/button';
import { EditorMode } from './types';

interface UnifiedHeaderProps {
  onClose: () => void;
  currentMode: EditorMode;
  onModeChange: (mode: EditorMode) => void;
}

export function UnifiedHeader({ onClose, currentMode, onModeChange }: UnifiedHeaderProps) {
  return (
    <div className="flex-none flex items-center justify-between px-6 py-4 border-b bg-card">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold">Media Editor</h1>

        {/* Mode Switcher */}
        <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
          <Button
            variant={currentMode === 'image' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onModeChange('image')}
            className="flex items-center gap-2"
          >
            <Image className="w-4 h-4" />
            Edit Image
          </Button>
          <Button
            variant={currentMode === 'video' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onModeChange('video')}
            className="flex items-center gap-2"
          >
            <Video className="w-4 h-4" />
            Generate Video
          </Button>
        </div>
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={onClose}
        className="text-muted-foreground hover:text-foreground"
      >
        <X className="w-5 h-5" />
      </Button>
    </div>
  );
}