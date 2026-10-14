import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { FEED_PAGE_SIZE } from '../config';
import type { Activity, Comment, Post, Prefs, User } from '../data/types';
import { DEFAULT_PREFS } from '../data/types';
import {
  createBackend,
  FriendlyError,
  toFriendlyError,
  validateComment,
  validatePost,
  validateProfileEdits,
  type Backend,
  type FeedPage,
} from '../services/backend';
import { useAuth } from './AuthContext';
import type {
  FeedSummary,
  Live,
  LoadState,
  LocalImage,
  NewPostInput,
  OnProgress,
  ProfileEdits,
  StoreValue,
} from './storeTypes';

export type { ProfileEdits } from './storeTypes';

/**
 * App data store. Implements the StoreValue contract (storeTypes.ts) on top
 * of a Backend (Firebase or the offline demo, see src/config.ts).
 *
 * - The feed is ONE realtime query over the newest `pages * FEED_PAGE_SIZE`
 *   posts. loadMore() grows the window, refreshFeed() resets it to one page.
 *   New posts can never open a gap between pages.
 * - likedByMe is resolved per visible post (batched + cached) and overlaid
 *   on every post the store hands out, together with optimistic overrides.
 *   Like / follow writes are idempotent transactions that report the real
 *   resulting state, which corrects any stale local flag.
 * - Users are a synchronous cache: unknown ids return a placeholder and are
 *   fetched once in the background (queued in a microtask, never setState
 *   during render).
 * - The profile doc is set up once per session (with retries); every
 *   mutation that touches users/{me} waits for it.
 * - Everything lives in a session component keyed by the signed-in user id,
 *   so signing out (or switching accounts) starts from a clean slate, and
 *   the backend is disposed when the session unmounts.
 */

const LEGACY_ME = 'me';
const ACTIVITY_LIMIT = 50;
const SUGGESTION_POOL = 40;
const SUGGESTION_LIMIT = 20;
const REFRESH_TIMEOUT_MS = 10000;
/** How long a settled like override may wait for the snapshot to catch up. */
const LIKE_SETTLE_MS = 5000;
const PROFILE_ATTEMPTS = 3;
const PROFILE_BACKOFF_MS = 600;
const PROFILE_ERROR =
  "Couldn't set up your profile. Check your connection and try again.";
const LOAD_MORE_ERROR = "Couldn't load more posts.";

type LikeOverride = {
  liked: boolean;
  count: number;
  seq: number;
  /** The server post's likeCount when the toggle started. */
  baseCount: number;
  /** The write succeeded; drop the override once the snapshot moves. */
  settled?: boolean;
};
type FollowOverride = { value: boolean; seq: number };
type MoreWaiter = {
  epoch: number;
  limit: number;
  promise: Promise<void>;
  resolve: () => void;
  reject: (e: Error) => void;
};

/** Internal API the per-screen hooks use. Not part of the public contract. */
type Internals = {
  backend: Backend;
  meId: string;
  resolveId: (userId: string) => string;
  users: Record<string, User>;
  placeholder: (userId: string) => User;
  cacheUsers: (list: User[]) => void;
  requestUsers: (ids: string[]) => void;
  decorate: (post: Post) => Post;
  remember: (posts: Post[]) => void;
  peekPost: (postId: string) => Post | undefined;
  hidden: Record<string, true>;
  pendingPosts: Post[];
  pendingComments: Record<string, Comment[]>;
};

const StoreContext = createContext<StoreValue | null>(null);
const InternalContext = createContext<Internals | null>(null);

function warn(scope: string) {
  return (e: unknown) => {
    if (__DEV__) {
      console.warn(`[store] ${scope}:`, (e as Error)?.message ?? e);
    }
  };
}

const delay = (ms: number) =>
  new Promise<void>(resolve => setTimeout(resolve, ms));

function firstName(name: string | undefined) {
  return (name ?? '').trim().split(/\s+/)[0] || 'Someone';
}

/** A short quote-able snippet, cut at a word boundary. */
function snippet(text: string, max = 48) {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) {
    return clean.replace(/[.!?,;:]+$/, '');
  }
  const cut = clean.slice(0, max);
  const space = cut.lastIndexOf(' ');
  return `${(space > 20 ? cut.slice(0, space) : cut).replace(
    /[.!?,;:]+$/,
    '',
  )}…`;
}

