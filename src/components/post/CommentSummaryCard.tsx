import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { colors, type } from '../../theme';
import { AICard, IconButton } from '../ui';

type Props = {
  /** "1,208": the post's comment count, formatted. */
  countText: string;
  /** `useCommentSummary().displayText` (falls back to NO_SUMMARY_TEXT). */
  text: string;
  loading: boolean;
  onRefresh: () => void;
};

/**
 * The post's AI comment summary (SPEC 3.05): AI card r20 p13/14, inline
 * sparkle header "Comment summary · {n} comments", a 30x30 r9 refresh
 * button with a #DCE3F8 ring, and two shimmer lines while it loads.
 */
export function CommentSummaryCard({
  countText,
  text,
  loading,
  onRefresh,
}: Props) {
  return (
    <AICard
      title="Comment summary"
      subtitle={`· ${countText} comments`}
      loading={loading}
      style={styles.card}
      right={
        <IconButton
          icon="arrow-clockwise"
          iconSize={16}
          color={colors.accentInk}
          size={30}
          radius={9}
          background={colors.bg}
          style={styles.refresh}
          disabled={loading}
          accessibilityLabel="Refresh comment summary"
          onPress={onRefresh}
        />
      }
    >
      <Text style={type.small} accessibilityLiveRegion="polite">
        {text}
      </Text>
    </AICard>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: 14, marginHorizontal: 16, marginBottom: 6 },
  refresh: { borderWidth: 1, borderColor: colors.aiChipBorder },
});
