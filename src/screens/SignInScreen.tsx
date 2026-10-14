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
import { AuthFooterLink } from '../components/auth/AuthFooterLink';
import { EMAIL_RE, googleMessage } from '../components/auth/authHelpers';
import { Button, Logo, TextField, useToast } from '../components/ui';
import { firstNameOf, type User } from '../data/types';
import { useNav } from '../navigation/Navigator';
import { AuthError, sendPasswordReset } from '../services/auth';
import { useAuth } from '../state/AuthContext';
import { colors, fonts, space, type } from '../theme';
import { messageOf } from '../utils/errors';

type Errors = { email?: string; pw?: string };

const EMAIL_ERROR = 'Enter a valid email address.';
const PW_ERROR = 'Password must be at least 8 characters.';

/** 02 Login (SPEC 3.02). Inline errors on submit; real auth via useAuth. */
export function SignInScreen() {
  const nav = useNav();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { signIn, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [resetting, setResetting] = useState(false);
  const pwRef = useRef<TextInputInstance>(null);

  // Signing in swaps the whole stack, which unmounts this screen.
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const signedIn = (user: User | null) => {
    if (user) {
      toast.show(`Signed in as ${firstNameOf(user.name)}`);
    }
  };

  const submit = async () => {
    if (busy || googleBusy) {
      return;
    }
    // Validation runs only on submit; both errors are set together.
    const next: Errors = {};
    if (!EMAIL_RE.test(email)) {
      next.email = EMAIL_ERROR;
    }
    if (pw.length < 8) {
      next.pw = PW_ERROR;
    }
    setErr(next);
    if (next.email || next.pw) {
      return;
    }
    setBusy(true);
    try {
      signedIn(await signIn(email.trim(), pw));
      if (mounted.current) {
        setPw('');
      }
    } catch (e) {
      if (!mounted.current) {
        return;
      }
      if (e instanceof AuthError && e.field === 'email') {
        setErr({ email: e.message });
      } else if (e instanceof AuthError && e.field === 'password') {
        setErr({ pw: e.message });
      } else {
        toast.show(messageOf(e, "Couldn't sign in. Please try again."), {
          icon: 'warning-circle',
        });
      }
    } finally {
      if (mounted.current) {
        setBusy(false);
      }
    }
  };

  // Google has its own busy state so the email button keeps its label. A
  // cancelled picker resolves (or rejects) quietly: no message.
  const google = async () => {
    if (busy || googleBusy) {
      return;
    }
    setErr({});
    setGoogleBusy(true);
    try {
      // null when the picker was cancelled: stay silent.
      signedIn(await signInWithGoogle());
    } catch (e) {
      const text = googleMessage(e);
      if (text) {
        toast.show(text, { icon: 'warning-circle' });
      }
    } finally {
      if (mounted.current) {
        setGoogleBusy(false);
      }
    }
  };

  const forgot = async () => {
    if (resetting) {
      return;
    }
    if (!EMAIL_RE.test(email)) {
      setErr(e => ({ ...e, email: EMAIL_ERROR }));
      return;
    }
    setResetting(true);
    try {
      await sendPasswordReset(email.trim());
      toast.show('Reset link sent to your email');
    } catch (e) {
      if (!mounted.current) {
        return;
      }
      if (e instanceof AuthError && e.field === 'email') {
        setErr(x => ({ ...x, email: e.message }));
      } else {
        toast.show(
          messageOf(e, "Couldn't send a reset link. Please try again."),
          { icon: 'warning-circle' },
        );
      }
    } finally {
      if (mounted.current) {
        setResetting(false);
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
        <View style={styles.logo}>
          <Logo size={56} />
        </View>
        <Text style={styles.title} accessibilityRole="header">
          Welcome back
        </Text>
        <Text style={styles.lead}>
          Sign in to see what your people have been up to.
        </Text>

        <View style={styles.fields}>
          <TextField
            label="Email"
            placeholder="noor@haddad.studio"
            value={email}
            onChangeText={v => {
              setEmail(v);
              if (err.email) {
                setErr(e => ({ ...e, email: undefined }));
              }
            }}
            error={err.email}
            errorIcon
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
              if (err.pw) {
                setErr(e => ({ ...e, pw: undefined }));
              }
            }}
            error={err.pw}
            errorIcon
            secure
            secureToggle
            autoCapitalize="none"
            autoComplete="current-password"
            textContentType="password"
            returnKeyType="go"
            onSubmitEditing={submit}
          />
        </View>

        <Button
          variant="link"
          size="text"
          label="Forgot password?"
          accessibilityLabel="Forgot password"
          accessibilityHint="Sends a reset link to the email above"
          onPress={forgot}
          loading={resetting}
          style={styles.forgot}
        />

        <Button
          label="Sign in"
          loadingLabel="Signing in…"
          loading={busy}
          disabled={googleBusy}
          onPress={submit}
        />

        <View style={styles.divider} importantForAccessibility="no">
          <View style={styles.rule} />
          <Text style={styles.or}>or</Text>
          <View style={styles.rule} />
        </View>

        {/* "Continue with Apple" is hidden (DECISIONS #6). */}
        <Button
          variant="outline"
          size="social"
          icon="google-logo"
          label="Continue with Google"
          loading={googleBusy}
          disabled={busy}
          onPress={google}
        />

        <View style={styles.spacer} />
        <AuthFooterLink
          prompt="New to Harbor? "
          action="Create account"
          onPress={() => nav.popTo({ name: 'SignUp' })}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { flexGrow: 1, paddingHorizontal: space.authGutter },
  logo: { marginTop: 34, alignSelf: 'flex-start' },
  title: { ...type.authTitle, marginTop: 26, marginBottom: 8 },
  lead: { ...type.lead, marginBottom: 28 },
  fields: { gap: 18 },
  // The design's link is text-height with margin 12 0 22; the shared text
  // Button is 44 tall, so the margins shrink by its extra 13.5 per side.
  forgot: {
    alignSelf: 'flex-end',
    marginTop: -1.5,
    marginBottom: 8.5,
    marginRight: -4,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 24,
  },
  rule: { flex: 1, height: 1, backgroundColor: colors.line },
  or: { fontFamily: fonts.regular, fontSize: 13, color: colors.faint },
  spacer: { flex: 1, minHeight: 20 },
});
