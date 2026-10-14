import React, { useId } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

export type GradientStop = {
  /** 0..1 along the direction. */
  offset: number;
  /** Any CSS colour, rgba() included. */
  color: string;
};

export type GradientProps = {
  stops: GradientStop[];
  /**
   * CSS-like direction: 'down' = linear-gradient(180deg, ...) (top to
   * bottom), 'up' = 0deg (bottom to top), 'right' = 90deg.
   */
  direction?: 'down' | 'up' | 'right';
  style?: StyleProp<ViewStyle>;
};

/**
 * A linear gradient fill over react-native-svg, for overlays and fade
 * zones (story scrims, the feed header zone, the tab-bar zone, cover
 * gradients). Non-interactive; size it with `style` (often
 * StyleSheet.absoluteFill).
 *
 *   <Gradient direction="down" style={StyleSheet.absoluteFill} stops={[
 *     { offset: 0.45, color: 'rgba(24,24,27,0)' },
 *     { offset: 1, color: 'rgba(24,24,27,0.6)' },
 *   ]} />
 */
export function Gradient({ stops, direction = 'down', style }: GradientProps) {
  const id = `g${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const coords =
    direction === 'down'
      ? { x1: '0', y1: '0', x2: '0', y2: '1' }
      : direction === 'up'
      ? { x1: '0', y1: '1', x2: '0', y2: '0' }
      : { x1: '0', y1: '0', x2: '1', y2: '0' };
  return (
    <View pointerEvents="none" style={style}>
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
        <Defs>
          <LinearGradient id={id} {...coords}>
            {stops.map(s => (
              <Stop
                key={`${s.offset}-${s.color}`}
                offset={s.offset}
                stopColor={s.color}
              />
            ))}
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}
