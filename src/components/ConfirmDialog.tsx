import { AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '../lib/utils';

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'danger' | 'warning' | 'info';
}

export function ConfirmDialog({
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  type = 'warning',
}: ConfirmDialogProps) {
  const typeConfig = {
    danger: {
      iconBg: 'bg-destructive/10 dark:bg-destructive/20',
      iconColor: 'text-destructive',
      variant: 'destructive' as const,
    },
    warning: {
      iconBg: 'bg-accent/10',
      iconColor: 'text-accent-foreground',
      variant: 'default' as const,
    },
    info: {
      iconBg: 'bg-primary/10 dark:bg-primary/20',
      iconColor: 'text-primary',
      variant: 'default' as const,
    },
  };

  const config = typeConfig[type];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="glass-card max-w-md w-full p-6 shadow-2xl animate-scale-in">
        <div className={cn(
          'w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ring-4 ring-offset-2 ring-offset-background',
          config.iconBg
        )}>
          <AlertCircle className={cn('w-7 h-7', config.iconColor)} />
        </div>
        <h2 className="text-2xl font-bold text-center mb-3">
          {title}
        </h2>
        <p className="text-muted-foreground text-center mb-6 leading-relaxed">
          {message}
        </p>
        <div className="flex gap-3">
          <Button
            onClick={onCancel}
            variant="outline"
            size="lg"
            className="flex-1"
          >
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            variant={config.variant}
            size="lg"
            className="flex-1"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
