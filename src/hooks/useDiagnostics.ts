import { useEffect } from 'react';
import { startErrorObservers } from '@/diagnostics/errorObservers';
import { startLongTaskObserver } from '@/diagnostics/longTaskObserver';
import { startEventLoopLagMonitor } from '@/diagnostics/eventLoopLag';
import { startNetworkProxy } from '@/diagnostics/networkProxy';
import { startPageLoadObserver } from '@/diagnostics/pageLoadObserver';
import { startRouteChangeObserver } from '@/diagnostics/routeChangeObserver';

export const useDiagnostics = () => {
  useEffect(() => {
    // Only enable in development or when explicitly enabled
    const isDev = process.env.NODE_ENV === 'development';
    const isEnabled = localStorage.getItem('debug:enable') === '1';
    
    if (!isDev && !isEnabled) return;

    console.log('[Diagnostics] Initializing stability monitoring...');
    
    const cleanups = [
      startErrorObservers(),
      startLongTaskObserver(),
      startEventLoopLagMonitor(),
      startNetworkProxy(),
      startPageLoadObserver(),
      startRouteChangeObserver(),
    ];

    return () => {
      console.log('[Diagnostics] Cleaning up stability monitoring...');
      cleanups.forEach(cleanup => cleanup());
    };
  }, []);
};
