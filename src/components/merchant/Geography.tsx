import { lazy, Suspense, memo, useState, useEffect, useRef } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const GlobalReachMap = lazy(() => import("./GlobalReachMap"));

export const Geography = () => {
  const [shouldLoadMap, setShouldLoadMap] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setShouldLoadMap(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px' }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div className="space-y-6" ref={containerRef}>
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Global Reach</h2>
      </div>
      {shouldLoadMap ? (
        <Suspense fallback={<Skeleton className="h-[500px] w-full rounded-lg" />}>
          <GlobalReachMap 
            membersEndpoint="members-geojson"
            autoFit={true}
            padding={60}
            title=""
          />
        </Suspense>
      ) : (
        <Skeleton className="h-[500px] w-full rounded-lg" />
      )}
    </div>
  );
};

export default memo(Geography);
