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
import { PressableScale } from './PressableScale';
import { Toggle } from './Toggle';

/**
 * A white rounded group of rows (Settings HARBOR AI / PRIVACY): margin
 * 0 16, radius 18, #FFFFFF, clipped. Give the last row `last`.
 */
export function ListGroup({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.group, style]}>{children}</View>;
}

export type ListRowProps = {
  label: string;
  /** Leading icon, 21 #52525B. */
  icon?: IconName;
  /** Trailing value, #71717A ("Friends", "2"). */
  value?: string;
  /** Trailing caret-right #A1A1AA. Default true. */
  chevron?: boolean;
  onPress?: () => void;
  /** Drops the 1px #F0F0F2 bottom border. */
  last?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Settings row (SPEC 3.14 PRIVACY): padding 14, gap 12, 15px label. */
export function ListRow({
  label,
  icon,
  value,
  chevron = true,
  onPress,
  last = false,
  style,
}: ListRowProps) {
  const content = (
    <>
      {icon ? <Icon name={icon} size={21} color={colors.sub} /> : null}
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
      {value ? <Text style={styles.value}>{value}</Text> : null}
      {chevron ? (
        <Icon name="caret-right" size={16} color={colors.faint} />
      ) : null}
    </>
  );
  const rowStyle = [styles.row, !last && styles.divider, style];
  if (!onPress) {
    return (
      <View
        style={rowStyle}
        accessible
        accessibilityLabel={value ? `${label}, ${value}` : label}
      >
        {content}
      </View>
    );
  }
  return (
    <PressableScale
      onPress={onPress}
      pressedScale={1}
      pressedBg={colors.pressed}
      accessibilityLabel={value ? `${label}, ${value}` : label}
      style={rowStyle}
    >
      {content}
    </PressableScale>
  );
}

export type ToggleRowProps = {
  label: string;
  sub?: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
  last?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * Settings AI row (SPEC 3.14): padding 13 14, gap 12; label 15/500, sub 13
 * #71717A (margin-top 1, lh 1.35); the whole row toggles.
 */
export function ToggleRow({
  label,
  sub,
  value,
  onValueChange,
  last = false,
  style,
}: ToggleRowProps) {
  return (
    <PressableScale
      onPress={() => onValueChange(!value)}
      pressedScale={1}
      pressedBg={colors.pressed}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={label}
      accessibilityHint={sub}
      style={[styles.toggleRow, !last && styles.divider, style]}
    >
      <View style={styles.text}>
        <Text style={styles.toggleLabel}>{label}</Text>
        {sub ? <Text style={styles.sub}>{sub}</Text> : null}
      </View>
      <Toggle value={value} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  group: {
    marginHorizontal: 16,
    borderRadius: 18,
    backgroundColor: colors.bg,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    backgroundColor: colors.bg,
  },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.hairline },
  label: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.ink,
  },
  value: { fontFamily: fonts.regular, fontSize: 15, color: colors.muted },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 14,
    backgroundColor: colors.bg,
  },
  text: { flex: 1 },
  toggleLabel: { fontFamily: fonts.medium, fontSize: 15, color: colors.ink },
  sub: {
    marginTop: 1,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 17.55,
    color: colors.muted,
  },
});
