import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { firstNameOf, type User } from '../../data/types';
import { colors, type } from '../../theme';
import { Avatar, Chip, Icon, PressableScale } from '../ui';

/**
 * Chat header middle (SPEC 3.10): avatar 38 + small online dot, first name
 * 16/600 over "Active now". Tapping it opens the peer's profile.
 */
export function ChatPeerTitle({
  peer,
  onPress,
}: {
  peer: User;
  onPress: () => void;
}) {
  const first = firstNameOf(peer.name);
  return (
    <PressableScale
      onPress={onPress}
      pressedScale={0.98}
      accessibilityLabel={`View ${peer.name}'s profile`}
      accessibilityHint={`${first} is active now`}
      style={styles.peer}
    >
      <Avatar uri={peer.photoUrl} name={peer.name} size={38} online="sm" />
      <View style={styles.peerText}>
        <Text style={type.rowTitle} numberOfLines={1}>
          {first}
        </Text>
        <Text style={type.caption} numberOfLines={1}>
          Active now
        </Text>
      </View>
    </PressableScale>
  );
}

/** Conversation intro (SPEC 3.10): avatar 72, name 17/600, "Friends since 2021 · N mutual friends". */
export function ChatIntro({ peer, line }: { peer: User; line: string }) {
  return (
    <View style={styles.intro}>
      <Avatar uri={peer.photoUrl} name={peer.name} size={72} />
      <Text style={type.chatName}>{peer.name}</Text>
      <Text style={type.meta}>{line}</Text>
    </View>
  );
}

export type SmartRepliesProps = {
  replies: string[];
  onPick: (reply: string) => void;
};

/** Smart-reply row above the chat composer: sparkle fill 15 + compact AI chips, gap 6, padding-bottom 9. */
export function SmartReplies({ replies, onPick }: SmartRepliesProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.replies}
      accessibilityLabel="Suggested replies"
    >
      <Icon name="sparkle" weight="fill" size={15} color={colors.accent} />
      {replies.map(r => (
        <Chip
          key={r}
          variant="ai"
          compact
          label={r}
          accessibilityLabel={`Send "${r}"`}
          onPress={() => onPick(r)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  peer: {
    flex: 1,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  peerText: { flex: 1, minWidth: 0, paddingLeft: 4 },
  intro: {
    alignItems: 'center',
    gap: 6,
    paddingTop: 10,
    paddingBottom: 18,
  },
  replies: { alignItems: 'center', gap: 6, paddingBottom: 9 },
});
