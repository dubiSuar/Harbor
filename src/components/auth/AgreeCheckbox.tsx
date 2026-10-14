import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { colors, duration, ease, fonts } from '../../theme';
import { Icon, PressableScale, useReduceMotion } from '../ui';

type Props = {
  checked: boolean;
  error?: boolean;
  onToggle: () => void;
  label: string;
};

/**
 * Register terms row (SPEC 3.03): the whole row toggles. Box 22x22 r7,
 * 1.5px border (#2F5BD3 checked, #DC2626 errored, else #D4D4D8), white or
 * #2F5BD3 fill with a white `check` 13. The design's `all .2s` is an
 * opacity cross-fade of the blue layer.
 */
export function AgreeCheckbox({ checked, error, onToggle, label }: Props) {
  const reduce = useReduceMotion();
  const on = useRef(new Animated.Value(checked ? 1 : 0)).current;
  useEffect(() => {
    const anim = Animated.timing(on, {
      toValue: checked ? 1 : 0,
      duration: reduce ? 0 : duration.chip,
      easing: ease.css,
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [checked, on, reduce]);

  return (
    <PressableScale
      onPress={onToggle}
      pressedScale={1}
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked }}
      style={styles.row}
    >
      <View
        style={[
          styles.box,
          { borderColor: error && !checked ? colors.danger : colors.border },
        ]}
      >
        <Animated.View style={[styles.fill, { opacity: on }]}>
          <Icon name="check" size={13} color={colors.onAccent} />
        </Animated.View>
      </View>
      <Text style={styles.text}>{label}</Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    minHeight: 44,
  },
  box: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1.5,
    backgroundColor: colors.bg,
  },
  // Covers the border too, so a checked box reads as solid #2F5BD3.
  fill: {
    position: 'absolute',
    top: -1.5,
    left: -1.5,
    right: -1.5,
    bottom: -1.5,
    borderRadius: 7,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20.3,
    color: colors.sub,
  },
});
