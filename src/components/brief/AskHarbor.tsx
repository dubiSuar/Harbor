import React, { forwardRef } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputInstance,
} from 'react-native';
import type { AskMessage } from '../../data/types';
import { colors, fonts, type } from '../../theme';
import { Bubble, Chip, IconButton, ShimmerLines } from '../ui';

export type AskHarborProps = {
  messages: AskMessage[];
  loading: boolean;
  suggestions: string[];
  draft: string;
  onDraftChange: (text: string) => void;
  /** Sends a question (a suggestion or the draft). */
  onAsk: (question: string) => void;
  onInputFocus?: () => void;
};

/**
 * Brief "Ask Harbor" (SPEC 3.12 items 8-11): header, thread with the
 * shimmer bubble while loading, suggestion chips (they stay after use) and
 * the question input with its round send button.
 */
export const AskHarbor = forwardRef<TextInputInstance, AskHarborProps>(
  function AskHarborImpl(
    {
      messages,
      loading,
      suggestions,
      draft,
      onDraftChange,
      onAsk,
      onInputFocus,
    },
    ref,
  ) {
    const hasDraft = draft.trim().length > 0;
    const send = () => {
      if (hasDraft && !loading) {
        onAsk(draft);
      }
    };
    return (
      <View>
        <View style={styles.header}>
          <Text style={type.section} accessibilityRole="header">
            Ask Harbor
          </Text>
          <Text style={styles.headerSub}>Uses only posts shared with you</Text>
        </View>

        <View style={styles.thread} accessibilityLiveRegion="polite">
          {messages.map(m => (
            <Bubble key={m.id} text={m.text} mine={m.fromMe} variant="ask" />
          ))}
          {loading ? (
            <View style={styles.loading}>
              <ShimmerLines
                widths={['100%', '60%']}
                height={10}
                radius={5}
                gap={7}
                padding={NO_PADDING}
              />
            </View>
          ) : null}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
          keyboardShouldPersistTaps="handled"
        >
          {suggestions.map(s => (
            <Chip
              key={s}
              variant="ai"
              label={s}
              onPress={() => onAsk(s)}
              accessibilityLabel={`Ask: ${s}`}
            />
          ))}
        </ScrollView>

        <View style={styles.inputRow}>
          <TextInput
            ref={ref}
            value={draft}
            onChangeText={onDraftChange}
            onSubmitEditing={send}
            onFocus={onInputFocus}
            placeholder="Ask about your friends' posts…"
            placeholderTextColor={colors.faint}
            returnKeyType="send"
            submitBehavior="blurAndSubmit"
            accessibilityLabel="Ask Harbor a question"
            style={styles.input}
          />
          <IconButton
            icon="arrow-up"
            iconSize={17}
            size={36}
            color={colors.onAccent}
            background={hasDraft ? colors.accent : colors.faint}
            accessibilityLabel="Send question"
            disabled={!hasDraft || loading}
            onPress={send}
          />
        </View>
      </View>
    );
  },
);

const NO_PADDING = { vertical: 0 };

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 26,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  headerSub: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted },
  thread: { gap: 8, paddingHorizontal: 16 },
  loading: {
    width: '70%',
    padding: 14,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomRightRadius: 18,
    borderBottomLeftRadius: 6,
    backgroundColor: colors.aiSurface,
  },
  chips: { gap: 6, paddingVertical: 10, paddingHorizontal: 16 },
  inputRow: {
    marginHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 5,
    paddingRight: 5,
    paddingBottom: 5,
    paddingLeft: 16,
    borderRadius: 22,
    backgroundColor: colors.fill,
  },
  input: {
    flex: 1,
    height: 36,
    paddingVertical: 0,
    paddingHorizontal: 0,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.ink,
  },
});
