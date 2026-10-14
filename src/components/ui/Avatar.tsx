import React, { useState } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { colors, fonts } from '../../theme';

export type AvatarProps = {
  /** Photo URL. Without one (or if it fails) initials show on #E4E4E7. */
  uri?: string;
  /** Used for the initials fallback and the accessibility label. */
  name?: string;
  /** Diameter: 18 / 20 / 22 / 26 / 30 / 34 / 36 / 38 / 40 / 44 / 48 / 50 / 54 / 56 / 58 / 72 / 104. */
  size?: number;
  /**
   * Feed story-card avatar: 3px border, #2F5BD3 unseen / #D4D4D8 seen
   * (inside the size, border-box).
   */
  story?: 'unseen' | 'seen';
  /** Border inside the size (border-box): profile 4px white, onboarding 5-6px white. */
  border?: { width: number; color: string };
  /**
   * Outer ring that takes no layout (CSS `0 0 0 Npx C`): story header
   * `{width: 2, color: 'rgba(255,255,255,.9)'}`, active tab `{2, '#18181B'}`.
   */
  ring?: { width: number; color: string };
  /** Online dot: 'lg' 15px / 3px white border at right 1 bottom 1; 'sm' 12px / 2px at right 0 bottom 0. */
  online?: 'lg' | 'sm';
  style?: StyleProp<ViewStyle>;
  /** Default: decorative (hidden from screen readers). */
  accessible?: boolean;
};

function initialsOf(name: string | undefined) {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  const letters =
    parts.length > 1 ? [parts[0], parts[parts.length - 1]] : parts;
  return letters.map(p => p.charAt(0).toUpperCase()).join('') || '?';
}

/** Round photo avatar with initials fallback, story border, ring and online dot. */
export function Avatar({
  uri,
  name,
  size = 40,
  story,
  border,
  ring,
  online,
  style,
  accessible = false,
}: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const showPhoto = !!uri && !failed;
  const edge = story
    ? { width: 3, color: story === 'unseen' ? colors.accent : colors.border }
    : border;
  const dot =
    online === 'lg'
      ? { size: 15, border: 3, offset: 1 }
      : online === 'sm'
      ? { size: 12, border: 2, offset: 0 }
      : null;

  return (
    <View
      style={[{ width: size, height: size }, style]}
      accessible={accessible}
      accessibilityLabel={accessible ? name : undefined}
      accessibilityRole={accessible ? 'image' : undefined}
      importantForAccessibility={accessible ? 'auto' : 'no-hide-descendants'}
    >
      <View
        style={[
          styles.circle,
          { width: size, height: size, borderRadius: size / 2 },
          edge ? { borderWidth: edge.width, borderColor: edge.color } : null,
          ring ? { boxShadow: `0 0 0 ${ring.width}px ${ring.color}` } : null,
        ]}
      >
        {showPhoto ? (
          <Image
            source={{ uri }}
            style={styles.fill}
            resizeMode="cover"
            onError={() => setFailed(true)}
          />
        ) : (
          <Text
            style={[styles.initials, { fontSize: Math.max(9, size * 0.36) }]}
            numberOfLines={1}
          >
            {initialsOf(name)}
          </Text>
        )}
      </View>
      {dot ? (
        <View
          style={[
            styles.dot,
            {
              width: dot.size,
              height: dot.size,
              borderRadius: dot.size / 2,
              borderWidth: dot.border,
              right: dot.offset,
              bottom: dot.offset,
            },
          ]}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    overflow: 'hidden',
    backgroundColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fill: { width: '100%', height: '100%' },
  initials: { fontFamily: fonts.semibold, color: colors.muted },
  dot: {
    position: 'absolute',
    backgroundColor: colors.online,
    borderColor: colors.bg,
  },
});
