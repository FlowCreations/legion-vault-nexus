import { Skeleton } from "@/components/ui/skeleton";

export const VideoGridSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {[...Array(6)].map((_, i) => (
      <div key={i} className="space-y-3">
        <Skeleton className="h-48 w-full rounded-lg" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    ))}
  </div>
);

export const MusicGridSkeleton = () => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
    {[...Array(10)].map((_, i) => (
      <div key={i} className="space-y-3">
        <Skeleton className="aspect-square w-full rounded-lg" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    ))}
  </div>
);

export const ProductGridSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
    {[...Array(8)].map((_, i) => (
      <div key={i} className="space-y-3">
        <Skeleton className="aspect-square w-full rounded-lg" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-4 w-1/3" />
      </div>
    ))}
  </div>
);

export const HeroSkeleton = () => (
  <div className="relative h-[60vh] min-h-[500px] w-full">
    <Skeleton className="absolute inset-0" />
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="text-center space-y-4 max-w-2xl px-4">
        <Skeleton className="h-12 w-96 mx-auto" />
        <Skeleton className="h-6 w-72 mx-auto" />
        <Skeleton className="h-10 w-32 mx-auto rounded-full" />
      </div>
    </div>
  </div>
);

export const CarouselSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-6 w-48" />
    <div className="flex gap-4 overflow-hidden">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex-shrink-0 w-64 space-y-2">
          <Skeleton className="aspect-video w-full rounded-lg" />
          <Skeleton className="h-4 w-full" />
        </div>
      ))}
    </div>
  </div>
);

export const TableSkeleton = ({ rows = 5 }: { rows?: number }) => (
  <div className="space-y-2">
    <Skeleton className="h-10 w-full" />
    {[...Array(rows)].map((_, i) => (
      <Skeleton key={i} className="h-16 w-full" />
    ))}
  </div>
);

export const FormSkeleton = () => (
  <div className="space-y-4 max-w-md">
    <div className="space-y-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-10 w-full" />
    </div>
    <div className="space-y-2">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-10 w-full" />
    </div>
    <div className="space-y-2">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-24 w-full" />
    </div>
    <Skeleton className="h-10 w-full rounded-lg" />
  </div>
);

export const ProfileSkeleton = () => (
  <div className="space-y-6 max-w-2xl">
    <div className="flex items-center gap-4">
      <Skeleton className="h-24 w-24 rounded-full" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
    </div>
    <div className="grid grid-cols-3 gap-4">
      {[...Array(3)].map((_, i) => (
        <Skeleton key={i} className="h-24 w-full rounded-lg" />
      ))}
    </div>
  </div>
);
