/** The design's email check (SPEC 3.02 / 3.03): `/^\S+@\S+\.\S+$/`. */
export const EMAIL_RE = /^\S+@\S+\.\S+$/;

/**
 * Plain-language copy for a failed Google sign-in, or undefined when there
 * is nothing to say (the user closed the account picker). The Google SDK's
 * own messages are developer-facing, so only known cases pass through.
 * (Carried over from the retired AuthLayout.)
 */
export function googleMessage(e: unknown): string | undefined {
  const code = String((e as { code?: unknown } | null)?.code ?? '');
  const raw = e instanceof Error ? e.message : '';
  if (
    /cancel/i.test(raw) ||
    code === 'SIGN_IN_CANCELLED' ||
    code === '12501' ||
    code === 'IN_PROGRESS'
  ) {
    return undefined;
  }
  if (/play services/i.test(raw) || code === 'PLAY_SERVICES_NOT_AVAILABLE') {
    return 'Google Play services is needed to sign in with Google. Update it and try again.';
  }
  if (/network|connection|reach the server/i.test(raw)) {
    return "Can't reach Google right now. Check your connection and try again.";
  }
  if (/too many attempts|isn't set up yet/i.test(raw)) {
    return raw;
  }
  return "Couldn't sign in with Google. Try again, or use your email.";
}
