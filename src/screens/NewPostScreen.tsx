import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  Image,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AICard,
  Avatar,
  Button,
  Chip,
  FadeIn,
  Icon,
  IconButton,
  PressableScale,
  Shimmer,
  useToast,
  useToastKeyboardBar,
  type IconName,
} from '../components/ui';
import { useKeyboardVisible } from '../components/useKeyboard';
import { draftPhoto } from '../data/mock';
import { firstNameOf, type Audience } from '../data/types';
import {
  useBackOverride,
  useIsTopScreen,
  useNav,
} from '../navigation/Navigator';
import { useGoToTab } from '../navigation/TabBarContext';
import { pickImage } from '../services/media';
import { useMe, usePolish } from '../state/SocialContext';
import { useStore } from '../state/StoreContext';
import type { LocalImage } from '../state/storeTypes';
import { colors, fonts, hitSlop, type } from '../theme';
import { messageOf } from '../utils/errors';

const MAX = 500;
/** The design switches the textarea from 22 to 17 at 90 characters. */
const LONG = 90;
const PLACE = 'Rotterdam';

type Tone = 'Clearer' | 'Warmer' | 'Shorter';

const AUDIENCES: { key: Audience; label: string; icon: IconName }[] = [
  { key: 'friends', label: 'Friends', icon: 'users' },
  { key: 'public', label: 'Public', icon: 'globe-hemisphere-west' },
  { key: 'close', label: 'Close friends', icon: 'star' },
];

const TONES: { tone: Tone; icon: IconName }[] = [
  { tone: 'Clearer', icon: 'text-align-left' },
  { tone: 'Warmer', icon: 'sun' },
  { tone: 'Shorter', icon: 'arrows-in-line-horizontal' },
];

