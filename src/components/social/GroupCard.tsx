import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import type { Group } from '../../data/types';
import { colors, fonts, type } from '../../theme';
import { Button } from '../ui';

export const GROUP_CARD_WIDTH = 244;

export type GroupCardProps = {
  group: Group;
  joined: boolean;
  onToggleJoin: () => void;
};

/**
 * "Groups for you" card (SPEC 3.08): 244 wide, r20, 1px #E4E4E7 inner ring
 * drawn over the content; 112-tall cover; body p 11 12 12 with name /
 * members and Join / Joined (h32 r10, 13/600).
 */
export function GroupCard({ group, joined, onToggleJoin }: GroupCardProps) {
  return (
    <View style={styles.card}>
      <Image
        source={{ uri: group.imageUrl }}
        style={styles.image}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
      />
      <View style={styles.body}>
        <View style={styles.text}>
          <Text style={styles.name} numberOfLines={1}>
            {group.name}
          </Text>
          <Text style={type.caption} numberOfLines={1}>
            {group.membersLabel}
          </Text>
        </View>
        <Button
          size="xs"
          variant={joined ? 'muted' : 'primary'}
          label={joined ? 'Joined' : 'Join'}
          accessibilityLabel={
            joined ? `Leave ${group.name}` : `Join ${group.name}`
          }
          highlight={false}
          onPress={onToggleJoin}
        />
      </View>
      <View style={styles.ring} pointerEvents="none" />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: GROUP_CARD_WIDTH,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: colors.bg,
  },
  ring: {
    ...StyleSheet.absoluteFill,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.line,
  },
  image: { width: '100%', height: 112, backgroundColor: colors.line },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 11,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  text: { flex: 1, minWidth: 0 },
  name: { fontFamily: fonts.semibold, fontSize: 14.5, color: colors.ink },
});
