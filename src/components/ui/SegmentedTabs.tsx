import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { colors, duration, ease, fonts, shadow } from '../../theme';
import { useReduceMotion } from './motion';

type TabsProps = {
  tabs: string[];
  index: number;
  onChange: (index: number) => void;
  style?: StyleProp<ViewStyle>;
};

function useSlide(index: number) {
  const x = useRef(new Animated.Value(index)).current;
  const reduce = useReduceMotion();
  useEffect(() => {
    const anim = Animated.timing(x, {
      toValue: index,
      duration: reduce ? 0 : duration.thumb,
      easing: ease.smooth,
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [index, reduce, x]);
  return x;
}

/**
 * Underline tabs (profile Posts / Photos / About, SPEC 3.13): equal
 * columns, labels 46 tall 14.5/600, #2F5BD3 active / #71717A, a 1px
 * #F0F0F2 bottom border, and a 48x2.5 accent bar that slides 450 ms smooth.
 */
export function SegmentedTabs({ tabs, index, onChange, style }: TabsProps) {
  const [width, setWidth] = useState(0);
  const slide = useSlide(index);
  const col = width / Math.max(1, tabs.length);
  return (
    <View
      style={[styles.tabs, style]}
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
      accessibilityRole="tablist"
    >
      {tabs.map((label, i) => (
        <Pressable
          key={label}
          onPress={() => onChange(i)}
          style={styles.tab}
          accessibilityRole="tab"
          accessibilityState={{ selected: i === index }}
          accessibilityLabel={label}
        >
          <Text
            style={[
              styles.tabLabel,
              { color: i === index ? colors.accent : colors.muted },
            ]}
          >
            {label}
          </Text>
        </Pressable>
      ))}
      {width > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.indicator,
            {
              width: col,
              transform: [
                {
                  translateX: slide.interpolate({
                    inputRange: [0, Math.max(1, tabs.length - 1)],
                    outputRange: [0, col * Math.max(1, tabs.length - 1)],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.bar} />
        </Animated.View>
      ) : null}
    </View>
  );
}

/**
 * Pill segmented control (Brief Today / This week, SPEC 3.12): height 38,
 * padding 3, radius 12, #F4F4F5; white thumb r9 h32 with the `thumb`
 * shadow, sliding 450 ms smooth; labels 14/600 ink.
 */
export function SegmentedControl({ tabs, index, onChange, style }: TabsProps) {
  const [width, setWidth] = useState(0);
  const slide = useSlide(index);
  const n = Math.max(1, tabs.length);
  const thumbW = width ? width / n - 3 : 0;
  return (
    <View
      style={[styles.track, style]}
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
      accessibilityRole="tablist"
    >
      {width > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.thumb,
            {
              width: thumbW,
              transform: [
                {
                  translateX: slide.interpolate({
                    inputRange: [0, Math.max(1, n - 1)],
                    outputRange: [0, thumbW * Math.max(1, n - 1)],
                  }),
                },
              ],
            },
          ]}
        />
      ) : null}
      {tabs.map((label, i) => (
        <Pressable
          key={label}
          onPress={() => onChange(i)}
          style={styles.segment}
          accessibilityRole="tab"
          accessibilityState={{ selected: i === index }}
          accessibilityLabel={label}
          hitSlop={{ top: 3, bottom: 3 }}
        >
          <Text style={styles.segmentLabel}>{label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  tab: { flex: 1, height: 46, alignItems: 'center', justifyContent: 'center' },
  tabLabel: { fontFamily: fonts.semibold, fontSize: 14.5 },
  indicator: {
    position: 'absolute',
    left: 0,
    bottom: -1,
    height: 2.5,
    alignItems: 'center',
  },
  bar: {
    width: 48,
    height: '100%',
    borderRadius: 2,
    backgroundColor: colors.accent,
  },
  track: {
    height: 38,
    padding: 3,
    borderRadius: 12,
    backgroundColor: colors.fill,
    flexDirection: 'row',
  },
  thumb: {
    position: 'absolute',
    top: 3,
    left: 3,
    height: 32,
    borderRadius: 9,
    backgroundColor: colors.bg,
    boxShadow: shadow.thumb,
  },
  segment: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  segmentLabel: { fontFamily: fonts.semibold, fontSize: 14, color: colors.ink },
});
