import { useState, useEffect } from 'react';

interface UseAnalyticsCSVOptions {
  url: string;
  enabled?: boolean;
}

interface CSVData {
  data: any[];
  isLoading: boolean;
  error: string | null;
}

// Cache for CSV data
const csvCache = new Map<string, { data: any[], timestamp: number }>();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

export function useAnalyticsCSV({ url, enabled = true }: UseAnalyticsCSVOptions): CSVData {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const fetchCSV = async () => {
      // Check cache first
      const cached = csvCache.get(url);
      const now = Date.now();
      
      if (cached && (now - cached.timestamp) < CACHE_DURATION) {
        setData(cached.data);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch CSV');

        const text = await response.text();
        const rows = text.split('\n').filter(row => row.trim());
        const headers = rows[0].split(',').map(h => h.replace(/"/g, '').trim());
        
        const parsedData = rows.slice(1).map(row => {
          const values = row.split(',').map(v => v.replace(/"/g, '').trim());
          const obj: any = {};
          headers.forEach((header, index) => {
            obj[header] = values[index] || '';
          });
          return obj;
        });

        // Update cache
        csvCache.set(url, { data: parsedData, timestamp: now });
        setData(parsedData);
      } catch (err) {
        console.error('Error fetching CSV:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setData([]);
      } finally {
        setIsLoading(false);
      }
    };

    // Delay loading to prioritize critical content
    const timer = setTimeout(fetchCSV, 500);
    return () => clearTimeout(timer);
  }, [url, enabled]);

  return { data, isLoading, error };
}

export function clearCSVCache() {
  csvCache.clear();
}
