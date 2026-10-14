import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { VignetteBlur } from './VignetteBlur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, type } from '../../theme';
import { IconButton } from './IconButton';

type CommonProps = {
  /** Shows the back button (caret-left 24 in a 44 box). */
  onBack?: () => void;
  /** Spoken name of the back button. Default "Back". */
  backLabel?: string;
  /** Right-hand action(s): an IconButton, a text Button, a row of them. */
  right?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export type CompactHeaderProps = CommonProps & {
  variant: 'compact';
  /** 17/600 nav title ("{First}'s post"). */
  title?: string;
  /** Custom middle content instead of the title (chat: avatar + name). */
  children?: React.ReactNode;
  /**
   * Bar height below the safe area: 48 (post, 98 in the design) or 54
   * (chat, 104). Default 48.
   */
  barHeight?: number;
  /** Bottom hairline rgba(24,24,27,.05). Default true. */
  hairline?: boolean;
  /** Back button width: 44 (default) or 40 (chat, 40x44). */
  backWidth?: number;
  /** Gap between the bar's items: 2 (default) or 6 (chat). */
  gap?: number;
  /** Position absolutely over scrolling content. Default true. */
  floating?: boolean;
};

export type LargeHeaderProps = CommonProps & {
  variant: 'large';
  /** 32/700 large title ("Messages", "Notifications", "Menu"). */
  title: string;
  /** Inline before the title (Brief's 36px sparkle square). */
  leading?: React.ReactNode;
  /**
   * Add the status-bar inset on top. Default true: large headers sit at the
   * top of a scroll view.
   */
  safeTop?: boolean;
};

export type HeaderProps = CompactHeaderProps | LargeHeaderProps;

/**
 * Screen headers (SPEC 4.2).
 *
 * - `compact`: the translucent fixed bar of Post and Chat. DECISIONS #1:
 *   no blur package, so it is rgba(255,255,255,.86) plus a hairline.
 *   Content scrolls under it; pad your scroll by `insets.top + barHeight`.
 * - `large`: no bar. An optional 44px icon row (back / right action, padding
 *   4 8 0) and the 32/700 large title (padding 0 16; 10 16 0 when there is
 *   no icon row). Put it inside the ScrollView so it scrolls away.
 */
export function Header(props: HeaderProps) {
  const insets = useSafeAreaInsets();
  const backWidth =
    props.variant === 'compact' ? props.backWidth ?? 44 : undefined;
  const back = props.onBack ? (
    <IconButton
      icon="caret-left"
      iconSize={24}
      width={backWidth}
      accessibilityLabel={props.backLabel ?? 'Back'}
      onPress={props.onBack}
    />
  ) : null;

  if (props.variant === 'compact') {
    const {
      title,
      children,
      barHeight = 48,
      hairline = true,
      floating = true,
      gap = 2,
      right,
      style,
    } = props;
    return (
      <View
        style={[
          styles.compact,
          {
            paddingTop: insets.top,
            height: insets.top + barHeight,
            gap,
          },
          hairline ? styles.hairline : null,
          floating ? styles.floating : null,
          style,
        ]}
      >
        {floating ? (
          // Translucent bar: content scrolls under a real blur (iOS-style).
          <VignetteBlur
            edge="full"
            tint={0.72}
            style={StyleSheet.absoluteFill}
          />
        ) : null}
        {back}
        <View style={styles.middle}>
          {children ??
            (title ? (
              <Text
                style={type.navTitle}
                numberOfLines={1}
                accessibilityRole="header"
              >
                {title}
              </Text>
            ) : null)}
        </View>
        {right ? <View style={styles.right}>{right}</View> : null}
      </View>
    );
  }

  const { title, leading, safeTop = true, right, style } = props;
  const hasRow = !!back || !!right;
  return (
    <View style={[safeTop ? { paddingTop: insets.top } : null, style]}>
      {hasRow ? (
        <View style={styles.iconRow}>
          {back ?? <View />}
          {right ? <View style={styles.right}>{right}</View> : null}
        </View>
      ) : null}
      <View style={[styles.titleRow, !hasRow && styles.titleRowTop]}>
        {leading}
        <Text style={type.largeTitle} accessibilityRole="header">
          {title}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  compact: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    backgroundColor: colors.barFallback,
  },
  hairline: { borderBottomWidth: 1, borderBottomColor: colors.ring05 },
  floating: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    backgroundColor: 'transparent',
  },
  middle: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  right: { flexDirection: 'row', alignItems: 'center' },
  iconRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
    paddingHorizontal: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
  },
  titleRowTop: { paddingTop: 10 },
});
