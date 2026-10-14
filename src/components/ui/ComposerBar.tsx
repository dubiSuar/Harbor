import React, { forwardRef } from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type TextInputInstance,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../../theme';
import { useKeyboard } from '../useKeyboard';
import { IconButton } from './IconButton';

export type ComposerBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  /** Called with the trimmed text on Send or the keyboard's send key. Ignored when empty. */
  onSend: (text: string) => void;
  placeholder: string;
  /** Left slot: my 34 avatar (post) or the 38 photo button (chat). */
  left?: React.ReactNode;
  /** Above the input row: smart-reply chips (chat). */
  top?: React.ReactNode;
  /** 'post' rgba(255,255,255,.86) + top hairline, p 10 12; 'chat' .88, p 8 12. */
  tone?: 'post' | 'chat';
  /** Reports the bar's height so the scroll can pad its bottom. */
  onHeight?: (height: number) => void;
  /** Input focus / blur (e.g. pause something). */
  onFocus?: () => void;
  onBlur?: () => void;
  /** Caps typed text (comments: 500). Programmatic values are not cut. */
  maxLength?: number;
  /** False locks the input (default true). */
  editable?: boolean;
  /** Focuses the input on mount. */
  autoFocus?: boolean;
  /**
   * Blocks sending (e.g. while a comment is in flight, or before the post
   * has loaded): Send greys out and the keyboard's send key does nothing.
   * Typing still works.
   */
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

/**
 * The frosted bottom composer of Post and Chat (SPEC 3.05 / 3.10): row
 * gap 10 (post) / 8 (chat); input h40 r20 #F4F4F5 p0 16 15px; round send
 * 40 with paper-plane-right fill 19, #2F5BD3 with a draft else #D4D4D8,
 * press .9. Absolutely positioned at the bottom; rides the keyboard.
 * DECISIONS #1: semi-opaque white instead of blur.
 */
export const ComposerBar = forwardRef<TextInputInstance, ComposerBarProps>(
  function ComposerBarImpl(
    {
      value,
      onChangeText,
      onSend,
      placeholder,
      left,
      top,
      tone = 'post',
      onHeight,
      onFocus,
      onBlur,
      maxLength,
      editable = true,
      autoFocus,
      disabled = false,
      style,
      accessibilityLabel,
    },
    ref,
  ) {
    const insets = useSafeAreaInsets();
    const keyboard = useKeyboard();
    const canSend = !disabled && value.trim().length > 0;
    const send = () => {
      const clean = value.trim();
      if (clean && !disabled) {
        onSend(clean);
      }
    };
    // Rides the keyboard; at rest it clears the home indicator.
    const lift = {
      bottom: keyboard.visible ? keyboard.height : 0,
      paddingBottom: keyboard.visible ? KEYBOARD_PAD : restPad(insets.bottom),
    };
    return (
      <View
        onLayout={(e: LayoutChangeEvent) =>
          onHeight?.(e.nativeEvent.layout.height)
        }
        style={[
          styles.bar,
          tone === 'post' ? styles.post : styles.chat,
          lift,
          style,
        ]}
      >
        {top}
        <View
          style={[
            styles.row,
            tone === 'post' ? styles.rowPost : styles.rowChat,
          ]}
        >
          {left}
          <TextInput
            ref={ref}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={colors.faint}
            returnKeyType="send"
            onSubmitEditing={send}
            submitBehavior="submit"
            onFocus={onFocus}
            onBlur={onBlur}
            maxLength={maxLength}
            editable={editable}
            autoFocus={autoFocus}
            accessibilityLabel={accessibilityLabel ?? placeholder}
            style={styles.input}
          />
          <IconButton
            icon="paper-plane-right"
            weight="fill"
            iconSize={19}
            color={colors.onAccent}
            size={40}
            background={canSend ? colors.accent : colors.border}
            pressedScale={0.9}
            spring
            disabled={!canSend}
            accessibilityLabel="Send"
            onPress={send}
          />
        </View>
      </View>
    );
  },
);

/** Bottom padding while the keyboard is up. */
const KEYBOARD_PAD = 10;
/**
 * Bottom padding at rest: the design's 30 on a device with a home indicator
 * (a 34 inset), 16 without one. Same mapping as the tab bar's offset.
 */
const restPad = (insetBottom: number) => Math.max(insetBottom - 4, 16);

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 20,
    paddingHorizontal: 12,
  },
  post: {
    paddingTop: 10,
    backgroundColor: colors.barComposer,
    borderTopWidth: 1,
    borderTopColor: colors.ring06,
  },
  chat: { paddingTop: 8, backgroundColor: colors.barChat },
  row: { flexDirection: 'row', alignItems: 'center' },
  rowPost: { gap: 10 },
  rowChat: { gap: 8 },
  input: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.fill,
    paddingHorizontal: 16,
    paddingVertical: 0,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.ink,
  },
});
