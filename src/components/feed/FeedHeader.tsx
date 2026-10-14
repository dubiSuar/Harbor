import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, layout, shadow, type } from '../../theme';
import { Icon, Logo, PressableScale, UnreadDot, VignetteBlur } from '../ui';

/** The zone is 132 in the design, 82 of it below the 50 status bar. */
const ZONE_BELOW_BAR = layout.feedHeaderZone - 50;
type Props = {
  /** The bell number; hidden at 0. */
  unreadCount: number;
  /** Any unread chat: shows the dot on the messages button. */
  unreadMessages: boolean;
  onNotifications: () => void;
  onMessages: () => void;
};

/**
 * The feed's floating header (SPEC 3.04): a white fade zone (DECISIONS #1:
 * gradient only, no blur) under a row of white pills at top 52: the
 * "Home" pill with the logo, then the bell pill with the unread count and
 * the round messages button with its dot (only while a chat is unread). Only the pills take
 * touches; the feed scrolls under everything.
 */
export function FeedHeader({
  unreadCount,
  unreadMessages,
  onNotifications,
  onMessages,
}: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View pointerEvents="box-none" style={styles.root}>
      <VignetteBlur
        edge="top"
        style={[styles.zone, { height: insets.top + ZONE_BELOW_BAR }]}
      />
      <View
        pointerEvents="box-none"
        style={[styles.row, { top: insets.top + 2 }]}
      >
        <View
          style={[styles.pill, styles.homePill]}
          accessible
          accessibilityRole="header"
          accessibilityLabel="Home"
        >
          <Logo size={32} />
          <Text style={type.headerPill}>Home</Text>
        </View>
        <View style={styles.right}>
          <PressableScale
            onPress={onNotifications}
            pressedScale={0.94}
            accessibilityLabel={
              unreadCount > 0
                ? `Notifications, ${unreadCount} new`
                : 'Notifications'
            }
            style={[styles.pill, styles.bell]}
          >
            <Icon name="bell" size={21} />
            {unreadCount > 0 ? (
              <Text style={styles.count}>{unreadCount}</Text>
            ) : null}
          </PressableScale>
          <PressableScale
            onPress={onMessages}
            pressedScale={0.94}
            accessibilityLabel={
              unreadMessages ? 'Messages, unread chats' : 'Messages'
            }
            style={[styles.pill, styles.messages]}
          >
            <Icon name="chat-circle-dots" size={21} />
            {unreadMessages ? (
              <UnreadDot size={9} ring style={styles.dot} />
            ) : null}
          </PressableScale>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20 },
  zone: { position: 'absolute', top: 0, left: 0, right: 0 },
  row: {
    position: 'absolute',
    left: 16,
    right: 16,
    height: layout.headerPillH,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pill: {
    height: layout.headerPillH,
    borderRadius: 22,
    backgroundColor: colors.bg,
    boxShadow: shadow.pill,
    flexDirection: 'row',
    alignItems: 'center',
  },
  homePill: { gap: 8, paddingLeft: 6, paddingRight: 16 },
  right: { flexDirection: 'row', gap: 8 },
  bell: { minWidth: 44, paddingHorizontal: 14, gap: 6 },
  count: { ...type.button, fontSize: 14 },
  messages: { width: 44, justifyContent: 'center' },
  dot: { position: 'absolute', top: 8, right: 9 },
});