/** 06 Create post (SPEC 3.06), presented as a modal. */
export function NewPostScreen({
  initialText,
  withPhoto,
}: {
  initialText?: string;
  withPhoto?: boolean;
}) {
  const nav = useNav();
  const goToTab = useGoToTab();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const keyboardVisible = useKeyboardVisible();
  const me = useMe();
  const polishPost = usePolish();
  const { mode, createPost } = useStore();

  const [text, setText] = useState(() => (initialText ?? '').slice(0, MAX));
  const [photo, setPhoto] = useState<LocalImage>();
  const [aud, setAud] = useState(0);
  const [place, setPlace] = useState<string>();
  const [prevText, setPrevText] = useState<string | null>(null);
  const [polishing, setPolishing] = useState<Tone | null>(null);
  const [posting, setPosting] = useState(false);
  const [picking, setPicking] = useState(false);
  const [toolbarH, setToolbarH] = useState(0);
  const isTop = useIsTopScreen();
  // With the keyboard up, toasts sit above the toolbar riding on it.
  useToastKeyboardBar(toolbarH, isTop);

  const progress = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef<Animated.CompositeAnimation | null>(null);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      progressAnim.current?.stop();
    };
  }, []);

  const hasDraft = text.trim().length > 0 || !!photo;
  const canPost = hasDraft && !posting;
  const first = firstNameOf(me.name);
  const audience = AUDIENCES[aud];

  const animateProgress = (fraction: number, ms = 180) => {
    progressAnim.current?.stop();
    const anim = Animated.timing(progress, {
      toValue: Math.max(0, Math.min(1, fraction)),
      duration: ms,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    progressAnim.current = anim;
    anim.start();
  };

  // Demo mode attaches the design's placeholder photo; Firebase mode opens
  // the real library picker.
  const addPhoto = async () => {
    if (picking || posting) {
      return;
    }
    if (mode === 'demo') {
      setPhoto({ uri: draftPhoto(), width: 900, height: 675 });
      return;
    }
    setPicking(true);
    try {
      const picked = await pickImage();
      if (picked && mounted.current) {
        // Warm the cache so the new post's photo shows at once in the feed.
        Image.prefetch(picked.uri).catch(() => {});
        setPhoto(picked);
      }
    } catch (e) {
      toast.show(messageOf(e, "Couldn't open your photos."), {
        icon: 'warning-circle',
      });
    } finally {
      if (mounted.current) {
        setPicking(false);
      }
    }
  };

  // `withPhoto` (the feed composer's photo icon) attaches one on open.
  const attachOnOpen = useRef(withPhoto);
  useEffect(() => {
    if (attachOnOpen.current) {
      attachOnOpen.current = false;
      addPhoto();
    }
    // Once, on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const polish = async (tone: Tone) => {
    const original = text.trim();
    if (!original) {
      toast.show('Write something first');
      return;
    }
    if (polishing || posting) {
      return;
    }
    setPolishing(tone);
    try {
      const out = await polishPost(original, tone);
      if (mounted.current) {
        setPrevText(original);
        setText(out.replace(/^"|"$/g, '').slice(0, MAX));
      }
    } catch {
      toast.show("Couldn't reach Harbor AI", { icon: 'warning-circle' });
    } finally {
      if (mounted.current) {
        setPolishing(null);
      }
    }
  };

  const undoPolish = () => {
    if (prevText !== null) {
      setText(prevText);
      setPrevText(null);
    }
  };

  const addPlace = () => {
    setPlace(PLACE);
    toast.show(`Location added: ${PLACE}`);
  };

  const submit = async () => {
    if (!canPost) {
      return;
    }
    setPosting(true);
    progress.setValue(0);
    // Text-only posts have no upload; give the bar a little head start.
    animateProgress(photo ? 0.04 : 0.35, 220);
    try {
      await createPost(
        { text: text.trim(), image: photo, place, audience: audience.key },
        fraction => animateProgress(fraction),
      );
      if (!mounted.current) {
        return;
      }
      animateProgress(1, 160);
      goToTab('home', { scrollTop: true });
      toast.show(`Posted to ${audience.label}`);
    } catch (e) {
      if (!mounted.current) {
        return;
      }
      progressAnim.current?.stop();
      progress.setValue(0);
      setPosting(false);
      toast.show(messageOf(e, "Couldn't share your post."), {
        icon: 'warning-circle',
      });
    }
  };

  // Discard guard: the close button and Android back confirm before a
  // draft is thrown away.
  const close = () => {
    if (posting) {
      return;
    }
    if (!hasDraft) {
      nav.pop();
      return;
    }
    Alert.alert('Discard post?', 'Your text and photo will be lost.', [
      { text: 'Keep editing', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: nav.pop },
    ]);
  };
  useBackOverride(close);

  const small = text.length >= LONG || !!photo;
  // The keyboard covers the home indicator, so drop the safe-area padding
  // while it is up.
  const toolbarPad = {
    paddingBottom: keyboardVisible ? 8 : Math.max(insets.bottom, 16) + 4,
  };

  return (
    // 'padding' on both platforms: Android runs edge-to-edge, so the window
    // is not resized for the keyboard.
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top }]}
      behavior="padding"
    >
      <View style={styles.header}>
        <IconButton
          icon="x"
          iconSize={22}
          size={40}
          pressedScale={0.92}
          accessibilityLabel="Close"
          disabled={posting}
          onPress={close}
        />
        <Text style={type.navTitle} accessibilityRole="header">
          Create post
        </Text>
        <Button
          label="Post"
          size="sm"
          disabled={!hasDraft}
          loading={posting}
          onPress={submit}
          style={styles.post}
          labelStyle={styles.postLabel}
          accessibilityHint={`Shares with ${audience.label}`}
        />
        <View
          style={styles.track}
          accessible={posting}
          accessibilityRole="progressbar"
          accessibilityLabel="Posting"
          importantForAccessibility={posting ? 'yes' : 'no-hide-descendants'}
          pointerEvents="none"
        >
          <Animated.View
            style={[
              styles.bar,
              !posting && styles.barHidden,
              { transform: [{ scaleX: progress }] },
            ]}
          />
        </View>
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.author}>
          <Avatar uri={me.photoUrl} name={me.name} size={44} />
          <View>
            <Text style={styles.name}>{me.name}</Text>
            <Chip
              variant="audience"
              icon={audience.icon}
              label={audience.label}
              accessibilityLabel={`Audience: ${audience.label}. Tap to change`}
              onPress={() => setAud(a => (a + 1) % AUDIENCES.length)}
              disabled={posting}
              style={styles.audience}
            />
          </View>
        </View>

        <TextInput
          value={text}
          onChangeText={setText}
          placeholder={`What's on your mind, ${first}?`}
          placeholderTextColor={colors.faint}
          selectionColor={colors.accent}
          cursorColor={colors.accent}
          maxLength={MAX}
          multiline
          autoFocus={!withPhoto}
          editable={!posting}
          style={[styles.input, small ? styles.inputSm : styles.inputLg]}
          accessibilityLabel="Post text"
          accessibilityHint={`Up to ${MAX} characters`}
        />

        {prevText !== null ? (
          <PressableScale
            onPress={undoPolish}
            pressedScale={0.97}
            hitSlop={{ top: 14, bottom: 14 }}
            accessibilityLabel="Undo AI edit"
            style={styles.undo}
          >
            <Icon
              name="arrow-counter-clockwise"
              size={13}
              color={colors.accent}
            />
            <Text style={styles.undoText}>Undo AI edit</Text>
          </PressableScale>
        ) : null}

        {photo ? (
          <FadeIn key={photo.uri} style={styles.photoWrap}>
            <Image
              source={{ uri: photo.uri }}
              style={styles.photo}
              resizeMode="cover"
              accessibilityIgnoresInvertColors
              accessibilityLabel="Attached photo"
            />
            {!posting ? (
              <IconButton
                icon="x"
                iconSize={16}
                size={32}
                color={colors.onAccent}
                background={colors.scrim60}
                accessibilityLabel="Remove photo"
                onPress={() => setPhoto(undefined)}
                style={styles.remove}
              />
            ) : null}
          </FadeIn>
        ) : null}

        <AICard
          title="Polish with Harbor"
          titleStyle={styles.polishTitle}
          padding={{ vertical: 12, horizontal: 13 }}
          right={
            <Text style={styles.polishNote} numberOfLines={1}>
              Only you see drafts
            </Text>
          }
        >
          <View style={styles.tones}>
            {TONES.map(t => (
              <Chip
                key={t.tone}
                variant="tone"
                icon={t.icon}
                label={t.tone}
                accessibilityLabel={`Polish: ${t.tone}`}
                dimmed={!!polishing && polishing !== t.tone}
                onPress={() => polish(t.tone)}
              />
            ))}
          </View>
          {polishing ? (
            <Shimmer height={10} radius={5} style={styles.shimmer} />
          ) : null}
        </AICard>
      </ScrollView>

      <View
        style={[styles.toolbar, toolbarPad]}
        onLayout={e => setToolbarH(e.nativeEvent.layout.height)}
      >
        <Tool
          icon="image-square"
          iconColor={colors.accent}
          label="Photo"
          a11y={photo ? 'Replace photo' : 'Add photo'}
          disabled={posting || picking}
          onPress={addPhoto}
        />
        <Tool
          icon="user-plus"
          label="Tag"
          a11y="Tag friends"
          onPress={() => toast.show('Tagging opens your friends list')}
        />
        <Tool
          icon="map-pin"
          label="Place"
          a11y={place ? `Place: ${place}` : 'Add place'}
          onPress={addPlace}
        />
        <Tool
          icon="chart-bar-horizontal"
          label="Poll"
          a11y="Add poll"
          onPress={() => toast.show('Polls are coming soon')}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

