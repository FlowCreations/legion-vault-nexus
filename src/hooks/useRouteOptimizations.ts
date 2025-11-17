import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Smooth scroll to top on route change
 */
export const useScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
};

/**
 * Add page transition class on route change
 */
export const usePageTransition = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    document.body.classList.add('page-transitioning');
    const timer = setTimeout(() => {
      document.body.classList.remove('page-transitioning');
    }, 300);

    return () => clearTimeout(timer);
  }, [pathname]);
};

/**
 * Preload critical route data
 */
export const useRoutePreload = (routes: string[]) => {
  useEffect(() => {
    routes.forEach(route => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = route;
      document.head.appendChild(link);
    });
  }, [routes]);
};
