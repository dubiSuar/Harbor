import React, { memo, useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import type { BriefItem, User } from '../../data/types';
import { colors, duration, ease, fonts, type } from '../../theme';
import {
  AICard,
  Avatar,
  Button,
  FadeIn,
  Icon,
  PressableScale,
  ShimmerLines,
  useReduceMotion,
} from '../ui';

type Props = {
  /** "While you were away · 23 posts". */
  subtitle: string;
  /** "AI · may miss context". */
  note: string;
  items: BriefItem[];
  loading: boolean;
  open: boolean;
  onToggle: () => void;
  onRefresh: () => void;
  onFullBrief: () => void;
  person: (userId: string) => User;
};

/**
 * The feed's Harbor Brief card (SPEC 3.04 #3), in its 8px #F4F4F5 section:
 * r22 AI surface. The header toggles the body and turns the caret 180deg
 * (400 ms smooth). The body fades in (300 ms) with three shimmer lines
 * while loading, else the brief lines, then Refresh / Full brief and the
 * AI note.
 */
export const BriefCard = memo(function BriefCardImpl({
  subtitle,
  note,
  items,
  loading,
  open,
  onToggle,
  onRefresh,
  onFullBrief,
  person,
}: Props) {
  const reduce = useReduceMotion();
  const turn = useRef(new Animated.Value(open ? 1 : 0)).current;
  useEffect(() => {
    const anim = Animated.timing(turn, {
      toValue: open ? 1 : 0,
      duration: reduce ? 0 : duration.knob,
      easing: ease.smooth,
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [open, reduce, turn]);
  const rotate = turn.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <View style={styles.section}>
      <AICard
        header="badge"
        title="Harbor Brief"
        subtitle={subtitle}
        radius={22}
        padding={{ top: 14, horizontal: 14, bottom: 12 }}
        headerPress={{
          onPress: onToggle,
          accessibilityLabel: `Harbor Brief. ${subtitle}`,
          accessibilityHint: open ? 'Collapses the Brief' : 'Expands the Brief',
          expanded: open,
        }}
        right={
          <Animated.View style={{ transform: [{ rotate }] }}>
            <Icon name="caret-down" size={18} color={colors.sub} />
          </Animated.View>
        }
      >
        {open ? (
          <FadeIn duration={duration.fadeSm} style={styles.body}>
            {loading ? (
              <ShimmerLines />
            ) : (
              items.map((item, i) => {
                const author = person(item.authorId);
                return (
                  <View key={`${i}-${item.authorId}`} style={styles.item}>
                    <Avatar
                      uri={author.photoUrl}
                      name={author.name}
                      size={22}
                      style={styles.itemAvatar}
                    />
                    <Text style={[type.bodySm, styles.flex]}>{item.text}</Text>
                  </View>
                );
              })
            )}
            <View style={styles.footer}>
              <Button
                variant="ai"
                size="xs"
                label="Refresh"
                icon="arrow-clockwise"
                iconSize={13}
                pressedScale={0.96}
                loading={loading}
                accessibilityLabel="Refresh the Brief"
                onPress={onRefresh}
                style={styles.refresh}
              />
              <PressableScale
                onPress={onFullBrief}
                pressedScale={1}
                accessibilityLabel="Full brief"
                accessibilityHint="Opens the Brief tab"
                hitSlop={SLOP}
                style={[styles.footerButton, styles.full]}
              >
                <Text style={styles.footerLabel}>Full brief</Text>
                <Icon name="arrow-right" size={13} color={colors.accentInk} />
              </PressableScale>
              <Text style={styles.note} numberOfLines={1}>
                {note}
              </Text>
            </View>
          </FadeIn>
        ) : null}
      </AICard>
    </View>
  );
});

/** The 32-tall footer buttons, padded to 44. */
const SLOP = { top: 6, bottom: 6 };

const styles = StyleSheet.create({
  section: {
    borderTopWidth: 8,
    borderTopColor: colors.fill,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  flex: { flex: 1 },
  body: { marginTop: 12, gap: 11 },
  item: { flexDirection: 'row', alignItems: 'flex-start', gap: 9 },
  itemAvatar: { marginTop: 1 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  footerButton: {
    flexShrink: 0,
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  refresh: { flexShrink: 0, paddingHorizontal: 12 },
  full: { gap: 4 },
  footerLabel: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.accentInk,
  },
  // At 320-360 the note gives way first: one line, ellipsised.
  note: {
    flexShrink: 1,
    marginLeft: 'auto',
    textAlign: 'right',
    fontFamily: fonts.regular,
    fontSize: 11.5,
    color: colors.muted,
  },
});
