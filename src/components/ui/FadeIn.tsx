import React, { useEffect, useRef } from 'react';
import { Animated, type StyleProp, type ViewStyle } from 'react-native';
import { duration as durations, ease } from '../../theme';
import { useReduceMotion } from './motion';

export type FadeInProps = {
  children: React.ReactNode;
  /** `hb-fade`: 350 (default; screens, comments, rows), 300 (bubbles, tab content), 500 (onboarding). */
  duration?: number;
  delay?: number;
  style?: StyleProp<ViewStyle>;
};

/** Opacity 0 -> 1 on mount with the CSS `ease` curve (the design's `hb-fade`). */
export function FadeIn({
  children,
  duration = durations.fade,
  delay = 0,
  style,
}: FadeInProps) {
  const reduce = useReduceMotion();
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.timing(v, {
      toValue: 1,
      duration: reduce ? 0 : duration,
      delay: reduce ? 0 : delay,
      easing: ease.css,
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [v, duration, delay, reduce]);
  return (
    <Animated.View style={[style, { opacity: v }]}>{children}</Animated.View>
  );
}
