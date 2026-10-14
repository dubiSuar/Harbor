import React, { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type TextInputInstance,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AgreeCheckbox } from '../components/auth/AgreeCheckbox';
import { AuthFooterLink } from '../components/auth/AuthFooterLink';
import { EMAIL_RE } from '../components/auth/authHelpers';
import { StrengthMeter } from '../components/auth/StrengthMeter';
import { Button, IconButton, TextField, useToast } from '../components/ui';
import { firstNameOf } from '../data/types';
import { useNav } from '../navigation/Navigator';
import { AuthError } from '../services/auth';
import { useAuth } from '../state/AuthContext';
import { colors, fonts, space, type } from '../theme';
import { messageOf } from '../utils/errors';

type Errors = { name?: string; email?: string; pw?: string; agree?: string };

const ERR = {
  name: 'Enter your name.',
  email: 'Enter a valid email address.',
  pw: 'Use at least 8 characters.',
  agree: 'Please accept the terms to continue.',
};

const TERMS =
  'I agree to the Terms and Privacy Policy. Harbor never sells your data.';

/** 03 Register (SPEC 3.03). Live password strength; real sign-up via useAuth. */
export function SignUpScreen() {
  const nav = useNav();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [agree, setAgree] = useState(false);
  const [err, setErr] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const emailRef = useRef<TextInputInstance>(null);
  const pwRef = useRef<TextInputInstance>(null);

  // Signing up swaps the whole stack, which unmounts this screen.
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const clear = (key: keyof Errors) => {
    if (err[key]) {
      setErr(e => ({ ...e, [key]: undefined }));
    }
  };

  const submit = async () => {
    if (busy) {
      return;
    }
    const next: Errors = {};
    if (name.trim().length < 2) {
      next.name = ERR.name;
    }
    if (!EMAIL_RE.test(email)) {
      next.email = ERR.email;
    }
    if (pw.length < 8) {
      next.pw = ERR.pw;
    }
    if (!agree) {
      next.agree = ERR.agree;
    }
    setErr(next);
    if (Object.keys(next).length) {
      return;
    }
    setBusy(true);
    const clean = name.trim();
    try {
      const user = await signUp(clean, email.trim(), pw);
      toast.show(`Welcome to Harbor, ${firstNameOf(user.name || clean)}`);
    } catch (e) {
      if (!mounted.current) {
        return;
      }
      if (e instanceof AuthError && e.field) {
        const key = e.field === 'password' ? 'pw' : e.field;
        setErr({ [key]: e.message });
      } else {
        toast.show(
          messageOf(e, "Couldn't create your account. Please try again."),
          { icon: 'warning-circle' },
        );
      }
    } finally {
      if (mounted.current) {
        setBusy(false);
      }
    }
  };

  return (
    // 'padding' on both platforms: Android runs edge-to-edge, so the window
    // is not resized for the keyboard.
    <KeyboardAvoidingView style={styles.root} behavior="padding">
      <ScrollView
        style={styles.root}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top,
            paddingBottom: Math.max(insets.bottom, 16),
          },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
      >
        <IconButton
          icon="caret-left"
          iconSize={24}
          accessibilityLabel="Back"
          onPress={nav.pop}
          style={styles.back}
        />
        <Text style={styles.title} accessibilityRole="header">
          Create your account
        </Text>
        <Text style={styles.lead}>Use the name your friends know you by.</Text>

        <View style={styles.fields}>
          <TextField
            label="Full name"
            placeholder="Noor Haddad"
            value={name}
            onChangeText={v => {
              setName(v);
              clear('name');
            }}
            error={err.name}
            autoCapitalize="words"
            autoComplete="name"
            textContentType="name"
            returnKeyType="next"
            onSubmitEditing={() => emailRef.current?.focus()}
            submitBehavior="submit"
          />
          <TextField
            ref={emailRef}
            label="Email"
            placeholder="noor@haddad.studio"
            value={email}
            onChangeText={v => {
              setEmail(v);
              clear('email');
            }}
            error={err.email}
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
            returnKeyType="next"
            onSubmitEditing={() => pwRef.current?.focus()}
            submitBehavior="submit"
          />
          <TextField
            ref={pwRef}
            label="Password"
            placeholder="At least 8 characters"
            value={pw}
            onChangeText={v => {
              setPw(v);
              clear('pw');
            }}
            error={err.pw}
            secure
            autoCapitalize="none"
            autoComplete="new-password"
            textContentType="newPassword"
            returnKeyType="done"
            below={<StrengthMeter password={pw} />}
          />
          <AgreeCheckbox
            checked={agree}
            error={!!err.agree}
            label={TERMS}
            onToggle={() => {
              setAgree(a => !a);
              clear('agree');
            }}
          />
          {err.agree ? (
            <Text style={styles.agreeError} accessibilityLiveRegion="polite">
              {err.agree}
            </Text>
          ) : null}
        </View>

        <View style={styles.spacer} />
        <Button
          label="Create account"
          loadingLabel="Creating account…"
          loading={busy}
          onPress={submit}
        />
        <AuthFooterLink
          prompt="Already have an account? "
          action="Sign in"
          onPress={() => nav.popTo({ name: 'SignIn' })}
          style={styles.footer}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { flexGrow: 1, paddingHorizontal: space.authGutter },
  back: { marginTop: 4, marginLeft: -10 },
  title: { ...type.authTitle, marginTop: 14, marginBottom: 8 },
  lead: { ...type.lead, marginBottom: 26 },
  fields: { gap: 18 },
  agreeError: {
    marginTop: -8,
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.danger,
  },
  spacer: { flex: 1, minHeight: 24 },
  // The design's 18 top margin, less the link Button's extra height.
  footer: { marginTop: 4.5 },
});
