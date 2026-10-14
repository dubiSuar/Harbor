import React from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { colors } from '../../theme';

const DOT = 6;
const ACTIVE = 22;
const GAP = 6;
const GROW = ACTIVE - DOT;

/**
 * One pill drawn from two 6px caps and a middle bar, so its width can
 * animate 6 -> 22 with transforms only: the middle scales on X from the
 * left and the right cap slides by 16 * `a`.
 */
function Pill({
  color,
  a,
}: {
  color: string;
  a: Animated.AnimatedInterpolation<number>;
}) {
  return (
    <>
      <View style={[styles.cap, { backgroundColor: color }]} />
      <Animated.View
        style={[
          styles.mid,
          { backgroundColor: color, transform: [{ scaleX: a }] },
        ]}
      />
      <Animated.View
        style={[
          styles.cap,
          {
            backgroundColor: color,
            transform: [
              {
                translateX: a.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, GROW],
                }),
              },
            ],
          },
        ]}
      />
    </>
  );
}

/**
 * Onboarding dots (SPEC 3.01): h6 r3, gap 6; the active dot is 22 wide and
 * #2F5BD3, the rest 6 and #D4D4D8. `position` is the animated page index
 * (0..count-1), driven by the screen with the design's
 * `all .45s cubic-bezier(.16,1,.3,1)`. The width and colour change map to
 * transforms and an opacity cross-fade (native driver).
 */
export function PagerDots({
  count,
  position,
}: {
  count: number;
  position: Animated.Value;
}) {
  return (
    <View
      style={[styles.row, { width: count * DOT + (count - 1) * GAP + GROW }]}
    >
      {Array.from({ length: count }, (_, i) => {
        // 1 while dot i is the active one.
        const a = position.interpolate({
          inputRange: [i - 1, i, i + 1],
          outputRange: [0, 1, 0],
          extrapolate: 'clamp',
        });
        // Dots after the active one sit 16 further right.
        const x = position.interpolate({
          inputRange: [i - 1, i],
          outputRange: [i * (DOT + GAP) + GROW, i * (DOT + GAP)],
          extrapolate: 'clamp',
        });
        return (
          <Animated.View
            key={i}
            style={[styles.dot, { transform: [{ translateX: x }] }]}
          >
            <Pill color={colors.border} a={a} />
            <Animated.View style={[StyleSheet.absoluteFill, { opacity: a }]}>
              <Pill color={colors.accent} a={a} />
            </Animated.View>
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { height: DOT },
  dot: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: ACTIVE,
    height: DOT,
  },
  cap: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
  },
  mid: {
    position: 'absolute',
    left: DOT / 2,
    top: 0,
    width: GROW,
    height: DOT,
    transformOrigin: 'left',
  },
});
