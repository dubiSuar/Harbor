import React, { memo } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { firstNameOf, type Story, type User } from '../../data/types';
import { colors, fonts, shadow } from '../../theme';
import { Avatar, Gradient, Icon, PressableScale } from '../ui';

const CARD_W = 104;
const CARD_H = 172;
const SCRIM = [
  { offset: 0.45, color: 'rgba(24,24,27,0)' },
  { offset: 1, color: 'rgba(24,24,27,0.6)' },
];

type Props = {
  stories: Story[];
  isSeen: (storyId: string) => boolean;
  person: (userId: string) => User;
  /** My photo (`useMe().photoUrl`) on the "Create story" card. */
  mePhotoUrl?: string;
  onCreate: () => void;
  /** Index into `stories` (the Story route's `index`). */
  onOpen: (index: number) => void;
};

/**
 * Stories rail (SPEC 3.04 #2): horizontal, gap 8, padding 0 16 16. A
 * "Create story" card, then one 104x172 r18 card per story with a dark
 * fade, the author's avatar ringed accent (unseen) or grey (seen), and
 * their first name. Cards press to .96.
 */
export const StoryRail = memo(function StoryRailImpl({
  stories,
  isSeen,
  person,
  mePhotoUrl,
  onCreate,
  onOpen,
}: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.rail}
      accessibilityLabel="Stories"
    >
      <PressableScale
        onPress={onCreate}
        pressedScale={0.96}
        accessibilityLabel="Create story"
        style={[styles.card, styles.create]}
      >
        {mePhotoUrl ? (
          <Image
            source={{ uri: mePhotoUrl }}
            style={styles.createImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.createImage} />
        )}
        <View style={styles.plus}>
          <Icon name="plus" weight="bold" size={16} color={colors.onAccent} />
        </View>
        <Text style={styles.createLabel}>Create story</Text>
      </PressableScale>
      {stories.map((story, i) => {
        const author = person(story.authorId);
        const first = firstNameOf(author.name);
        const seen = isSeen(story.id);
        return (
          <PressableScale
            key={story.id}
            onPress={() => onOpen(i)}
            pressedScale={0.96}
            accessibilityLabel={`${first}'s story${seen ? ', seen' : ''}`}
            style={[styles.card, styles.story]}
          >
            <Image
              source={{ uri: story.imageUrl }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />
            <Gradient stops={SCRIM} style={StyleSheet.absoluteFill} />
            <Avatar
              uri={author.photoUrl}
              name={author.name}
              size={36}
              story={seen ? 'seen' : 'unseen'}
              style={styles.avatar}
            />
            <Text style={styles.name} numberOfLines={1}>
              {first}
            </Text>
          </PressableScale>
        );
      })}
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  rail: { gap: 8, paddingHorizontal: 16, paddingBottom: 16 },
  card: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: 18,
    overflow: 'hidden',
  },
  create: {
    backgroundColor: colors.bg,
    boxShadow: shadow.ringLine,
  },
  createImage: {
    width: '100%',
    height: 118,
    backgroundColor: colors.line,
  },
  plus: {
    position: 'absolute',
    top: 102,
    left: (CARD_W - 32) / 2,
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: colors.bg,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createLabel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 12,
    textAlign: 'center',
    fontFamily: fonts.semibold,
    fontSize: 12.5,
    color: colors.ink,
  },
  story: { backgroundColor: colors.line },
  avatar: { position: 'absolute', top: 8, left: 8 },
  name: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 10,
    fontFamily: fonts.semibold,
    fontSize: 12.5,
    color: colors.onAccent,
  },
});
