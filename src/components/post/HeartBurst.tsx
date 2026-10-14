import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { colors, duration, ease } from '../../theme';
import { Icon, useReduceMotion } from '../ui';

type Props = {
  /** Bump to play the burst once (0 = never played). */
  trigger: number;
  size?: number;
};

/**
 * The double-tap heart: a white fill heart that pops in with the design's
 * spring curve, holds, then fades. Transform and opacity only, native
 * driver; skipped entirely with reduce motion on.
 */
export function HeartBurst({ trigger, size = 84 }: Props) {
  const reduce = useReduceMotion();
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    if (!trigger || reduce) {
      return;
    }
    opacity.setValue(0);
    scale.setValue(0.4);
    const anim = Animated.sequence([
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 120,
          easing: ease.css,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: duration.storyHeart,
          easing: ease.spring,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(320),
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: duration.toastOut,
          easing: ease.css,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1.15,
          duration: duration.toastOut,
          easing: ease.smooth,
          useNativeDriver: true,
        }),
      ]),
    ]);
    anim.start();
    return () => {
      anim.stop();
      opacity.setValue(0);
    };
  }, [trigger, reduce, opacity, scale]);

  return (
    <Animated.View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.wrap, { opacity, transform: [{ scale }] }]}
    >
      <Icon name="heart" weight="fill" size={size} color={colors.onAccent} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
