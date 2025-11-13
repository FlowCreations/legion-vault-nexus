import { useEffect, useRef, useState } from 'react';

interface UseQueryBatcherOptions {
  delayMs?: number;
}

type QueryFunction<T> = () => Promise<T>;

export function useQueryBatcher({ delayMs = 100 }: UseQueryBatcherOptions = {}) {
  const batchRef = useRef<Array<() => void>>([]);
  const timerRef = useRef<NodeJS.Timeout>();

  const batchQuery = <T,>(queryFn: QueryFunction<T>): Promise<T> => {
    return new Promise((resolve, reject) => {
      batchRef.current.push(async () => {
        try {
          const result = await queryFn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      // Clear existing timer
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      // Set new timer to execute batch
      timerRef.current = setTimeout(() => {
        const batch = [...batchRef.current];
        batchRef.current = [];
        
        // Execute all queries in parallel
        batch.forEach(fn => fn());
      }, delayMs);
    });
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return { batchQuery };
}
