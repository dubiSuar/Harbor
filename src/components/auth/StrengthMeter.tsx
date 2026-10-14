import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, duration, fonts } from '../../theme';
import { FadeIn } from '../ui';

const LABELS = ['Weak', 'Weak', 'Fair', 'Good', 'Strong'];

/**
 * The design's password score (SPEC 3.03): +1 each for 8+ characters, an
 * uppercase letter, a digit and a symbol.
 */
export function passwordScore(pw: string): number {
  let score = 0;
  if (pw.length >= 8) {
    score++;
  }
  if (/[A-Z]/.test(pw)) {
    score++;
  }
  if (/\d/.test(pw)) {
    score++;
  }
  if (/[^A-Za-z0-9]/.test(pw)) {
    score++;
  }
  return score;
}

/** '' while empty, else Weak / Weak / Fair / Good / Strong by score. */
export function strengthLabel(pw: string): string {
  return pw ? LABELS[passwordScore(pw)] : '';
}

function barColor(score: number): string {
  if (score < 2) {
    return colors.danger;
  }
  if (score < 3) {
    return colors.warning;
  }
  return colors.accent;
}

/**
 * Four bars (h4 r2, gap 4) plus the label (12.5 #71717A, min-width 44,
 * right-aligned). Bar i is coloured when i < score. The design's
 * `background .3s` is a cross-fade of the coloured layer (opacity only).
 */
export function StrengthMeter({ password }: { password: string }) {
  const score = passwordScore(password);
  const label = strengthLabel(password);
  const color = barColor(score);
  return (
    <View
      style={styles.row}
      accessible
      accessibilityLabel={
        label ? `Password strength: ${label}` : 'Password strength'
      }
    >
      <View style={styles.bars}>
        {[0, 1, 2, 3].map(i => (
          <View key={i} style={styles.bar}>
            {i < score ? (
              <FadeIn
                key={color}
                duration={duration.fadeSm}
                style={[StyleSheet.absoluteFill, { backgroundColor: color }]}
              >
                {null}
              </FadeIn>
            ) : null}
          </View>
        ))}
      </View>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bars: { flex: 1, flexDirection: 'row', gap: 4 },
  bar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: colors.line,
  },
  label: {
    minWidth: 44,
    textAlign: 'right',
    fontFamily: fonts.regular,
    fontSize: 12.5,
    color: colors.muted,
  },
});
