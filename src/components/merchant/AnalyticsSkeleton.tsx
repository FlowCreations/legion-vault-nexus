import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export const EarningsOverviewSkeleton = () => (
  <div className="space-y-6">
    <div>
      <Skeleton className="h-4 w-48 mb-2" />
      <Skeleton className="h-16 w-64" />
    </div>
    <div>
      <Skeleton className="h-4 w-32 mb-2" />
      <Skeleton className="h-12 w-48" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i}>
          <CardContent className="p-8 text-center">
            <Skeleton className="h-12 w-12 mx-auto mb-4 rounded-full" />
            <Skeleton className="h-6 w-20 mx-auto mb-2" />
            <Skeleton className="h-10 w-32 mx-auto" />
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

export const TopTracksSkeleton = () => (
  <div className="space-y-6">
    <Skeleton className="h-10 w-48" />
    <div className="flex gap-6 pb-4">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-8 w-24" />
      ))}
    </div>
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="grid grid-cols-12 gap-4 items-center p-4 rounded-lg bg-card">
          <div className="col-span-6 flex items-center gap-4">
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-14 w-14 rounded" />
            <Skeleton className="h-6 w-32" />
          </div>
          <Skeleton className="col-span-3 h-6 w-20 mx-auto" />
          <Skeleton className="col-span-3 h-6 w-16 ml-auto" />
        </div>
      ))}
    </div>
  </div>
);

export const DemographicsSkeleton = () => (
  <div className="space-y-6">
    <Skeleton className="h-10 w-48" />
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-6 w-48 mb-4" />
          <Skeleton className="h-64 w-full rounded-full mx-auto" />
          <div className="mt-6 space-y-3">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-6 w-48 mb-6" />
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    </div>
  </div>
);

export const PlatformOverviewSkeleton = () => (
  <Card>
    <CardContent className="p-6">
      <Skeleton className="h-8 w-48 mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-4 w-48" />
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

export const EngagementTimelineSkeleton = () => (
  <Card>
    <CardContent className="p-6">
      <Skeleton className="h-8 w-48 mb-6" />
      <Skeleton className="h-64 w-full" />
    </CardContent>
  </Card>
);

export const PlatformDistributionSkeleton = () => (
  <Card>
    <CardContent className="p-6">
      <Skeleton className="h-8 w-48 mb-6" />
      <Skeleton className="h-64 w-full" />
    </CardContent>
  </Card>
);

export const GeographySkeleton = () => (
  <div className="space-y-6">
    <Skeleton className="h-10 w-48" />
    <Card>
      <CardContent className="p-6">
        <Skeleton className="h-96 w-full rounded-lg" />
      </CardContent>
    </Card>
  </div>
);
