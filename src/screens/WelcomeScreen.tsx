import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  PanResponder,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type LayoutChangeEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ART_H, ART_W, OnboardingArt } from '../components/auth/OnboardingArt';
import { PagerDots } from '../components/auth/PagerDots';
import { Button, FadeIn, Logo, useReduceMotion } from '../components/ui';
import { useNav } from '../navigation/Navigator';
import { colors, duration, ease, fonts, type } from '../theme';

type Page = 0 | 1 | 2;

const PAGES: { title: string; body: string }[] = [
  {
    title: "Stay close to the people you'd actually call.",
    body: "Your feed shows friends, family, and the groups you've joined, in the order they posted.",
  },
  {
    title: 'Share the whole album, not just one good shot.',
    body: 'Add a photo to any post, tag friends, and choose who sees each post.',
  },
  {
    title: 'Catch up in thirty seconds.',
    body: 'Harbor Brief summarizes what you missed across posts, comments, and messages. Turn it off anytime.',
  },
];

const LAST = 2;
/** The design's swipe threshold: |dx| > 40 on release. */
const SWIPE = 40;
/** The art never shrinks below this on height alone... */
const MIN_ART_SCALE = 0.55;
/** ...unless even that would clip the copy (then the type steps down too). */
const MIN_ART_SCALE_COMPACT = 0.3;

