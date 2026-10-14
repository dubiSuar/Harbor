import React, { memo, useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  aspectRatioOf,
  postImages,
  type Post,
  type User,
} from '../../data/types';
import { postTime } from '../../data/time';
import { colors, fonts, type } from '../../theme';
import { Avatar, Icon, PressableScale, type IconName } from '../ui';
import { fmtCount, metaLine } from './format';
import { ImageCarousel } from './ImageCarousel';

/** The 42-tall action buttons, padded to a 44 target. */
const SLOP = { top: 1, bottom: 1 };

type Props = {
  post: Post;
  author: User;
  /** The heart button: toggles. */
  onLike: (postId: string) => void;
  /** Double-tap on a photo: like only, never unlike (DECISIONS #10). */
  onDoubleTapLike: (postId: string) => void;
  onComment: () => void;
  onShare: () => void;
  /** Avatar / name: opens the author's profile. Called with the author id. */
  onAuthor: (userId: string) => void;
};

/**
 * The top of the post detail (SPEC 3.05): author row (no audience glyph,
 * no more button), 15.5 text, the photo row without a count badge, and the
 * action row of counts between two hairlines.
 */
export const PostDetailBody = memo(function PostDetailBodyImpl({
  post,
  author,
  onLike,
  onDoubleTapLike,
  onComment,
  onShare,
  onAuthor,
}: Props) {
  const images = postImages(post);
  const { id, likedByMe, authorId } = post;
  const like = useCallback(() => onLike(id), [onLike, id]);
  const openAuthor = useCallback(
    () => onAuthor(authorId),
    [onAuthor, authorId],
  );
  const meta = metaLine(postTime(post.createdAt), post.place);
  const doubleTap = useCallback(() => {
    if (!likedByMe) {
      onDoubleTapLike(id);
    }
  }, [onDoubleTapLike, id, likedByMe]);

  return (
    <View>
      <PressableScale
        onPress={openAuthor}
        pressedScale={0.98}
        accessibilityLabel={`View ${author.name}'s profile. ${meta}`}
        style={styles.author}
      >
        <Avatar uri={author.photoUrl} name={author.name} size={40} />
        <View style={styles.flex}>
          <Text style={styles.name} numberOfLines={1}>
            {author.name}
          </Text>
          <Text style={type.meta} numberOfLines={1}>
            {meta}
          </Text>
        </View>
      </PressableScale>
      {post.text ? (
        <Text style={[type.bodyLg, styles.text]} textBreakStrategy="balanced">
          {post.text}
        </Text>
      ) : null}
      {images.length > 0 ? (
        <ImageCarousel
          images={images}
          aspectRatio={aspectRatioOf(post.aspect)}
          onDoubleTap={doubleTap}
          ownerName={author.name}
          style={styles.images}
        />
      ) : null}
      <View style={styles.actions}>
        <Action
          icon="heart"
          filled={likedByMe}
          color={likedByMe ? colors.accent : colors.inkSoft}
          label={fmtCount(post.likeCount)}
          a11y={`Like, ${fmtCount(post.likeCount)} likes`}
          selected={likedByMe}
          disabled={!!post.pending}
          onPress={like}
        />
        <Action
          icon="chat-circle"
          label={fmtCount(post.commentCount)}
          a11y={`Comment, ${fmtCount(post.commentCount)} comments`}
          disabled={!!post.pending}
          onPress={onComment}
        />
        <Action
          icon="share-fat"
          label={fmtCount(post.shareCount)}
          a11y={`Share, ${fmtCount(post.shareCount)} shares`}
          disabled={!!post.pending}
          onPress={onShare}
        />
      </View>
    </View>
  );
});

function Action({
  icon,
  filled = false,
  color = colors.inkSoft,
  label,
  a11y,
  selected,
  disabled,
  onPress,
}: {
  icon: IconName;
  filled?: boolean;
  color?: string;
  label: string;
  a11y: string;
  selected?: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      pressedScale={0.92}
      spring
      hitSlop={SLOP}
      accessibilityLabel={a11y}
      accessibilityState={{ selected, disabled }}
      style={styles.action}
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
  flex: { flex: 1, minWidth: 0 },
  author: {
    alignSelf: 'flex-start',
    maxWidth: '100%',
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 6,
    paddingHorizontal: 16,
  },
  name: { fontFamily: fonts.semibold, fontSize: 15, color: colors.ink },
  text: { marginTop: 10, marginHorizontal: 16 },
  images: { paddingTop: 12 },
  actions: {
    flexDirection: 'row',
    marginTop: 10,
    marginHorizontal: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.hairline,
  },
  action: {
    flex: 1,
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
});
