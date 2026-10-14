import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { User } from '../../data/types';
import { colors, fonts, type } from '../../theme';
import { Avatar, FadeIn, Icon, PressableScale, Skeleton } from '../ui';

/** Small text actions are ~17 tall; pad them out to a 44+ target. */
const ACTION_SLOP = { top: 14, bottom: 14, left: 8, right: 8 };
/** The 34 avatar, padded to a 44 target. */
const AVATAR_SLOP = { top: 5, bottom: 5, left: 5, right: 5 };
/** The ~17-tall name inside the bubble, padded to a 44 target. */
const NAME_SLOP = { top: 14, bottom: 13, left: 8, right: 8 };

type Props = {
  commentId: string;
  /** Author id, passed back to `onReply`. */
  authorId: string;
  author: User;
  text: string;
  /** "18m", "Just now". */
  time: string;
  liked: boolean;
  likes: number;
  pending?: boolean;
  onLike: (commentId: string) => void;
  onReply: (authorId: string) => void;
  /** Avatar / name: opens the author's profile. */
  onAuthor: (authorId: string) => void;
};

/**
 * One comment (SPEC 3.05): avatar 34, a #F4F4F5 r18 bubble (name 13.5/600
 * over 14.5 text), then a meta row with the time, Like, Reply and, when
 * liked, a heart count. Fades in on mount. Pending (unsent) comments sit
 * at half opacity until the server copy replaces them.
 */
export const CommentRow = memo(function CommentRowImpl({
  commentId,
  authorId,
  author,
  text,
  time,
  liked,
  likes,
  pending = false,
  onLike,
  onReply,
  onAuthor,
}: Props) {
  const profileLabel = `View ${author.name}'s profile`;
  return (
    <FadeIn style={pending ? styles.pending : undefined}>
      <View style={styles.row} accessibilityState={{ busy: pending }}>
        {/* One profile stop for screen readers: the name; the avatar is a
            duplicate touch target only. */}
        <PressableScale
          onPress={() => onAuthor(authorId)}
          pressedScale={0.94}
          hitSlop={AVATAR_SLOP}
          accessible={false}
          importantForAccessibility="no-hide-descendants"
          accessibilityElementsHidden
        >
          <Avatar uri={author.photoUrl} name={author.name} size={34} />
        </PressableScale>
        <View style={styles.content}>
          <View style={styles.bubble}>
            <PressableScale
              onPress={() => onAuthor(authorId)}
              pressedScale={0.98}
              hitSlop={NAME_SLOP}
              accessibilityLabel={profileLabel}
              style={styles.nameButton}
            >
              <Text style={styles.name}>{author.name}</Text>
            </PressableScale>
            <Text style={type.comment}>{text}</Text>
          </View>
          <View style={styles.meta}>
            <Text style={styles.metaText}>{time}</Text>
            <Pressable
              onPress={() => onLike(commentId)}
              hitSlop={ACTION_SLOP}
              accessibilityRole="button"
              accessibilityLabel={`Like ${author.name}'s comment`}
              accessibilityState={{ selected: liked }}
            >
              <Text style={[styles.action, liked && styles.liked]}>Like</Text>
            </Pressable>
            <Pressable
              onPress={() => onReply(authorId)}
              hitSlop={ACTION_SLOP}
              accessibilityRole="button"
              accessibilityLabel={`Reply to ${author.name}`}
            >
              <Text style={styles.action}>Reply</Text>
            </Pressable>
            {likes > 0 ? (
              <View
                style={styles.count}
                accessible
                accessibilityLabel={`${likes} ${
                  likes === 1 ? 'like' : 'likes'
                }`}
              >
                <Icon
                  name="heart"
                  weight="fill"
                  size={12.5}
                  color={colors.accent}
                />
                <Text style={styles.metaText}>{likes}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>
    </FadeIn>
  );
});

/** First-load placeholder for the comment list. */
export function CommentsSkeleton() {
  return (
    <View style={styles.skeleton}>
      {[0, 1, 2].map(i => (
        <View key={i} style={styles.row}>
          <Skeleton circle={34} />
          <View style={styles.content}>
            <Skeleton width={i === 1 ? '62%' : '84%'} height={52} radius={18} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  pending: { opacity: 0.5 },
  row: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  content: { flex: 1, minWidth: 0 },
  bubble: {
    alignSelf: 'flex-start',
    maxWidth: '100%',
    backgroundColor: colors.fill,
    borderRadius: 18,
    paddingTop: 8,
    paddingHorizontal: 13,
    paddingBottom: 9,
  },
  nameButton: { alignSelf: 'flex-start' },
  name: { fontFamily: fonts.semibold, fontSize: 13.5, color: colors.ink },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingTop: 4,
    paddingHorizontal: 12,
  },
  metaText: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.muted },
  action: { fontFamily: fonts.semibold, fontSize: 12.5, color: colors.muted },
  liked: { color: colors.accent },
  count: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  skeleton: { gap: 4 },
});