function joinNames(names: string[]) {
  if (names.length <= 1) {
    return names[0] ?? '';
  }
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Feed digest built from loaded posts. No AI call. Covers today (since local
 * midnight) or, when nothing was posted today, the last 7 days.
 */
function buildSummary(
  posts: Post[],
  users: Record<string, User>,
  meId: string,
  now = Date.now(),
): FeedSummary {
  const midnight = new Date(now);
  midnight.setHours(0, 0, 0, 0);
  const since = (t: number) =>
    posts.filter(p => !p.pending && p.createdAt >= t);
  let period: FeedSummary['period'] = 'today';
  let inWindow = since(midnight.getTime());
  if (inWindow.length === 0) {
    period = 'week';
    inWindow = since(now - WEEK_MS);
  }
  if (inWindow.length === 0) {
    return { count: 0, period: 'today', bullets: [] };
  }
  const when = period === 'today' ? 'today' : 'this week';
  const nameOf = (id: string) => firstName(users[id]?.name);
  const describe = (p: Post) =>
    p.text.trim()
      ? `${nameOf(p.authorId)}'s "${snippet(p.text)}"`
      : `${nameOf(p.authorId)}'s photo`;
  const bullets: string[] = [];

  const mostLiked = inWindow
    .filter(p => p.likeCount > 0)
    .sort((a, b) => b.likeCount - a.likeCount)[0];
  if (mostLiked) {
    bullets.push(`${describe(mostLiked)} is the most-liked post ${when}.`);
  }

  const mostDiscussed = inWindow
    .filter(p => p.commentCount > 0)
    .sort((a, b) => b.commentCount - a.commentCount)[0];
  if (mostDiscussed) {
    const n = mostDiscussed.commentCount;
    const comments = `${n} comment${n === 1 ? '' : 's'}`;
    bullets.push(
      mostDiscussed.id === mostLiked?.id
        ? `It's also the most discussed, with ${comments}.`
        : `${describe(mostDiscussed)} has the most conversation (${comments}).`,
    );
  }

  const weekAgo = now - WEEK_MS;
  const newcomers = [...new Set(inWindow.map(p => p.authorId))]
    .filter(id => id !== meId)
    .filter(id => (users[id]?.joinedAt ?? 0) >= weekAgo)
    .map(nameOf);
  if (newcomers.length) {
    bullets.push(
      `Say hi to ${joinNames(newcomers.slice(0, 3))}, new to Harbor this week.`,
    );
  }

  if (bullets.length === 0) {
    const people = new Set(inWindow.map(p => p.authorId)).size;
    bullets.push(
      `${inWindow.length} new post${
        inWindow.length === 1 ? '' : 's'
      } from ${people} ${people === 1 ? 'person' : 'people'} ${when}.`,
    );
  }
  return { count: inWindow.length, period, bullets };
}

/**
 * Batches ids requested during a render/effect into one async call made in a
 * microtask. `requested` dedupes across calls; forget() allows a retry.
 */
function useMicrotaskQueue(run: (ids: string[]) => void) {
  const requested = useRef(new Set<string>());
  const queue = useRef(new Set<string>());
  const scheduled = useRef(false);
  const runRef = useRef(run);
  runRef.current = run;

  const enqueue = useCallback((ids: string[], force = false) => {
    let added = false;
    ids.forEach(id => {
      if (id && (force || !requested.current.has(id))) {
        requested.current.add(id);
        queue.current.add(id);
        added = true;
      }
    });
    if (!added || scheduled.current) {
      return;
    }
    scheduled.current = true;
    Promise.resolve().then(() => {
      scheduled.current = false;
      const batch = [...queue.current];
      queue.current.clear();
      if (batch.length) {
        runRef.current(batch);
      }
    });
  }, []);

  const forget = useCallback((ids: string[]) => {
    ids.forEach(id => requested.current.delete(id));
  }, []);

  return { enqueue, forget, requested };
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const meId = user?.id ?? LEGACY_ME;
  // Keyed by user id: a different account never sees the previous one's data.
  return (
    <StoreSession key={meId} meId={meId} authUser={user}>
      {children}
    </StoreSession>
  );
}

function StoreSession({
  meId,
  authUser,
  children,
}: {
  meId: string;
  authUser: User | null;
  children: React.ReactNode;
}) {
  const backend = useMemo(() => createBackend(meId), [meId]);
  const aliveRef = useRef(true);
  /** Session timers, cleared on unmount. */
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());
  const later = useCallback((run: () => void, ms: number) => {
    const t = setTimeout(() => {
      timers.current.delete(t);
      run();
    }, ms);
    timers.current.add(t);
    return () => {
      clearTimeout(t);
      timers.current.delete(t);
    };
  }, []);
  useEffect(() => {
    aliveRef.current = true;
    const pending = timers.current;
    return () => {
      aliveRef.current = false;
      pending.forEach(clearTimeout);
      pending.clear();
    };
  }, []);
  // Dispose the backend (cancel uploads, silence callbacks) on unmount. The
  // zero-delay timer survives StrictMode's mount -> unmount -> mount check.
  const disposeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (disposeTimer.current) {
      clearTimeout(disposeTimer.current);
      disposeTimer.current = null;
    }
    return () => {
      disposeTimer.current = setTimeout(() => backend.dispose(), 0);
    };
  }, [backend]);
  const authUserRef = useRef(authUser);
  authUserRef.current = authUser;

  const isMe = useCallback(
    (userId: string) => userId === meId || userId === LEGACY_ME,
    [meId],
  );
  const resolveId = useCallback(
    (userId: string) => (userId === LEGACY_ME ? meId : userId),
    [meId],
  );

  // ---- users cache -------------------------------------------------------
  const [users, setUsers] = useState<Record<string, User>>(() =>
    authUser ? { [meId]: { ...authUser, id: meId } } : {},
  );

  const usersRef = useRef(users);
  usersRef.current = users;

  const cacheUsers = useCallback((list: User[]) => {
    if (!list.length) {
      return;
    }
    setUsers(prev => {
      const next = { ...prev };
      list.forEach(u => {
        const email = u.email ?? prev[u.id]?.email;
        next[u.id] = email ? { ...u, email } : u;
      });
      return next;
    });
  }, []);

  const userQueue = useMicrotaskQueue(ids => {
    backend.getUsers(ids).then(
      found => {
        if (aliveRef.current) {
          cacheUsers(found);
        }
      },
      e => {
        userQueue.forget(ids); // retry on the next request
        warn('user lookup')(e);
      },
    );
  });
  const requestUsers = userQueue.enqueue;
  useEffect(() => {
    // Me is kept fresh by the profile subscription below.
    userQueue.requested.current.add(meId);
  }, [meId, userQueue.requested]);

  const placeholders = useRef(new Map<string, User>());
  const placeholder = useCallback((userId: string): User => {
    let p = placeholders.current.get(userId);
    if (!p) {
      p = { id: userId, name: '' };
      placeholders.current.set(userId, p);
    }
    return p;
  }, []);

  const getUser = useCallback(
    (userId: string): User => {
      const key = resolveId(userId);
      const hit = users[key];
      if (hit) {
        return hit;
      }
      if (key) {
        requestUsers([key]); // queued in a microtask, not a render-time setState
      }
      return placeholder(key);
    },
    [users, resolveId, requestUsers, placeholder],
  );

  // ---- profile setup ---------------------------------------------------------
  // users/{me} must exist before anything writes to it (counters, edits).
  // Retried with backoff; a final failure surfaces through feedState /
  // feedError and refreshFeed() tries again.
  const [profileFailed, setProfileFailed] = useState(false);
  const profileReady = useRef<Promise<void>>(Promise.resolve());

  const setupProfile = useCallback(() => {
    const a = authUserRef.current;
    const seed = {
      name: a?.name ?? '',
      email: a?.email,
      photoUrl: a?.photoUrl,
    };
    const attempt = async () => {
      for (let i = 0; i < PROFILE_ATTEMPTS; i++) {
        if (i > 0) {
          await delay(PROFILE_BACKOFF_MS * 2 ** (i - 1));
        }
        if (!aliveRef.current) {
          break;
        }
        try {
          await backend.ensureProfile(seed);
          return;
        } catch (e) {
          warn('ensureProfile')(e);
        }
      }
      throw new FriendlyError(PROFILE_ERROR);
    };
    const promise = attempt();
    profileReady.current = promise;
    promise.then(
      () => {
        if (aliveRef.current && profileReady.current === promise) {
          setProfileFailed(false);
        }
      },
      () => {
        if (aliveRef.current && profileReady.current === promise) {
          setProfileFailed(true);
        }
      },
    );
    return promise;
  }, [backend]);

  useEffect(() => {
    setupProfile().catch(() => {}); // surfaced through profileFailed
  }, [setupProfile]);

  /** Resolves once users/{me} exists; rejects with PROFILE_ERROR otherwise. */
  const whenProfileReady = useCallback(() => profileReady.current, []);

  // ---- my profile + prefs --------------------------------------------------
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [prefOverrides, setPrefOverrides] = useState<Partial<Prefs>>({});

  useEffect(
    () =>
      backend.subscribeProfile(
        meId,
        profile => {
          if (profile) {
            cacheUsers([profile.user]);
            if (profile.prefs) {
              setPrefs(profile.prefs);
            }
          }
        },
        warn('my profile'),
      ),
    [backend, meId, cacheUsers],
  );

  // ---- likes -------------------------------------------------------------
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});
  const [likeOverrides, setLikeOverrides] = useState<
    Record<string, LikeOverride>
  >({});
  /** Bumped on every local like toggle so stale flag reads are ignored. */
  const likeSeq = useRef<Record<string, number>>({});
  const likeInFlight = useRef(new Set<string>());

  const likedQueue = useMicrotaskQueue(ids => {
    const versions: Record<string, number> = {};
    ids.forEach(id => {
      versions[id] = likeSeq.current[id] ?? 0;
    });
    backend.getLikedFlags(ids).then(
      ({ flags, failed }) => {
        if (failed.length) {
          likedQueue.forget(failed); // unknown: retried on the next load
        }
        if (!aliveRef.current) {
          return;
        }
        setLikedMap(prev => {
          let changed = false;
          const next = { ...prev };
          Object.keys(flags).forEach(id => {
            if (
              (likeSeq.current[id] ?? 0) === versions[id] &&
              next[id] !== flags[id]
            ) {
              next[id] = flags[id];
              changed = true;
            }
          });
          return changed ? next : prev;
        });
      },
      e => {
        likedQueue.forget(ids); // allow a retry on the next load
        warn('liked flags')(e);
      },
    );
  });
  const resolveLiked = likedQueue.enqueue;
  const forgetLiked = likedQueue.forget;

  const decorate = useCallback(
    (p: Post): Post => {
      const o = likeOverrides[p.id];
      // A settled override only bridges the gap until the snapshot moves.
      const active = !!o && !(o.settled && p.likeCount !== o.baseCount);
      const likedByMe = active ? o.liked : likedMap[p.id] ?? p.likedByMe;
      const likeCount = active ? o.count : p.likeCount;
      return likedByMe === p.likedByMe && likeCount === p.likeCount
        ? p
        : { ...p, likedByMe, likeCount };
    },
    [likeOverrides, likedMap],
  );

  // ---- known posts registry ----------------------------------------------
  const knownPosts = useRef(new Map<string, Post>());
  const remember = useCallback(
    (list: Post[]) => {
      if (!list.length) {
        return;
      }
      list.forEach(p => knownPosts.current.set(p.id, p));
      requestUsers(list.map(p => p.authorId));
      resolveLiked(list.filter(p => !p.pending).map(p => p.id));
    },
    [requestUsers, resolveLiked],
  );
  const peekPost = useCallback(
    (postId: string) => knownPosts.current.get(postId),
    [],
  );

  // ---- feed ----------------------------------------------------------------
  const [live, setLive] = useState<FeedPage>({ posts: [], hasMore: false });
  const [pages, setPages] = useState(1);
  const pagesRef = useRef(pages);
  pagesRef.current = pages;
  const [feedState, setFeedState] = useState<LoadState>('loading');
  const [feedError, setFeedError] = useState<string | undefined>();
  const [feedEpoch, setFeedEpoch] = useState(0);
  const feedEpochRef = useRef(0);
  const moreWaiter = useRef<MoreWaiter | null>(null);
  const refreshWaiters = useRef<Array<() => void>>([]);
  const settleRefresh = useCallback(() => {
    const waiters = refreshWaiters.current;
    refreshWaiters.current = [];
    waiters.forEach(w => w());
  }, []);

  useEffect(() => {
    const max = pages * FEED_PAGE_SIZE;
    return backend.subscribeFeed(
      max,
      page => {
        setLive(page);
        setFeedState('ready');
        setFeedError(undefined);
        settleRefresh();
        const w = moreWaiter.current;
        if (w && w.limit === max) {
          moreWaiter.current = null;
          w.resolve();
        }
      },
      err => {
        const w = moreWaiter.current;
        if (w && w.limit === max) {
          // Growing the window failed: report it to loadMore()'s caller and
          // fall back to the window that worked. The feed itself is fine.
          moreWaiter.current = null;
          setPages(p => Math.max(1, p - 1));
          w.reject(err);
          return;
        }
        setFeedError(err.message);
        setFeedState('error');
        settleRefresh();
      },
    );
  }, [backend, pages, feedEpoch, settleRefresh]);

  useEffect(() => {
    remember(live.posts);
  }, [live, remember]);

  const [pendingPosts, setPendingPosts] = useState<Post[]>([]);
  const [hidden, setHidden] = useState<Record<string, true>>({});

  const posts = useMemo(() => {
    const seen = new Set<string>();
    const out: Post[] = [];
    const add = (p: Post) => {
      if (seen.has(p.id) || hidden[p.id]) {
        return;
      }
      seen.add(p.id);
      out.push(decorate(p));
    };
    live.posts.forEach(add);
    pendingPosts.forEach(add);
    return out.sort((a, b) => b.createdAt - a.createdAt);
  }, [live, pendingPosts, hidden, decorate]);

  const livePostsRef = useRef(live.posts);
  livePostsRef.current = live.posts;

  // ---- follows -------------------------------------------------------------
  const [serverFollowing, setServerFollowing] = useState<Record<string, true>>(
    {},
  );
  const [followingState, setFollowingState] = useState<LoadState>('loading');
  const [followingError, setFollowingError] = useState<string | undefined>();
  const [followingEpoch, setFollowingEpoch] = useState(0);
  const [followOverrides, setFollowOverrides] = useState<
    Record<string, FollowOverride>
  >({});
  const followSeq = useRef(0);
  const followInFlight = useRef(new Set<string>());
  /** Accounts (un)followed in this session stay in the suggestions list. */
  const [touched, setTouched] = useState<Record<string, true>>({});

  useEffect(
    () =>
      backend.subscribeFollowing(
        ids => {
          setServerFollowing(ids);
          setFollowingState('ready');
          setFollowingError(undefined);
        },
        e => {
          warn('following list')(e);
          setFollowingError(e.message);
          setFollowingState('error');
        },
      ),
    [backend, followingEpoch],
  );

  const following = useMemo(() => {
    const out: Record<string, boolean> = { ...serverFollowing };
    Object.keys(followOverrides).forEach(id => {
      out[id] = followOverrides[id].value;
    });
    return out;
  }, [serverFollowing, followOverrides]);

  // ---- activity --------------------------------------------------------------
  const [rawActivity, setRawActivity] = useState<Activity[]>([]);
  const [activityState, setActivityState] = useState<LoadState>('loading');
  const [activityError, setActivityError] = useState<string | undefined>();
  const [activityEpoch, setActivityEpoch] = useState(0);
  const [readIds, setReadIds] = useState<Record<string, true>>({});
  useEffect(
    () =>
      backend.subscribeActivity(
        ACTIVITY_LIMIT,
        items => {
          setRawActivity(items);
          setActivityState('ready');
          setActivityError(undefined);
          requestUsers(items.map(a => a.actorId));
        },
        e => {
          warn('activity')(e);
          setActivityError(e.message);
          setActivityState('error');
        },
      ),
    [backend, requestUsers, activityEpoch],
  );
  const activity = useMemo(
    () =>
      rawActivity.map(a =>
        !a.read && readIds[a.id] ? { ...a, read: true } : a,
      ),
    [rawActivity, readIds],
  );
  const unreadCount = useMemo(
    () => activity.filter(a => !a.read).length,
    [activity],
  );

  // ---- refresh / paging ------------------------------------------------------
  const followingStateRef = useRef(followingState);
  followingStateRef.current = followingState;
  const activityStateRef = useRef(activityState);
  activityStateRef.current = activityState;
  const profileFailedRef = useRef(profileFailed);
  profileFailedRef.current = profileFailed;

  const refreshFeed = useCallback(
    () =>
      new Promise<void>(resolve => {
        let done = false;
        const finish = () => {
          if (!done) {
            done = true;
            cancelTimer();
            resolve();
          }
        };
        const cancelTimer = later(finish, REFRESH_TIMEOUT_MS);
        refreshWaiters.current.push(finish);
        feedEpochRef.current += 1;
        // A pending loadMore belongs to the old window: let it go quietly.
        const w = moreWaiter.current;
        moreWaiter.current = null;
        w?.resolve();
        setPages(1);
        setFeedState(s => (s === 'error' ? 'loading' : s));
        setFeedEpoch(e => e + 1);
        // Retry whatever failed for good.
        if (profileFailedRef.current) {
          setProfileFailed(false);
          setupProfile().catch(() => {});
        }
        if (followingStateRef.current === 'error') {
          setFollowingState('loading');
          setFollowingEpoch(e => e + 1);
        }
        if (activityStateRef.current === 'error') {
          setActivityState('loading');
          setActivityEpoch(e => e + 1);
        }
        // Re-check likes for what's on screen (could have changed elsewhere).
        resolveLiked(
          livePostsRef.current.map(p => p.id),
          true,
        );
      }),
    [later, resolveLiked, setupProfile],
  );

  const loadMore = useCallback((): Promise<void> => {
    const pendingMore = moreWaiter.current;
    if (pendingMore && pendingMore.epoch === feedEpochRef.current) {
      return pendingMore.promise; // already growing this window
    }
    if (!live.hasMore || feedState !== 'ready') {
      return Promise.resolve();
    }
    const nextPages = pagesRef.current + 1;
    let settle!: { resolve: () => void; reject: (e: Error) => void };
    const promise = new Promise<void>((resolve, reject) => {
      settle = { resolve, reject };
    });
    const cancelTimer = later(() => {
      // Slow network: stop waiting; the window keeps growing in the background.
      if (moreWaiter.current?.promise === promise) {
        moreWaiter.current = null;
      }
      settle.resolve();
    }, REFRESH_TIMEOUT_MS);
    moreWaiter.current = {
      epoch: feedEpochRef.current,
      limit: nextPages * FEED_PAGE_SIZE,
      promise,
      resolve: () => {
        cancelTimer();
        settle.resolve();
      },
      reject: e => {
        cancelTimer();
        settle.reject(toFriendlyError(e, LOAD_MORE_ERROR));
      },
    };
    setPages(nextPages);
    return promise;
  }, [later, live.hasMore, feedState]);

  const hasMore = live.hasMore;

  const pendingPostsRef = useRef(pendingPosts);
  pendingPostsRef.current = pendingPosts;
  const findPost = useCallback(
    (postId: string): Post | undefined =>
      knownPosts.current.get(postId) ??
      pendingPostsRef.current.find(p => p.id === postId),
    [],
  );

  // ---- suggestions -----------------------------------------------------------
  const [recentIds, setRecentIds] = useState<string[]>([]);
  useEffect(() => {
    backend.listRecentUsers(SUGGESTION_POOL).then(list => {
      if (!aliveRef.current) {
        return;
      }
      // Never overwrite my own (live, richer) profile with this snapshot.
      const others = list.filter(u => !isMe(u.id));
      others.forEach(u => userQueue.requested.current.add(u.id));
      cacheUsers(others);
      setRecentIds(others.map(u => u.id));
    }, warn('suggestions'));
  }, [backend, cacheUsers, isMe, userQueue.requested]);

  const otherUsers = useMemo(
    () =>
      recentIds
        .filter(id => !isMe(id) && (touched[id] || !serverFollowing[id]))
        .map(id => users[id])
        .filter((u): u is User => !!u)
        .slice(0, SUGGESTION_LIMIT),
    [recentIds, isMe, touched, serverFollowing, users],
  );

  // ---- pending comments ------------------------------------------------------
  const [pendingComments, setPendingComments] = useState<
    Record<string, Comment[]>
  >({});

  // ---- mutations -------------------------------------------------------------

  const clearLikeOverride = useCallback((postId: string, seq: number) => {
    setLikeOverrides(prev => {
      if (prev[postId]?.seq !== seq) {
        return prev;
      }
      const next = { ...prev };
      delete next[postId];
      return next;
    });
  }, []);

  const toggleLike = useCallback(
    async (postId: string) => {
      const post = findPost(postId);
      if (!post) {
        throw new FriendlyError('That post is no longer available.');
      }
      if (post.pending) {
        throw new FriendlyError('Hold on, your post is still sharing.');
      }
      if (likeInFlight.current.has(postId)) {
        return; // ignore double taps while the previous write settles
      }
      likeInFlight.current.add(postId);
      let liked = true;
      let seq = 0;
      try {
        let current = decorate(post);
        if (likedMap[postId] === undefined && !likeOverrides[postId]) {
          // Unknown flag (lookup failed or still pending): resolve it first
          // so the toggle goes in the right direction.
          const { flags } = await backend.getLikedFlags([postId]);
          if (flags[postId] === undefined) {
            throw new FriendlyError(
              "Can't reach Harbor right now. Check your connection.",
            );
          }
          const resolved = flags[postId];
          likeSeq.current[postId] = (likeSeq.current[postId] ?? 0) + 1;
          if (aliveRef.current) {
            setLikedMap(prev => ({ ...prev, [postId]: resolved }));
          }
          current = { ...current, likedByMe: resolved };
        }
        liked = !current.likedByMe;
        const count = Math.max(0, current.likeCount + (liked ? 1 : -1));
        seq = (likeSeq.current[postId] ?? 0) + 1;
        likeSeq.current[postId] = seq;
        const mySeq = seq;
        setLikeOverrides(prev => ({
          ...prev,
          [postId]: { liked, count, seq: mySeq, baseCount: post.likeCount },
        }));
        const result = await backend.setLike(post, liked);
        if (aliveRef.current) {
          setLikedMap(prev => ({ ...prev, [postId]: result.value }));
          if (result.changed) {
            // Keep showing the optimistic count until the snapshot moves.
            setLikeOverrides(prev =>
              prev[postId]?.seq === mySeq
                ? { ...prev, [postId]: { ...prev[postId], settled: true } }
                : prev,
            );
            later(() => clearLikeOverride(postId, mySeq), LIKE_SETTLE_MS);
          } else {
            // Already in that state: the server count is already right.
            clearLikeOverride(postId, mySeq);
          }
        }
      } catch (e) {
        if (aliveRef.current) {
          if (seq) {
            clearLikeOverride(postId, seq); // roll back
          }
          // Our flag may be stale: look it up again.
          forgetLiked([postId]);
          resolveLiked([postId], true);
        }
        throw toFriendlyError(
          e,
          liked
            ? "Couldn't like that post. Try again."
            : "Couldn't remove your like. Try again.",
        );
      } finally {
        likeInFlight.current.delete(postId);
      }
    },
    [
      backend,
      decorate,
      findPost,
      likedMap,
      likeOverrides,
      clearLikeOverride,
      later,
      forgetLiked,
      resolveLiked,
    ],
  );

  const addComment = useCallback(
    async (postId: string, text: string) => {
      const clean = validateComment(text);
      const post = findPost(postId);
      if (!post) {
        throw new FriendlyError('That post is no longer available.');
      }
      if (post.pending) {
        throw new FriendlyError('Hold on, the post is still sharing.');
      }
      const id = backend.newId();
      const pending: Comment = {
        id,
        postId,
        authorId: meId,
        text: clean,
        createdAt: Date.now(),
        pending: true,
      };
      setPendingComments(prev => ({
        ...prev,
        [postId]: [...(prev[postId] ?? []), pending],
      }));
      try {
        // The post's commentCount updates through its live snapshot.
        await backend.addComment(post, id, clean);
      } catch (e) {
        throw toFriendlyError(e, "Couldn't post your comment. Try again.");
      } finally {
        if (aliveRef.current) {
          setPendingComments(prev => {
            const rest = (prev[postId] ?? []).filter(c => c.id !== id);
            const next = { ...prev };
            if (rest.length) {
              next[postId] = rest;
            } else {
              delete next[postId];
            }
            return next;
          });
        }
      }
    },
    [backend, findPost, meId],
  );

  const createPost = useCallback(
    async (input: NewPostInput, onProgress?: OnProgress) => {
      const text = validatePost(input.text, !!input.image);
      const id = backend.newId();
      const pending: Post = {
        id,
        authorId: meId,
        text,
        imageUrls: input.image ? [input.image.uri] : [],
        aspect: '4/3',
        shareCount: 0,
        place: input.place,
        audience: input.audience,
        imageUrl: input.image?.uri,
        createdAt: Date.now(),
        likeCount: 0,
        likedByMe: false,
        commentCount: 0,
        pending: true,
      };
      setPendingPosts(prev => [pending, ...prev]);
      try {
        await whenProfileReady();
        const created = await backend.createPost(
          {
            id,
            text,
            image: input.image,
            place: input.place,
            audience: input.audience,
          },
          onProgress,
        );
        if (aliveRef.current) {
          knownPosts.current.set(id, created);
          likeSeq.current[id] = (likeSeq.current[id] ?? 0) + 1;
          setLikedMap(prev => ({ ...prev, [id]: false }));
        }
      } catch (e) {
        throw toFriendlyError(e, "Couldn't share your post. Try again.");
      } finally {
        if (aliveRef.current) {
          setPendingPosts(prev => prev.filter(p => p.id !== id));
        }
      }
    },
    [backend, meId, whenProfileReady],
  );

  const deletePost = useCallback(
    async (postId: string) => {
      const post = findPost(postId);
      if (!post) {
        throw new FriendlyError('That post is no longer available.');
      }
      if (!isMe(post.authorId)) {
        throw new FriendlyError('You can only delete your own posts.');
      }
      if (post.pending) {
        throw new FriendlyError('Hold on, your post is still sharing.');
      }
      setHidden(prev => ({ ...prev, [postId]: true }));
      try {
        await whenProfileReady();
        await backend.deletePost({ ...post, authorId: meId });
        if (aliveRef.current) {
          knownPosts.current.delete(postId);
        }
      } catch (e) {
        if (aliveRef.current) {
          setHidden(prev => {
            const next = { ...prev };
            delete next[postId];
            return next;
          });
        }
        throw toFriendlyError(e, "Couldn't delete the post. Try again.");
      }
    },
    [backend, findPost, isMe, meId, whenProfileReady],
  );

  const toggleFollow = useCallback(
    async (userId: string) => {
      const target = resolveId(userId);
      if (!target || isMe(target)) {
        throw new FriendlyError("You can't follow yourself.");
      }
      if (followingState !== 'ready') {
        throw new FriendlyError(
          followingState === 'error'
            ? "Couldn't load who you follow. Pull to refresh and try again."
            : 'Hold on, still loading who you follow.',
        );
      }
      if (followInFlight.current.has(target)) {
        return;
      }
      const value = !following[target];
      const seq = ++followSeq.current;
      followInFlight.current.add(target);
      setTouched(prev => ({ ...prev, [target]: true }));
      setFollowOverrides(prev => ({ ...prev, [target]: { value, seq } }));
      try {
        await whenProfileReady();
        const result = await backend.setFollow(target, value);
        if (aliveRef.current) {
          // Keep the real result even if the following snapshot lags behind.
          setServerFollowing(prev => {
            const next = { ...prev };
            if (result.value) {
              next[target] = true;
            } else {
              delete next[target];
            }
            return next;
          });
        }
      } catch (e) {
        throw toFriendlyError(
          e,
          value
            ? "Couldn't follow. Try again."
            : "Couldn't unfollow. Try again.",
        );
      } finally {
        followInFlight.current.delete(target);
        if (aliveRef.current) {
          setFollowOverrides(prev => {
            if (prev[target]?.seq !== seq) {
              return prev;
            }
            const next = { ...prev };
            delete next[target];
            return next;
          });
        }
      }
    },
    [backend, following, followingState, isMe, resolveId, whenProfileReady],
  );

  const markAllRead = useCallback(async () => {
    const ids = activity.filter(a => !a.read).map(a => a.id);
    if (!ids.length) {
      return;
    }
    setReadIds(prev => {
      const next = { ...prev };
      ids.forEach(id => {
        next[id] = true;
      });
      return next;
    });
    try {
      await backend.markActivityRead(ids);
    } catch (e) {
      if (aliveRef.current) {
        setReadIds(prev => {
          const next = { ...prev };
          ids.forEach(id => delete next[id]);
          return next;
        });
      }
      throw toFriendlyError(e, "Couldn't update your activity.");
    }
  }, [activity, backend]);

  const updateProfile = useCallback(
    async (edits: ProfileEdits) => {
      const clean = validateProfileEdits(edits);
      if (!Object.keys(clean).length) {
        return;
      }
      const previous = usersRef.current[meId];
      setUsers(prev =>
        prev[meId] ? { ...prev, [meId]: { ...prev[meId], ...clean } } : prev,
      );
      try {
        await whenProfileReady();
        await backend.updateProfile(clean);
      } catch (e) {
        if (aliveRef.current && previous) {
          const restore = previous;
          setUsers(prev => ({ ...prev, [meId]: restore }));
        }
        throw toFriendlyError(e, "Couldn't save your profile. Try again.");
      }
    },
    [backend, meId, whenProfileReady],
  );

  const uploadAvatar = useCallback(
    async (image: LocalImage, onProgress?: OnProgress) => {
      try {
        await whenProfileReady();
        const url = await backend.uploadAvatar(image, onProgress);
        if (aliveRef.current) {
          setUsers(prev =>
            prev[meId]
              ? { ...prev, [meId]: { ...prev[meId], photoUrl: url } }
              : prev,
          );
        }
      } catch (e) {
        throw toFriendlyError(e, "Couldn't update your photo. Try again.");
      }
    },
    [backend, meId, whenProfileReady],
  );

  const setPref = useCallback(
    async (key: keyof Prefs, value: boolean) => {
      setPrefOverrides(prev => ({ ...prev, [key]: value }));
      try {
        await whenProfileReady();
        await backend.setPref(key, value);
        if (aliveRef.current) {
          setPrefs(prev => ({ ...prev, [key]: value }));
        }
      } catch (e) {
        throw toFriendlyError(e, "Couldn't save that setting. Try again.");
      } finally {
        if (aliveRef.current) {
          setPrefOverrides(prev => {
            if (prev[key] !== value) {
              return prev;
            }
            const next = { ...prev };
            delete next[key];
            return next;
          });
        }
      }
    },
    [backend, whenProfileReady],
  );

  const effectivePrefs = useMemo(
    () => ({ ...prefs, ...prefOverrides }),
    [prefs, prefOverrides],
  );

  const summary = useMemo(
    () => buildSummary(posts, users, meId),
    [posts, users, meId],
  );

  const outFeedState: LoadState = profileFailed ? 'error' : feedState;
  const outFeedError = profileFailed ? PROFILE_ERROR : feedError;

  const value = useMemo<StoreValue>(
    () => ({
      mode: backend.mode,
      meId,
      isMe,
      posts,
      feedState: outFeedState,
      feedError: outFeedError,
      hasMore,
      refreshFeed,
      loadMore,
      summary,
      getUser,
      otherUsers,
      toggleLike,
      addComment,
      createPost,
      deletePost,
      following,
      followingState,
      followingError,
      toggleFollow,
      activity,
      activityState,
      activityError,
      unreadCount,
      markAllRead,
      updateProfile,
      uploadAvatar,
      prefs: effectivePrefs,
      setPref,
    }),
    [
      backend.mode,
      meId,
      isMe,
      posts,
      outFeedState,
      outFeedError,
      hasMore,
      refreshFeed,
      loadMore,
      summary,
      getUser,
      otherUsers,
      toggleLike,
      addComment,
      createPost,
      deletePost,
      following,
      followingState,
      followingError,
      toggleFollow,
      activity,
      activityState,
      activityError,
      unreadCount,
      markAllRead,
      updateProfile,
      uploadAvatar,
      effectivePrefs,
      setPref,
    ],
  );

  const internals = useMemo<Internals>(
    () => ({
      backend,
      meId,
      resolveId,
      users,
      placeholder,
      cacheUsers,
      requestUsers,
      decorate,
      remember,
      peekPost,
      hidden,
      pendingPosts,
      pendingComments,
    }),
    [
      backend,
      meId,
      resolveId,
      users,
      placeholder,
      cacheUsers,
      requestUsers,
      decorate,
      remember,
      peekPost,
      hidden,
      pendingPosts,
      pendingComments,
    ],
  );

  return (
    <InternalContext.Provider value={internals}>
      <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
    </InternalContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error('useStore must be used inside StoreProvider');
  }
  return ctx;
}

