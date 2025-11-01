import { ArrowLeft } from 'lucide-react';

interface EditorHeaderProps {
  title: string;
  onClose: () => void;
  closeLabel?: string;
}

export function EditorHeader({ title, onClose, closeLabel = 'Close' }: EditorHeaderProps) {
  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-all hover:scale-105"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Project</span>
          </button>
          <div className="h-6 w-px bg-border" />
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-muted-foreground hover:text-foreground transition-all hover:scale-105"
          >
            {closeLabel}
          </button>
        </div>
      </div>
    </header>
  );
}

