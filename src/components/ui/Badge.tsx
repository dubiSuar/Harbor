import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { colors, fonts } from '../../theme';
import { Icon, type IconName } from '../Icon';

export type UnreadDotProps = {
  /** Default 10 (chat list). The messages-button dot is 9 with `ring`. */
  size?: number;
  /** 2px white border, drawn outside `size` (content-box: 9 + 4 = 13). */
  ring?: boolean;
  color?: string;
  style?: StyleProp<ViewStyle>;
};

/** #2F5BD3 unread dot. */
export function UnreadDot({
  size = 10,
  ring = false,
  color = colors.accent,
  style,
}: UnreadDotProps) {
  const total = ring ? size + 4 : size;
  return (
    <View
      style={[
        {
          width: total,
          height: total,
          borderRadius: total / 2,
          backgroundColor: color,
        },
        ring ? styles.ring : null,
        style,
      ]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}

export type BadgeProps = {
  label: string;
  /**
   * 'scrim': photo-count badge (p 4 9, r999, rgba(24,24,27,.6), white
   * 12/600). 'count': accent pill with a white number (11.5/600, min 18).
   */
  tone?: 'scrim' | 'count';
  style?: StyleProp<ViewStyle>;
};

/** Small text badge ("3 photos", counts). */
export function Badge({ label, tone = 'scrim', style }: BadgeProps) {
  return (
    <View style={[tone === 'scrim' ? styles.scrim : styles.count, style]}>
      <Text style={tone === 'scrim' ? styles.scrimText : styles.countText}>
        {label}
      </Text>
    </View>
  );
}

export type IconBadgeProps = {
  icon: IconName;
  /** Default 24 (notification kind badge). */
  size?: number;
  /** Default 12. */
  iconSize?: number;
  /** White border. Default 2.5. */
  borderWidth?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * Accent circle with a white fill icon and a white border (notification
 * kind badge at right -3 / bottom -3 of a 54 avatar; the create-story plus).
 */
export function IconBadge({
  icon,
  size = 24,
  iconSize = 12,
  borderWidth = 2.5,
  color = colors.accent,
  style,
}: IconBadgeProps) {
  return (
    <View
      style={[
        styles.iconBadge,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth,
          backgroundColor: color,
        },
        style,
      ]}
    >
      <Icon name={icon} weight="fill" size={iconSize} color={colors.onAccent} />
    </View>
  );
}

const styles = StyleSheet.create({
  ring: { borderWidth: 2, borderColor: colors.bg },
  scrim: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 999,
    backgroundColor: colors.scrim60,
  },
  scrimText: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.onAccent,
  },
  count: {
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    borderRadius: 9,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    fontFamily: fonts.semibold,
    fontSize: 11.5,
    color: colors.onAccent,
  },
  iconBadge: {
    borderColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
