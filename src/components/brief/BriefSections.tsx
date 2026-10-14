import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { PhosphorName } from '../Icon';
import type { User } from '../../data/types';
import { colors, fonts } from '../../theme';
import {
  Avatar,
  Button,
  FadeIn,
  Icon,
  PressableScale,
  Shimmer,
  ShimmerLines,
} from '../ui';

export type BriefRow = { key: string; person: User; text: string };

/**
 * WHAT YOU MISSED card (SPEC 3.12 item 5): r20, 1px #E4E4E7 ring, rows
 * of avatar 30, 14.5/1.42 text and a caret; every row has the bottom
 * hairline. While the AI regenerates, shimmer rows stand in.
 */
export function BriefList({
  rows,
  loading,
  onOpen,
}: {
  rows: BriefRow[];
  loading: boolean;
  onOpen: (row: BriefRow) => void;
}) {
  return (
    <View style={styles.card}>
      {loading
        ? Array.from({ length: rows.length || 3 }, (_, i) => (
            <View key={i} style={styles.row}>
              <Shimmer width={30} height={30} radius={15} />
              <ShimmerLines
                widths={['100%', '72%']}
                height={11}
                gap={8}
                style={styles.flex}
              />
            </View>
          ))
        : rows.map(r => (
            <FadeIn key={r.key}>
              <PressableScale
                onPress={() => onOpen(r)}
                pressedScale={1}
                pressedBg={colors.pressed}
                accessibilityLabel={r.text}
                accessibilityHint={`Opens ${r.person.name}'s post or profile`}
                style={styles.row}
              >
                <Avatar
                  uri={r.person.photoUrl}
                  name={r.person.name}
                  size={30}
                />
                <Text style={styles.text}>{r.text}</Text>
                <Icon
                  name="caret-right"
                  size={16}
                  color={colors.faint}
                  style={styles.caret}
                />
              </PressableScale>
            </FadeIn>
          ))}
    </View>
  );
}

/** COMING UP grid (SPEC 3.12 item 6): 2 static #F4F4F5 tiles. */
export function ComingUp({
  items,
}: {
  items: { icon: PhosphorName; title: string; sub: string }[];
}) {
  return (
    <View style={styles.grid}>
      {items.map(it => (
        <View
          key={it.title}
          style={styles.tile}
          accessible
          accessibilityLabel={`${it.title}, ${it.sub}`}
        >
          <Icon name={it.icon} size={22} color={colors.accent} />
          <Text style={styles.tileTitle}>{it.title}</Text>
          <Text style={styles.tileSub}>{it.sub}</Text>
        </View>
      ))}
    </View>
  );
}

/** WAITING ON YOU card (SPEC 3.12 item 7). */
export function WaitingOnYou({
  person,
  text,
  onReply,
}: {
  person: User;
  text: string;
  onReply: () => void;
}) {
  return (
    <View style={styles.waiting}>
      <Avatar uri={person.photoUrl} name={person.name} size={40} />
      <Text style={styles.waitingText}>{text}</Text>
      <Button
        size="sm"
        label="Reply"
        highlight={false}
        accessibilityLabel={`Reply to ${person.name}`}
        onPress={onReply}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: {
    marginHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  text: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 14.5,
    lineHeight: 20.59,
    color: colors.ink2,
  },
  caret: { marginTop: 6 },
  grid: { flexDirection: 'row', gap: 8, marginHorizontal: 16 },
  tile: {
    flex: 1,
    padding: 14,
    borderRadius: 18,
    backgroundColor: colors.fill,
  },
  tileTitle: {
    marginTop: 10,
    fontFamily: fonts.semibold,
    fontSize: 14.5,
    lineHeight: 18.85,
    color: colors.ink,
  },
  tileSub: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.muted,
  },
  waiting: {
    marginHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
  },
  waitingText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 19.6,
    color: colors.ink2,
  },
});
