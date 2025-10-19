import { Upload } from 'lucide-react';

interface DropzoneOverlayProps {
  isVisible: boolean;
  message?: string;
}

export function DropzoneOverlay({ isVisible, message = "Drop images to upload" }: DropzoneOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-primary/10 backdrop-blur-sm z-50 flex items-center justify-center pointer-events-none">
      <div className="bg-card rounded-xl p-8 shadow-2xl border-2 border-dashed border-primary">
        <Upload className="w-16 h-16 text-primary mx-auto mb-4" />
        <p className="text-2xl font-semibold text-primary">{message}</p>
      </div>
    </div>
  );
}
