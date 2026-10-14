import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type TextInputInstance,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import {
  Avatar,
  Button,
  Icon,
  IconButton,
  TextField,
  useToast,
} from '../components/ui';
import type { User } from '../data/types';
import { useBackOverride, useNav } from '../navigation/Navigator';
import { pickImage } from '../services/media';
import { useStore, useUser } from '../state/StoreContext';
import { colors, fonts, type } from '../theme';
import { messageOf } from '../utils/errors';

const BIO_MAX = 150;
const HANDLE_RULE = /^[a-z0-9._]{3,24}$/;

type Draft = { name: string; handle: string; bio: string; location: string };

function validate(d: Draft) {
  const errors: Partial<Record<keyof Draft, string>> = {};
  if (!d.name.trim()) {
    errors.name = 'Add your name so people can find you.';
  }
  if (!HANDLE_RULE.test(d.handle)) {
    errors.handle =
      'Use 3 to 24 lowercase letters, numbers, dots or underscores.';
  }
  return errors;
}

const draftOf = (u: User): Draft => ({
  name: u.name ?? '',
  handle: u.handle ?? '',
  bio: u.bio ?? '',
  location: u.location ?? '',
});

/** Appends a cache-busting query so a re-uploaded photo at the same URL reloads. */
function withVersion(uri: string, v: number) {
  return `${uri}${uri.includes('?') ? '&' : '?'}v=${v}`;
}

export function EditProfileScreen() {
  const nav = useNav();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const { meId, updateProfile, uploadAvatar } = useStore();
  const { data: me } = useUser(meId);

  const [initial, setInitial] = useState<Draft>(() => draftOf(me));
  const [draft, setDraft] = useState<Draft>(initial);
  const [touched, setTouched] = useState<Partial<Record<keyof Draft, true>>>(
    {},
  );
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string>();
  const [upload, setUpload] = useState<{ uri: string; progress: number }>();
  const [photoError, setPhotoError] = useState<string>();
  // Set after an upload: while the profile still reports the same photoUrl
  // as before it, the image cache would keep showing the old photo.
  const [uploaded, setUploaded] = useState<{ before?: string; v: number }>();

  const handleRef = useRef<TextInputInstance>(null);
  const bioRef = useRef<TextInputInstance>(null);
  const locationRef = useRef<TextInputInstance>(null);

  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // If the profile was still loading when the screen opened, fill the form
  // once it arrives (unless the user has already started typing).
  const seeded = useRef(!!me.name);
  const untouched = Object.keys(touched).length === 0;
  useEffect(() => {
    if (!seeded.current && me.name && untouched) {
      seeded.current = true;
      const next = draftOf(me);
      setInitial(next);
      setDraft(next);
    }
  }, [me, untouched]);

  const dirty = (Object.keys(initial) as (keyof Draft)[]).some(
    k => initial[k] !== draft[k],
  );
  const errors = validate(draft);
  const valid = Object.keys(errors).length === 0;

  const set = (key: keyof Draft) => (value: string) => {
    setDraft(prev => ({ ...prev, [key]: value }));
    setTouched(prev => (prev[key] ? prev : { ...prev, [key]: true }));
    if (saveError) {
      setSaveError(undefined);
    }
  };

  const save = async () => {
    if (saving || !dirty) {
      return;
    }
    if (!valid) {
      setTouched({ name: true, handle: true });
      return;
    }
    setSaving(true);
    setSaveError(undefined);
    try {
      await updateProfile({
        name: draft.name.trim(),
        handle: draft.handle,
        bio: draft.bio.trim(),
        location: draft.location.trim(),
      });
      if (mounted.current) {
        nav.pop();
      }
    } catch (e) {
      if (mounted.current) {
        setSaving(false);
        setSaveError(messageOf(e, "Couldn't save your profile."));
      }
    }
  };

  const cancel = () => {
    if (saving) {
      return;
    }
    if (!dirty) {
      nav.pop();
      return;
    }
    Alert.alert(
      'Discard changes?',
      'Your edits to your profile will be lost.',
      [
        { text: 'Keep editing', style: 'cancel' },
        { text: 'Discard changes', style: 'destructive', onPress: nav.pop },
      ],
    );
  };

  useBackOverride(cancel);

  const changePhoto = async () => {
    if (upload) {
      return;
    }
    setPhotoError(undefined);
    try {
      const image = await pickImage();
      if (!image || !mounted.current) {
        return;
      }
      const before = me.photoUrl;
      setUpload({ uri: image.uri, progress: 0 });
      await uploadAvatar(image, fraction => {
        if (mounted.current) {
          setUpload(u => (u ? { ...u, progress: fraction } : u));
        }
      });
      if (mounted.current) {
        setUploaded({ before, v: Date.now() });
        toast.show('Photo updated');
      }
    } catch (e) {
      if (mounted.current) {
        setPhotoError(messageOf(e, "Couldn't update your photo."));
      }
    } finally {
      if (mounted.current) {
        setUpload(undefined);
      }
    }
  };

  // While uploading, preview the picked file in place of the old photo.
  // Right after, if the URL didn't change, bust the cache so the new photo
  // replaces the old one.
  const photoUrl = upload
    ? upload.uri
    : uploaded && me.photoUrl && me.photoUrl === uploaded.before
    ? withVersion(me.photoUrl, uploaded.v)
    : me.photoUrl;

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Create's header (SPEC 3.06): X to cancel, centred title, primary
          Save on the right. */}
      <View style={styles.header}>
        <IconButton
          icon="x"
          iconSize={22}
          size={40}
          pressedScale={0.92}
          accessibilityLabel="Cancel"
          disabled={saving}
          onPress={cancel}
        />
        <Text
          style={[type.navTitle, styles.title]}
          accessibilityRole="header"
          numberOfLines={1}
          pointerEvents="none"
        >
          Edit profile
        </Text>
        <Button
          label="Save"
          size="sm"
          loadingLabel="Saving…"
          loading={saving}
          disabled={!dirty || !valid}
          onPress={save}
          style={styles.save}
          labelStyle={styles.saveLabel}
        />
      </View>

      {saveError ? (
        <View style={styles.banner} accessibilityLiveRegion="polite">
          <Icon name="warning-circle" size={16} color={colors.danger} />
          <Text style={styles.bannerText}>{saveError}</Text>
          <Button
            variant="link"
            size="text"
            label="Retry"
            accessibilityLabel="Retry saving"
            onPress={save}
          />
        </View>
      ) : null}

      {/* 'padding' on both platforms: Android runs edge-to-edge, so the
          window is not resized for the keyboard. */}
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          contentContainerStyle={[
            styles.body,
            { paddingBottom: Math.max(insets.bottom, 16) + 24 },
          ]}
        >
          <View style={styles.photo}>
            <View
              accessible={!!upload}
              accessibilityRole={upload ? 'progressbar' : undefined}
              accessibilityLabel={upload ? 'Uploading photo' : undefined}
              accessibilityValue={
                upload
                  ? { min: 0, max: 100, now: Math.round(upload.progress * 100) }
                  : undefined
              }
            >
              <Avatar
                uri={photoUrl}
                name={draft.name || me.name}
                size={AVATAR}
                style={upload ? styles.uploading : undefined}
              />
              {upload ? <ProgressRing progress={upload.progress} /> : null}
            </View>
            <Button
              variant="soft"
              size="sm"
              icon="camera"
              label={upload ? 'Uploading…' : 'Change photo'}
              disabled={!!upload || saving}
              onPress={changePhoto}
            />
            {photoError ? (
              <Text style={styles.photoError} accessibilityLiveRegion="polite">
                {photoError}
              </Text>
            ) : null}
          </View>

          <View style={styles.fields} pointerEvents={saving ? 'none' : 'auto'}>
            <TextField
              label="Name"
              value={draft.name}
              onChangeText={set('name')}
              error={touched.name ? errors.name : undefined}
              errorIcon
              editable={!saving}
              autoCapitalize="words"
              autoComplete="name"
              textContentType="name"
              returnKeyType="next"
              onSubmitEditing={() => handleRef.current?.focus()}
              submitBehavior="submit"
            />
            <TextField
              ref={handleRef}
              label="Username"
              value={draft.handle}
              onChangeText={set('handle')}
              error={touched.handle ? errors.handle : undefined}
              errorIcon
              helper="Lowercase letters, numbers, dots and underscores."
              editable={!saving}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="username"
              textContentType="username"
              returnKeyType="next"
              onSubmitEditing={() => bioRef.current?.focus()}
              submitBehavior="submit"
            />
            <TextField
              ref={bioRef}
              multiline
              inputStyle={styles.bio}
              label="Bio"
              value={draft.bio}
              onChangeText={set('bio')}
              helper={`${draft.bio.length}/${BIO_MAX}`}
              editable={!saving}
              maxLength={BIO_MAX}
            />
            <TextField
              ref={locationRef}
              label="Location"
              value={draft.location}
              onChangeText={set('location')}
              placeholder="City or region"
              editable={!saving}
              autoCapitalize="words"
              returnKeyType="done"
              onSubmitEditing={save}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const AVATAR = 96;