function useInternals(): Internals {
  const ctx = useContext(InternalContext);
  if (!ctx) {
    throw new Error('Store hooks must be used inside StoreProvider');
  }
  return ctx;
}

type SubState<T> = { key: string; data: T; state: LoadState; error?: string };

/**
 * Subscribes on mount / key change and unsubscribes on unmount. State is
 * tagged with the key so a changed id never shows the previous id's data.
 */
function useSubscription<T>(
  key: string,
  initial: () => T,
  subscribe: (next: (data: T) => void, fail: (e: Error) => void) => () => void,
): SubState<T> {
  const [state, setState] = useState<SubState<T>>(() => ({
    key,
    data: initial(),
    state: 'loading',
  }));
  const subscribeRef = useRef(subscribe);
  subscribeRef.current = subscribe;
  const initialRef = useRef(initial);
  initialRef.current = initial;

  useEffect(() => {
    if (!key) {
      return;
    }
    return subscribeRef.current(
      data => setState({ key, data, state: 'ready' }),
      e =>
        setState(prev => ({
          key,
          data: prev.key === key ? prev.data : initialRef.current(),
          state: 'error',
          error: e.message,
        })),
    );
  }, [key]);

  return state.key === key
    ? state
    : { key, data: initial(), state: key ? 'loading' : 'ready' };
}

