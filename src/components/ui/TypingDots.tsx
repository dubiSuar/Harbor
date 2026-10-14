import React, { useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { colors } from '../../theme';
import { useReduceMotion } from './motion';

const DELAYS = [0, 150, 300];
const HALF = 480; // 40% of the 1.2 s `hb-dot` cycle
const HOLD = 240; // the last 20%

function Dot({ delay }: { delay: number }) {
  const v = useRef(new Animated.Value(0)).current;
  const reduce = useReduceMotion();
  useEffect(() => {
    if (reduce) {
      v.setValue(1);
      return;
    }
    const anim = Animated.sequence([
      Animated.delay(delay),
      Animated.loop(
        Animated.sequence([
          Animated.timing(v, {
            toValue: 1,
            duration: HALF,
            useNativeDriver: true,
          }),
          Animated.timing(v, {
            toValue: 0,
            duration: HALF,
            useNativeDriver: true,
          }),
          Animated.delay(HOLD),
        ]),
      ),
    ]);
    anim.start();
    return () => anim.stop();
  }, [delay, reduce, v]);
  return (
    <Animated.View
      style={[
        styles.dot,
        {
          opacity: v.interpolate({
            inputRange: [0, 1],
            outputRange: [0.25, 1],
          }),
          transform: [
            {
              translateY: v.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -3],
              }),
            },
          ],
        },
      ]}
    />
  );
}

export type TypingDotsProps = {
  /** Wrap in the chat "their" bubble (#F4F4F5, p 13 15, r 20 20 20 6). Default true. */
  bubble?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Three 7px #71717A dots bouncing (`hb-dot`, 1.2 s, offsets 0 / 150 / 300 ms). */
export function TypingDots({ bubble = true, style }: TypingDotsProps) {
  return (
    <View
      style={[styles.row, bubble && styles.bubble, style]}
      accessible
      accessibilityLabel="Typing"
    >
      {DELAYS.map(d => (
        <Dot key={d} delay={d} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  bubble: {
    alignSelf: 'flex-start',
    paddingVertical: 13,
    paddingHorizontal: 15,
    backgroundColor: colors.fill,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    borderBottomLeftRadius: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.muted,
  },
});
