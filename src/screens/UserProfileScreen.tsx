import React, { useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  DEFAULT_PROFILE_TAB,
  ProfileView,
  coverButton,
} from '../components/profile/ProfileView';
import { Button, IconButton, useToast } from '../components/ui';
import { pic } from '../data/mock';
import {
  firstNameOf,
  postImages,
  type AboutRow,
  type FriendStatus,
} from '../data/types';
import { useNav } from '../navigation/Navigator';
import { useChats, useFriends, usePerson } from '../state/SocialContext';
import { useStore, useUserPosts } from '../state/StoreContext';
import { colors } from '../theme';

/**
 * Another person's profile (route `User`), in the Profile tab's visual
 * language: cover, identity, friend actions, Posts / Photos / About.
 */
export function UserProfileScreen({ userId }: { userId: string }) {
  const nav = useNav();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const { isMe } = useStore();
  const user = usePerson(userId);
  const posts = useUserPosts(userId);
  const friends = useFriends();
  const { chatWith, markRead } = useChats();
  const [tab, setTab] = useState(DEFAULT_PROFILE_TAB);

  const mine = isMe(userId);
  const first = firstNameOf(user.name);
  const status = friends.statusOf(userId);
  const mutual = friends.mutualCount(userId);

  const stats = useMemo(() => {
    const out: { value: number; label: string }[] = [];
    if (typeof user.friendsCount === 'number') {
      out.push({ value: user.friendsCount, label: 'friends' });
    } else if (!mine && mutual > 0) {
      out.push({ value: mutual, label: 'mutual friends' });
    }
    const postCount =
      user.postsCount ?? (posts.state === 'ready' ? posts.data.length : 0);
    out.push({ value: postCount, label: 'posts' });
    if (typeof user.albumsCount === 'number') {
      out.push({ value: user.albumsCount, label: 'albums' });
    }
    return out;
  }, [user, mine, mutual, posts]);

  const photos = user.photos?.length
    ? user.photos
    : posts.data.flatMap(p => postImages(p));

  const about = useMemo<AboutRow[]>(() => {
    if (user.about?.length) {
      return user.about;
    }
    const rows: AboutRow[] = [];
    if (user.location) {
      rows.push({ icon: 'map-pin', text: `Lives in ${user.location}` });
    }
    if (!mine && mutual > 0) {
      rows.push({
        icon: 'users',
        text: `${mutual} mutual ${mutual === 1 ? 'friend' : 'friends'}`,
      });
    }
    return rows;
  }, [user, mine, mutual]);

  const message = () => {
    const chat = chatWith(userId);
    if (chat) {
      markRead(chat.id);
      nav.push({ name: 'Conversation', chatId: chat.id });
    } else {
      toast.show(`Say hi to ${first}`);
    }
  };

  const friendAction = () => {
    if (status === 'friend') {
      Alert.alert(`Remove ${first} as a friend?`, undefined, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => friends.removeFriend(userId),
        },
      ]);
      return;
    }
    if (status === 'incoming') {
      const req = friends.pendingRequests.find(r => r.fromId === userId);
      if (req) {
        friends.acceptRequest(req.id);
        toast.show(`You and ${first} are now friends`);
      }
      return;
    }
    friends.toggleRequest(userId);
  };

  const actions = mine ? (
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
  ) : (
    <>
      <FriendButton status={status} name={user.name} onPress={friendAction} />
      <Button
        flex
        size="md"
        variant="soft"
        label="Message"
        icon="chat-circle-dots"
        accessibilityHint={`Opens your conversation with ${first}`}
        onPress={message}
      />
    </>
  );

  return (
    <ProfileView
      style={styles.screen}
      contentContainerStyle={{
        paddingBottom: Math.max(insets.bottom, 16) + 24,
      }}
      user={user}
      coverUrl={user.coverUrl ?? pic(`hb-cover-${userId}`, 800, 440)}
      coverControls={
        <View style={[styles.back, { top: insets.top + 2 }]}>
          <IconButton
            icon="caret-left"
            accessibilityLabel="Back"
            onPress={nav.pop}
            size={coverButton.size}
            iconSize={coverButton.iconSize}
            color={coverButton.color}
            background={coverButton.background}
            style={coverButton.ring}
          />
        </View>
      }
      stats={stats}
      actions={actions}
      tab={tab}
      onTabChange={setTab}
      posts={posts}
      photos={photos}
      about={about}
      onOpenPost={postId => nav.push({ name: 'Post', postId })}
      emptyPosts={{
        title: 'No posts yet',
        body: mine
          ? 'Photos and notes you post will collect here.'
          : `When ${first} shares something, it will show up here.`,
      }}
      emptyPhotos={{
        title: 'No photos yet',
        body: mine
          ? 'Photos you post will collect here.'
          : `When ${first} shares a photo, it will show up here.`,
      }}
    />
  );
}

/** Add friend (tint) / Requested (muted) / Confirm (primary) / Friends (muted). */
function FriendButton({
  status,
  name,
  onPress,
}: {
  status: FriendStatus;
  name: string;
  onPress: () => void;
}) {
  switch (status) {
    case 'requested':
      return (
        <Button
          flex
          size="md"
          variant="muted"
          label="Requested"
          icon="check"
          accessibilityHint={`Cancels your friend request to ${name}`}
          onPress={onPress}
        />
      );
    case 'incoming':
      return (
        <Button
          flex
          size="md"
          label="Confirm"
          icon="user-plus"
          accessibilityLabel={`Confirm friend request from ${name}`}
          onPress={onPress}
        />
      );
    case 'friend':
      return (
        <Button
          flex
          size="md"
          variant="muted"
          label="Friends"
          icon="users"
          accessibilityHint={`Lets you remove ${name} as a friend`}
          onPress={onPress}
        />
      );
    default:
      return (
        <Button
          flex
          size="md"
          variant="tint"
          label="Add friend"
          icon="user-plus"
          accessibilityHint={`Sends ${name} a friend request`}
          onPress={onPress}
        />
      );
  }
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  back: { position: 'absolute', left: 14 },
});
