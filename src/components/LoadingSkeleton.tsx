export function ProjectCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden animate-pulse">
      <div className="aspect-video bg-slate-200" />
      <div className="p-4">
        <div className="h-5 bg-slate-200 rounded w-3/4 mb-2" />
        <div className="h-4 bg-slate-200 rounded w-full mb-1" />
        <div className="h-4 bg-slate-200 rounded w-2/3 mb-3" />
        <div className="h-3 bg-slate-200 rounded w-1/2" />
      </div>
    </div>
  );
}

export function MediaCardSkeleton() {
  return (
    <div className="group relative aspect-square bg-slate-200 rounded-lg overflow-hidden animate-pulse" />
  );
}

export function DashboardSkeleton() {
  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div className="w-full sm:w-auto">
          <div className="h-8 bg-slate-200 rounded w-48 mb-2 animate-pulse" />
          <div className="h-4 bg-slate-200 rounded w-64 animate-pulse" />
        </div>
        <div className="w-full sm:w-auto h-11 bg-slate-200 rounded-lg animate-pulse sm:w-40" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <ProjectCardSkeleton />
        <ProjectCardSkeleton />
        <ProjectCardSkeleton />
      </div>
    </div>
  );
}

export function MediaLibrarySkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {[...Array(8)].map((_, i) => (
        <MediaCardSkeleton key={i} />
      ))}
    </div>
  );
}
