import {
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged as onFirebaseAuthStateChanged,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  type User as FirebaseUser,
} from '@react-native-firebase/auth';
import {
  GoogleSignin,
  isErrorWithCode,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { DEMO_MODE } from '../config';
import type { User } from '../data/types';

// Set webClientId from the Firebase console (OAuth client, type "Web").
GoogleSignin.configure({
  // webClientId: 'YOUR_WEB_CLIENT_ID_HERE.apps.googleusercontent.com',
});

export class AuthError extends Error {
  field?: 'name' | 'email' | 'password';
  constructor(message: string, field?: AuthError['field']) {
    super(message);
    this.field = field;
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * The name typed on the sign-up form while the account is being created.
 * Firebase fires onAuthStateChanged as soon as the account exists, BEFORE
 * updateProfile(displayName) has run, so the listener maps the new user
 * with this name (otherwise the profile would be created with the email
 * prefix).
 */
let pendingSignUpName: string | null = null;

export function mapFirebaseUser(fbUser: FirebaseUser, name?: string): User {
  return {
    id: fbUser.uid,
    name: name || fbUser.displayName || fbUser.email?.split('@')[0] || 'You',
    email: fbUser.email ?? undefined,
    photoUrl: fbUser.photoURL ?? undefined,
  };
}

// Firebase error codes -> copy that names the problem and the recovery.
function toAuthError(e: unknown): AuthError {
  const code = (e as { code?: string })?.code ?? '';
  switch (code) {
    case 'auth/invalid-email':
      return new AuthError("That doesn't look like an email address.", 'email');
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return new AuthError(
        'Email or password is incorrect. Try again or reset your password.',
        'password',
      );
    case 'auth/email-already-in-use':
      return new AuthError(
        'An account already uses this email. Sign in instead.',
        'email',
      );
    case 'auth/weak-password':
      return new AuthError('Choose a stronger password.', 'password');
    case 'auth/too-many-requests':
      return new AuthError('Too many attempts. Wait a minute and try again.');
    case 'auth/network-request-failed':
      return new AuthError("Can't reach the server. Check your connection.");
    default:
      return new AuthError(
        (e as Error)?.message ?? 'Something went wrong. Try again.',
      );
  }
}

function validateEmail(email: string) {
  if (!email.trim()) {
    throw new AuthError('Enter your email.', 'email');
  }
  if (!EMAIL_RE.test(email.trim())) {
    throw new AuthError("That doesn't look like an email address.", 'email');
  }
}

// ---------------------------------------------------------------------------
// DEMO_MODE: a local fake. Any valid email + 8+ character password signs in
// as the demo user (id 'me', matching the seeded mock content). Sessions are
// not persisted: every launch starts signed out.
// ---------------------------------------------------------------------------

const DEMO_ID = 'me';
type AuthListener = (user: User | null) => void;
const demoListeners = new Set<AuthListener>();
const demoDelay = () =>
  new Promise<void>(resolve => setTimeout(resolve, 400 + Math.random() * 300));

// The design's demo persona. A name typed on sign-up overrides it
// (DECISIONS #7); a plain sign-in keeps it.
const DEMO_NAME = 'Noor Haddad';

function demoUser(email: string, name?: string): User {
  return {
    id: DEMO_ID,
    name: name?.trim() || DEMO_NAME,
    email: email.trim(),
  };
}

function demoNotify(user: User | null) {
  demoListeners.forEach(l => l(user));
}

async function demoSignIn(email: string, password: string, name?: string) {
  validateEmail(email);
  if (password.length < 8) {
    throw new AuthError('Password needs at least 8 characters.', 'password');
  }
  await demoDelay();
  const user = demoUser(email, name);
  demoNotify(user);
  return user;
}

// ---------------------------------------------------------------------------

export async function signIn(email: string, password: string): Promise<User> {
  validateEmail(email);
  if (!password) {
    throw new AuthError('Enter your password.', 'password');
  }
  if (DEMO_MODE) {
    return demoSignIn(email, password);
  }
  try {
    const cred = await signInWithEmailAndPassword(
      getAuth(),
      email.trim(),
      password,
    );
    return mapFirebaseUser(cred.user);
  } catch (e) {
    throw toAuthError(e);
  }
}

/**
 * Creates the account. The Firestore profile (users/{uid}) is created by the
 * data backend's ensureProfile() when the store first loads, which keeps
 * this module free of data-layer imports.
 */
export async function signUp(
  name: string,
  email: string,
  password: string,
): Promise<User> {
  if (!name.trim()) {
    throw new AuthError('Enter your name.', 'name');
  }
  validateEmail(email);
  if (password.length < 8) {
    throw new AuthError('Password needs at least 8 characters.', 'password');
  }
  if (DEMO_MODE) {
    return demoSignIn(email, password, name);
  }
  const cleanName = name.trim();
  pendingSignUpName = cleanName;
  try {
    const cred = await createUserWithEmailAndPassword(
      getAuth(),
      email.trim(),
      password,
    );
    // The account exists now: a failed display-name update must not turn
    // a successful sign-up into an error (the profile already has the name).
    try {
      await updateProfile(cred.user, { displayName: cleanName });
    } catch {
      // Best effort.
    }
    return mapFirebaseUser(cred.user, cleanName);
  } catch (e) {
    throw toAuthError(e);
  } finally {
    pendingSignUpName = null;
  }
}

export async function sendPasswordReset(email: string): Promise<void> {
  validateEmail(email);
  if (DEMO_MODE) {
    await demoDelay();
    return;
  }
  try {
    await sendPasswordResetEmail(getAuth(), email.trim());
  } catch (e) {
    throw toAuthError(e);
  }
}

/**
 * Google sign-in. Resolves with null when the user cancels (nothing changes).
 */
export async function signInWithGoogle(): Promise<User | null> {
  if (DEMO_MODE) {
    await demoDelay();
    const user = demoUser('noor@haddad.studio');
    demoNotify(user);
    return user;
  }
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const result = await GoogleSignin.signIn();
    // v16 reports a cancel as a response, not an error.
    if (result.type !== 'success') {
      return null;
    }
    const idToken = result.data.idToken;
    if (!idToken) {
      // Without a webClientId, Google returns no idToken for Firebase.
      throw new AuthError(
        "Google sign-in isn't set up yet. Add the webClientId (see FIREBASE_SETUP.md).",
      );
    }
    const credential = GoogleAuthProvider.credential(idToken);
    const cred = await signInWithCredential(getAuth(), credential);
    return mapFirebaseUser(cred.user);
  } catch (e) {
    if (e instanceof AuthError) {
      throw e;
    }
    if (isErrorWithCode(e)) {
      switch (e.code) {
        case statusCodes.SIGN_IN_CANCELLED:
          return null;
        case statusCodes.IN_PROGRESS:
          throw new AuthError('Google sign-in is already open.');
        case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
          throw new AuthError(
            'Google Play services is missing or out of date. Update it and try again.',
          );
      }
    }
    throw toAuthError(e);
  }
}

export async function signOut(): Promise<void> {
  if (DEMO_MODE) {
    demoNotify(null);
    return;
  }
  await firebaseSignOut(getAuth());
  await GoogleSignin.signOut().catch(() => {});
}

/**
 * Subscribes to auth changes with app-level users. In DEMO_MODE it calls
 * back with null immediately (no persisted session) and then on every demo
 * sign-in / sign-out.
 */
export function onAuthStateChanged(
  callback: (user: User | null) => void,
): () => void {
  if (DEMO_MODE) {
    demoListeners.add(callback);
    callback(null);
    return () => {
      demoListeners.delete(callback);
    };
  }
  return onFirebaseAuthStateChanged(getAuth(), fbUser =>
    callback(
      fbUser ? mapFirebaseUser(fbUser, pendingSignUpName ?? undefined) : null,
    ),
  );
}
