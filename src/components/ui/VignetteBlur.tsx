import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { BlurView } from '@react-native-community/blur';
import RNMaskedView from '@react-native-masked-view/masked-view';
import { Gradient } from './Gradient';

// The package ships class typings that predate React 19's JSX types.
const MaskedView = RNMaskedView as unknown as React.ComponentType<{
  style?: StyleProp<ViewStyle>;
  maskElement: React.ReactElement;
  children?: React.ReactNode;
}>;

export type VignetteBlurProps = {
  /**
   * Where the blur is strongest: 'top' fades out downwards (headers),
   * 'bottom' fades out upwards (tab bar zone), 'full' is even (bars).
   */
  edge: 'top' | 'bottom' | 'full';
  /** Blur strength (0..32). */
  amount?: number;
  /** Max white tint over the blur, at the strong edge (0..1). */
  tint?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * iOS-style progressive blur: real backdrop blur that fades out across the
 * zone (a gradient mask), with a soft white wash on top so content reads
 * through like a vignette instead of a solid white band.
 */
export function VignetteBlur({
  edge,
  amount = 14,
  tint = 0.55,
  style,
}: VignetteBlurProps) {
  const blur = (
    <BlurView
      style={StyleSheet.absoluteFill}
      blurType="light"
      blurAmount={amount}
      reducedTransparencyFallbackColor="rgba(255,255,255,0.92)"
      overlayColor="transparent"
    />
  );

  if (edge === 'full') {
    return (
      <View pointerEvents="none" style={[styles.clip, style]}>
        {blur}
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: `rgba(255,255,255,${tint})` },
          ]}
        />
      </View>
    );
  }

  const direction = edge === 'top' ? 'down' : 'up';
  return (
    <View pointerEvents="none" style={[styles.clip, style]}>
      <MaskedView
        style={StyleSheet.absoluteFill}
        maskElement={
          <Gradient
            direction={direction}
            style={StyleSheet.absoluteFill}
            stops={[
              { offset: 0, color: 'rgba(0,0,0,1)' },
              { offset: 0.5, color: 'rgba(0,0,0,0.85)' },
              { offset: 1, color: 'rgba(0,0,0,0)' },
            ]}
          />
        }
      >
        {blur}
      </MaskedView>
      <Gradient
        direction={direction}
        style={StyleSheet.absoluteFill}
        stops={[
          { offset: 0, color: `rgba(255,255,255,${tint})` },
          { offset: 0.55, color: `rgba(255,255,255,${tint * 0.45})` },
          { offset: 1, color: 'rgba(255,255,255,0)' },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  clip: { overflow: 'hidden' },
});
