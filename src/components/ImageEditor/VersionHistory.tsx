import { History } from 'lucide-react';
import { imageModels } from '../../data/aiModels';
import { VersionHistoryItem } from './types';

interface VersionHistoryProps {
  versions: VersionHistoryItem[];
}

export function VersionHistory({ versions }: VersionHistoryProps) {
  if (versions.length === 0) {
    return null;
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-2 mb-3">
        <History className="w-4 h-4 text-muted-foreground" />
        <h4 className="text-sm font-medium text-foreground">Version History</h4>
      </div>
      <div className="space-y-2">
        {versions.map((version, index) => (
          <div
            key={index}
            className="bg-muted rounded-lg p-3 text-xs animate-slide-up hover:bg-muted/70 transition-colors"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-foreground">
                Version {versions.length - index}
              </span>
              <span className="text-muted-foreground">
                {new Date(version.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <p className="text-muted-foreground mb-1">{version.prompt}</p>
            <p className="text-muted-foreground/70">
              Model: {imageModels.find((m) => m.id === version.model)?.name}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

