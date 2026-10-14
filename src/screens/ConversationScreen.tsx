import React, { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ScrollViewInstance,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useIsTopScreen, useNav } from '../navigation/Navigator';
import { useOpenProfile } from '../navigation/useOpenProfile';
import {
  Bubble,
  ComposerBar,
  EmptyState,
  Header,
  IconButton,
  useReduceMotion,
  useToast,
  useToastKeyboardBar,
} from '../components/ui';
import { useKeyboardVisible } from '../components/useKeyboard';
import { ChatIntro, ChatPeerTitle, SmartReplies } from '../components/social';
import { TypingDots } from '../components/ui';
import { CHAT_DATE_STAMP, chatIntro } from '../data/social';
import { firstNameOf } from '../data/types';
import { useChat, useChats, usePerson } from '../state/SocialContext';
import { colors, fonts } from '../theme';

const BAR_HEIGHT = 54;

/** Chat (SPEC 3.10): bubbles, smart replies, typing indicator, composer. */
export function ConversationScreen({ chatId }: { chatId: string }) {
  const nav = useNav();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const reduce = useReduceMotion();
  const { chat, smartReplies, send } = useChat(chatId);
  const { markRead } = useChats();
  const peer = usePerson(chat?.peerId ?? '');
  const first = firstNameOf(peer.name);

  const [draft, setDraft] = useState('');
  const [composerH, setComposerH] = useState(0);
  const scrollRef = useRef<ScrollViewInstance>(null);
  const settled = useRef(false);
  const isTop = useIsTopScreen();
  const keyboardUp = useKeyboardVisible();
  const openProfile = useOpenProfile();

  // With the keyboard up, toasts sit above the composer riding on it.
  useToastKeyboardBar(composerH, isTop);

  // The keyboard shrinks the viewport without changing the content size, so
  // bring the latest message back into view once it is up.
  useEffect(() => {
    if (!keyboardUp) {
      return;
    }
    const t = setTimeout(
      () => scrollRef.current?.scrollToEnd({ animated: !reduce }),
      60,
    );
    return () => clearTimeout(t);
  }, [keyboardUp, reduce]);

  // Mark the chat read on open.
  useEffect(() => {
    markRead(chatId);
  }, [chatId, markRead]);

  // The design re-scrolls to the end on open, on a new message and when
  // typing toggles: all of them change the content height.
  const toEnd = () => {
    scrollRef.current?.scrollToEnd({ animated: settled.current && !reduce });
    settled.current = true;
  };

  const submit = (text: string) => {
    send(text);
    setDraft('');
  };

  if (!chat) {
    return (
      <View style={styles.screen}>
        <Header
          variant="compact"
          barHeight={BAR_HEIGHT}
          onBack={nav.pop}
          floating={false}
        />
        <EmptyState
          icon="chat-circle-dots"
          title="This conversation isn't available"
        />
      </View>
    );
  }

  const call = () => toast.show(`Calling ${first}…`);

  return (
    <View style={styles.screen}>
      <KeyboardAvoidingView behavior="padding" style={styles.flex}>
        <ScrollView
          ref={scrollRef}
          style={styles.flex}
          contentContainerStyle={[
            styles.content,
            {
              paddingTop: insets.top + BAR_HEIGHT + 8,
              paddingBottom: composerH + 10,
            },
          ]}
          onContentSizeChange={toEnd}
          onLayout={() => scrollRef.current?.scrollToEnd({ animated: false })}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
        >
          <ChatIntro peer={peer} line={chatIntro(peer.mutualCount ?? 0)} />
          <Text style={styles.stamp}>{CHAT_DATE_STAMP}</Text>
          {chat.messages.map(m => (
            <Bubble key={m.id} text={m.text} mine={m.fromMe} />
          ))}
          {chat.typing ? <TypingDots /> : null}
        </ScrollView>
      </KeyboardAvoidingView>

      <Header
        variant="compact"
        barHeight={BAR_HEIGHT}
        backWidth={40}
        gap={6}
        onBack={nav.pop}
        right={
          <View style={styles.actions}>
            <IconButton
              icon="phone"
              iconSize={22}
              size={40}
              color={colors.accent}
              accessibilityLabel={`Call ${first}`}
              onPress={call}
            />
            <IconButton
              icon="video-camera"
              iconSize={23}
              size={40}
              color={colors.accent}
              accessibilityLabel={`Video call ${first}`}
              onPress={call}
            />
          </View>
        }
      >
        <ChatPeerTitle peer={peer} onPress={() => openProfile(chat.peerId)} />
      </Header>

      <ComposerBar
        tone="chat"
        value={draft}
        onChangeText={setDraft}
        onSend={submit}
        placeholder="Message"
        accessibilityLabel={`Message ${first}`}
        onHeight={setComposerH}
        top={
          smartReplies.length ? (
            <SmartReplies replies={smartReplies} onPick={submit} />
          ) : null
        }
        left={
          <IconButton
            icon="image-square"
            iconSize={23}
            size={38}
            color={colors.accent}
            accessibilityLabel="Add a photo"
            onPress={() => toast.show('Photo library opens here')}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  content: { paddingHorizontal: 14, gap: 5 },
  stamp: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.faint,
    textAlign: 'center',
    paddingTop: 4,
    paddingBottom: 8,
  },
  actions: { flexDirection: 'row', gap: 6 },
});
