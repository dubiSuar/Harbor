/**
 * Offline demo adapter: an in-memory implementation of Backend seeded from
 * src/data/mock.ts. Used when DEMO_MODE is true (src/config.ts). Every
 * contract feature works without a network, with small fixed delays and a
 * fake upload progress so loading and optimistic states are visible.
 *
 * Writes go through a serial queue, so rapid toggles (like, unlike, like)
 * resolve in the order they were made, exactly like a real backend would
 * apply them.
 *
 * State lives in the closure, so each sign-in (StoreProvider mount) starts
 * from a fresh copy of the seed.
 */
import type { Activity, Comment, Post, Prefs, User } from '../../data/types';
import { DEFAULT_PREFS } from '../../data/types';
import {
  ME_ID,
  seedActivity,
  seedComments,
  seedFollowing,
  seedPosts,
  seedPrefs,
  users as seedUsers,
} from '../../data/mock';
import type { LocalImage, OnProgress } from '../../state/storeTypes';
import {
  FriendlyError,
  handleFromEmail,
  validateComment,
  validatePost,
  validateProfileEdits,
  type Backend,
  type FeedPage,
  type LikedFlags,
  type ToggleResult,
  type Unsubscribe,
} from './types';

type PostRec = Omit<Post, 'likedByMe' | 'likeCount'> & {
  /** Likes from seed accounts we don't model individually. */
  baseLikes: number;
  likers: Set<string>;
};

/** Fixed latencies (ms): deterministic ordering, still visible in the UI. */
const READ_DELAY = 250;
const LOOKUP_DELAY = 150;
const WRITE_DELAY = 250;

let idSeq = 0;

