import React, { useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { colors, duration, ease, fonts } from '../../theme';
import { useReduceMotion } from './motion';

export type BubbleProps = {
  text: string;
  /** My message: right-aligned, bottom-right corner 6. */
  mine: boolean;
  /**
   * 'chat' (SPEC 3.10): max 76%, p 9 14, 15/400 lh 20.7; mine #2F5BD3 /
   * white, theirs #F4F4F5 / ink.
   * 'ask' (SPEC 3.12): max 84%, p 10 14, 14.5/400 lh 21 #27272A; mine
   * #F4F4F5, Harbor #F5F7FE.
   */
  variant?: 'chat' | 'ask';
  /** Fade in on mount (`hb-fade .3s`). Default true. */
  animate?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Chat and Ask Harbor message bubble. Render inside a full-width column. */
export function Bubble({
  text,
  mine,
  variant = 'chat',
  animate = true,
  style,
}: BubbleProps) {
  const reduce = useReduceMotion();
  const fade = useRef(new Animated.Value(animate ? 0 : 1)).current;
  useEffect(() => {
    const anim = Animated.timing(fade, {
      toValue: 1,
      duration: reduce ? 0 : duration.fadeSm,
      easing: ease.css,
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [fade, reduce]);

  const chat = variant === 'chat';
  const bg = chat
    ? mine
      ? colors.accent
      : colors.fill
    : mine
    ? colors.fill
    : colors.aiSurface;
  const fg = chat ? (mine ? colors.onAccent : colors.ink) : colors.ink2;

  return (
    <Animated.View
      style={[
        styles.base,
        chat ? styles.chat : styles.ask,
        mine ? styles.mine : styles.theirs,
        { backgroundColor: bg, opacity: fade },
        style,
      ]}
    >
      <Text style={[chat ? styles.chatText : styles.askText, { color: fg }]}>
        {text}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  chat: { maxWidth: '76%', paddingVertical: 9, paddingHorizontal: 14 },
  ask: { maxWidth: '84%', paddingVertical: 10, paddingHorizontal: 14 },
  mine: {
    alignSelf: 'flex-end',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 6,
  },
  theirs: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 20,
  },
  chatText: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 20.7 },
  askText: { fontFamily: fonts.regular, fontSize: 14.5, lineHeight: 21 },
});
