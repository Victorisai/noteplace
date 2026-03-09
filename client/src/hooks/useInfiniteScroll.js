import { useEffect, useRef } from 'react';

function useInfiniteScroll({ onIntersect, enabled = true, rootMargin = '200px' }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!enabled || !ref.current) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onIntersect();
        }
      },
      { rootMargin }
    );

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, [onIntersect, enabled, rootMargin]);

  return ref;
}

export default useInfiniteScroll;