/** One post, live (likes, comment count). */
export function usePost(postId: string): Live<Post | undefined> {
  const { backend, decorate, hidden, pendingPosts, peekPost, remember } =
    useInternals();
  const sub = useSubscription<Post | null | undefined>(
    postId,
    () => peekPost(postId),
    (next, fail) =>
      backend.subscribePost(
        postId,
        p => {
          if (p) {
            remember([p]);
          }
          next(p);
        },
        fail,
      ),
  );
  const pending = pendingPosts.find(p => p.id === postId);
  const base = sub.data ?? pending;
  const data = base && !hidden[postId] ? decorate(base) : undefined;
  const state: LoadState =
    sub.state === 'loading' && (pending || sub.data) ? 'ready' : sub.state;
  return useMemo(
    () => ({ data, state, error: sub.error }),
    [data, state, sub.error],
  );
}

/** Comments oldest first, live, including my pending ones. */
export function useComments(postId: string): Live<Comment[]> {
  const { backend, pendingComments, requestUsers } = useInternals();
  const sub = useSubscription<Comment[]>(
    postId,
    () => [],
    (next, fail) =>
      backend.subscribeComments(
        postId,
        list => {
          requestUsers(list.map(c => c.authorId));
          next(list);
        },
        fail,
      ),
  );
  const pending = pendingComments[postId];
  const data = useMemo(() => {
    if (!pending?.length) {
      return sub.data;
    }
    const ids = new Set(sub.data.map(c => c.id));
    return [...sub.data, ...pending.filter(c => !ids.has(c.id))].sort(
      (a, b) => a.createdAt - b.createdAt,
    );
  }, [sub.data, pending]);
  return useMemo(
    () => ({ data, state: sub.state, error: sub.error }),
    [data, sub.state, sub.error],
  );
}

