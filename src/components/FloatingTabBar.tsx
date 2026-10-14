import React from 'react';
import {
  LayoutAnimation,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import type { TabKey } from '../navigation/TabBarContext';
import {
  FAB_SIZE,
  TAB_BAR_GAP,
  TAB_BAR_HEIGHT,
  TAB_BAR_SIDE,
  TAB_ZONE_HEIGHT,
  useTabBarOffset,
} from '../navigation/insets';
import { colors, duration, fonts, shadow } from '../theme';
import { Icon, type PhosphorName } from './Icon';
import {
  Avatar,
  FadeIn,
  Gradient,
  PressableScale,
  useReduceMotion,
} from './ui';

export type { TabKey } from '../navigation/TabBarContext';

type Item = { key: TabKey; label: string; icon?: PhosphorName };

const ITEMS: Item[] = [
  { key: 'home', label: 'Home', icon: 'house' },
  { key: 'explore', label: 'Explore', icon: 'compass' },
  { key: 'brief', label: 'Brief', icon: 'sparkle' },
  { key: 'profile', label: 'Profile' },
];

/** DECISIONS #1: gradient-only zone (no blur package). */
const ZONE_STOPS = [
  { offset: 0, color: 'rgba(255,255,255,0.92)' },
  { offset: 0.55, color: 'rgba(255,255,255,0.5)' },
  { offset: 1, color: 'rgba(255,255,255,0)' },
];

/**
 * Narrow screens. The pill is W - 104 wide (16 + 16 sides, 10 gap, 62 FAB)
 * and needs 14 (padding) + 6 (three 2 gaps) plus its items. Labels measured
 * from Geist-SemiBold 14 / -0.01em: Home 38.7, Explore 51.7, Brief 32.8,
 * Profile 44.7. Icons are 23, the avatar 26.
 * - At the design's paddings (16 active / 12 inactive) "Explore" active
 *   needs 20 + 114.7 + 47 + 47 + 50 = 278.7: fits the 286 pill at 390, but
 *   overflows below it.
 * - Below 390 (12 active / 8 inactive) it needs 20 + 106.7 + 39 + 39 + 42
 *   = 246.7: fits 375 (pill 271) and 360 (pill 256).
 * - Below 350 the active label hides (the design's 340 rule, moved up to
 *   where 246.7 stops fitting): 20 + 47 + 39 + 39 + 42 = 187 fits 320
 *   (pill 216).
 * Items also shrink (flexShrink 1, minWidth 44) as a last resort.
 */
const NARROW = 390;
const TINY = 350;

type Props = {
  active: TabKey;
  /** Tap on a tab (including the active one: the caller scrolls to top). */
  onChange: (tab: TabKey) => void;
  /** The create FAB. */
  onCreate: () => void;
  /** Photo for the Profile (avatar) tab. */
  avatarUri?: string;
  avatarName?: string;
};

/**
 * The tab bar (SPEC 4.1), rendered as a full-screen, touch-through overlay
 * by MainTabs: a 140-tall white fade zone at the bottom, then a row at
 * left / right 16 and bottom `useTabBarOffset()` holding the dark pill
 * (flex 1, h62, r31, #18181B, padding 7, gap 2, `tabBar` shadow) and the
 * 62x62 create FAB. Items are left-packed as in the design (DECISIONS #13):
 * active = white pill, padding 16, fill icon + 14/600 label; inactive =
 * transparent, padding 12, regular icon at rgba(255,255,255,.72). The
 * profile item is the 26px avatar with a 2px ink ring when active.
 */
export function FloatingTabBar({
  active,
  onChange,
  onCreate,
  avatarUri,
  avatarName,
}: Props) {
  const offset = useTabBarOffset();
  const reduce = useReduceMotion();
  const { width } = useWindowDimensions();
  const narrow = width < NARROW;
  const showLabel = width >= TINY;

  // Animate the active pill's width change (the design's `all .45s`).
  const select = (key: TabKey) => {
    if (!reduce && key !== active) {
      LayoutAnimation.configureNext({
        duration: duration.tab,
        update: { type: LayoutAnimation.Types.easeInEaseOut },
      });
    }
    onChange(key);
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Gradient direction="up" stops={ZONE_STOPS} style={styles.zone} />
      <View style={[styles.row, { bottom: offset }]} pointerEvents="box-none">
        <View style={styles.pill} accessibilityRole="tablist">
          {ITEMS.map(item => {
            const on = item.key === active;
            const fg = on ? colors.ink : colors.onInkMuted;
            return (
              <PressableScale
                key={item.key}
                onPress={() => select(item.key)}
                pressedScale={0.94}
                accessibilityRole="tab"
                accessibilityLabel={item.label}
                accessibilityState={{ selected: on }}
                style={[
                  styles.item,
                  on ? styles.itemOn : styles.itemOff,
                  narrow && (on ? styles.itemOnNarrow : styles.itemOffNarrow),
                ]}
              >
                {item.icon ? (
                  <Icon
                    name={item.icon}
                    weight={on ? 'fill' : 'regular'}
                    size={23}
                    color={fg}
                  />
                ) : (
                  <Avatar
                    uri={avatarUri}
                    name={avatarName}
                    size={26}
                    ring={{
                      width: 2,
                      color: on ? colors.ink : 'transparent',
                    }}
                  />
                )}
                {on && showLabel ? (
                  <FadeIn duration={250} style={styles.labelWrap}>
                    <Text style={styles.label} numberOfLines={1}>
                      {item.label}
                    </Text>
                  </FadeIn>
                ) : null}
              </PressableScale>
            );
          })}
        </View>
        <PressableScale
          onPress={onCreate}
          pressedScale={0.9}
          pressedRotate={90}
          spring
          accessibilityLabel="Create post"
          style={styles.fab}
        >
          <Icon name="plus" size={26} color={colors.onAccent} />
        </PressableScale>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  zone: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: TAB_ZONE_HEIGHT,
  },
  row: {
    position: 'absolute',
    left: TAB_BAR_SIDE,
    right: TAB_BAR_SIDE,
    flexDirection: 'row',
    alignItems: 'center',
    gap: TAB_BAR_GAP,
  },
  pill: {
    flex: 1,
    height: TAB_BAR_HEIGHT,
    borderRadius: TAB_BAR_HEIGHT / 2,
    backgroundColor: colors.ink,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 7,
    gap: 2,
    boxShadow: shadow.tabBar,
  },
  item: {
    height: 48,
    minWidth: 44,
    flexShrink: 1,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  itemOn: { backgroundColor: colors.bg, paddingHorizontal: 16 },
  itemOff: { backgroundColor: 'transparent', paddingHorizontal: 12 },
  itemOnNarrow: { paddingHorizontal: 12 },
  itemOffNarrow: { paddingHorizontal: 8 },
  labelWrap: { flexShrink: 1 },
  label: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    letterSpacing: -0.14,
    color: colors.ink,
  },
  fab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: shadow.fab,
  },
});
