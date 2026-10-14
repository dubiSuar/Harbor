import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../theme';
import { Avatar, IconButton, PressableScale } from '../ui';

type Props = {
  /** My first name, for "What's on your mind, {First}?". */
  firstName: string;
  photoUrl?: string;
  name?: string;
  onCompose: () => void;
  onComposePhoto: () => void;
};

/**
 * The top of the feed (SPEC 3.04 #1): my 40 avatar, the #F4F4F5 "What's on
 * your mind" pill (press .98) and the accent photo button, which opens
 * Create with a placeholder photo attached.
 */
export function ComposerRow({
  firstName,
  photoUrl,
  name,
  onCompose,
  onComposePhoto,
}: Props) {
  const prompt = `What's on your mind, ${firstName}?`;
  return (
    <View style={styles.row}>
      <Avatar uri={photoUrl} name={name} size={40} />
      <PressableScale
        onPress={onCompose}
        pressedScale={0.98}
        accessibilityLabel={prompt}
        accessibilityHint="Opens Create post"
        hitSlop={{ top: 2, bottom: 2 }}
        style={styles.pill}
      >
        <Text style={styles.prompt} numberOfLines={1}>
          {prompt}
        </Text>
      </PressableScale>
      <IconButton
        icon="image-square"
        iconSize={23}
        color={colors.accent}
        size={40}
        accessibilityLabel="Create post with a photo"
        onPress={onComposePhoto}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 2,
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  pill: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.fill,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  prompt: { fontFamily: fonts.regular, fontSize: 15, color: colors.muted },
});
