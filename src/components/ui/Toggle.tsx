import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { colors, duration, ease, shadow } from '../../theme';
import { useReduceMotion } from './motion';

export type ToggleProps = {
  value: boolean;
  /** Omit when a parent row handles the tap (ToggleRow does). */
  onValueChange?: (next: boolean) => void;
  accessibilityLabel?: string;
  disabled?: boolean;
};

/**
 * The design's switch (SPEC 3.14), never the platform Switch: 51x31 r16
 * track, #2F5BD3 on / #E4E4E7 off (250 ms cross-fade); 27px white knob at
 * top 2 / left 2 with the `knob` shadow, translateX 20 when on (400 ms,
 * cubic-bezier(.34,1.3,.64,1)).
 */
export function Toggle({
  value,
  onValueChange,
  accessibilityLabel,
  disabled,
}: ToggleProps) {
  const reduce = useReduceMotion();
  const knob = useRef(new Animated.Value(value ? 1 : 0)).current;
  const track = useRef(new Animated.Value(value ? 1 : 0)).current;
  useEffect(() => {
    const anim = Animated.parallel([
      Animated.timing(knob, {
        toValue: value ? 1 : 0,
        duration: reduce ? 0 : duration.knob,
        easing: ease.knob,
        useNativeDriver: true,
      }),
      Animated.timing(track, {
        toValue: value ? 1 : 0,
        duration: reduce ? 0 : duration.track,
        easing: ease.css,
        useNativeDriver: true,
      }),
    ]);
    anim.start();
    return () => anim.stop();
  }, [value, reduce, knob, track]);

  const body = (
    <View style={styles.track}>
      <Animated.View style={[styles.on, { opacity: track }]} />
      <Animated.View
        style={[
          styles.knob,
          {
            transform: [
              {
                translateX: knob.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 20],
                }),
              },
            ],
          },
        ]}
      />
    </View>
  );

  if (!onValueChange) {
    return (
      <View accessible={false} importantForAccessibility="no-hide-descendants">
        {body}
      </View>
    );
  }
  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled: !!disabled }}
      accessibilityLabel={accessibilityLabel}
      hitSlop={{ top: 7, bottom: 7, left: 4, right: 4 }}
    >
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: 51,
    height: 31,
    borderRadius: 16,
    backgroundColor: colors.line,
    overflow: 'hidden',
  },
  on: { ...StyleSheet.absoluteFill, backgroundColor: colors.accent },
  knob: {
    position: 'absolute',
    top: 2,
    left: 2,
    width: 27,
    height: 27,
    borderRadius: 13.5,
    backgroundColor: colors.bg,
    boxShadow: shadow.knob,
  },
});
