import React, { forwardRef, useCallback, useMemo } from 'react';
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type ListRenderItemInfo,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { AboutRow, Post, User } from '../../data/types';
import { postImages } from '../../data/types';
import { postTime } from '../../data/time';
import type { Live } from '../../state/storeTypes';
import { colors, fonts, type } from '../../theme';
import {
  Avatar,
  EmptyState,
  ErrorState,
  FadeIn,
  Gradient,
  Icon,
  PressableScale,
  SegmentedTabs,
  Skeleton,
} from '../ui';

/** The design's cover is 210 tall including its 50 status bar. */
const COVER_BELOW_STATUS = 160;
const AVATAR = 104;
const PHOTO_GAP = 2;

export const PROFILE_TABS = ['Posts', 'Photos', 'About'];
/** The design opens on Photos. */
export const DEFAULT_PROFILE_TAB = 1;

export type ProfileStat = { value: number; label: string };

export type ProfileViewProps = {
  user: User;
  /** Cover image; the #D4D4D8 placeholder shows while it loads. */
  coverUrl?: string;
  /** Frosted controls laid over the cover (gear, back). */
  coverControls?: React.ReactNode;
  /** "482 friends · 131 posts · 36 albums". */
  stats: ProfileStat[];
  /** The 40-tall action buttons row. */
  actions?: React.ReactNode;
  tab: number;
  onTabChange: (index: number) => void;
  posts: Live<Post[]>;
  photos: string[];
  about: AboutRow[];
  onOpenPost: (postId: string) => void;
  onRetryPosts?: () => void;
  /** Copy for an empty Posts / Photos tab. */
  emptyPosts: { title: string; body?: string };
  emptyPhotos: { title: string; body?: string };
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
};

/** One list row: a post, a row of three photos, an About line, or a state. */
export type ProfileRow =
  | { kind: 'post'; key: string; post: Post }
  | { kind: 'photos'; key: string; uris: string[]; start: number }
  | { kind: 'about'; key: string; row: AboutRow; first: boolean }
  | { kind: 'state'; key: string };

/** Rows that fade in when a tab opens (the rest mount while scrolling). */
const FADE_ROWS = 6;

/**
 * The profile (SPEC 3.13) as one virtualised list. The header holds the
 * cover with a top gradient, the overlapping 104 avatar, name, handle and
 * place, bio, stats, actions and the Posts / Photos / About underline tabs;
 * the rows are the active tab's posts, photo rows (three per row) or About
 * lines. The ref is the FlatList's (scroll to top).
 */
