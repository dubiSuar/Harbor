import React from 'react';
import { StyleSheet, Text, type StyleProp, type TextStyle } from 'react-native';
import { type } from '../../theme';

export type OverlineProps = {
  children: string;
  /**
   * Padding. Default 22 16 8 (Brief, Settings uses `{ horizontal: 28 }`);
   * Explore PEOPLE uses `{ top: 0, horizontal: 0, bottom: 6, tight: true }`.
   */
  padding?: { top?: number; horizontal?: number; bottom?: number };
  /** PEOPLE: letter-spacing .02em (0.26) instead of .03em. */
  tight?: boolean;
  style?: StyleProp<TextStyle>;
};

/** 13/600 uppercase #71717A section label ("WHAT YOU MISSED", "PRIVACY"). */
export function Overline({ children, padding, tight, style }: OverlineProps) {
  return (
    <Text
      accessibilityRole="header"
      style={[
        type.overline,
        {
          paddingTop: padding?.top ?? 22,
          paddingHorizontal: padding?.horizontal ?? 16,
          paddingBottom: padding?.bottom ?? 8,
        },
        tight ? styles.tight : null,
        style,
      ]}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  tight: { letterSpacing: 0.26 },
});
