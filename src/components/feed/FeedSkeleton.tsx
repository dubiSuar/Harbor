import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { colors } from '../../theme';
import { Skeleton } from '../ui';

/**
 * First-load placeholder in the shape of a feed post: the 8px section
 * border, the author row, two text lines and a 4:3 photo.
 */
export function PostSkeleton({ photo = true }: { photo?: boolean }) {
  const { width } = useWindowDimensions();
  return (
    <View
      style={styles.article}
      accessible
      accessibilityLabel="Loading posts"
      accessibilityRole="progressbar"
    >
      <View style={styles.header}>
        <Skeleton circle={40} />
        <View style={styles.lines}>
          <Skeleton width="42%" height={13} />
          <Skeleton width="28%" height={11} />
        </View>
      </View>
      <View style={styles.text}>
        <Skeleton width="100%" height={13} />
        <Skeleton width="72%" height={13} />
      </View>
      {photo ? (
        <Skeleton
          width={width - 32}
          height={((width - 32) * 3) / 4}
          radius={18}
          style={styles.photo}
        />
      ) : null}
    </View>
  );
}

/** Two post placeholders, for the cold load. */
export function FeedSkeleton() {
  return (
    <>
      <PostSkeleton />
      <PostSkeleton photo={false} />
    </>
  );
}

const styles = StyleSheet.create({
  article: {
    paddingTop: 14,
    paddingBottom: 20,
    borderTopWidth: 8,
    borderTopColor: colors.fill,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
  },
  lines: { flex: 1, gap: 7 },
  text: { marginTop: 14, marginHorizontal: 16, gap: 8 },
  photo: { marginTop: 14, marginHorizontal: 16 },
});