export const ProfileView = forwardRef<FlatList<ProfileRow>, ProfileViewProps>(
  function ProfileViewImpl(
    {
      user,
      coverUrl,
      coverControls,
      stats,
      actions,
      tab,
      onTabChange,
      posts,
      photos,
      about,
      onOpenPost,
      onRetryPosts,
      emptyPosts,
      emptyPhotos,
      style,
      contentContainerStyle,
    },
    ref,
  ) {
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();
    const tile = (width - PHOTO_GAP * 2) / 3;
    const handleLine = [user.handle ? `@${user.handle}` : '', user.location]
      .filter(Boolean)
      .join(' · ');

    const rows = useMemo<ProfileRow[]>(() => {
      if (tab === 0) {
        return posts.data.length
          ? posts.data.map(post => ({ kind: 'post', key: post.id, post }))
          : [{ kind: 'state', key: 'posts' }];
      }
      if (tab === 1) {
        if (!photos.length) {
          return [{ kind: 'state', key: 'photos' }];
        }
        const out: ProfileRow[] = [];
        for (let i = 0; i < photos.length; i += 3) {
          out.push({
            kind: 'photos',
            key: String(i),
            uris: photos.slice(i, i + 3),
            start: i,
          });
        }
        return out;
      }
      return about.map((row, i) => ({
        kind: 'about',
        key: `${row.icon}-${i}`,
        row,
        first: i === 0,
      }));
    }, [tab, posts.data, photos, about]);

    const renderItem = useCallback(
      ({ item, index }: ListRenderItemInfo<ProfileRow>) => {
        let body: React.ReactNode;
        switch (item.kind) {
          case 'post':
            body = <PostRow post={item.post} onOpen={onOpenPost} />;
            break;
          case 'photos':
            body = (
              <View style={styles.photoRow}>
                {item.uris.map((uri, i) => (
                  <Image
                    key={`${uri}-${item.start + i}`}
                    source={{ uri }}
                    resizeMode="cover"
                    accessible
                    accessibilityRole="image"
                    accessibilityLabel={`Photo ${item.start + i + 1} of ${
                      photos.length
                    }`}
                    style={[styles.photo, { width: tile, height: tile }]}
                  />
                ))}
              </View>
            );
            break;
          case 'about':
            body = (
              <View
                style={[styles.aboutRow, item.first && styles.aboutFirst]}
                accessible
                accessibilityLabel={item.row.text}
              >
                <Icon name={item.row.icon} size={22} color={colors.sub} />
                <Text style={styles.aboutText}>{item.row.text}</Text>
              </View>
            );
            break;
          default:
            body =
              tab === 0 ? (
                <PostsState
                  posts={posts}
                  onRetry={onRetryPosts}
                  empty={emptyPosts}
                />
              ) : (
                <EmptyState
                  icon="images"
                  title={emptyPhotos.title}
                  body={emptyPhotos.body}
                />
              );
        }
        return index < FADE_ROWS ? (
          <FadeIn duration={300}>{body}</FadeIn>
        ) : (
          body
        );
      },
      [
        tab,
        tile,
        photos.length,
        posts,
        onOpenPost,
        onRetryPosts,
        emptyPosts,
        emptyPhotos,
      ],
    );

    const header = (
      <View>
        <View
          style={[styles.cover, { height: insets.top + COVER_BELOW_STATUS }]}
        >
          {coverUrl ? (
            <Image
              source={{ uri: coverUrl }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
              accessibilityIgnoresInvertColors
            />
          ) : null}
          <Gradient
            style={StyleSheet.absoluteFill}
            stops={[
              { offset: 0, color: colors.scrim35 },
              { offset: 0.45, color: 'rgba(24,24,27,0)' },
            ]}
          />
          {coverControls}
        </View>

        <View style={styles.identity}>
          <Avatar
            uri={user.photoUrl}
            name={user.name}
            size={AVATAR}
            border={{ width: 4, color: colors.bg }}
            style={styles.avatar}
          />
          <Text style={styles.name} accessibilityRole="header">
            {user.name}
          </Text>
          {handleLine ? <Text style={styles.handle}>{handleLine}</Text> : null}
          {user.bio ? <Text style={styles.bio}>{user.bio}</Text> : null}
          {stats.length ? (
            <View
              style={styles.stats}
              accessible
              accessibilityLabel={stats
                .map(st => `${st.value} ${st.label}`)
                .join(', ')}
            >
              {stats.map(st => (
                <Text key={st.label} style={styles.stat}>
                  <Text style={styles.statValue}>{st.value}</Text> {st.label}
                </Text>
              ))}
            </View>
          ) : null}
          {actions ? <View style={styles.actions}>{actions}</View> : null}
        </View>

        <SegmentedTabs
          tabs={PROFILE_TABS}
          index={tab}
          onChange={onTabChange}
          style={styles.tabs}
        />
      </View>
    );

    return (
      <FlatList
        ref={ref}
        style={style}
        contentContainerStyle={contentContainerStyle}
        data={rows}
        keyExtractor={keyOf}
        renderItem={renderItem}
        ListHeaderComponent={header}
        ListFooterComponent={
          tab === 2 && about.length ? (
            <View style={styles.aboutEnd} />
          ) : undefined
        }
        showsVerticalScrollIndicator={false}
        initialNumToRender={8}
        windowSize={9}
      />
    );
  },
);

/** Keys carry the kind, so switching tabs remounts (and fades) the rows. */
const keyOf = (row: ProfileRow) => `${row.kind}:${row.key}`;

/** Loading skeleton, load error or the empty copy for the Posts tab. */
function PostsState({
  posts,
  onRetry,
  empty,
}: {
  posts: Live<Post[]>;
  onRetry?: () => void;
  empty: { title: string; body?: string };
}) {
  if (posts.state === 'loading') {
    return (
      <View style={styles.post}>
        <Skeleton width={60} height={13} />
        <Skeleton height={15} style={styles.skeletonLine} />
        <Skeleton height={180} radius={16} />
      </View>
    );
  }
  if (posts.state === 'error') {
    return (
      <ErrorState
        title="Couldn't load posts"
        message={posts.error}
        onRetry={onRetry}
      />
    );
  }
  return (
    <EmptyState icon="note-pencil" title={empty.title} body={empty.body} />
  );
}

/** A Posts-tab row: time, text, first photo and the likes / comments line. */
function PostRow({
  post: p,
  onOpen,
}: {
  post: Post;
  onOpen: (postId: string) => void;
}) {
  const img = postImages(p)[0];
  const comments = `${p.commentCount} comments`;
  return (
    <PressableScale
      onPress={() => onOpen(p.id)}
      pressedScale={0.99}
      accessibilityLabel={`${postTime(p.createdAt)}. ${p.text}`}
      accessibilityHint="Opens the post"
      style={styles.post}
    >
      <Text style={styles.time}>{postTime(p.createdAt)}</Text>
      {p.text ? <Text style={styles.postText}>{p.text}</Text> : null}
      {img ? (
        <Image
          source={{ uri: img }}
          style={styles.postImage}
          resizeMode="cover"
        />
      ) : null}
      <View style={styles.meta}>
        <Icon name="heart" weight="fill" size={13} color={colors.accent} />
        <Text style={styles.metaText}>
          {p.likeCount} · {comments}
        </Text>
      </View>
    </PressableScale>
  );
}

/**
 * The frosted 38 circle on the cover (gear / back): rgba(24,24,27,.35),
 * 1px rgba(255,255,255,.18) ring, white icon 20. No blur (DECISIONS #1).
 */
export const coverButton = {
  size: 38,
  background: colors.scrim35,
  color: colors.onAccent,
  iconSize: 20,
  ring: { borderWidth: 1, borderColor: colors.ringWhite18 },
} as const;

const styles = StyleSheet.create({
  cover: { backgroundColor: colors.border, overflow: 'hidden' },
  identity: { paddingHorizontal: 16 },
  avatar: { marginTop: -54 },
  name: { ...type.profileName, marginTop: 10 },
  handle: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.muted,
    marginTop: 2,
  },
  bio: { ...type.body, marginTop: 10 },
  stats: { flexDirection: 'row', gap: 18, marginTop: 12 },
  stat: { fontFamily: fonts.regular, fontSize: 14, color: colors.sub },
  statValue: { fontFamily: fonts.semibold, color: colors.ink },
  actions: { flexDirection: 'row', gap: 8, marginTop: 14 },
  tabs: { marginTop: 18 },
  post: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 8,
    borderBottomColor: colors.fill,
  },
  skeletonLine: { marginTop: 6, marginBottom: 10 },
  time: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted },
  postText: {
    ...type.body,
    color: colors.ink,
    marginTop: 6,
    marginBottom: 10,
  },
  postImage: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 16,
    backgroundColor: colors.line,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  metaText: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted },
  photoRow: { flexDirection: 'row', gap: PHOTO_GAP, marginTop: PHOTO_GAP },
  photo: { backgroundColor: colors.line },
  aboutFirst: { marginTop: 8 },
  aboutEnd: { height: 8 },
  aboutRow: {
    marginHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  aboutText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.ink,
  },
});
