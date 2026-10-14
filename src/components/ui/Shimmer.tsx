import React, { useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  View,
  type DimensionValue,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { colors, duration, ease } from '../../theme';
import { useOnScreen } from '../../navigation/PaneVisibleContext';
import { Gradient } from './Gradient';
import { useReduceMotion } from './motion';

const TILE = 480;
const STOPS = [
  { offset: 0, color: colors.shimmerBase },
  { offset: 0.5, color: colors.shimmerHi },
  { offset: 1, color: colors.shimmerBase },
];

export type ShimmerProps = {
  height?: number;
  /** Number (dp) or percentage string. Default '100%'. */
  width?: DimensionValue;
  radius?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * The AI loading bar (`hb-shimmer`): a 480-wide #E4EAFA / #F8F9FE / #E4EAFA
 * gradient sliding 480 dp every 1200 ms, linear, looping. Native-driven;
 * pauses when it can't be seen (a hidden tab pane, or a screen covered by
 * another) and when reduce motion is on.
 */
export function Shimmer({
  height = 12,
  width = '100%',
  radius = 6,
  style,
}: ShimmerProps) {
  const x = useRef(new Animated.Value(0)).current;
  const reduce = useReduceMotion();
  const visible = useOnScreen();
  useEffect(() => {
    if (reduce || !visible) {
      return;
    }
    x.setValue(0);
    const loop = Animated.loop(
      Animated.timing(x, {
        toValue: 1,
        duration: duration.shimmer,
        easing: ease.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [reduce, visible, x]);

  return (
    <View
      style={[styles.bar, { height, width, borderRadius: radius }, style]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Animated.View
        style={[
          styles.track,
          {
            transform: [
              {
                translateX: x.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-TILE - TILE / 2, -TILE + TILE / 2],
                }),
              },
            ],
          },
        ]}
      >
        <Gradient direction="right" stops={STOPS} style={styles.tile} />
        <Gradient direction="right" stops={STOPS} style={styles.tile} />
        <Gradient direction="right" stops={STOPS} style={styles.tile} />
      </Animated.View>
    </View>
  );
}

export type ShimmerLinesProps = {
  /** One bar per entry. Feed Brief: ['100%','86%','64%']; summary: ['100%','72%']. */
  widths?: DimensionValue[];
  height?: number;
  radius?: number;
  gap?: number;
  /** Padding around the bars; default vertical 4, horizontal 0. */
  padding?: { vertical?: number; horizontal?: number };
  style?: StyleProp<ViewStyle>;
};

/**
 * Stacked shimmer bars. Defaults match the feed Brief card (3 lines, 12
 * tall, r6, gap 9, padding 4 0). Comment summary: height 11, gap 8, widths
 * ['100%','72%']. Ask bubble: height 10, r5, gap 7, ['100%','60%'],
 * padding { vertical: 0 }.
 */
export function ShimmerLines({
  widths = ['100%', '86%', '64%'],
  height = 12,
  radius = 6,
  gap = 9,
  padding,
  style,
}: ShimmerLinesProps) {
  const box = {
    gap,
    paddingVertical: padding?.vertical ?? 4,
    paddingHorizontal: padding?.horizontal ?? 0,
  };
  return (
    <View
      style={[box, style]}
      accessible
      accessibilityLabel="Loading"
      accessibilityRole="progressbar"
    >
      {widths.map((w, i) => (
        <Shimmer key={i} width={w} height={height} radius={radius} />
      ))}
    </View>
  );
}

/**
 * Plain #F4F4F5 placeholder block for first-load lists (not AI states).
 * `circle` makes a round avatar placeholder of `size`.
 */
export function Skeleton({
  width = '100%',
  height = 14,
  radius = 6,
  circle,
  style,
}: {
  width?: DimensionValue;
  height?: number;
  radius?: number;
  circle?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      style={[
        styles.skeleton,
        circle
          ? { width: circle, height: circle, borderRadius: circle / 2 }
          : { width, height, borderRadius: radius },
        style,
      ]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}

const styles = StyleSheet.create({
  bar: { overflow: 'hidden', backgroundColor: colors.shimmerBase },
  track: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: TILE * 3,
    flexDirection: 'row',
  },
  tile: { width: TILE, height: '100%' },
  skeleton: { backgroundColor: colors.fill },
});
