import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useNav } from '../navigation/Navigator';
import { Header, IconButton, SearchField, useToast } from '../components/ui';
import { ActiveNowItem, ChatRow, filterChats } from '../components/social';
import { firstNameOf } from '../data/types';
import { useChats, usePeople } from '../state/SocialContext';
import { colors, fonts } from '../theme';

/** Messages (SPEC 3.09): active-now rail and the chat list. */
export function MessagesScreen() {
  const nav = useNav();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const person = usePeople();
  const { chats, activeNow, chatWith, markRead } = useChats();
  const [q, setQ] = useState('');
  const searching = q.trim().length > 0;
  const shown = useMemo(
    () => filterChats(chats, q, id => person(id).name),
    [chats, q, person],
  );

  const openChat = (chatId: string) => {
    markRead(chatId);
    nav.push({ name: 'Conversation', chatId });
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{
        paddingBottom: Math.max(insets.bottom, 16) + 10,
      }}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      showsVerticalScrollIndicator={false}
    >
      <Header
        variant="large"
        title="Messages"
        onBack={nav.pop}
        right={
          <IconButton
            icon="note-pencil"
            iconSize={22}
            accessibilityLabel="New message"
            onPress={() => toast.show('Pick a friend to message')}
          />
        }
      />
      {/* Filters the chats by the peer's name. */}
      <SearchField
        value={q}
        onChangeText={setQ}
        placeholder="Search messages"
        accessibilityLabel="Search messages"
        returnKeyType="search"
        containerStyle={styles.search}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.rail}
      >
        {activeNow.map(id => {
          const p = person(id);
          return (
            <ActiveNowItem
              key={id}
              person={p}
              onPress={() => {
                const chat = chatWith(id);
                if (chat) {
                  openChat(chat.id);
                } else {
                  toast.show(`Say hi to ${firstNameOf(p.name)}`);
                }
              }}
            />
          );
        })}
      </ScrollView>
      <View style={styles.list}>
        {searching && shown.length === 0 ? (
          <Text style={styles.empty} accessibilityLiveRegion="polite">
            {`No chats match "${q.trim()}"`}
          </Text>
        ) : null}
        {shown.map(c => (
          <ChatRow
            key={c.id}
            chat={c}
            peer={person(c.peerId)}
            onPress={() => openChat(c.id)}
          />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  search: { marginTop: 12, marginHorizontal: 16 },
  rail: {
    gap: 14,
    paddingTop: 18,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  list: { paddingVertical: 6 },
  empty: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
  },
});