/** Toolbar item: h56, centred column, gap 4, 11.5/500, pressed #F4F4F5. */
function Tool({
  icon,
  iconColor = colors.inkSoft,
  label,
  a11y,
  disabled,
  onPress,
}: {
  icon: IconName;
  iconColor?: string;
  label: string;
  a11y: string;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      pressedScale={1}
      pressedBg={colors.fill}
      accessibilityLabel={a11y}
      accessibilityState={{ disabled: !!disabled }}
      hitSlop={hitSlop}
      style={styles.tool}
    >
      <Icon name={icon} size={24} color={iconColor} />
      <Text style={styles.toolLabel}>{label}</Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  header: {
    height: 52,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  post: { borderRadius: 12, paddingHorizontal: 16 },
  postLabel: { fontSize: 15 },
  // Upload progress rides on the header's bottom hairline.
  track: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: -1,
    height: 2,
    overflow: 'hidden',
  },
  bar: {
    height: 2,
    width: '100%',
    backgroundColor: colors.accent,
    transformOrigin: 'left',
  },
  barHidden: { opacity: 0 },
  body: { paddingTop: 16, paddingHorizontal: 16, paddingBottom: 20 },
  author: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  name: { fontFamily: fonts.semibold, fontSize: 15, color: colors.ink },
  audience: { marginTop: 3 },
  input: {
    marginTop: 14,
    padding: 0,
    textAlignVertical: 'top',
  },
  // Five lines tall: 30.8 x 5 (22px), or 23.8 x 5 (17px) when long or
  // with a photo.
  inputLg: { ...type.composer, minHeight: 30.8 * 5 },
  inputSm: { ...type.composerSm, minHeight: 23.8 * 5 },
  undo: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    marginBottom: 10,
  },
  undoText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.accent },
  photoWrap: { marginBottom: 14 },
  photo: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 18,
    backgroundColor: colors.line,
  },
  remove: { position: 'absolute', top: 10, right: 10 },
  polishTitle: { fontSize: 14 },
  polishNote: type.tiny,
  // The AICard header already leaves 8 below it; the design's gap is 11.
  tones: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 3 },
  shimmer: { marginTop: 12 },
  toolbar: {
    flexDirection: 'row',
    paddingTop: 8,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
    backgroundColor: colors.bg,
  },
  tool: {
    flex: 1,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  toolLabel: {
    fontFamily: fonts.medium,
    fontSize: 11.5,
    color: colors.inkSoft,
  },
});
