import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Image,
  KeyboardAvoidingView,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StoryProgress } from '../components/story/StoryProgress';
import { useAppActive } from '../components/story/useAppActive';
import {
  Avatar,
  Gradient,
  IconButton,
  PressableScale,
  useToast,
  useToastKeyboardBar,
} from '../components/ui';
import { useKeyboardVisible } from '../components/useKeyboard';
import { firstNameOf } from '../data/types';
import { useIsTopScreen, useNav } from '../navigation/Navigator';
import { useOnScreen } from '../navigation/PaneVisibleContext';
import { useOpenProfile } from '../navigation/useOpenProfile';
import { usePerson, useStories } from '../state/SocialContext';
import { colors, duration, fonts } from '../theme';

/** Verbatim story alphas (SPEC 2.1). */
const SCRIM = [
  { offset: 0, color: 'rgba(11,11,12,0.55)' },
  { offset: 0.22, color: 'rgba(11,11,12,0)' },
  { offset: 0.7, color: 'rgba(11,11,12,0)' },
  { offset: 1, color: 'rgba(11,11,12,0.6)' },
];
const AVATAR_RING = { width: 2, color: 'rgba(255,255,255,0.9)' };
const INPUT_BORDER = 'rgba(255,255,255,0.55)';
const INPUT_BG = 'rgba(255,255,255,0.08)';

/** Tap zones run from 110 below the top to 110 above the bottom. */
const ZONE_INSET = 110;
/** The reply row (44) plus its 12 gap above the keyboard. */
const REPLY_BAR = 44 + 12;

/**
 * True while a screen reader (VoiceOver / TalkBack) is on. Stories then wait
 * for the reader instead of advancing every 5 s.
 */
function useScreenReader() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isScreenReaderEnabled()
      .then(v => {
        if (alive) {
          setOn(v);
        }
      })
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      setOn,
    );
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);
  return on;
}

/**
 * 07 Story (SPEC 3.07, DECISIONS #11). Auto-advances every 5 s with the
 * progress bars; tap the left 35% / right 65% to go back / forward; press
 * and hold, or focus the reply, to pause. Finishing a story marks it seen;
 * the last one closes the viewer. With a screen reader on, stories never
 * auto-advance (use Next / Previous). The author opens their profile.
 */