/** A profile's posts, newest first. Accepts 'me'. */
export function useUserPosts(userId: string): Live<Post[]> {
  const { backend, resolveId, meId, decorate, hidden, pendingPosts, remember } =
    useInternals();
  const uid = resolveId(userId);
  const sub = useSubscription<Post[]>(
    uid,
    () => [],
    (next, fail) =>
      backend.subscribeUserPosts(
        uid,
        list => {
          remember(list);
          next(list);
        },
        fail,
      ),
  );
  const data = useMemo(() => {
    const seen = new Set<string>();
    const out: Post[] = [];
    const add = (p: Post) => {
      if (!seen.has(p.id) && !hidden[p.id]) {
        seen.add(p.id);
        out.push(decorate(p));
      }
    };
    sub.data.forEach(add);
    if (uid === meId) {
      pendingPosts.forEach(add);
    }
    return out.sort((a, b) => b.createdAt - a.createdAt);
  }, [sub.data, uid, meId, pendingPosts, hidden, decorate]);
  return useMemo(
    () => ({ data, state: sub.state, error: sub.error }),
    [data, sub.state, sub.error],
  );
}

/** Posts the signed-in user liked, most recently liked first. */
export function useLikedPosts(): Live<Post[]> {
  const { backend, meId, decorate, hidden, remember } = useInternals();
  const sub = useSubscription<Post[]>(
    meId,
    () => [],
    (next, fail) =>
      backend.subscribeLikedPosts(list => {
        remember(list);
        next(list);
      }, fail),
  );
  const data = useMemo(
    () =>
      sub.data
        .filter(p => !hidden[p.id])
        .map(decorate)
        .filter(p => p.likedByMe),
    [sub.data, hidden, decorate],
  );
  return useMemo(
    () => ({ data, state: sub.state, error: sub.error }),
    [data, sub.state, sub.error],
  );
}

/** A profile, fetched on mount and kept fresh. Accepts 'me'. */
export function useUser(userId: string): Live<User> {
  const { backend, resolveId, users, placeholder, cacheUsers } = useInternals();
  const uid = resolveId(userId);
  const sub = useSubscription<boolean>(
    uid,
    () => false,
    (next, fail) =>
      backend.subscribeProfile(
        uid,
        profile => {
          if (profile) {
            cacheUsers([profile.user]);
          }
          next(!!profile);
        },
        fail,
      ),
  );
  const cached = users[uid];
  const data = cached ?? placeholder(uid);
  let state = sub.state;
  let error = sub.error;
  if (sub.state === 'loading' && cached) {
    state = 'ready';
  } else if (sub.state === 'ready' && !sub.data && !cached) {
    state = 'error';
    error = "This account isn't available.";
  }
  return useMemo(() => ({ data, state, error }), [data, state, error]);
}
