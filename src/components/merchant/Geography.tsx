import { lazy, Suspense, memo } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const GlobalReachMap = lazy(() => import("./GlobalReachMap"));

export const Geography = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Global Reach</h2>
      </div>
      <Suspense fallback={<Skeleton className="h-[500px] w-full rounded-lg" />}>
        <GlobalReachMap 
          membersEndpoint="members-geojson"
          autoFit={true}
          padding={60}
          title=""
        />
      </Suspense>
    </div>
  );
};

export default memo(Geography);