export function createDemoBackend(): Backend {
  const meId = ME_ID;

  // ---- lifecycle -------------------------------------------------------------
  let disposed = false;
  const timers = new Set<ReturnType<typeof setTimeout>>();
  const intervals = new Set<ReturnType<typeof setInterval>>();

  const wait = (ms: number) =>
    new Promise<void>(resolve => {
      const t = setTimeout(() => {
        timers.delete(t);
        resolve();
      }, ms);
      timers.add(t);
    });

  /** Serial write queue: each write starts after the previous one settled. */
  let tail: Promise<unknown> = Promise.resolve();
  function write<T>(run: () => T | Promise<T>): Promise<T> {
    const result = tail.then(async () => {
      await wait(WRITE_DELAY);
      if (disposed) {
        throw new FriendlyError('You signed out.');
      }
      return run();
    });
    tail = result.catch(() => {});
    return result;
  }

  // ---- seed ---------------------------------------------------------------
  const users: Record<string, User> = {};
  Object.values(seedUsers).forEach(u => {
    users[u.id] = { ...u };
  });

  const posts = new Map<string, PostRec>();
  seedPosts.forEach(p => {
    const { likeCount, likedByMe, ...rest } = p;
    const likers = new Set<string>();
    if (likedByMe) {
      likers.add(meId);
    }
    posts.set(p.id, {
      ...rest,
      imageUrls: [...p.imageUrls],
      baseLikes: likeCount - likers.size,
      likers,
    });
  });
  const seedPostCounts: Record<string, number> = {};
  seedPosts.forEach(p => {
    seedPostCounts[p.authorId] = (seedPostCounts[p.authorId] ?? 0) + 1;
  });
  const likedAt = new Map<string, number>(); // postId -> when I liked it
  posts.forEach(p => {
    if (p.likers.has(meId)) {
      likedAt.set(p.id, p.createdAt);
    }
  });

  let comments: Comment[] = seedComments.map(c => ({ ...c }));
  const following = new Set(
    Object.keys(seedFollowing).filter(id => seedFollowing[id]),
  );
  let activity: Activity[] = seedActivity.map(a => ({ ...a }));
  let prefs: Prefs = { ...DEFAULT_PREFS, ...seedPrefs };

  // ---- change notification -------------------------------------------------
  const listeners = new Set<() => void>();
  const emit = () => {
    if (!disposed) {
      listeners.forEach(l => l());
    }
  };

  /** Emits compute() after an initial delay, then on every change. */
  function watch<T>(compute: () => T, onNext: (value: T) => void) {
    let active = true;
    let ready = false;
    const push = () => {
      if (active && ready && !disposed) {
        onNext(compute());
      }
    };
    listeners.add(push);
    wait(READ_DELAY).then(() => {
      ready = true;
      push();
    });
    return () => {
      active = false;
      listeners.delete(push);
    };
  }

  // ---- views ---------------------------------------------------------------
  const toPost = ({ baseLikes, likers, ...p }: PostRec): Post => ({
    ...p,
    likeCount: Math.max(0, baseLikes + likers.size),
    likedByMe: likers.has(meId),
  });

  const sortedPosts = () =>
    [...posts.values()].sort((a, b) => b.createdAt - a.createdAt).map(toPost);

  const userView = (id: string): User | undefined => {
    const u = users[id];
    if (!u) {
      return undefined;
    }
    let postsCount = 0;
    posts.forEach(p => {
      if (p.authorId === id) {
        postsCount++;
      }
    });
    // Seeded display totals (the design's "131 posts") move with changes.
    if (u.postsCount !== undefined) {
      postsCount = u.postsCount + postsCount - (seedPostCounts[id] ?? 0);
    }
    return {
      ...u,
      postsCount,
      following: id === meId ? following.size : u.following,
    };
  };

  /** The newest `max` posts, like the Firestore query with limit(max). */
  const feedWindow = (max: number): FeedPage => {
    const all = sortedPosts();
    return { posts: all.slice(0, max), hasMore: all.length > max };
  };

  /** Fake upload: ~1s of progress ticks, resolves with the local uri. */
  function fakeUpload(image: LocalImage, onProgress?: OnProgress) {
    return new Promise<string>((resolve, reject) => {
      let p = 0;
      onProgress?.(0);
      const tick = setInterval(() => {
        if (disposed) {
          clearInterval(tick);
          intervals.delete(tick);
          reject(new FriendlyError('Upload cancelled.'));
          return;
        }
        p = Math.min(1, p + 0.15);
        onProgress?.(p);
        if (p >= 1) {
          clearInterval(tick);
          intervals.delete(tick);
          resolve(image.uri);
        }
      }, 100);
      intervals.add(tick);
    });
  }

  const backend: Backend = {
    mode: 'demo',
    meId,

    dispose() {
      disposed = true;
      listeners.clear();
      timers.forEach(clearTimeout);
      timers.clear();
      intervals.forEach(clearInterval);
      intervals.clear();
    },

    ensureProfile(seed) {
      return write(() => {
        const me = users[meId];
        users[meId] = {
          ...me,
          name: seed.name || me.name,
          email: seed.email,
          // The demo persona keeps its seeded handle (@noorhaddad).
          handle: me.handle ?? handleFromEmail(seed.email, meId),
          photoUrl: seed.photoUrl ?? me.photoUrl,
        };
        emit();
      });
    },

    subscribeProfile(userId, onNext): Unsubscribe {
      return watch(() => {
        const user = userView(userId);
        if (!user) {
          return null;
        }
        // Prefs are private: only the signed-in user's profile carries them.
        return userId === meId ? { user, prefs: { ...prefs } } : { user };
      }, onNext);
    },

    async getUsers(ids) {
      await wait(LOOKUP_DELAY);
      return ids.map(userView).filter((u): u is User => !!u);
    },

    async listRecentUsers(max) {
      await wait(READ_DELAY);
      return Object.keys(users)
        .reverse()
        .map(userView)
        .filter((u): u is User => !!u)
        .slice(0, max);
    },

    updateProfile(edits) {
      const clean = validateProfileEdits(edits);
      return write(() => {
        users[meId] = { ...users[meId], ...clean };
        emit();
      });
    },

    async uploadAvatar(image, onProgress) {
      const url = await fakeUpload(image, onProgress);
      return write(() => {
        users[meId] = { ...users[meId], photoUrl: url };
        emit();
        return url;
      });
    },

    setPref(key, value) {
      if (!(key in DEFAULT_PREFS) || typeof value !== 'boolean') {
        return Promise.reject(
          new FriendlyError("That setting isn't available."),
        );
      }
      return write(() => {
        prefs = { ...prefs, [key]: value };
        emit();
      });
    },

    subscribeFeed(max, onNext) {
      return watch(() => feedWindow(max), onNext);
    },

    subscribePost(postId, onNext) {
      return watch(() => {
        const p = posts.get(postId);
        return p ? toPost(p) : null;
      }, onNext);
    },

    subscribeUserPosts(userId, onNext) {
      return watch(
        () => sortedPosts().filter(p => p.authorId === userId),
        onNext,
      );
    },

    subscribeLikedPosts(onNext) {
      return watch(
        () =>
          [...likedAt.entries()]
            .sort((a, b) => b[1] - a[1])
            .map(([id]) => posts.get(id))
            .filter((p): p is PostRec => !!p)
            .map(toPost),
        onNext,
      );
    },

    async getLikedFlags(postIds): Promise<LikedFlags> {
      await wait(LOOKUP_DELAY);
      const out: LikedFlags = { flags: {}, failed: [] };
      postIds.forEach(id => {
        const p = posts.get(id);
        out.flags[id] = !!p && p.likers.has(meId);
      });
      return out;
    },

    subscribeComments(postId, onNext) {
      return watch(
        () =>
          comments
            .filter(c => c.postId === postId)
            .sort((a, b) => a.createdAt - b.createdAt),
        onNext,
      );
    },

    newId() {
      return `demo-${Date.now().toString(36)}-${(idSeq++).toString(36)}`;
    },

    async createPost({ id, text, image, place, audience }, onProgress) {
      const clean = validatePost(text, !!image);
      const imageUrl = image ? await fakeUpload(image, onProgress) : undefined;
      return write(() => {
        const rec: PostRec = {
          id,
          authorId: meId,
          text: clean,
          imageUrls: imageUrl ? [imageUrl] : [],
          aspect: '4/3',
          place,
          audience: audience ?? 'friends',
          shareCount: 0,
          imageUrl,
          imagePath: image ? `posts/${meId}/${id}.jpg` : undefined,
          createdAt: Date.now(),
          commentCount: 0,
          baseLikes: 0,
          likers: new Set(),
        };
        posts.set(id, rec);
        emit();
        return toPost(rec);
      });
    },

    deletePost(post) {
      if (post.authorId !== meId) {
        return Promise.reject(
          new FriendlyError('You can only delete your own posts.'),
        );
      }
      return write(() => {
        posts.delete(post.id);
        likedAt.delete(post.id);
        comments = comments.filter(c => c.postId !== post.id);
        emit();
      });
    },

    setLike(post, liked) {
      return write((): ToggleResult => {
        const p = posts.get(post.id);
        if (!p) {
          throw new FriendlyError('That post no longer exists.');
        }
        if (p.likers.has(meId) === liked) {
          return { value: liked, changed: false };
        }
        if (liked) {
          p.likers.add(meId);
          likedAt.set(p.id, Date.now());
        } else {
          p.likers.delete(meId);
          likedAt.delete(p.id);
        }
        emit();
        return { value: liked, changed: true };
      });
    },

    addComment(post, commentId, text) {
      const clean = validateComment(text);
      return write(() => {
        const p = posts.get(post.id);
        if (!p) {
          throw new FriendlyError('That post no longer exists.');
        }
        comments = [
          ...comments,
          {
            id: commentId,
            postId: post.id,
            authorId: meId,
            text: clean,
            createdAt: Date.now(),
          },
        ];
        p.commentCount += 1;
        emit();
      });
    },

    subscribeFollowing(onNext) {
      return watch(() => {
        const ids: Record<string, true> = {};
        following.forEach(id => {
          ids[id] = true;
        });
        return ids;
      }, onNext);
    },

    setFollow(targetId, follow) {
      if (!targetId || targetId === meId) {
        return Promise.reject(new FriendlyError("You can't follow yourself."));
      }
      return write((): ToggleResult => {
        const target = users[targetId];
        if (!target) {
          throw new FriendlyError('That account no longer exists.');
        }
        if (following.has(targetId) === follow) {
          return { value: follow, changed: false };
        }
        if (follow) {
          following.add(targetId);
        } else {
          following.delete(targetId);
        }
        users[targetId] = {
          ...target,
          followers: Math.max(0, (target.followers ?? 0) + (follow ? 1 : -1)),
        };
        emit();
        return { value: follow, changed: true };
      });
    },

    subscribeActivity(max, onNext) {
      return watch(
        () =>
          [...activity].sort((a, b) => b.createdAt - a.createdAt).slice(0, max),
        onNext,
      );
    },

    markActivityRead(ids) {
      return write(() => {
        // Ids that no longer exist are simply skipped.
        const set = new Set(ids);
        activity = activity.map(a =>
          set.has(a.id) ? { ...a, read: true } : a,
        );
        emit();
      });
    },
  };

  return backend;
}
