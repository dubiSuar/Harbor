import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { User } from '../data/types';
import * as auth from '../services/auth';

type AuthValue = {
  user: User | null;
  // True until Firebase reports the restored session (or none).
  initializing: boolean;
  /** Resolves with the signed-in User (toast "Signed in as {First}"). */
  signIn: (email: string, password: string) => Promise<User>;
  /** Resolves with the new User (toast "Welcome to Harbor, {First}"). */
  signUp: (name: string, email: string, password: string) => Promise<User>;
  /** Resolves with the User, or null (still signed out) on a cancel. */
  signInWithGoogle: () => Promise<User | null>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // Firebase (or the DEMO_MODE fake, see src/config.ts) reports sessions.
    const unsubscribe = auth.onAuthStateChanged(next => {
      // Keep a richer local copy (e.g. the name set during sign-up, which
      // can arrive after the first auth event).
      setUser(prev =>
        next ? (prev && prev.id === next.id ? prev : next) : null,
      );
      setInitializing(false);
    });
    return unsubscribe;
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const next = await auth.signIn(email, password);
    setUser(next);
    return next;
  }, []);

  const signUp = useCallback(
    async (name: string, email: string, password: string) => {
      const next = await auth.signUp(name, email, password);
      setUser(next);
      return next;
    },
    [],
  );

  const signInWithGoogle = useCallback(async () => {
    const next = await auth.signInWithGoogle();
    // null: the user cancelled the Google sheet. Nothing to do.
    if (next) {
      setUser(next);
    }
    return next;
  }, []);

  const signOut = useCallback(async () => {
    // Drop the user first so the store session (and its Firestore
    // listeners) unmounts while the credentials are still valid; otherwise
    // every listener fails with permission-denied during sign-out.
    setUser(null);
    // Let React commit the unmount before revoking.
    await new Promise<void>(resolve => setTimeout(resolve, 0));
    await auth.signOut();
  }, []);

  const value = useMemo(
    () => ({ user, initializing, signIn, signUp, signInWithGoogle, signOut }),
    [user, initializing, signIn, signUp, signInWithGoogle, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
