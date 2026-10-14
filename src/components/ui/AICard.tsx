import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type DimensionValue,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { colors, fonts, radius as radii } from '../../theme';
import { Icon } from '../Icon';
import { ShimmerLines } from './Shimmer';
import { TypingDots } from './TypingDots';

export type SparkleBadgeProps = {
  /** 'circle' (28 onboarding / 32 feed Brief) or 'square' (36 r12, Brief title). */
  shape?: 'circle' | 'square';
  /** Default 32 (circle) / 36 (square). */
  size?: number;
};

/** #2F5BD3 circle or rounded square holding a white fill sparkle. */
export function SparkleBadge({ shape = 'circle', size }: SparkleBadgeProps) {
  const s = size ?? (shape === 'square' ? 36 : 32);
  const icon = shape === 'square' ? 20 : s === 28 ? 15 : 17;
  return (
    <View
      style={[
        styles.badge,
        shape === 'square' ? styles.square : styles.circle,
        { width: s, height: s },
      ]}
    >
      <Icon name="sparkle" weight="fill" size={icon} color={colors.onAccent} />
    </View>
  );
}

export type AICardProps = {
  /** Header label ("Comment summary", "Polish with Harbor", "Harbor Brief"). */
  title?: string;
  /** Header line under the title (badge style) or after it (inline style). */
  subtitle?: string;
  /**
   * 'inline': sparkle fill 17 #2F5BD3 + 13.5/600 title (comment summary,
   * polish). 'badge': 32 SparkleBadge + 15/600 title over a 12.5 #52525B
   * subtitle (feed Brief). 'none': no header. Default 'inline'.
   */
  header?: 'inline' | 'badge' | 'none';
  /** Right side of the header (refresh button, caret, "Only you see drafts"). */
  right?: React.ReactNode;
  /** Title text overrides (the Create polish card's title is 14). */
  titleStyle?: StyleProp<TextStyle>;
  /**
   * Makes the whole header one button (the feed Brief's collapse toggle).
   * `expanded` is announced as the accessibility state.
   */
  headerPress?: {
    onPress: () => void;
    accessibilityLabel: string;
    accessibilityHint?: string;
    expanded?: boolean;
  };
  /** Shows shimmer lines instead of the body. */
  loading?: boolean;
  /** Widths of the loading lines. Default ['100%','72%'] (height 11, gap 8). */
  loadingLines?: DimensionValue[];
  /** Shows typing dots instead of the body (when not loading). */
  typing?: boolean;
  /** Corner radius: 20 (default), 22 feed Brief, 18 notification summary. */
  radius?: number;
  /** Default 13 / 14 (padding 13 14). */
  padding?: {
    vertical?: number;
    horizontal?: number;
    top?: number;
    bottom?: number;
  };
  /** Headerless row layout (notification summary: sparkle + text). */
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

/**
 * The pale cobalt AI surface (SPEC 5): #F5F7FE, 1px #E1E8FB ring, radius
 * 20. Header carries the sparkle label; body shows shimmer while loading or
 * typing dots while "thinking".
 */
export function AICard({
  title,
  subtitle,
  header = 'inline',
  right,
  titleStyle,
  headerPress,
  loading = false,
  loadingLines = ['100%', '72%'],
  typing = false,
  radius = 20,
  padding,
  children,
  style,
}: AICardProps) {
  const pv = padding?.vertical ?? 13;
  const ph = padding?.horizontal ?? 14;
  // Header text never wraps at 320-360: the title keeps its width, the
  // subtitle shrinks and ends in an ellipsis.
  const inlineHeader =
    header === 'inline' && (title || right) ? (
      <View style={styles.inlineHeader}>
        <Icon name="sparkle" weight="fill" size={17} color={colors.accent} />
        {title ? (
          <Text style={[styles.inlineTitle, titleStyle]} numberOfLines={1}>
            {title}
          </Text>
        ) : null}
        {subtitle ? (
          <Text style={styles.inlineSub} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
        {right ? <View style={styles.right}>{right}</View> : null}
      </View>
    ) : null;
  const badgeHeader =
    header === 'badge' ? (
      <View style={styles.badgeHeader}>
        <SparkleBadge />
        <View style={styles.flex}>
          {title ? (
            <Text style={[styles.badgeTitle, titleStyle]} numberOfLines={1}>
              {title}
            </Text>
          ) : null}
          {subtitle ? (
            <Text style={styles.badgeSub} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {right}
      </View>
    ) : null;
  const headerNode = inlineHeader ?? badgeHeader;
  return (
    <View
      style={[
        styles.card,
        {
          borderRadius: radius,
          paddingTop: padding?.top ?? pv,
          paddingBottom: padding?.bottom ?? pv,
          paddingHorizontal: ph,
        },
        style,
      ]}
    >
      {headerNode && headerPress ? (
        <Pressable
          onPress={headerPress.onPress}
          accessibilityRole="button"
          accessibilityLabel={headerPress.accessibilityLabel}
          accessibilityHint={headerPress.accessibilityHint}
          accessibilityState={
            headerPress.expanded === undefined
              ? undefined
              : { expanded: headerPress.expanded }
          }
        >
          {headerNode}
        </Pressable>
      ) : (
        headerNode
      )}
      {loading ? (
        <ShimmerLines widths={loadingLines} height={11} gap={8} />
      ) : typing ? (
        <TypingDots bubble={false} />
      ) : (
        children
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.aiSurface,
    borderWidth: 1,
    borderColor: colors.aiBorder,
  },
  badge: {
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: { borderRadius: radii.pill },
  square: { borderRadius: 12 },
  inlineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  inlineTitle: {
    flexShrink: 0,
    fontFamily: fonts.semibold,
    fontSize: 13.5,
    color: colors.ink,
  },
  inlineSub: {
    flexShrink: 1,
    fontFamily: fonts.regular,
    fontSize: 12.5,
    color: colors.muted,
  },
  right: { marginLeft: 'auto', flexShrink: 0 },
  badgeHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  flex: { flex: 1 },
  badgeTitle: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    letterSpacing: -0.15,
    color: colors.ink,
  },
  badgeSub: { fontFamily: fonts.regular, fontSize: 12.5, color: colors.sub },
});
