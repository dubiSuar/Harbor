import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { firstNameOf, type Chat, type User } from '../../data/types';
import { colors, fonts } from '../../theme';
import { Avatar, PressableScale, UnreadDot } from '../ui';

/** `{"You: " if mine}{last text}` for the chat list preview. */
export function chatPreview(chat: Chat): string {
  const last = chat.messages[chat.messages.length - 1];
  if (!last) {
    return '';
  }
  return `${last.fromMe ? 'You: ' : ''}${last.text}`;
}

/**
 * Messages search: the chats whose peer's name contains `query`
 * (case-insensitive), in list order. A blank query keeps every chat.
 */
export function filterChats(
  chats: Chat[],
  query: string,
  nameOf: (peerId: string) => string,
): Chat[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    return chats;
  }
  return chats.filter(c => nameOf(c.peerId).toLowerCase().includes(q));
}

export type ChatRowProps = {
  chat: Chat;
  peer: User;
  onPress: () => void;
};

/**
 * Messages list row (SPEC 3.09): p 10 16, gap 12, pressed bg #F4F4F5;
 * avatar 56; name 15.5 (600 when unread); preview 14, #18181B 600 when
 * unread else #71717A 400, one line; 10px accent unread dot.
 */
export function ChatRow({ chat, peer, onPress }: ChatRowProps) {
  const unread = chat.unread;
  const preview = `${chatPreview(chat)} · ${chat.timeLabel}`;
  return (
    <PressableScale
      onPress={onPress}
      pressedScale={1}
      pressedBg={colors.fill}
      accessibilityLabel={`${peer.name}${unread ? ', unread' : ''}. ${preview}`}
      accessibilityHint={`Opens your chat with ${firstNameOf(peer.name)}`}
      style={styles.row}
    >
      <Avatar uri={peer.photoUrl} name={peer.name} size={56} />
      <View style={styles.text}>
        <Text
          style={[styles.name, unread ? styles.semibold : styles.regular]}
          numberOfLines={1}
        >
          {peer.name}
        </Text>
        <Text
          style={[styles.preview, unread ? styles.previewUnread : null]}
          numberOfLines={1}
        >
          {preview}
        </Text>
      </View>
      {unread ? <UnreadDot /> : null}
    </PressableScale>
  );
}

export type ActiveNowItemProps = {
  person: User;
  onPress: () => void;
};

/** Active-now rail item (SPEC 3.09): 62 wide; avatar 58 + online dot; first name 12 #3F3F46. */
export function ActiveNowItem({ person, onPress }: ActiveNowItemProps) {
  const first = firstNameOf(person.name);
  return (
    <PressableScale
      onPress={onPress}
      pressedScale={0.96}
      accessibilityLabel={`${first}, active now`}
      style={styles.active}
    >
      <Avatar uri={person.photoUrl} name={person.name} size={58} online="lg" />
      <Text style={styles.activeName} numberOfLines={1}>
        {first}
      </Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  text: { flex: 1, minWidth: 0 },
  name: { fontSize: 15.5, color: colors.ink },
  semibold: { fontFamily: fonts.semibold },
  regular: { fontFamily: fonts.regular },
  preview: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted },
  previewUnread: { fontFamily: fonts.semibold, color: colors.ink },
  active: { width: 62, alignItems: 'center', gap: 6 },
  activeName: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.inkSoft,
  },
});
