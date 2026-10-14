import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  type ScrollViewInstance,
} from 'react-native';
import { AskHarbor } from '../components/brief/AskHarbor';
import {
  BriefList,
  ComingUp,
  WaitingOnYou,
  type BriefRow,
} from '../components/brief/BriefSections';
import { useKeyboard } from '../components/useKeyboard';
import {
  Header,
  Overline,
  SegmentedControl,
  SparkleBadge,
  useReduceMotion,
  useToast,
} from '../components/ui';
import { briefCopy, comingUp, waitingOnYou } from '../data/social';
import { useNav } from '../navigation/Navigator';
import { useTabBarClearance } from '../navigation/insets';
import { useScrollToTop } from '../navigation/TabBarContext';
import {
  useAsk,
  useBrief,
  useChats,
  usePeople,
  usePerson,
} from '../state/SocialContext';
import { useStore } from '../state/StoreContext';
import { colors, fonts } from '../theme';

const RANGES = ['Today', 'This week'];

/** Brief tab (SPEC 3.12): overview, What you missed, Coming up, Ask Harbor. */
export function BriefScreen() {
  const nav = useNav();
  const toast = useToast();
  const reduce = useReduceMotion();
  const clearance = useTabBarClearance(12);
  const keyboard = useKeyboard();
  const brief = useBrief();
  const ask = useAsk();
  const person = usePeople();
  const mateo = usePerson(waitingOnYou.personId);
  const { markRead } = useChats();
  const { posts } = useStore();
  const [range, setRange] = useState(0);
  const [draft, setDraft] = useState('');
  const [pulled, setPulled] = useState(false);
  const scrollRef = useRef<ScrollViewInstance>(null);

  useScrollToTop('brief', () =>
    scrollRef.current?.scrollTo({ y: 0, animated: true }),
  );

  // When the Ask thread grows, scroll to the end (design: smooth scroll).
  const count = ask.messages.length + (ask.loading ? 1 : 0);
  const prevCount = useRef(count);
  useEffect(() => {
    if (count > prevCount.current) {
      const t = setTimeout(
        () => scrollRef.current?.scrollToEnd({ animated: !reduce }),
        50,
      );
      prevCount.current = count;
      return () => clearTimeout(t);
    }
    prevCount.current = count;
  }, [count, reduce]);

  const items = range === 0 ? brief.today : brief.week;
  const rows = useMemo<BriefRow[]>(
    () =>
      items.map((b, i) => ({
        key: `${range}-${i}-${b.authorId}`,
        person: person(b.authorId),
        text: b.text,
      })),
    [items, range, person],
  );

  const open = (i: number) => {
    const item = items[i];
    if (!item) {
      return;
    }
    // The design opens the author's post if one exists, else the profile.
    const post =
      (item.postId && posts.find(p => p.id === item.postId)) ||
      posts.find(p => p.authorId === item.authorId);
    if (post) {
      nav.push({ name: 'Post', postId: post.id });
    } else {
      nav.push({ name: 'User', userId: item.authorId });
    }
  };

  const refresh = async () => {
    setPulled(true);
    try {
      await brief.regenerate();
    } catch {
      toast.show("Couldn't refresh the Brief", { icon: 'warning-circle' });
    } finally {
      setPulled(false);
    }
  };

  const reply = () => {
    markRead(waitingOnYou.chatId);
    nav.push({ name: 'Conversation', chatId: waitingOnYou.chatId });
  };

  const send = (q: string) => {
    if (!q.trim() || ask.loading) {
      return;
    }
    ask.ask(q);
    setDraft('');
  };

  // Tab panes are edge to edge, so the keyboard does not resize the window:
  // pad by its height (below) and bring the input into view on focus.
  const focusTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(focusTimer.current), []);
  const scrollToInput = () => {
    clearTimeout(focusTimer.current);
    focusTimer.current = setTimeout(
      () => scrollRef.current?.scrollToEnd({ animated: !reduce }),
      300,
    );
  };

  const bottom = keyboard.visible ? keyboard.height + 16 : clearance;

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.screen}
      contentContainerStyle={{ paddingBottom: bottom }}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={pulled && brief.loading}
          onRefresh={refresh}
          tintColor={colors.accent}
          colors={[colors.accent]}
          accessibilityLabel="Refresh the Brief"
        />
      }
    >
      <Header
        variant="large"
        title="Brief"
        leading={<SparkleBadge shape="square" />}
      />
      <Text style={styles.updated}>{briefCopy.updated}</Text>
      <SegmentedControl
        tabs={RANGES}
        index={range}
        onChange={setRange}
        style={styles.segmented}
      />

      <Overline>What you missed</Overline>
      <BriefList
        rows={rows}
        loading={brief.loading && range === 0}
        onOpen={row => open(rows.indexOf(row))}
      />

      <Overline>Coming up</Overline>
      <ComingUp items={comingUp} />

      <Overline>Waiting on you</Overline>
      <WaitingOnYou person={mateo} text={waitingOnYou.text} onReply={reply} />

      <AskHarbor
        messages={ask.messages}
        loading={ask.loading}
        suggestions={ask.suggestions}
        draft={draft}
        onDraftChange={setDraft}
        onAsk={send}
        onInputFocus={scrollToInput}
      />

      <Text style={styles.disclaimer}>{briefCopy.disclaimer}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  updated: {
    marginTop: 8,
    marginHorizontal: 16,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.muted,
  },
  segmented: { marginTop: 16, marginHorizontal: 16 },
  disclaimer: {
    marginTop: 12,
    marginHorizontal: 16,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 17.4,
    // It carries information, so it needs readable contrast (not #A1A1AA).
    color: colors.muted,
  },
});
