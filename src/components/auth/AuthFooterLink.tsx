import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { colors, fonts } from '../../theme';
import { Button } from '../ui';

type Props = {
  /** "New to Harbor? " / "Already have an account? " */
  prompt: string;
  /** "Create account" / "Sign in" */
  action: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

/**
 * Auth footer (SPEC 3.02 / 3.03): centred 14.5 #52525B prompt followed by
 * a 600 #2F5BD3 text button. The button is the shared `link` Button, 44
 * tall for the touch target.
 */
export function AuthFooterLink({ prompt, action, onPress, style }: Props) {
  return (
    <View style={[styles.row, style]}>
      <Text style={styles.prompt}>{prompt}</Text>
      <Button
        variant="link"
        size="text"
        label={action}
        onPress={onPress}
        labelStyle={styles.action}
        style={styles.button}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  prompt: { fontFamily: fonts.regular, fontSize: 14.5, color: colors.sub },
  action: { fontSize: 14.5 },
  // The design's link has no padding; cancel the Button's 0 4 so the text
  // sits right after the prompt.
  button: { marginHorizontal: -4 },
});