const RING = AVATAR + 10;
const RING_STROKE = 2.5;

/** Thin accent ring around the avatar that fills with upload progress. */
function ProgressRing({ progress }: { progress: number }) {
  const r = (RING - RING_STROKE) / 2;
  const circumference = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, progress));
  return (
    <View style={styles.ring} pointerEvents="none">
      <Svg width={RING} height={RING}>
        <Circle
          cx={RING / 2}
          cy={RING / 2}
          r={r}
          stroke={colors.line}
          strokeWidth={RING_STROKE}
          fill="none"
        />
        <Circle
          cx={RING / 2}
          cy={RING / 2}
          r={r}
          stroke={colors.accent}
          strokeWidth={RING_STROKE}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={circumference * (1 - clamped)}
          transform={`rotate(-90 ${RING / 2} ${RING / 2})`}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
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
  // Centred on the bar whatever the widths of X and Save.
  title: {
    position: 'absolute',
    left: 72,
    right: 72,
    textAlign: 'center',
  },
  save: { minWidth: 64, borderRadius: 12, paddingHorizontal: 16 },
  saveLabel: { fontSize: 15 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 16,
    paddingRight: 12,
    backgroundColor: colors.fill,
  },
  bannerText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.danger,
  },
  body: { paddingHorizontal: 16, paddingTop: 24 },
  photo: { alignItems: 'center', gap: 12 },
  uploading: { opacity: 0.7 },
  ring: {
    position: 'absolute',
    top: (AVATAR - RING) / 2,
    left: (AVATAR - RING) / 2,
  },
  photoError: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20.3,
    color: colors.danger,
    textAlign: 'center',
    maxWidth: 300,
  },
  fields: { gap: 18, marginTop: 24 },
  bio: { minHeight: 112 },
});
