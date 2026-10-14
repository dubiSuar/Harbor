import React, { memo, useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  aspectRatioOf,
  postImages,
  type Post,
  type User,
} from '../../data/types';
import { postTime } from '../../data/time';
import { colors, type } from '../../theme';
import {
  AUDIENCE_ICON,
  AUDIENCE_LABEL,
  fmtCount,
  metaLine,
} from '../post/format';
import { ImageCarousel } from '../post/ImageCarousel';
import { Avatar, Icon, IconButton, PressableScale, type IconName } from '../ui';

type Props = {
  post: Post;
  author: User;
  /** Opens the post (text, counts). */
  onOpen: (postId: string) => void;
  /** The Comment button: opens the post with the composer focused. */
  onComment: (postId: string) => void;
  /** The heart button: toggles. */
  onLike: (postId: string) => void;
  /** Photo double-tap: like only (DECISIONS #10). Called only when not liked yet. */
  onDoubleTapLike: (postId: string) => void;
  onShare: (postId: string) => void;
  onMore: (postId: string) => void;
  /** Avatar / name: opens the author's profile. Called with the author id. */
  onAuthor: (userId: string) => void;
};

/** The 42-tall action buttons, padded to a 44 target. */
const ACTION_SLOP = { top: 1, bottom: 1 };
/** The 13px counts link, padded to a 44 target. */
const COUNTS_SLOP = { top: 14, bottom: 14, left: 4, right: 4 };

/**
 * A feed post (SPEC 3.04 #4): an article in an 8px #F4F4F5 section with the
 * author row, text, photo row (with the "{n} photos" badge), counts and the
 * Like / Comment / Share bar. Memoised; every callback takes the post id so
 * the list can pass the same functions to every card.
 */
export const FeedPostCard = memo(function FeedPostCardImpl({
  post,
  author,
  onOpen,
  onComment,
  onLike,
  onDoubleTapLike,
  onShare,
  onMore,
  onAuthor,
}: Props) {
  const { id, likedByMe, authorId } = post;
  const images = postImages(post);
  const pending = !!post.pending;
  const audience = post.audience ?? 'friends';

  const open = useCallback(() => onOpen(id), [onOpen, id]);
  const comment = useCallback(() => onComment(id), [onComment, id]);
  const like = useCallback(() => onLike(id), [onLike, id]);
  const share = useCallback(() => onShare(id), [onShare, id]);
  const more = useCallback(() => onMore(id), [onMore, id]);
  const openAuthor = useCallback(
    () => onAuthor(authorId),
    [onAuthor, authorId],
  );
  const doubleTap = useCallback(() => {
    if (!likedByMe) {
      onDoubleTapLike(id);
    }
  }, [onDoubleTapLike, id, likedByMe]);

  const time = postTime(post.createdAt);
  const comments = `${fmtCount(post.commentCount)} comments`;
  const shares = `${post.shareCount} shares`;
  const meta = metaLine(time, post.place);

  return (
    <View
      style={[styles.article, pending && styles.pending]}
      accessibilityState={{ busy: pending }}
    >
      <View style={styles.header}>
        <PressableScale
          onPress={openAuthor}
          pressedScale={0.98}
          accessibilityLabel={`View ${author.name}'s profile. ${meta}, ${AUDIENCE_LABEL[audience]}`}
          style={styles.author}
        >
          <Avatar uri={author.photoUrl} name={author.name} size={40} />
          <View style={styles.flex}>
            <Text style={type.name} numberOfLines={1}>
              {author.name}
            </Text>
            <View style={styles.meta}>
              <Text style={type.meta} numberOfLines={1}>
                {meta}
              </Text>
              <Icon
                name={AUDIENCE_ICON[audience]}
                size={13}
                color={colors.muted}
              />
            </View>
          </View>
        </PressableScale>
        <IconButton
          icon="dots-three"
          iconSize={20}
          color={colors.muted}
          size={36}
          disabled={pending}
          accessibilityLabel="More options"
          onPress={more}
        />
      </View>

      {post.text ? (
        <Pressable
          onPress={open}
          disabled={pending}
          accessibilityRole="button"
          accessibilityHint="Opens the post"
          style={styles.textWrap}
        >
          <Text style={type.body} textBreakStrategy="balanced">
            {post.text}
          </Text>
        </Pressable>
      ) : null}

      {images.length > 0 ? (
        <ImageCarousel
          images={images}
          aspectRatio={aspectRatioOf(post.aspect)}
          onDoubleTap={doubleTap}
          showCount
          ownerName={author.name}
          style={styles.images}
        />
      ) : null}

      <View style={styles.counts}>
        <View
          style={styles.likes}
          accessible
          accessibilityLabel={`${fmtCount(post.likeCount)} likes`}
        >
          <View style={styles.heartDot}>
            <Icon
              name="heart"
              weight="fill"
              size={10}
              color={colors.onAccent}
            />
          </View>
          <Text style={type.meta}>{fmtCount(post.likeCount)}</Text>
        </View>
        <Pressable
          onPress={open}
          disabled={pending}
          hitSlop={COUNTS_SLOP}
          accessibilityRole="button"
          accessibilityLabel={`${comments}, ${shares}`}
          accessibilityHint="Opens the post"
        >
          <Text style={type.meta}>{`${comments} · ${shares}`}</Text>
        </Pressable>
      </View>

      <View style={styles.bar}>
        <BarButton
          icon="heart"
          filled={likedByMe}
          color={likedByMe ? colors.accent : colors.inkSoft}
          label={likedByMe ? 'Liked' : 'Like'}
          a11y="Like"
          selected={likedByMe}
          spring
          disabled={pending}
          onPress={like}
        />
        <BarButton
          icon="chat-circle"
          label="Comment"
          disabled={pending}
          onPress={comment}
        />
        <BarButton
          icon="share-fat"
          label="Share"
          disabled={pending}
          onPress={share}
        />
      </View>
    </View>
  );
});

function BarButton({
  icon,
  filled = false,
  color = colors.inkSoft,
  label,
  a11y,
  selected,
  spring = false,
  disabled,
  onPress,
}: {
  icon: IconName;
  filled?: boolean;
  color?: string;
  label: string;
  a11y?: string;
  selected?: boolean;
  /** Like scales to .92 on the spring curve; the others only tint. */
  spring?: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      pressedScale={spring ? 0.92 : 1}
      spring={spring}
      pressedBg={colors.fill}
      hitSlop={ACTION_SLOP}
      accessibilityLabel={a11y ?? label}
      accessibilityState={{ selected, disabled }}
      style={styles.barButton}
    >
      <Icon
        name={icon}
        weight={filled ? 'fill' : 'regular'}
        size={20}
        color={color}
      />
      <Text style={[type.button, { color }]}>{label}</Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  article: {
    paddingTop: 14,
    paddingBottom: 4,
    borderTopWidth: 8,
    borderTopColor: colors.fill,
    backgroundColor: colors.bg,
  },
  pending: { opacity: 0.6 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
  },
  author: {
    flex: 1,
    minWidth: 0,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  flex: { flex: 1, minWidth: 0 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  textWrap: { marginTop: 10, marginHorizontal: 16 },
  images: { marginTop: 12 },
  counts: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 6,
  },
  likes: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heartDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bar: {
    flexDirection: 'row',
    marginHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
    paddingTop: 2,
  },
  barButton: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
});
