import React from 'react';
import { StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';
import { colors, fonts } from '../../theme';
import { Icon, type IconName } from '../Icon';
import { PressableScale } from './PressableScale';

export type ChipVariant =
  /** Explore topics: h34 r17 p0 14 13.5/600; selected #18181B / white, else #F4F4F5 / #3F3F46. */
  | 'topic'
  /** AI suggestions: #F5F7FE + 1px #DCE3F8, #2447AE 13.5/500. h34 r17 (Ask) or `compact` h32 r16 (smart replies). */
  | 'ai'
  /** Polish tones: h34 r11 p0 13, white + 1px #DCE3F8, #2447AE 13.5/600, icon 16 gap 6. */
  | 'tone'
  /** Create audience: h26 r8 p0 10, #EEF2FD, #2447AE 12.5/600, gap 5, trailing caret-down. */
  | 'audience';

export type ChipProps = {
  label: string;
  onPress?: () => void;
  variant?: ChipVariant;
  /** topic: selected state. */
  selected?: boolean;
  /** Leading icon (tone, audience). */
  icon?: IconName;
  /** ai: the 32-tall smart-reply size. */
  compact?: boolean;
  /** tone: fade to .5 while another tone runs. */
  dimmed?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

export function Chip({
  label,
  onPress,
  variant = 'topic',
  selected = false,
  icon,
  compact = false,
  dimmed = false,
  disabled,
  style,
  accessibilityLabel,
}: ChipProps) {
  let box: ViewStyle;
  let fg: string;
  let font: string = fonts.semibold;
  let fontSize = 13.5;
  let press = 0.95;
  switch (variant) {
    case 'topic':
      box = {
        height: 34,
        borderRadius: 17,
        paddingHorizontal: 14,
        backgroundColor: selected ? colors.ink : colors.fill,
      };
      fg = selected ? colors.onAccent : colors.inkSoft;
      press = 0.96;
      break;
    case 'ai':
      box = {
        height: compact ? 32 : 34,
        borderRadius: compact ? 16 : 17,
        paddingHorizontal: 13,
        backgroundColor: colors.aiSurface,
        borderWidth: 1,
        borderColor: colors.aiChipBorder,
      };
      fg = colors.accentInk;
      font = fonts.medium;
      press = compact ? 0.95 : 0.96;
      break;
    case 'tone':
      box = {
        height: 34,
        borderRadius: 11,
        paddingHorizontal: 13,
        backgroundColor: colors.bg,
        borderWidth: 1,
        borderColor: colors.aiChipBorder,
        gap: 6,
      };
      fg = colors.accentInk;
      break;
    case 'audience':
      box = {
        height: 26,
        borderRadius: 8,
        paddingHorizontal: 10,
        backgroundColor: colors.accentSoft,
        gap: 5,
      };
      fg = colors.accentInk;
      fontSize = 12.5;
      break;
  }
  const iconSize = variant === 'audience' ? 14 : 16;
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      pressedScale={press}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{
        selected: variant === 'topic' ? selected : undefined,
        disabled: !!disabled,
      }}
      hitSlop={{ top: 6, bottom: 6 }}
      style={[styles.base, box, dimmed ? styles.dimmed : null, style]}
    >
      {icon ? <Icon name={icon} size={iconSize} color={fg} /> : null}
      <Text numberOfLines={1} style={{ fontFamily: font, fontSize, color: fg }}>
        {label}
      </Text>
      {variant === 'audience' ? (
        <Icon name="caret-down" size={12} color={fg} />
      ) : null}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  dimmed: { opacity: 0.5 },
});
