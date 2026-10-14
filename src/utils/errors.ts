/**
 * The one place that turns a rejected call into toast / banner copy. Store,
 * auth and backend calls reject with user-safe messages, so pass those
 * through; anything else (or an empty message) gets the caller's fallback.
 */
export function messageOf(e: unknown, fallback: string): string {
  return e instanceof Error && e.message ? e.message : fallback;
}
