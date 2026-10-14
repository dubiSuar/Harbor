import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  type GestureResponderEvent,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { duration, ease } from '../../theme';
import { useReduceMotion } from './motion';

export type PressableScaleProps = Omit<PressableProps, 'style' | 'children'> & {
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  /** Scale while pressed: .98 / .97 / .96 / .95 / .94 / .92 / .9 / .85. Default .97. */
  pressedScale?: number;
  /** Spring curve (250 ms, cubic-bezier(.34,1.56,.64,1)) instead of smooth 200 ms. */
  spring?: boolean;
  /** Background while pressed (e.g. colors.fill). */
  pressedBg?: string;
  /** Extra rotation while pressed, in degrees (the FAB uses 90). */
  pressedRotate?: number;
};

/**
 * The design's `style-active` press feedback: a native-driven scale (and
 * optional rotation), plus an optional pressed background. Every tappable
 * primitive builds on this.
 */
export function PressableScale({
  style,
  children,
  pressedScale = 0.97,
  spring = false,
  pressedBg,
  pressedRotate,
  onPressIn,
  onPressOut,
  accessibilityRole = 'button',
  ...rest
}: PressableScaleProps) {
  const progress = useRef(new Animated.Value(0)).current;
  const [pressed, setPressed] = useState(false);
  const reduce = useReduceMotion();
  useEffect(() => () => progress.stopAnimation(), [progress]);

  const animate = (to: number) => {
    Animated.timing(progress, {
      toValue: to,
      duration: reduce ? 0 : spring ? duration.pressSpring : duration.press,
      easing: spring ? ease.spring : ease.smooth,
      useNativeDriver: true,
    }).start();
  };

  const scale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, pressedScale],
  });
  const transform = pressedRotate
    ? [
        { scale },
        {
          rotate: progress.interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', `${pressedRotate}deg`],
          }),
        },
      ]
    : [{ scale }];

  return (
    <AnimatedPressable
      accessibilityRole={accessibilityRole}
      {...rest}
      onPressIn={(e: GestureResponderEvent) => {
        setPressed(true);
        animate(1);
        onPressIn?.(e);
      }}
      onPressOut={(e: GestureResponderEvent) => {
        setPressed(false);
        animate(0);
        onPressOut?.(e);
      }}
      style={[
        style,
        pressed && pressedBg ? { backgroundColor: pressedBg } : null,
        { transform },
      ]}
    >
      {children}
    </AnimatedPressable>
  );
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
