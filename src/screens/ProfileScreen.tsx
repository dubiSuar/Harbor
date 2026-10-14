import React, { useMemo, useRef, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  DEFAULT_PROFILE_TAB,
  ProfileView,
  coverButton,
  type ProfileRow,
} from '../components/profile/ProfileView';
import { Button, IconButton, useToast } from '../components/ui';
import { useNav } from '../navigation/Navigator';
import { useTabBarClearance } from '../navigation/insets';
import { useScrollToTop } from '../navigation/TabBarContext';
import { useMe } from '../state/SocialContext';
import { useStore, useUserPosts } from '../state/StoreContext';
import { colors } from '../theme';

/**
 * Profile tab (SPEC 3.13). The status bar is white here (App.tsx owns it).
 */
export function ProfileScreen() {
  const nav = useNav();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const clearance = useTabBarClearance(8);
  const me = useMe();
  const { meId } = useStore();
  const posts = useUserPosts(meId);
  const [tab, setTab] = useState(DEFAULT_PROFILE_TAB);
  const listRef = useRef<FlatList<ProfileRow>>(null);

  useScrollToTop('profile', () =>
    listRef.current?.scrollToOffset({ offset: 0, animated: true }),
  );

  // useMe() carries the totals: in demo mode the persona's friends and
  // albums plus my session posts; in Firebase mode only my real post count.
  const stats = useMemo(
    () => [
      ...(typeof me.friendsCount === 'number'
        ? [{ value: me.friendsCount, label: 'friends' }]
        : []),
      { value: me.postsCount ?? posts.data.length, label: 'posts' },
      ...(typeof me.albumsCount === 'number'
        ? [{ value: me.albumsCount, label: 'albums' }]
        : []),
    ],
    [me.friendsCount, me.postsCount, me.albumsCount, posts.data.length],
  );

  return (
    <ProfileView
      ref={listRef}
      style={styles.screen}
      contentContainerStyle={{ paddingBottom: clearance }}
      user={me}
      coverUrl={me.coverUrl}
      coverControls={
        <View style={[styles.gear, { top: insets.top + 2 }]}>
          <IconButton
            icon="gear-six"
            accessibilityLabel="Settings"
            onPress={() => nav.push({ name: 'Settings' })}
            size={coverButton.size}
            iconSize={coverButton.iconSize}
            color={coverButton.color}
            background={coverButton.background}
            style={coverButton.ring}
          />
        </View>
      }
      stats={stats}
      actions={
        <>
          <Button
            flex
            size="md"
            label="Edit profile"
            highlight={false}
            icon="pencil-simple"
            onPress={() => nav.push({ name: 'EditProfile' })}
          />
          <Button
            flex
            size="md"
            variant="soft"
            label="Share"
            icon="share-network"
            onPress={() => toast.show('Profile link copied')}
          />
        </>
      }
      tab={tab}
      onTabChange={setTab}
      posts={posts}
      photos={me.photos ?? []}
      about={me.about ?? []}
      onOpenPost={postId => nav.push({ name: 'Post', postId })}
      emptyPosts={{
        title: 'No posts yet',
        body: 'Photos and notes you post will collect here.',
      }}
      emptyPhotos={{
        title: 'No photos yet',
        body: 'Photos you post will collect here.',
      }}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  gear: { position: 'absolute', right: 14 },
});
