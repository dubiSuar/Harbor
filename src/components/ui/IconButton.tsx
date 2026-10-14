import React from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { colors } from '../../theme';
import { Icon, type IconName, type IconWeight } from '../Icon';
import { PressableScale } from './PressableScale';

export type IconButtonProps = {
  icon: IconName;
  /** Required: icon-only controls need a spoken name. */
  accessibilityLabel: string;
  onPress?: () => void;
  weight?: IconWeight;
  /** Icon size (the design's font-size). Default 24. */
  iconSize?: number;
  color?: string;
  /** Box height (and width unless `width`). Default 44. */
  size?: number;
  /** Override width (e.g. the 40x44 chat back button). */
  width?: number;
  /** Background fill (white header pill, accent send). Default none. */
  background?: string;
  /** Default: a circle when there is a background, else square. */
  radius?: number;
  pressedScale?: number;
  pressedBg?: string;
  pressedRotate?: number;
  /** Spring press curve (send buttons, like). */
  spring?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Extra content (a badge or dot) positioned over the icon. */
  children?: React.ReactNode;
  testID?: string;
};

/**
 * Icon-only button: back (caret-left 24 in 44), close (x 22 in 40), more
 * (dots-three 20 in 36), send (paper-plane-right fill 19 in a 40 circle).
 * The touch target is padded to at least 44 with hitSlop.
 */
export function IconButton({
  icon,
  accessibilityLabel,
  onPress,
  weight = 'regular',
  iconSize = 24,
  color = colors.ink,
  size = 44,
  width,
  background,
  radius,
  pressedScale = 0.92,
  pressedBg,
  pressedRotate,
  spring,
  disabled,
  style,
  children,
  testID,
}: IconButtonProps) {
  const w = width ?? size;
  const slopV = Math.max(0, (44 - size) / 2);
  const slopH = Math.max(0, (44 - w) / 2);
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!disabled }}
      pressedScale={pressedScale}
      pressedBg={pressedBg}
      pressedRotate={pressedRotate}
      spring={spring}
      testID={testID}
      hitSlop={
        slopV || slopH
          ? { top: slopV, bottom: slopV, left: slopH, right: slopH }
          : undefined
      }
      style={[
        styles.base,
        {
          width: w,
          height: size,
          borderRadius: radius ?? (background ? size / 2 : 0),
          backgroundColor: background,
        },
        style,
      ]}
    >
      <Icon name={icon} weight={weight} size={iconSize} color={color} />
      {children}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
});
