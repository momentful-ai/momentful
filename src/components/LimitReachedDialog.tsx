import { AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { mergeName } from '../lib/utils';

interface LimitReachedDialogProps {
  type: 'images' | 'videos';
  onClose: () => void;
}

export function LimitReachedDialog({
  type,
  onClose,
}: LimitReachedDialogProps) {
  const typeConfig = {
    images: {
      title: 'Image Generation Limit Reached',
      message: `You’ve maxed out your image credits :( Message the Momentful crew at hello@momentful.ai to unlock more.`,
      iconBg: 'bg-primary/10 dark:bg-primary/20',
      iconColor: 'text-primary',
    },
    videos: {
      title: 'Video Generation Limit Reached',
      message: `You’ve maxed out your video credits :(Message the Momentful crew at hello@momentful.ai to unlock more.`,
      iconBg: 'bg-primary/10 dark:bg-primary/20',
      iconColor: 'text-primary',
    },
  };

  const config = typeConfig[type];

  return (
    <div data-testid={`limit-dialog-${type}`} className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="glass-card max-w-md w-full p-6 shadow-2xl animate-scale-in">
        <div className={mergeName(
          'w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ring-4 ring-offset-2 ring-offset-background',
          config.iconBg
        )}>
          <AlertCircle className={mergeName('w-7 h-7', config.iconColor)} />
        </div>
        <h2 className="text-2xl font-bold text-center mb-3">
          {config.title}
        </h2>
        <p className="text-muted-foreground text-center mb-6 leading-relaxed">
          {config.message}
        </p>
        <div className="flex justify-center">
          <Button
            onClick={onClose}
            variant="default"
            size="lg"
            className="min-w-[120px]"
            data-testid={`close-${type}`}
          >
            OK
          </Button>
        </div>
      </div>
    </div>
  );
}
