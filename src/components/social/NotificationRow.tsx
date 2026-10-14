import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import {
  NOTIFICATION_ICON,
  type AppNotification,
  type User,
} from '../../data/types';
import { colors, ease, fonts, type } from '../../theme';
import {
  Avatar,
  Button,
  ButtonRow,
  IconBadge,
  PressableScale,
  useReduceMotion,
} from '../ui';

export type NotificationRowProps = {
  item: AppNotification;
  actor: User;
  /** Opens the linked post or the actor's profile. */
  onPress: () => void;
  /** What the row opens, for the accessibility hint. */
  opensLabel: string;
  onConfirm?: () => void;
  onDelete?: () => void;
};

const KIND_LABEL: Record<AppNotification['kind'], string> = {
  like: 'Like',
  comment: 'Comment',
  event: 'Invite',
  request: 'Friend request',
  group: 'Group',
  mention: 'Mention',
  follow: 'Follow',
  commentLike: 'Like',
};

/**
 * Notification row (SPEC 3.11): p 10 16, gap 12; avatar 54 with the kind
 * badge at right -3 / bottom -3; 14.5 / lh 1.4 text with the name in 600
 * ink; 12.5/500 time (accent while unread). Unread rows sit on #F5F7FE,
 * fading out over .4s on Mark all read (an opacity overlay, so it runs on
 * the native driver). Pending friend requests show Confirm / Delete.
 */
export function NotificationRow({
  item,
  actor,
  onPress,
  opensLabel,
  onConfirm,
  onDelete,
}: NotificationRowProps) {
  const reduce = useReduceMotion();
  const tint = useRef(new Animated.Value(item.unread ? 1 : 0)).current;
  useEffect(() => {
    const anim = Animated.timing(tint, {
      toValue: item.unread ? 1 : 0,
      duration: reduce ? 0 : 400,
      easing: ease.css,
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [item.unread, reduce, tint]);

  const showActions =
    item.kind === 'request' && item.requestState === 'pending';

  return (
    <View style={styles.wrap}>
      <Animated.View
        pointerEvents="none"
        style={[styles.tint, { opacity: tint }]}
      />
      <PressableScale
        onPress={onPress}
        pressedScale={0.98}
        accessibilityLabel={`${KIND_LABEL[item.kind]}${
          item.unread ? ', new' : ''
        }. ${actor.name} ${item.text} ${item.timeLabel}`}
        accessibilityHint={opensLabel}
        style={styles.row}
      >
        <View style={styles.avatar}>
          <Avatar uri={actor.photoUrl} name={actor.name} size={54} />
          <IconBadge icon={NOTIFICATION_ICON[item.kind]} style={styles.badge} />
        </View>
        <View style={styles.body}>
          <Text style={type.comment}>
            <Text style={styles.name}>{actor.name}</Text> {item.text}
          </Text>
          <Text style={[styles.time, item.unread ? styles.timeUnread : null]}>
            {item.timeLabel}
          </Text>
        </View>
      </PressableScale>
      {showActions ? (
        <ButtonRow style={styles.actions}>
          <Button
            flex
            size="confirm"
            label="Confirm"
            accessibilityLabel={`Confirm ${actor.name}'s friend request`}
            onPress={onConfirm}
          />
          <Button
            flex
            size="confirm"
            variant="soft"
            label="Delete"
            accessibilityLabel={`Delete ${actor.name}'s friend request`}
            onPress={onDelete}
          />
        </ButtonRow>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingVertical: 10, paddingHorizontal: 16 },
  row: { flexDirection: 'row', gap: 12 },
  tint: { ...StyleSheet.absoluteFill, backgroundColor: colors.aiSurface },
  avatar: { width: 54, height: 54 },
  badge: { position: 'absolute', right: -3, bottom: -3 },
  body: { flex: 1, minWidth: 0 },
  name: { fontFamily: fonts.semibold, color: colors.ink },
  time: {
    fontFamily: fonts.medium,
    fontSize: 12.5,
    marginTop: 2,
    color: colors.muted,
  },
  timeUnread: { color: colors.accent },
  // Under the text column: avatar 54 + gap 12.
  actions: { marginTop: 9, marginLeft: 66 },
});
