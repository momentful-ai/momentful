import { MediaSkeleton } from './MediaSkeleton';
import { Card } from './ui/card';

export function DashboardSkeleton() {
  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div className="space-y-2">
          <MediaSkeleton className="h-10 w-64" type="text" rounded="md" />
          <MediaSkeleton className="h-5 w-80" type="text" rounded="md" />
        </div>
        <MediaSkeleton className="h-11 w-full sm:w-40" rounded="lg" type="text" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="glass-card overflow-hidden">
            <MediaSkeleton className="aspect-video w-full" type="image" rounded="none" />
            <div className="p-5 space-y-3">
              <MediaSkeleton className="h-6 w-3/4" type="text" rounded="sm" />
              <MediaSkeleton className="h-4 w-full" type="text" rounded="sm" />
              <MediaSkeleton className="h-4 w-2/3" type="text" rounded="sm" />
              <MediaSkeleton className="h-3 w-32 mt-4" type="text" rounded="sm" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function MediaLibrarySkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {[...Array(10)].map((_, i) => (
        <Card key={i} className="glass-card overflow-hidden space-y-3">
          <MediaSkeleton className="aspect-square w-full" type="image" rounded="none" />
          <div className="p-3 space-y-2">
            <MediaSkeleton className="h-4 w-full" type="text" rounded="sm" />
            <MediaSkeleton className="h-3 w-2/3" type="text" rounded="sm" />
          </div>
        </Card>
      ))}
    </div>
  );
}