export function StoryScreen({ index: startIndex }: { index: number }) {
  const nav = useNav();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { stories, isLiked, markSeen, toggleLike } = useStories();
  const count = stories.length;
  const [index, setIndex] = useState(() =>
    Math.max(0, Math.min(startIndex, count - 1)),
  );
  // Bumped on every prev/next so the timer restarts even when the index
  // stays put (prev on the first story).
  const [run, setRun] = useState(0);
  const [held, setHeld] = useState(false);
  const [typing, setTyping] = useState(false);
  const [reply, setReply] = useState('');
  const [away, setAway] = useState(false);
  const keyboardVisible = useKeyboardVisible();
  const appActive = useAppActive();
  const onScreen = useOnScreen();
  const isTop = useIsTopScreen();
  const screenReader = useScreenReader();
  const openProfile = useOpenProfile();
  const paused =
    held || typing || away || screenReader || !appActive || !onScreen;

  // Back on top after visiting a profile: resume.
  useEffect(() => {
    if (onScreen) {
      setAway(false);
    }
  }, [onScreen]);

  // With the keyboard up, toasts sit above the reply row riding on it.
  useToastKeyboardBar(REPLY_BAR, isTop);

  const story = stories[index];
  const author = usePerson(story?.authorId ?? 'me');
  const liked = story ? isLiked(story.id) : false;

  const progress = useRef(new Animated.Value(0)).current;
  // Where the current story's bar stopped when paused. `epoch` changes on
  // every prev/next (synchronously, in the handler) so a timer being torn
  // down for a story change does not save its position for the new story.
  const resumeAt = useRef(0);
  const epoch = useRef(0);

  const goTo = useCallback(
    (next: number) => {
      epoch.current += 1;
      resumeAt.current = 0;
      progress.setValue(0);
      setIndex(next);
      setRun(r => r + 1);
    },
    [progress],
  );

  // nextStory(): mark the current story seen, advance, or close at the end.
  const next = useCallback(() => {
    if (story) {
      markSeen(story.id);
    }
    if (index + 1 < count) {
      goTo(index + 1);
    } else {
      nav.pop();
    }
  }, [story, markSeen, index, count, goTo, nav]);

  // prevStory(): back one (or restart the first); nothing is marked seen.
  const prev = useCallback(() => goTo(Math.max(0, index - 1)), [goTo, index]);

  const nextRef = useRef(next);
  useEffect(() => {
    nextRef.current = next;
  }, [next]);

  // The 5 s timer: a linear, native-driven fill. Pausing stops it and
  // remembers where (from the clock, so no async read of the native value
  // is needed); resuming runs the remainder.
  const hasStory = !!story;
  useEffect(() => {
    if (paused || !hasStory) {
      return;
    }
    const mine = epoch.current;
    const from = resumeAt.current;
    const startedAt = Date.now();
    progress.setValue(from);
    const anim = Animated.timing(progress, {
      toValue: 1,
      duration: Math.max(0, (1 - from) * duration.story),
      easing: Easing.linear,
      useNativeDriver: true,
    });
    anim.start(({ finished }) => {
      if (finished && epoch.current === mine) {
        nextRef.current();
      }
    });
    return () => {
      anim.stop();
      if (epoch.current === mine) {
        const at = Math.min(
          1,
          from + (Date.now() - startedAt) / duration.story,
        );
        resumeAt.current = at;
        progress.setValue(at);
      }
    };
  }, [paused, run, hasStory, progress]);

  // Prefetch the next story's full image.
  useEffect(() => {
    const upcoming = stories[index + 1];
    if (upcoming) {
      Image.prefetch(upcoming.fullImageUrl).catch(() => {});
    }
  }, [stories, index]);

  // Close if the stories list is empty (nothing to show).
  useEffect(() => {
    if (!story) {
      nav.pop();
    }
  }, [story, nav]);

  const send = () => {
    if (reply.trim()) {
      setReply('');
      toast.show('Reply sent');
    }
  };

  if (!story) {
    return <View style={styles.root} />;
  }

  const first = firstNameOf(author.name);
  // The design's bottom 32; tighter while the keyboard covers the inset.
  const footerGap = {
    marginBottom: keyboardVisible ? 12 : Math.max(insets.bottom, 16) + 2,
  };

  return (
    <View style={styles.root}>
      <Image
        source={{ uri: story.fullImageUrl }}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
        accessible
        accessibilityLabel={`${author.name}'s story, ${story.timeLabel}`}
      />
      <Gradient stops={SCRIM} style={StyleSheet.absoluteFill} />

      {/* Tap zones: left 35% back, right 65% forward. Holding pauses. */}
      <Pressable
        style={[styles.zone, styles.zoneLeft]}
        onPress={prev}
        onPressIn={() => setHeld(true)}
        onPressOut={() => setHeld(false)}
        onLongPress={() => {}}
        delayLongPress={250}
        accessibilityRole="button"
        accessibilityLabel="Previous"
        accessibilityHint="Shows the previous story. Hold to pause."
      />
      <Pressable
        style={[styles.zone, styles.zoneRight]}
        onPress={next}
        onPressIn={() => setHeld(true)}
        onPressOut={() => setHeld(false)}
        onLongPress={() => {}}
        delayLongPress={250}
        accessibilityRole="button"
        accessibilityLabel="Next"
        accessibilityHint="Shows the next story. Hold to pause."
      />

      <StoryProgress
        count={count}
        index={index}
        progress={progress}
        style={[styles.bars, { top: insets.top + 4 }]}
      />

      <View style={[styles.header, { top: insets.top + 18 }]}>
        <PressableScale
          onPress={() => {
            // Pause first, so the timer can't advance under the push.
            setAway(true);
            openProfile(story.authorId);
          }}
          pressedScale={0.97}
          accessibilityLabel={`View ${author.name}'s profile`}
          style={styles.author}
        >
          <Avatar
            uri={author.photoUrl}
            name={author.name}
            size={36}
            ring={AVATAR_RING}
          />
          <View style={styles.meta}>
            <Text style={styles.name} numberOfLines={1}>
              {author.name}
            </Text>
            <Text style={styles.time}>{story.timeLabel}</Text>
          </View>
        </PressableScale>
        <IconButton
          icon="x"
          iconSize={24}
          size={40}
          color={colors.onAccent}
          accessibilityLabel="Close"
          onPress={nav.pop}
        />
      </View>

      {/* 'padding' on both platforms: Android runs edge-to-edge, so the
          window is not resized for the keyboard. */}
      <KeyboardAvoidingView
        style={styles.footerZone}
        behavior="padding"
        pointerEvents="box-none"
      >
        <View style={[styles.footer, footerGap]}>
          <TextInput
            value={reply}
            onChangeText={setReply}
            onFocus={() => setTyping(true)}
            onBlur={() => setTyping(false)}
            onSubmitEditing={send}
            returnKeyType="send"
            placeholder={`Reply to ${first}…`}
            placeholderTextColor={colors.faint}
            selectionColor={colors.onAccent}
            cursorColor={colors.onAccent}
            style={styles.input}
            accessibilityLabel={`Reply to ${first}`}
          />
          <IconButton
            icon="heart"
            weight={liked ? 'fill' : 'regular'}
            iconSize={26}
            color={colors.onAccent}
            pressedScale={0.85}
            spring
            accessibilityLabel={liked ? 'Unlike story' : 'Like story'}
            onPress={() => toggleLike(story.id)}
          />
          <IconButton
            icon="paper-plane-tilt"
            iconSize={24}
            color={colors.onAccent}
            accessibilityLabel="Send reply"
            onPress={send}
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.storyBg },
  zone: { position: 'absolute', top: ZONE_INSET, bottom: ZONE_INSET },
  zoneLeft: { left: 0, width: '35%' },
  zoneRight: { right: 0, width: '65%' },
  bars: { position: 'absolute', left: 10, right: 10 },
  header: {
    position: 'absolute',
    left: 12,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  author: {
    flex: 1,
    minWidth: 0,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  meta: { flex: 1, flexDirection: 'row', alignItems: 'baseline' },
  name: {
    flexShrink: 1,
    fontFamily: fonts.semibold,
    fontSize: 14.5,
    color: colors.onAccent,
  },
  time: {
    marginLeft: 8,
    fontFamily: fonts.regular,
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
  },
  footerZone: { ...StyleSheet.absoluteFill, justifyContent: 'flex-end' },
  footer: {
    marginHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  input: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: INPUT_BORDER,
    backgroundColor: INPUT_BG,
    paddingHorizontal: 18,
    paddingVertical: 0,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.onAccent,
  },
});
