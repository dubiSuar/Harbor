import React from 'react';
import {
  Animated,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { colors } from '../../theme';

const TRACK = 'rgba(255,255,255,0.35)';

/**
 * Story progress bars (SPEC 3.07): one per story, flex 1, h3 r2, track
 * rgba(255,255,255,.35), white fill scaled on X from the left. Past
 * stories are full, later ones empty, the current one follows `progress`
 * (0..1, native-driven).
 */
export function StoryProgress({
  count,
  index,
  progress,
  style,
}: {
  count: number;
  index: number;
  progress: Animated.Value;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      style={[styles.row, style]}
      pointerEvents="none"
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`Story ${index + 1} of ${count}`}
    >
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={styles.track}>
          {i === index ? (
            <Animated.View
              style={[styles.fill, { transform: [{ scaleX: progress }] }]}
            />
          ) : i < index ? (
            <View style={styles.fill} />
          ) : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 4 },
  track: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: TRACK,
  },
  fill: {
    height: '100%',
    width: '100%',
    backgroundColor: colors.bg,
    transformOrigin: 'left',
  },
});
