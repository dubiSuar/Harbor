import React, { memo, useCallback, useMemo, useRef, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
  type AccessibilityActionEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { colors } from '../../theme';
import { Badge } from '../ui';
import { DOUBLE_TAP_MS } from './format';
import { HeartBurst } from './HeartBurst';

const GAP = 6;
const SIDE = 16;
const RADIUS = 18;
const ACTIVATE = [{ name: 'activate', label: 'Like' }];

type Props = {
  images: string[];
  /** Width / height ('4/3' -> 4/3). */
  aspectRatio: number;
  /** Called on a double-tap (or a screen-reader activate) of any photo. */
  onDoubleTap: () => void;
  /** The feed's "{n} photos" badge on multi-photo posts. */
  showCount?: boolean;
  /** Spoken owner of the photos ("Priya Raman"). */
  ownerName?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * The post photo row (SPEC 3.04 / 3.05): a horizontal snap list, gap 6,
 * side padding 16. One photo is W-32 wide; several are round(W*.759)
 * (296 at 390) so the next one peeks in. Radius 18, #E4E4E7 placeholder,
 * double-tap to like with a heart burst.
 */
export const ImageCarousel = memo(function ImageCarouselImpl({
  images,
  aspectRatio,
  onDoubleTap,
  showCount = false,
  ownerName,
  style,
}: Props) {
  const { width: W } = useWindowDimensions();
  const multi = images.length > 1;
  const itemW = multi ? Math.round(W * 0.759) : W - SIDE * 2;
  const offsets = useMemo(
    () => images.map((_, i) => i * (itemW + GAP)),
    [images, itemW],
  );

  return (
    <View style={style}>
      <ScrollView
        horizontal
        scrollEnabled={multi}
        showsHorizontalScrollIndicator={false}
        snapToOffsets={multi ? offsets : undefined}
        snapToAlignment="start"
        decelerationRate="fast"
        disableIntervalMomentum
        contentContainerStyle={styles.row}
      >
        {images.map((uri, i) => (
          <CarouselImage
            key={`${i}-${uri}`}
            uri={uri}
            width={itemW}
            aspectRatio={aspectRatio}
            onDoubleTap={onDoubleTap}
            label={`Photo ${i + 1} of ${images.length}${
              ownerName ? ` by ${ownerName}` : ''
            }`}
          />
        ))}
      </ScrollView>
      {showCount && multi ? (
        <Badge label={`${images.length} photos`} style={styles.count} />
      ) : null}
    </View>
  );
});

const CarouselImage = memo(function CarouselImageImpl({
  uri,
  width,
  aspectRatio,
  onDoubleTap,
  label,
}: {
  uri: string;
  width: number;
  aspectRatio: number;
  onDoubleTap: () => void;
  label: string;
}) {
  const lastTap = useRef(0);
  const [burst, setBurst] = useState(0);

  const fire = useCallback(() => {
    setBurst(n => n + 1);
    onDoubleTap();
  }, [onDoubleTap]);

  const onPress = useCallback(() => {
    const now = Date.now();
    if (now - lastTap.current < DOUBLE_TAP_MS) {
      lastTap.current = 0;
      fire();
    } else {
      lastTap.current = now;
    }
  }, [fire]);

  const onAccessibilityAction = useCallback(
    (e: AccessibilityActionEvent) => {
      if (e.nativeEvent.actionName === 'activate') {
        fire();
      }
    },
    [fire],
  );

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="image"
      accessibilityLabel={label}
      accessibilityHint="Double-tap to like"
      accessibilityActions={ACTIVATE}
      onAccessibilityAction={onAccessibilityAction}
      style={[styles.image, { width, aspectRatio }]}
    >
      <Image source={{ uri }} style={styles.fill} resizeMode="cover" />
      <HeartBurst trigger={burst} />
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: { paddingHorizontal: SIDE, gap: GAP },
  image: {
    borderRadius: RADIUS,
    overflow: 'hidden',
    backgroundColor: colors.line,
  },
  fill: { width: '100%', height: '100%' },
  count: { position: 'absolute', top: 10, right: 26 },
});
