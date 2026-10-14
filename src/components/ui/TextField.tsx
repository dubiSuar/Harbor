import React, { forwardRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputInstance,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { colors, fonts, radius, type } from '../../theme';
import { Icon } from '../Icon';
import { IconButton } from './IconButton';

export type TextFieldProps = Omit<TextInputProps, 'style'> & {
  /** 13/600 #3F3F46 above the input. */
  label?: string;
  /** Red 1.5px border plus the message under the input. */
  error?: string;
  /** Prefix the error with `warning-circle` 13 (login yes, register no). */
  errorIcon?: boolean;
  /** Muted helper text under the input (hidden while there is an error). */
  helper?: string;
  /** Password field. With `secureToggle` it gets the eye button. */
  secure?: boolean;
  /** Eye / eye-slash toggle at right 6, top 6 (40x40, icon 20 #71717A). */
  secureToggle?: boolean;
  /** Content under the input, before the error (e.g. a strength meter). */
  below?: React.ReactNode;
  /**
   * Multiline mode (Edit profile bio): the input grows with its text from
   * a 52 minimum, with padding 14 16, top-aligned text and the `type.body`
   * line height. Set a taller floor with `inputStyle` (`minHeight`).
   */
  multiline?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  /** Extra style for the TextInput itself, merged last. */
  inputStyle?: StyleProp<TextStyle>;
};

/**
 * Auth input (SPEC 3.02): column gap 8; input height 52, radius 14,
 * #F4F4F5, 1.5px border transparent or #DC2626, padding 0 16, 16px text,
 * placeholder #A1A1AA. With `multiline` it grows with its text instead.
 * `helper` doubles as the default accessibilityHint.
 */
export const TextField = forwardRef<TextInputInstance, TextFieldProps>(
  function TextFieldImpl(
    {
      label,
      error,
      errorIcon = false,
      helper,
      secure = false,
      secureToggle = false,
      below,
      multiline = false,
      containerStyle,
      inputStyle,
      accessibilityLabel,
      accessibilityHint,
      ...input
    },
    ref,
  ) {
    const [shown, setShown] = useState(false);
    const hidden = secure && !shown;
    return (
      <View style={[styles.field, containerStyle]}>
        {label ? <Text style={type.label}>{label}</Text> : null}
        <View>
          <TextInput
            ref={ref}
            placeholderTextColor={colors.faint}
            secureTextEntry={hidden}
            autoCorrect={secure ? false : input.autoCorrect}
            accessibilityLabel={accessibilityLabel ?? label}
            accessibilityHint={accessibilityHint ?? helper}
            multiline={multiline}
            textAlignVertical={multiline ? 'top' : undefined}
            {...input}
            style={[
              styles.input,
              multiline ? styles.multiline : null,
              error ? styles.inputError : null,
              secureToggle ? styles.withToggle : null,
              inputStyle,
            ]}
          />
          {secure && secureToggle ? (
            <IconButton
              icon={shown ? 'eye-slash' : 'eye'}
              iconSize={20}
              color={colors.muted}
              size={40}
              pressedScale={0.94}
              accessibilityLabel={shown ? 'Hide password' : 'Show password'}
              onPress={() => setShown(s => !s)}
              style={styles.toggle}
            />
          ) : null}
        </View>
        {below}
        {error ? (
          <View style={styles.errorRow} accessibilityLiveRegion="polite">
            {errorIcon ? (
              <Icon name="warning-circle" size={13} color={colors.danger} />
            ) : null}
            <Text style={styles.error}>{error}</Text>
          </View>
        ) : helper ? (
          <Text style={type.meta}>{helper}</Text>
        ) : null}
      </View>
    );
  },
);

export type SearchFieldProps = Omit<TextInputProps, 'style'> & {
  containerStyle?: StyleProp<ViewStyle>;
};

/**
 * Explore / Messages search (SPEC 3.08): height 44, radius 14, #F4F4F5,
 * magnifying-glass 19 #71717A at left 14 / top 12, padding-left 42, 15.5px.
 */
export const SearchField = forwardRef<TextInputInstance, SearchFieldProps>(
  function SearchFieldImpl({ containerStyle, ...input }, ref) {
    return (
      <View style={containerStyle}>
        <TextInput
          ref={ref}
          placeholderTextColor={colors.faint}
          returnKeyType="search"
          autoCorrect={false}
          accessibilityLabel={input.accessibilityLabel ?? input.placeholder}
          {...input}
          style={styles.search}
        />
        <View style={styles.searchIcon} pointerEvents="none">
          <Icon name="magnifying-glass" size={19} color={colors.muted} />
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  field: { gap: 8 },
  input: {
    height: 52,
    borderRadius: radius.input,
    backgroundColor: colors.fill,
    borderWidth: 1.5,
    borderColor: 'transparent',
    paddingHorizontal: 16,
    paddingVertical: 0,
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.ink,
  },
  multiline: {
    height: undefined,
    minHeight: 52,
    paddingTop: 14,
    paddingBottom: 14,
    lineHeight: type.body.lineHeight,
  },
  inputError: { borderColor: colors.danger },
  withToggle: { paddingRight: 50 },
  toggle: { position: 'absolute', right: 6, top: 6 },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  error: { fontFamily: fonts.regular, fontSize: 13, color: colors.danger },
  search: {
    height: 44,
    borderRadius: radius.input,
    backgroundColor: colors.fill,
    paddingLeft: 42,
    paddingRight: 16,
    paddingVertical: 0,
    fontFamily: fonts.regular,
    fontSize: 15.5,
    color: colors.ink,
  },
  searchIcon: { position: 'absolute', left: 14, top: 12 },
});
