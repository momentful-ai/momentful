import { motion } from 'framer-motion';
import { X, Edit3, Video } from 'lucide-react';
import { MediaEditorMode } from './types';
import { Button } from '../ui/button';

interface UnifiedHeaderProps {
  mode: MediaEditorMode;
  onClose: () => void;
  onModeSwitch: (mode: MediaEditorMode) => void;
}

export function UnifiedHeader({ mode, onClose, onModeSwitch }: UnifiedHeaderProps) {
  return (
    <motion.div
      className="h-16 bg-card border-b flex items-center justify-between px-6"
      initial={{ y: -64 }}
      animate={{ y: 0 }}
      exit={{ y: -64 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <div className="flex items-center gap-4">
        {/* Mode Switcher */}
        <div className="flex bg-muted rounded-lg p-1">
          <Button
            variant={mode === 'image-edit' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onModeSwitch('image-edit')}
            className="gap-2"
          >
            <Edit3 className="w-4 h-4" />
          </Button>
          <Button
            variant={mode === 'video-generate' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onModeSwitch('video-generate')}
            className="gap-2"
          >
            <Video className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={onClose}
        className="h-8 w-8"
      >
        <X className="w-5 h-5" />
      </Button>
    </motion.div>
  );
}