import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { FriendStatus, User } from '../../data/types';
import { colors, fonts, type } from '../../theme';
import { Avatar, Button, FadeIn, PressableScale } from '../ui';

export type PersonRowProps = {
  user: User;
  status: FriendStatus;
  /** Avatar and name: opens their profile. Called with the user id. */
  onOpen: (userId: string) => void;
  /** "Add friend" / "Requested" toggle (status none / requested). */
  onToggleRequest: (userId: string) => void;
  /** Accept their pending request (status incoming). */
  onConfirm: (userId: string) => void;
};

/**
 * Explore search result (SPEC 3.08): avatar 48, name 15/600 over
 * "{mutual} mutual friends" 13 #71717A, and the friend action (h34 r11).
 * The avatar and name open the profile; the friend button is a separate
 * target. Memoised: the callbacks take the user id.
 */
export const PersonRow = memo(function PersonRowImpl({
  user,
  status,
  onOpen,
  onToggleRequest,
  onConfirm,
}: PersonRowProps) {
  const mutual = `${user.mutualCount ?? 0} mutual friends`;
  const id = user.id;
  return (
    <FadeIn duration={300} style={styles.row}>
      <PressableScale
        onPress={() => onOpen(id)}
        pressedScale={0.98}
        accessibilityLabel={`View ${user.name}'s profile. ${mutual}`}
        style={styles.open}
      >
        <Avatar uri={user.photoUrl} name={user.name} size={48} />
        <View style={styles.text}>
          <Text style={styles.name} numberOfLines={1}>
            {user.name}
          </Text>
          <Text style={type.meta} numberOfLines={1}>
            {mutual}
          </Text>
        </View>
      </PressableScale>
      {status === 'friend' ? (
        <View style={styles.friends}>
          <Text style={styles.friendsText}>Friends</Text>
        </View>
      ) : status === 'incoming' ? (
        <Button
          size="sm"
          variant="tint"
          label="Confirm"
          accessibilityLabel={`Confirm ${user.name}'s friend request`}
          onPress={() => onConfirm(id)}
        />
      ) : (
        <Button
          size="sm"
          variant={status === 'requested' ? 'muted' : 'tint'}
          label={status === 'requested' ? 'Requested' : 'Add friend'}
          accessibilityLabel={
            status === 'requested'
              ? `Cancel friend request to ${user.name}`
              : `Add ${user.name} as a friend`
          }
          onPress={() => onToggleRequest(id)}
        />
      )}
    </FadeIn>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 9,
  },
  open: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  text: { flex: 1, minWidth: 0 },
  name: { ...type.name, letterSpacing: 0 },
  friends: {
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 11,
    backgroundColor: colors.fill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  friendsText: {
    fontFamily: fonts.semibold,
    fontSize: 13.5,
    color: colors.sub,
  },
});
