import { useEffect, useRef, useState } from 'react';

export const useHeaderMotion = ({
  compactAt = 24,
  hideAt = 120,
  topShowAt = 8,
  deltaThreshold = 6,
} = {}) => {
  const [isHeaderCompact, setIsHeaderCompact] = useState(false);
  const [isHeaderHidden, setIsHeaderHidden] = useState(false);
  const lastScrollYRef = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      const delta = Math.abs(currentY - lastScrollYRef.current);
      const isScrollingDown = currentY > lastScrollYRef.current;

      setIsHeaderCompact(currentY > compactAt);

      if (currentY <= topShowAt) {
        setIsHeaderHidden(false);
      } else if (delta > deltaThreshold) {
        setIsHeaderHidden(isScrollingDown && currentY > hideAt);
      }

      lastScrollYRef.current = currentY;
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [compactAt, hideAt, topShowAt, deltaThreshold]);

  return { isHeaderCompact, isHeaderHidden };
};
