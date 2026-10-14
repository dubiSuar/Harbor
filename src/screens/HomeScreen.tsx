import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BriefCard } from '../components/feed/BriefCard';
import { ComposerRow } from '../components/feed/ComposerRow';
import { FeedHeader } from '../components/feed/FeedHeader';
import { FeedPostCard } from '../components/feed/FeedPostCard';
import { FeedSkeleton, PostSkeleton } from '../components/feed/FeedSkeleton';
import { StoryRail } from '../components/feed/StoryRail';
import { EmptyState, ErrorState, useToast } from '../components/ui';
import { briefCopy } from '../data/social';
import { firstNameOf, type Post } from '../data/types';
import { useTabBarClearance } from '../navigation/insets';
import { useNav } from '../navigation/Navigator';
import { useGoToTab, useScrollToTop } from '../navigation/TabBarContext';
import { useOpenProfile } from '../navigation/useOpenProfile';
import {
  useBrief,
  useChats,
  useMe,
  useNotifications,
  usePeople,
  useStories,
} from '../state/SocialContext';
import { useStore } from '../state/StoreContext';
import { colors, fonts } from '../theme';
import { messageOf } from '../utils/errors';

/**
 * The Home tab (SPEC 3.04): composer row, stories rail, Harbor Brief card
 * and the post list under a floating, translucent header. Pull to refresh,
 * load more at the end, and the "all caught up" cap once there is no more.
 */
