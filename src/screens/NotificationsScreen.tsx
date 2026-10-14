import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useNav } from '../navigation/Navigator';
import { AICard, Button, Header, Icon, useToast } from '../components/ui';
import { NotificationRow } from '../components/social';
import { firstNameOf, type AppNotification } from '../data/types';
import {
  useFriends,
  useNotifications,
  usePeople,
} from '../state/SocialContext';
import { usePost } from '../state/StoreContext';
import { colors, type } from '../theme';

/**
 * Notifications (SPEC 3.11): static AI summary, New / Earlier sections,
 * friend-request actions. Rows open the linked post, or the actor's
 * profile when there is no post (or it is missing in Firebase mode).
 */
export function NotificationsScreen() {
  const nav = useNav();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const { fresh, earlier, markAllRead, summary } = useNotifications();

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{
        paddingBottom: Math.max(insets.bottom, 16) + 10,
      }}
      showsVerticalScrollIndicator={false}
    >
      <Header
        variant="large"
        title="Notifications"
        onBack={nav.pop}
        right={
          <Button
            variant="link"
            size="text"
            label="Mark all read"
            labelStyle={styles.markAll}
            style={styles.markAllBtn}
            onPress={() => {
              markAllRead();
              toast.show('All caught up');
            }}
          />
        }
      />
      {summary ? (
        <AICard
          header="none"
          radius={18}
          padding={{ vertical: 11, horizontal: 13 }}
          style={styles.summary}
        >
          <View
            style={styles.summaryRow}
            accessible
            accessibilityLabel={`Harbor AI summary. ${summary}`}
          >
            <Icon
              name="sparkle"
              weight="fill"
              size={17}
              color={colors.accent}
              style={styles.sparkle}
            />
            <Text style={styles.summaryText}>{summary}</Text>
          </View>
        </AICard>
      ) : null}

      <Text
        style={[styles.section, styles.sectionNew]}
        accessibilityRole="header"
      >
        New
      </Text>
      {fresh.map(n => (
        <Row key={n.id} item={n} />
      ))}
      <Text
        style={[styles.section, styles.sectionEarlier]}
        accessibilityRole="header"
      >
        Earlier
      </Text>
      {earlier.map(n => (
        <Row key={n.id} item={n} />
      ))}
    </ScrollView>
  );
}

function Row({ item }: { item: AppNotification }) {
  return item.postId ? (
    <PostLinkedRow item={item} postId={item.postId} />
  ) : (
    <LinkedRow item={item} postExists={false} />
  );
}

/** Subscribes to the linked post so a missing one (Firebase) falls back to the profile. */
function PostLinkedRow({
  item,
  postId,
}: {
  item: AppNotification;
  postId: string;
}) {
  const post = usePost(postId).data;
  return <LinkedRow item={item} postExists={!!post} />;
}

function LinkedRow({
  item,
  postExists,
}: {
  item: AppNotification;
  postExists: boolean;
}) {
  const nav = useNav();
  const toast = useToast();
  const person = usePeople();
  const friends = useFriends();
  const actor = person(item.actorId);
  const first = firstNameOf(actor.name);
  const openPost = !!item.postId && postExists;

  return (
    <NotificationRow
      item={item}
      actor={actor}
      opensLabel={openPost ? 'Opens the post' : `Opens ${first}'s profile`}
      onPress={() =>
        openPost && item.postId
          ? nav.push({ name: 'Post', postId: item.postId })
          : nav.push({ name: 'User', userId: item.actorId })
      }
      onConfirm={() => {
        if (item.requestId) {
          friends.acceptRequest(item.requestId);
          toast.show(`You and ${first} are now friends`);
        }
      }}
      onDelete={() => {
        if (item.requestId) {
          friends.declineRequest(item.requestId);
        }
      }}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  markAll: { fontSize: 14.5 },
  markAllBtn: { paddingHorizontal: 10 },
  summary: { marginTop: 14, marginHorizontal: 16, marginBottom: 4 },
  summaryRow: { flexDirection: 'row', gap: 10 },
  sparkle: { marginTop: 1 },
  summaryText: { ...type.small, flex: 1, lineHeight: 19.88 },
  section: { ...type.listHeader, paddingHorizontal: 16, paddingBottom: 6 },
  sectionNew: { paddingTop: 16 },
  sectionEarlier: { paddingTop: 18 },
});
