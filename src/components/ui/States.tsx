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
import { Button } from './Button';

export type EmptyStateProps = {
  /** Default 'magnifying-glass' (34, #D4D4D8). */
  icon?: IconName;
  title: string;
  body?: string;
  /** Optional action under the copy. */
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
};

/**
 * Empty result (Explore search, SPEC 3.08): padding 40 12, centred; icon 34
 * #D4D4D8; title 16/600 margin-top 10; body 14 #71717A margin-top 4.
 */
export function EmptyState({
  icon = 'magnifying-glass',
  title,
  body,
  actionLabel,
  onAction,
  style,
}: EmptyStateProps) {
  // One spoken element when it is only copy; with an action the copy and
  // the button stay separate, so a screen reader can reach the button.
  const hasAction = !!actionLabel && !!onAction;
  return (
    <View
      style={[styles.wrap, style]}
      accessible={!hasAction}
      accessibilityLabel={
        hasAction ? undefined : body ? `${title}. ${body}` : title
      }
    >
      <Icon name={icon} size={34} color={colors.border} />
      <Text style={styles.title}>{title}</Text>
      {body ? <Text style={styles.body}>{body}</Text> : null}
      {hasAction ? (
        <Button
          label={actionLabel}
          onPress={onAction}
          variant="soft"
          size="sm"
          style={styles.action}
        />
      ) : null}
    </View>
  );
}

export type ErrorStateProps = {
  title?: string;
  message?: string;
  /** Shows a "Try again" button. */
  onRetry?: () => void;
  retryLabel?: string;
  /** Busy state for the retry button. */
  retrying?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * Load failure, in the EmptyState layout with `warning-circle` and a retry
 * button. Not in the design; built from its tokens.
 */
export function ErrorState({
  title = "Couldn't load this",
  message = 'Check your connection and try again.',
  onRetry,
  retryLabel = 'Try again',
  retrying = false,
  style,
}: ErrorStateProps) {
  return (
    <View style={[styles.wrap, style]} accessibilityLiveRegion="polite">
      <Icon name="warning-circle" size={34} color={colors.border} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{message}</Text>
      {onRetry ? (
        <Button
          label={retryLabel}
          loadingLabel="Trying…"
          loading={retrying}
          onPress={onRetry}
          variant="soft"
          size="sm"
          icon="arrow-clockwise"
          style={styles.action}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingVertical: 40,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  title: {
    marginTop: 10,
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: colors.ink,
    textAlign: 'center',
  },
  body: {
    marginTop: 4,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20.3,
    color: colors.muted,
    textAlign: 'center',
  },
  action: { marginTop: 16, alignSelf: 'center' },
});
