import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { colors, fonts, shadow } from '../../theme';
import { Icon, type IconName, type IconWeight } from '../Icon';
import { PressableScale } from './PressableScale';

export type ButtonVariant =
  /** #2F5BD3 fill, white text, top highlight. Disabled: #F4F4F5 / #A1A1AA. */
  | 'primary'
  /** 1.5px #E4E4E7 border, ink text (social sign-in). */
  | 'outline'
  /** #F4F4F5 fill, ink text (profile Share, notification Delete). */
  | 'soft'
  /** #F4F4F5 fill, #52525B text ("Requested", "Joined"). */
  | 'muted'
  /** #EEF2FD fill, #2447AE text ("Add friend"). */
  | 'tint'
  /** White fill, #DC2626 text ("Log out"). */
  | 'dangerText'
  /** No fill, #3F3F46 text (onboarding "I already have an account"). */
  | 'ghost'
  /** No fill, #2F5BD3 text ("Forgot password?", "Mark all read", "See all"). */
  | 'link'
  /** White fill, #2447AE text, 1px #DCE3F8 ring (Brief card "Refresh"). */
  | 'ai';

/**
 * Height / radius / type / press presets from the design:
 * - `pill` 56 r999 16/600 ls -0.16 (onboarding primary, press .98)
 * - `lg` 54 r16 16/600 (auth primary, press .98)
 * - `social` 52 r16 15/600, icon 20 gap 10 (Google, press .98)
 * - `block` 50 r16 15.5/600 (Log out, press .98)
 * - `md` 40 r12 14.5/600, icon gap 6 (profile buttons, press .97)
 * - `confirm` 36 r11 14/600 (notification Confirm / Delete, press .97)
 * - `sm` 34 r11 13.5/600 p0 14 (Add friend, Reply, press .95)
 * - `xs` 32 r10 13/600 p0 13 (Join, Refresh, press .95)
 * - `ghostLg` 44 15/500 (onboarding secondary)
 * - `text` 44 tall, padding 0 4, 14/600 (text links; pair with variant
 *   'link'; override the size with `labelStyle`, e.g. 14.5 for "Mark all read")
 */
export type ButtonSize =
  | 'pill'
  | 'lg'
  | 'social'
  | 'block'
  | 'md'
  | 'confirm'
  | 'sm'
  | 'xs'
  | 'ghostLg'
  | 'text';

type SizeSpec = {
  height: number;
  radius: number;
  padH: number;
  font: string;
  fontSize: number;
  letterSpacing?: number;
  gap: number;
  icon: number;
  press: number;
};

const SIZES: Record<ButtonSize, SizeSpec> = {
  pill: {
    height: 56,
    radius: 999,
    padH: 20,
    font: fonts.semibold,
    fontSize: 16,
    letterSpacing: -0.16,
    gap: 8,
    icon: 20,
    press: 0.98,
  },
  lg: {
    height: 54,
    radius: 16,
    padH: 20,
    font: fonts.semibold,
    fontSize: 16,
    gap: 8,
    icon: 20,
    press: 0.98,
  },
  social: {
    height: 52,
    radius: 16,
    padH: 16,
    font: fonts.semibold,
    fontSize: 15,
    gap: 10,
    icon: 20,
    press: 0.98,
  },
  block: {
    height: 50,
    radius: 16,
    padH: 16,
    font: fonts.semibold,
    fontSize: 15.5,
    gap: 8,
    icon: 20,
    press: 0.98,
  },
  md: {
    height: 40,
    radius: 12,
    padH: 14,
    font: fonts.semibold,
    fontSize: 14.5,
    gap: 6,
    icon: 18,
    press: 0.97,
  },
  confirm: {
    height: 36,
    radius: 11,
    padH: 14,
    font: fonts.semibold,
    fontSize: 14,
    gap: 6,
    icon: 16,
    press: 0.97,
  },
  sm: {
    height: 34,
    radius: 11,
    padH: 14,
    font: fonts.semibold,
    fontSize: 13.5,
    gap: 6,
    icon: 16,
    press: 0.95,
  },
  xs: {
    height: 32,
    radius: 10,
    padH: 13,
    font: fonts.semibold,
    fontSize: 13,
    gap: 6,
    icon: 16,
    press: 0.95,
  },
  ghostLg: {
    height: 44,
    radius: 12,
    padH: 12,
    font: fonts.medium,
    fontSize: 15,
    gap: 6,
    icon: 18,
    press: 0.98,
  },
  text: {
    height: 44,
    radius: 10,
    padH: 4,
    font: fonts.semibold,
    fontSize: 14,
    gap: 5,
    icon: 16,
    press: 0.97,
  },
};

