import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * Honours the OS "reduce motion" setting (the design's
 * `prefers-reduced-motion`): when true, run animations with duration 0.
 */
export function useReduceMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then(on => {
        if (alive) {
          setReduce(on);
        }
      })
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduce,
    );
    return () => {
      alive = false;
      sub?.remove();
    };
  }, []);
  return reduce;
}