/** 01 Onboarding (SPEC 3.01): a 3-page pager; Skip / Next / Get started. */
export function WelcomeScreen() {
  const nav = useNav();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const reduce = useReduceMotion();
  const [ob, setOb] = useState<Page>(0);
  const obRef = useRef<Page>(0);
  obRef.current = ob;

  // Pager track (transform .62s smooth) and dots (all .45s smooth).
  const track = useRef(new Animated.Value(0)).current;
  const dots = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.parallel([
      Animated.timing(track, {
        toValue: ob,
        duration: reduce ? 0 : duration.pager,
        easing: ease.smooth,
        useNativeDriver: true,
      }),
      Animated.timing(dots, {
        toValue: ob,
        duration: reduce ? 0 : duration.tab,
        easing: ease.smooth,
        useNativeDriver: true,
      }),
    ]);
    anim.start();
    return () => anim.stop();
  }, [ob, reduce, track, dots]);

  const toRegister = () => nav.push({ name: 'SignUp' });
  const toLogin = () => nav.push({ name: 'SignIn' });
  const next = () => {
    if (ob < LAST) {
      setOb((ob + 1) as Page);
    } else {
      toRegister();
    }
  };

  // The design's pointer swipe: no drag-follow, a 40px threshold on release.
  const pan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_e, g) =>
          Math.abs(g.dx) > 10 && Math.abs(g.dx) > Math.abs(g.dy),
        onPanResponderRelease: (_e, g) => {
          const cur = obRef.current;
          if (g.dx < -SWIPE && cur < LAST) {
            setOb((cur + 1) as Page);
          } else if (g.dx > SWIPE && cur > 0) {
            setOb((cur - 1) as Page);
          }
        },
      }),
    [],
  );

  // The art is laid out for a 390x350 box. Scale it to the width, and to
  // the height the pager has left after the tallest page's copy, so the
  // title and body are never clipped on short screens (375x667, 360x640,
  // 320x568). Before the first layout only the width applies.
  const [pagerH, setPagerH] = useState(0);
  const copyHs = useRef<number[]>([]);
  const [copyH, setCopyH] = useState(0);
  const [compact, setCompact] = useState(false);
  const onPagerLayout = useCallback(
    (e: LayoutChangeEvent) => setPagerH(e.nativeEvent.layout.height),
    [],
  );
  const onCopyLayout = useCallback((page: number, e: LayoutChangeEvent) => {
    copyHs.current[page] = e.nativeEvent.layout.height;
    setCopyH(Math.max(0, ...copyHs.current.filter(Boolean)));
  }, []);
  const fit = pagerH && copyH ? (pagerH - copyH) / ART_H : 1;
  // Latched (never switches back), so the smaller type can't make the
  // check pass again and flip-flop.
  useEffect(() => {
    if (pagerH && copyH && fit < MIN_ART_SCALE) {
      setCompact(true);
    }
  }, [pagerH, copyH, fit]);
  const artScale = Math.min(
    1,
    width / ART_W,
    Math.max(compact ? MIN_ART_SCALE_COMPACT : MIN_ART_SCALE, fit),
  );
  const translateX = track.interpolate({
    inputRange: [0, LAST],
    outputRange: [0, -LAST * width],
  });

  return (
    <FadeIn
      duration={duration.fadeLg}
      style={[
        styles.root,
        {
          paddingTop: insets.top,
          paddingBottom: Math.max(insets.bottom, 16),
        },
      ]}
    >
      <View style={styles.top}>
        <View style={styles.wordmark}>
          <Logo size={30} />
          <Text style={type.wordmark}>harbor</Text>
        </View>
        <Button
          variant="ghost"
          size="text"
          label="Skip"
          onPress={toRegister}
          labelStyle={styles.skip}
          style={styles.skipButton}
        />
      </View>

      <View style={styles.pager} onLayout={onPagerLayout} {...pan.panHandlers}>
        <Animated.View
          style={[
            styles.track,
            { width: width * PAGES.length, transform: [{ translateX }] },
          ]}
        >
          {PAGES.map((p, i) => {
            const hidden = i !== ob;
            return (
              <View
                key={p.title}
                style={{ width }}
                accessibilityElementsHidden={hidden}
                importantForAccessibility={
                  hidden ? 'no-hide-descendants' : 'auto'
                }
              >
                <View style={[styles.artSlot, { height: ART_H * artScale }]}>
                  <View
                    style={{
                      marginTop: (ART_H * artScale - ART_H) / 2,
                      transform: [{ scale: artScale }],
                    }}
                  >
                    <OnboardingArt page={i as Page} />
                  </View>
                </View>
                <View style={styles.copy} onLayout={e => onCopyLayout(i, e)}>
                  <Text
                    style={[type.obTitle, compact && styles.titleCompact]}
                    accessibilityRole="header"
                    textBreakStrategy="balanced"
                    lineBreakStrategyIOS="push-out"
                  >
                    {p.title}
                  </Text>
                  <Text style={[styles.body, compact && styles.bodyCompact]}>
                    {p.body}
                  </Text>
                </View>
              </View>
            );
          })}
        </Animated.View>
      </View>

      <View
        style={styles.dots}
        accessible
        accessibilityLabel={`Page ${ob + 1} of ${PAGES.length}`}
      >
        <PagerDots count={PAGES.length} position={dots} />
      </View>

      <View style={styles.buttons}>
        <Button
          size="pill"
          label={ob === LAST ? 'Get started' : 'Next'}
          onPress={next}
        />
        <Button
          variant="ghost"
          size="ghostLg"
          label="I already have an account"
          onPress={toLogin}
        />
      </View>
    </FadeIn>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  top: {
    height: 48,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  wordmark: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  skip: { fontFamily: fonts.medium, fontSize: 15, color: colors.muted },
  // The design's Skip has p 8 4; the text Button already pads 0 4.
  skipButton: { marginRight: -4 },
  pager: { flex: 1, overflow: 'hidden' },
  track: { flex: 1, flexDirection: 'row' },
  artSlot: { alignItems: 'center', overflow: 'visible' },
  copy: { paddingTop: 14, paddingHorizontal: 28 },
  body: { ...type.lead, marginTop: 12 },
  // Short screens only (see `compact`): one step down, same proportions.
  titleCompact: { fontSize: 26, lineHeight: 28.08, letterSpacing: -0.91 },
  bodyCompact: { fontSize: 15, lineHeight: 22.5, marginTop: 10 },
  dots: { paddingHorizontal: 28, paddingBottom: 20 },
  buttons: { gap: 6, paddingHorizontal: 20 },
});