const VARIANTS: Record<
  ButtonVariant,
  { bg: string; fg: string; border?: string; ring?: string }
> = {
  primary: { bg: colors.accent, fg: colors.onAccent },
  outline: { bg: colors.bg, fg: colors.ink, border: colors.line },
  soft: { bg: colors.fill, fg: colors.ink },
  muted: { bg: colors.fill, fg: colors.sub },
  tint: { bg: colors.accentSoft, fg: colors.accentInk },
  dangerText: { bg: colors.bg, fg: colors.danger },
  ghost: { bg: 'transparent', fg: colors.inkSoft },
  link: { bg: 'transparent', fg: colors.accent },
  ai: { bg: colors.bg, fg: colors.accentInk, ring: shadow.ringAiChip },
};

export type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  iconWeight?: IconWeight;
  /** Icon size; defaults to the size preset's (e.g. 16 for 'xs'). */
  iconSize?: number;
  /** Icon before (default) or after the label ("Full brief" arrow). */
  iconPosition?: 'left' | 'right';
  /** Shows `loadingLabel` (or the label) at opacity .7 and ignores taps. */
  loading?: boolean;
  loadingLabel?: string;
  /** Primary turns #F4F4F5 / #A1A1AA; other variants fade to .5. */
  disabled?: boolean;
  /** flex: 1 inside a row. */
  flex?: boolean;
  /**
   * The primary inset top highlight (default true). Pass false where the
   * design has a flat primary (Explore Join, Brief Reply, Edit profile).
   */
  highlight?: boolean;
  /** Overrides the size preset's pressed scale (Refresh .96). */
  pressedScale?: number;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'lg',
  icon,
  iconWeight = 'regular',
  iconSize,
  iconPosition = 'left',
  loading = false,
  loadingLabel,
  disabled = false,
  flex = false,
  highlight = true,
  pressedScale,
  style,
  labelStyle,
  accessibilityLabel,
  accessibilityHint,
  testID,
}: ButtonProps) {
  const s = SIZES[size];
  const v = VARIANTS[variant];
  const off = disabled && variant === 'primary';
  const bg = off ? colors.fill : v.bg;
  const fg = off ? colors.faint : v.fg;
  const slop = s.height < 44 ? (44 - s.height) / 2 : 0;
  const iconEl = icon ? (
    <Icon
      name={icon}
      weight={iconWeight}
      size={iconSize ?? s.icon}
      color={fg}
    />
  ) : null;

  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled || loading}
      pressedScale={pressedScale ?? s.press}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      testID={testID}
      hitSlop={slop ? { top: slop, bottom: slop } : undefined}
      style={[
        styles.base,
        {
          height: s.height,
          borderRadius: s.radius,
          paddingHorizontal: s.padH,
          gap: s.gap,
          backgroundColor: bg,
        },
        v.border ? [styles.outline, { borderColor: v.border }] : null,
        variant === 'primary' && !off && highlight ? styles.highlight : null,
        v.ring ? { boxShadow: v.ring } : null,
        flex ? styles.flex : null,
        loading ? styles.loading : null,
        disabled && variant !== 'primary' ? styles.dim : null,
        style,
      ]}
    >
      {iconPosition === 'left' ? iconEl : null}
      <Text
        numberOfLines={1}
        style={[
          {
            fontFamily: s.font,
            fontSize: s.fontSize,
            letterSpacing: s.letterSpacing,
            color: fg,
          },
          labelStyle,
        ]}
      >
        {loading && loadingLabel ? loadingLabel : label}
      </Text>
      {iconPosition === 'right' ? iconEl : null}
    </PressableScale>
  );
}

/** A row of equal buttons (Confirm / Delete, Edit profile / Share). */
export function ButtonRow({
  children,
  gap = 8,
  style,
}: {
  children: React.ReactNode;
  gap?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.row, { gap }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: { flex: 1 },
  outline: { borderWidth: 1.5 },
  loading: { opacity: 0.7 },
  dim: { opacity: 0.5 },
  highlight: { boxShadow: shadow.btnHighlight },
  row: { flexDirection: 'row' },
});
