'use client';

import { useEffect, useRef } from 'react';

export function useInfiniteScroll(onLoadMore: () => void, disabled = false) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const target = sentinelRef.current;
    if (!target || disabled) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) {
        onLoadMore();
      }
    }, { rootMargin: '160px' });

    observer.observe(target);
    return () => observer.disconnect();
  }, [disabled, onLoadMore]);

  return sentinelRef;
}
