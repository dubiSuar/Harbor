import React, { useCallback, useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ScrollViewInstance,
} from 'react-native';

import { useTabBarClearance } from '../navigation/insets';
import { useScrollToTop } from '../navigation/TabBarContext';
import { useOpenProfile } from '../navigation/useOpenProfile';
import {
  EmptyState,
  Chip,
  Header,
  Overline,
  PressableScale,
  SearchField,
  useReduceMotion,
  useToast,
} from '../components/ui';
import {
  GROUP_CARD_WIDTH,
  GroupCard,
  MasonryGrid,
  PersonRow,
} from '../components/social';
import { exploreTileUrl } from '../data/social';
import { firstNameOf, type ExploreTile } from '../data/types';
import {
  useFriends,
  useGroups,
  usePeople,
  usePeopleSearch,
} from '../state/SocialContext';
import { colors, fonts, type } from '../theme';

const RAIL_GAP = 10;
/** The ~18-tall "See all" link, padded to a 44 target. */
const SEE_ALL_SLOP = { top: 13, bottom: 13, left: 8, right: 8 };

/** Explore tab (SPEC 3.08): search people, topics, groups and the masonry. */
export function ExploreScreen() {
  const clearance = useTabBarClearance(8);
  const toast = useToast();
  const reduce = useReduceMotion();
  const scrollRef = useRef<ScrollViewInstance>(null);
  useScrollToTop('explore', () =>
    scrollRef.current?.scrollTo({ y: 0, animated: !reduce }),
  );

  const [q, setQ] = useState('');
  const [topic, setTopic] = useState(0);
  const searching = q.trim().length > 0;
  const people = usePeopleSearch(q);
  const person = usePeople();
  const friends = useFriends();
  const { groups, topics, exploreGrid, isJoined, toggleJoin } = useGroups();

  const openProfile = useOpenProfile();
  // Id-based and stable while the friend state is unchanged, so the
  // memoised rows skip renders as the query changes.
  const { pendingRequests, acceptRequest, toggleRequest } = friends;
  const confirm = useCallback(
    (userId: string) => {
      const req = pendingRequests.find(r => r.fromId === userId);
      if (req) {
        acceptRequest(req.id);
        toast.show(
          `You and ${firstNameOf(person(userId).name)} are now friends`,
        );
      }
    },
    [pendingRequests, acceptRequest, person, toast],
  );
  const toggle = useCallback(
    (userId: string) => {
      toggleRequest(userId);
    },
    [toggleRequest],
  );

  const urlOf = useCallback(
    (tile: ExploreTile) => exploreTileUrl(tile, topic),
    [topic],
  );

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.screen}
      contentContainerStyle={{ paddingBottom: clearance }}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      showsVerticalScrollIndicator={false}
    >
      <Header variant="large" title="Explore" />
      <SearchField
        value={q}
        onChangeText={setQ}
        placeholder="Search people, groups, posts"
        accessibilityLabel="Search people, groups, posts"
        containerStyle={styles.search}
      />

      {searching ? (
        <View style={styles.results}>
          <Overline tight padding={{ top: 0, horizontal: 0, bottom: 6 }}>
            People
          </Overline>
          {people.map(u => (
            <PersonRow
              key={u.id}
              user={u}
              status={friends.statusOf(u.id)}
              onOpen={openProfile}
              onToggleRequest={toggle}
              onConfirm={confirm}
            />
          ))}
          {people.length === 0 ? (
            <EmptyState
              title={`No one matches "${q}"`}
              body="Try a first name, or search a group."
            />
          ) : null}
        </View>
      ) : (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.topics}
          >
            {topics.map((t, i) => (
              <Chip
                key={t}
                label={t}
                selected={i === topic}
                onPress={() => setTopic(i)}
              />
            ))}
          </ScrollView>

          <View style={styles.sectionHead}>
            <Text style={type.section} accessibilityRole="header">
              Groups for you
            </Text>
            <PressableScale
              onPress={() => toast.show('All groups open here')}
              pressedScale={0.96}
              hitSlop={SEE_ALL_SLOP}
              accessibilityLabel="See all groups"
            >
              <Text style={styles.seeAll}>See all</Text>
            </PressableScale>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.rail}
            snapToInterval={GROUP_CARD_WIDTH + RAIL_GAP}
            snapToAlignment="start"
            decelerationRate="fast"
          >
            {groups.map(g => (
              <GroupCard
                key={g.id}
                group={g}
                joined={isJoined(g.id)}
                onToggleJoin={() => {
                  if (toggleJoin(g.id)) {
                    toast.show(`Joined ${g.name}`);
                  }
                }}
              />
            ))}
          </ScrollView>

          <Text style={styles.gridTitle} accessibilityRole="header">
            {topic === 0 ? 'Photos from friends' : topics[topic]}
          </Text>
          <MasonryGrid tiles={exploreGrid} urlOf={urlOf} person={person} />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  search: { marginTop: 12, marginHorizontal: 16 },
  results: { paddingTop: 18, paddingHorizontal: 16 },
  topics: {
    gap: 8,
    paddingTop: 14,
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingTop: 18,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  seeAll: { fontFamily: fonts.semibold, fontSize: 14, color: colors.accent },
  rail: { gap: RAIL_GAP, paddingHorizontal: 16, paddingBottom: 4 },
  gridTitle: {
    ...type.section,
    paddingTop: 22,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
});
