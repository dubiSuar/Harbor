/**
 * App-wide switches.
 *
 * DEMO_MODE: when true, Harbor needs no backend, as a demo safety net
 * (seed images still load from picsum.photos, so keep a network connection).
 * Auth AND data are local: any valid email plus an 8+ character password
 * signs in (as the demo user with id 'me'), and the feed, comments, follows,
 * activity and settings come from the seeded mock content in
 * src/data/mock.ts, kept in memory. Nothing touches Firebase.
 *
 * When false (the default), auth uses Firebase Auth and data lives in
 * Firestore + Cloud Storage (see src/services/backend/firebase.ts).
 */
export const DEMO_MODE = true;

/** Posts per feed page. The feed is one realtime query whose window grows by this much on loadMore. */
export const FEED_PAGE_SIZE = 20;