export function HomeScreen() {
  const nav = useNav();
  const toast = useToast();
  const goToTab = useGoToTab();
  const insets = useSafeAreaInsets();
  const bottom = useTabBarClearance(38);
  const {
    posts,
    feedState,
    feedError,
    hasMore,
    refreshFeed,
    loadMore,
    isMe,
    toggleLike,
    deletePost,
  } = useStore();
  const me = useMe();
  const person = usePeople();
  const { stories, isSeen } = useStories();
  const brief = useBrief();
  const { unreadCount } = useNotifications();
  const { unreadCount: unreadChats } = useChats();
  const openAuthor = useOpenProfile();
  const [briefOpen, setBriefOpen] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const listRef = useRef<FlatList<Post>>(null);

  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const topPad = insets.top + 60;
  const coldLoad = feedState === 'loading' && posts.length === 0;
  const coldError = feedState === 'error' && posts.length === 0;

  const scrollToTop = useCallback(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);
  useScrollToTop('home', scrollToTop);

  // When one of my posts finishes sharing, bring the top of the feed (where
  // it lands) into view. A failed post just disappears.
  const sharing = useRef(new Set<string>());
  useEffect(() => {
    let shared = false;
    for (const p of posts) {
      if (p.pending && isMe(p.authorId)) {
        sharing.current.add(p.id);
      } else if (sharing.current.has(p.id)) {
        sharing.current.delete(p.id);
        shared = true;
      }
    }
    if (shared) {
      scrollToTop();
    }
  }, [posts, isMe, scrollToTop]);

  // An error while posts are already on screen is a toast, not a state.
  const lastError = useRef<string | undefined>(undefined);
  useEffect(() => {
    const current = feedState === 'error' ? feedError : undefined;
    if (current && posts.length > 0 && lastError.current !== current) {
      toast.show(current, { icon: 'warning-circle' });
    }
    lastError.current = current;
  }, [feedState, feedError, posts.length, toast]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshFeed();
    } catch (e) {
      toast.show(messageOf(e, "Couldn't refresh your feed."), {
        icon: 'warning-circle',
      });
    } finally {
      if (mounted.current) {
        setRefreshing(false);
      }
    }
  }, [refreshFeed, toast]);

  const onEndReached = useCallback(async () => {
    if (!hasMore || loadingMore || feedState !== 'ready') {
      return;
    }
    setLoadingMore(true);
    try {
      await loadMore();
    } catch (e) {
      toast.show(messageOf(e, "Couldn't load more posts."), {
        icon: 'warning-circle',
      });
    } finally {
      if (mounted.current) {
        setLoadingMore(false);
      }
    }
  }, [feedState, hasMore, loadMore, loadingMore, toast]);

  const retry = useCallback(() => {
    refreshFeed().catch(e =>
      toast.show(messageOf(e, "Couldn't load your feed."), {
        icon: 'warning-circle',
      }),
    );
  }, [refreshFeed, toast]);

  // ---- navigation ----------------------------------------------------------
  const compose = useCallback(
    () => nav.push({ name: 'NewPost' }, 'modal'),
    [nav],
  );
  const composePhoto = useCallback(
    () => nav.push({ name: 'NewPost', withPhoto: true }, 'modal'),
    [nav],
  );
  const openStory = useCallback(
    (index: number) => nav.push({ name: 'Story', index }, 'fade'),
    [nav],
  );
  const openNotifications = useCallback(
    () => nav.push({ name: 'Notifications' }),
    [nav],
  );
  const openMessages = useCallback(() => nav.push({ name: 'Messages' }), [nav]);

  // ---- Brief ---------------------------------------------------------------
  const { regenerate } = brief;
  const toggleBrief = useCallback(() => setBriefOpen(o => !o), []);
  const refreshBrief = useCallback(() => {
    setBriefOpen(true);
    regenerate().catch(() =>
      toast.show("Couldn't refresh the Brief", { icon: 'warning-circle' }),
    );
  }, [regenerate, toast]);
  const fullBrief = useCallback(() => goToTab('brief'), [goToTab]);

  // ---- post actions (id-based and stable, so memo cards skip renders) -----
  const open = useCallback(
    (postId: string) => nav.push({ name: 'Post', postId }),
    [nav],
  );
  const comment = useCallback(
    (postId: string) => nav.push({ name: 'Post', postId, focusComment: true }),
    [nav],
  );
  const like = useCallback(
    (postId: string) => {
      toggleLike(postId).catch(e =>
        toast.show(messageOf(e, "Couldn't update that like."), {
          icon: 'warning-circle',
        }),
      );
    },
    [toggleLike, toast],
  );
  const share = useCallback(() => toast.show('Link copied'), [toast]);

  // Read through a ref so the More handler stays stable while posts change.
  const postsRef = useRef(posts);
  useEffect(() => {
    postsRef.current = posts;
  }, [posts]);
  const more = useCallback(
    (postId: string) => {
      const authorId = postsRef.current.find(p => p.id === postId)?.authorId;
      if (!authorId || !isMe(authorId)) {
        toast.show('Post saved');
        return;
      }
      // My own posts: the one way to delete them from the feed.
      Alert.alert('Delete post?', undefined, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deletePost(postId).catch(e =>
              toast.show(messageOf(e, "Couldn't delete the post."), {
                icon: 'warning-circle',
              }),
            );
          },
        },
      ]);
    },
    [deletePost, isMe, toast],
  );

  const renderItem = useCallback(
    ({ item }: { item: Post }) => (
      <FeedPostCard
        post={item}
        author={person(item.authorId)}
        onOpen={open}
        onComment={comment}
        onLike={like}
        onDoubleTapLike={like}
        onShare={share}
        onMore={more}
        onAuthor={openAuthor}
      />
    ),
    [person, open, comment, like, share, more, openAuthor],
  );

  const header = useMemo(
    () => (
      <>
        <ComposerRow
          firstName={firstNameOf(me.name)}
          photoUrl={me.photoUrl}
          name={me.name}
          onCompose={compose}
          onComposePhoto={composePhoto}
        />
        <StoryRail
          stories={stories}
          isSeen={isSeen}
          person={person}
          mePhotoUrl={me.photoUrl}
          onCreate={compose}
          onOpen={openStory}
        />
        {brief.enabled ? (
          <BriefCard
            subtitle={briefCopy.feedSubtitle}
            note={briefCopy.aiNote}
            items={brief.today}
            loading={brief.loading}
            open={briefOpen}
            onToggle={toggleBrief}
            onRefresh={refreshBrief}
            onFullBrief={fullBrief}
            person={person}
          />
        ) : null}
      </>
    ),
    [
      me.name,
      me.photoUrl,
      compose,
      composePhoto,
      stories,
      isSeen,
      person,
      openStory,
      brief.enabled,
      brief.today,
      brief.loading,
      briefOpen,
      toggleBrief,
      refreshBrief,
      fullBrief,
    ],
  );

  const empty = coldLoad ? (
    <FeedSkeleton />
  ) : coldError ? (
    <View style={styles.section}>
      <ErrorState
        title="Couldn't load your feed"
        message={feedError ?? 'Check your connection and try again.'}
        onRetry={retry}
      />
    </View>
  ) : (
    <View style={styles.section}>
      <EmptyState
        icon="users"
        title="Your feed is quiet"
        body="Posts from your friends show up here."
        actionLabel="Create post"
        onAction={compose}
      />
    </View>
  );

  const footer =
    posts.length === 0 ? undefined : loadingMore ? (
      <PostSkeleton />
    ) : hasMore ? undefined : (
      <View style={styles.endCap}>
        <Text style={styles.endText}>
          You're all caught up from the last 24 hours.
        </Text>
      </View>
    );

  return (
    <View style={styles.flex}>
      <FlatList
        ref={listRef}
        data={posts}
        keyExtractor={keyOf}
        renderItem={renderItem}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        ListFooterComponent={footer}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.6}
        contentContainerStyle={{ paddingTop: topPad, paddingBottom: bottom }}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
        initialNumToRender={4}
        windowSize={7}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.muted}
            colors={[colors.accent]}
            progressViewOffset={topPad}
          />
        }
      />
      <FeedHeader
        unreadCount={unreadCount}
        unreadMessages={unreadChats > 0}
        onNotifications={openNotifications}
        onMessages={openMessages}
      />
    </View>
  );
}

const keyOf = (p: Post) => p.id;

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  section: { borderTopWidth: 8, borderTopColor: colors.fill },
  endCap: {
    borderTopWidth: 8,
    borderTopColor: colors.fill,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  endText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
  },
});
