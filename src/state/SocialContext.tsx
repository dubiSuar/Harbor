import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  commentSummaries as seededSummaries,
  ME_ID,
  PEOPLE_ORDER,
  seedPosts,
  users as seedUsers,
} from '../data/mock';
import {
  activeNow,
  briefToday,
  briefWeek,
  cannedReplies,
  DEFAULT_CANNED_REPLY,
  exploreGrid,
  NOTIFICATIONS_SUMMARY,
  REQUEST_ACCEPTED_TEXT,
  REQUEST_DECLINED_TEXT,
  askSuggestions,
  seedChats,
  SEED_FRIENDS_COUNT,
  seedFriendIds,
  seedFriendRequests,
  seedGroups,
  seedNotifications,
  seedStories,
  topics,
} from '../data/social';
import { postTime } from '../data/time';
import {
  DEFAULT_AI_SETTINGS,
  firstNameOf,
  postImages,
  type AboutRow,
  type AISettings,
  type AppNotification,
  type AskMessage,
  type BriefItem,
  type Chat,
  type Comment,
  type FriendRequest,
  type FriendStatus,
  type User,
} from '../data/types';
import * as ai from '../services/ai';
import { duration } from '../theme';
import { useComments, usePost, useStore, useUserPosts } from './StoreContext';

/**
 * Local social state (DECISIONS #12): stories, groups, friends, chats,
 * notifications, comment likes, Harbor AI settings, the Brief, comment
 * summaries and Ask Harbor. Seeded from src/data/social.ts in BOTH modes and
 * kept in memory for the session, so Firestore can replace it later without
 * touching the screens. Mount inside StoreProvider (App.tsx does).
 *
 * Screens use the hooks at the bottom; API reference in
 * design-import/FOUNDATION.md.
 */

type SummaryState = { text?: string; loading: boolean };

type SocialValue = {
  person: (userId: string) => User;

  stories: typeof seedStories;
  seenStories: Record<string, boolean>;
  likedStories: Record<string, boolean>;
  markStorySeen: (storyId: string) => void;
  toggleStoryLike: (storyId: string) => void;

  joined: Record<string, boolean>;
  toggleJoin: (groupId: string) => boolean;

  friendStatus: Record<string, FriendStatus>;
  requests: FriendRequest[];
  friendCount: number;
  toggleFriendRequest: (userId: string) => FriendStatus;
  acceptRequest: (requestId: string) => void;
  declineRequest: (requestId: string) => void;
  removeFriend: (userId: string) => void;

  chats: Chat[];
  sendMessage: (chatId: string, text: string) => void;
  markChatRead: (chatId: string) => void;

  notificationsRead: boolean;
  markAllNotificationsRead: () => void;

  likedComments: Record<string, boolean>;
  toggleCommentLike: (commentId: string) => void;

  aiSettings: AISettings;
  setAISetting: (key: keyof AISettings, value: boolean) => void;

  brief: { today: BriefItem[]; week: BriefItem[]; loading: boolean };
  regenerateBrief: () => Promise<void>;

  summaries: Record<string, SummaryState>;
  summarize: (input: ai.CommentSummaryInput) => Promise<void>;

  ask: { messages: AskMessage[]; loading: boolean };
  askHarbor: (question: string) => void;
};

const SocialContext = createContext<SocialValue | null>(null);

/** The chat list's time label for a message sent this minute. */
export const CHAT_NOW = 'now';

let seq = 0;
const nextId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${seq++}`;

/** Seed post ids: my posts outside this set were made this session. */
const SEED_POST_IDS = new Set(seedPosts.map(p => p.id));

const initialSummaries = (): Record<string, SummaryState> => {
  const out: Record<string, SummaryState> = {};
  Object.entries(seededSummaries).forEach(([postId, text]) => {
    out[postId] = { text, loading: false };
  });
  return out;
};

export function SocialProvider({ children }: { children: React.ReactNode }) {
  const store = useStore();
  const { getUser, isMe, posts, meId } = store;

  // ---- lifecycle ----------------------------------------------------------
  const alive = useRef(true);
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());
  useEffect(() => {
    alive.current = true;
    const pending = timers.current;
    return () => {
      alive.current = false;
      pending.forEach(clearTimeout);
      pending.clear();
    };
  }, []);
  const later = useCallback((ms: number, fn: () => void) => {
    const t = setTimeout(() => {
      timers.current.delete(t);
      if (alive.current) {
        fn();
      }
    }, ms);
    timers.current.add(t);
  }, []);

  // ---- stories ------------------------------------------------------------
  const [seenStories, setSeen] = useState<Record<string, boolean>>({});
  const [likedStories, setLikedStories] = useState<Record<string, boolean>>({});
  const markStorySeen = useCallback((storyId: string) => {
    setSeen(prev => (prev[storyId] ? prev : { ...prev, [storyId]: true }));
  }, []);
  const toggleStoryLike = useCallback((storyId: string) => {
    setLikedStories(prev => ({ ...prev, [storyId]: !prev[storyId] }));
  }, []);

  // ---- groups -------------------------------------------------------------
  const [joined, setJoined] = useState<Record<string, boolean>>({});
  const joinedRef = useRef(joined);
  joinedRef.current = joined;
  const toggleJoin = useCallback((groupId: string) => {
    const next = !joinedRef.current[groupId];
    joinedRef.current = { ...joinedRef.current, [groupId]: next };
    setJoined(joinedRef.current);
    return next;
  }, []);

  // ---- friends ------------------------------------------------------------
  const [friendStatus, setFriendStatus] = useState<
    Record<string, FriendStatus>
  >(() => {
    const out: Record<string, FriendStatus> = {};
    seedFriendIds.forEach(id => {
      out[id] = 'friend';
    });
    seedFriendRequests.forEach(r => {
      out[r.fromId] = 'incoming';
    });
    return out;
  });
  const statusRef = useRef(friendStatus);
  statusRef.current = friendStatus;
  const [requests, setRequests] = useState<FriendRequest[]>(() =>
    seedFriendRequests.map(r => ({ ...r })),
  );
  const requestsRef = useRef(requests);
  requestsRef.current = requests;
  const [friendDelta, setFriendDelta] = useState(0);

  const toggleFriendRequest = useCallback((userId: string): FriendStatus => {
    const current = statusRef.current[userId] ?? 'none';
    const next: FriendStatus =
      current === 'none'
        ? 'requested'
        : current === 'requested'
        ? 'none'
        : current;
    statusRef.current = { ...statusRef.current, [userId]: next };
    setFriendStatus(statusRef.current);
    return next;
  }, []);

  const resolveRequest = useCallback(
    (requestId: string, state: 'accepted' | 'declined') => {
      const req = requestsRef.current.find(r => r.id === requestId);
      if (!req || req.state !== 'pending') {
        return;
      }
      requestsRef.current = requestsRef.current.map(r =>
        r.id === requestId ? { ...r, state } : r,
      );
      setRequests(requestsRef.current);
      statusRef.current = {
        ...statusRef.current,
        [req.fromId]: state === 'accepted' ? 'friend' : 'none',
      };
      setFriendStatus(statusRef.current);
      if (state === 'accepted') {
        setFriendDelta(d => d + 1);
      }
    },
    [],
  );
  const acceptRequest = useCallback(
    (requestId: string) => resolveRequest(requestId, 'accepted'),
    [resolveRequest],
  );
  const declineRequest = useCallback(
    (requestId: string) => resolveRequest(requestId, 'declined'),
    [resolveRequest],
  );
  const removeFriend = useCallback((userId: string) => {
    if (statusRef.current[userId] !== 'friend') {
      return;
    }
    statusRef.current = { ...statusRef.current, [userId]: 'none' };
    setFriendStatus(statusRef.current);
    setFriendDelta(d => d - 1);
  }, []);
  const friendCount = SEED_FRIENDS_COUNT + friendDelta;

  // ---- people -------------------------------------------------------------
  // Seed people exist in the demo backend; in Firebase mode they only exist
  // in the seed, so fall back to it. 'me' always resolves to the real user.
  const demo = store.mode === 'demo';
  const realMe = getUser(meId);
  const myPosts = useUserPosts(meId).data;
  // My display profile, memoised so cards that take it (FeedPostCard,
  // CommentRow) keep their memo. In demo mode the persona's cover, About,
  // photos and totals fill in what the backend does not store (DECISIONS
  // #7); in Firebase mode the real user never shows the persona: Photos come
  // from their posts, About from their profile fields, and there are no
  // friend or album totals.
  const meUser = useMemo<User>(() => {
    const mine = myPosts.flatMap(p => postImages(p));
    if (demo) {
      const seed = seedUsers[ME_ID];
      const seedPhotos = realMe.photos ?? seed.photos ?? [];
      const sessionPosts = myPosts.filter(p => !SEED_POST_IDS.has(p.id));
      return {
        ...realMe,
        coverUrl: realMe.coverUrl ?? seed.coverUrl,
        about: realMe.about ?? seed.about,
        photos: [...mine, ...seedPhotos.filter(u => !mine.includes(u))],
        friendsCount: friendCount,
        albumsCount: realMe.albumsCount ?? seed.albumsCount,
        postsCount: (seed.postsCount ?? 0) + sessionPosts.length,
      };
    }
    const about: AboutRow[] =
      realMe.about ??
      (realMe.location
        ? [{ icon: 'map-pin', text: `Lives in ${realMe.location}` }]
        : []);
    return {
      ...realMe,
      about,
      photos: mine,
      friendsCount: undefined,
      albumsCount: undefined,
      postsCount: myPosts.length,
    };
  }, [demo, realMe, myPosts, friendCount]);

  const person = useCallback(
    (userId: string): User => {
      if (isMe(userId)) {
        return meUser;
      }
      const seed = seedUsers[userId];
      if (seed && !demo) {
        return seed;
      }
      const user = getUser(userId);
      // A cold cache returns a nameless placeholder; show the seed meanwhile.
      return seed && !user.name ? seed : user;
    },
    [getUser, isMe, meUser, demo],
  );

  // ---- chats --------------------------------------------------------------
  const [chats, setChats] = useState<Chat[]>(() =>
    seedChats.map(c => ({
      ...c,
      messages: [...c.messages],
      smartReplies: [...c.smartReplies],
    })),
  );
  /** Updates a chat and moves it to the top of the list (a new message). */
  const bumpChat = useCallback(
    (chatId: string, fn: (c: Chat) => Chat) =>
      setChats(prev => {
        const chat = prev.find(c => c.id === chatId);
        return chat ? [fn(chat), ...prev.filter(c => c.id !== chatId)] : prev;
      }),
    [],
  );
  const markChatRead = useCallback(
    (chatId: string) =>
      setChats(prev =>
        prev.some(c => c.id === chatId && c.unread)
          ? prev.map(c => (c.id === chatId ? { ...c, unread: false } : c))
          : prev,
      ),
    [],
  );
  const sendMessage = useCallback(
    (chatId: string, text: string) => {
      const clean = text.trim();
      if (!clean) {
        return;
      }
      bumpChat(chatId, c => ({
        ...c,
        timeLabel: CHAT_NOW,
        unread: false,
        smartReplies: [],
        typing: true,
        messages: [
          ...c.messages,
          { id: nextId('m'), fromMe: true, text: clean, createdAt: Date.now() },
        ],
      }));
      later(duration.typing, () =>
        bumpChat(chatId, c => ({
          ...c,
          timeLabel: CHAT_NOW,
          typing: false,
          messages: [
            ...c.messages,
            {
              id: nextId('m'),
              fromMe: false,
              text: cannedReplies[chatId] ?? DEFAULT_CANNED_REPLY,
              createdAt: Date.now(),
            },
          ],
        })),
      );
    },
    [later, bumpChat],
  );

  // ---- notifications ------------------------------------------------------
  const [notificationsRead, setNotificationsRead] = useState(false);
  const markAllNotificationsRead = useCallback(
    () => setNotificationsRead(true),
    [],
  );

  // ---- comment likes ------------------------------------------------------
  const [likedComments, setLikedComments] = useState<Record<string, boolean>>(
    {},
  );
  const toggleCommentLike = useCallback((commentId: string) => {
    setLikedComments(prev => ({ ...prev, [commentId]: !prev[commentId] }));
  }, []);

  // ---- AI settings --------------------------------------------------------
  const [aiSettings, setAISettings] = useState<AISettings>(DEFAULT_AI_SETTINGS);
  const setAISetting = useCallback(
    (key: keyof AISettings, value: boolean) =>
      setAISettings(prev => ({ ...prev, [key]: value })),
    [],
  );

  // ---- Brief --------------------------------------------------------------
  const [brief, setBrief] = useState({
    today: briefToday,
    week: briefWeek,
    loading: false,
  });
  const briefLoading = useRef(false);
  const briefVariant = useRef(0);
  const postsRef = useRef(posts);
  postsRef.current = posts;
  const personRef = useRef(person);
  personRef.current = person;

  const regenerateBrief = useCallback(async () => {
    if (briefLoading.current) {
      return;
    }
    briefLoading.current = true;
    setBrief(b => ({ ...b, loading: true }));
    briefVariant.current += 1;
    const input: ai.BriefInput = {
      variant: briefVariant.current,
      posts: postsRef.current
        .filter(p => !p.pending && !isMe(p.authorId))
        .map(p => ({
          postId: p.id,
          authorId: p.authorId,
          firstName: firstNameOf(personRef.current(p.authorId).name),
          text: p.text,
          likes: p.likeCount,
          comments: p.commentCount,
        })),
      people: Object.values(seedUsers)
        .filter(u => u.id !== ME_ID)
        .map(u => ({ id: u.id, firstName: firstNameOf(u.name) })),
    };
    try {
      const items = await ai.generateBrief(input);
      if (alive.current && items.length) {
        setBrief(b => ({ ...b, today: items }));
      }
    } finally {
      briefLoading.current = false;
      if (alive.current) {
        setBrief(b => ({ ...b, loading: false }));
      }
    }
  }, [isMe]);

  // ---- comment summaries --------------------------------------------------
  const [summaries, setSummaries] = useState(initialSummaries);
  const summarizing = useRef(new Set<string>());
  const summarize = useCallback(async (input: ai.CommentSummaryInput) => {
    const { postId } = input;
    if (summarizing.current.has(postId)) {
      return;
    }
    summarizing.current.add(postId);
    setSummaries(prev => ({
      ...prev,
      [postId]: { ...prev[postId], loading: true },
    }));
    try {
      const text = await ai.summarizeComments(input);
      if (alive.current) {
        setSummaries(prev => ({ ...prev, [postId]: { text, loading: false } }));
      }
    } catch (e) {
      if (alive.current) {
        setSummaries(prev => ({
          ...prev,
          [postId]: { ...prev[postId], loading: false },
        }));
      }
      throw e;
    } finally {
      summarizing.current.delete(postId);
    }
  }, []);

  // ---- Ask Harbor ---------------------------------------------------------
  const [ask, setAsk] = useState<{ messages: AskMessage[]; loading: boolean }>({
    messages: [],
    loading: false,
  });
  const askLoading = useRef(false);
  const chatsRef = useRef(chats);
  chatsRef.current = chats;
  const askHarbor = useCallback(
    (question: string) => {
      const q = question.trim();
      if (!q || askLoading.current) {
        return;
      }
      askLoading.current = true;
      setAsk(a => ({
        loading: true,
        messages: [...a.messages, { id: nextId('q'), fromMe: true, text: q }],
      }));
      const who = personRef.current;
      const ctx: ai.AskContext = {
        meName: who(meId).name,
        posts: postsRef.current
          .filter(p => !p.pending && !isMe(p.authorId))
          .map(p => {
            const u = who(p.authorId);
            return {
              authorId: p.authorId,
              fullName: u.name,
              firstName: firstNameOf(u.name),
              time: postTime(p.createdAt),
              place: p.place,
              text: p.text,
            };
          }),
        chats: chatsRef.current.map(c => ({
          firstName: firstNameOf(who(c.peerId).name),
          lastText: c.messages[c.messages.length - 1]?.text ?? '',
        })),
      };
      ai.askHarbor(q, ctx)
        .catch(() => ai.ASK_ERROR)
        .then(answer => {
          askLoading.current = false;
          if (alive.current) {
            setAsk(a => ({
              loading: false,
              messages: [
                ...a.messages,
                { id: nextId('a'), fromMe: false, text: answer },
              ],
            }));
          }
        });
    },
    [isMe, meId],
  );

  const value = useMemo<SocialValue>(
    () => ({
      person,
      stories: seedStories,
      seenStories,
      likedStories,
      markStorySeen,
      toggleStoryLike,
      joined,
      toggleJoin,
      friendStatus,
      requests,
      friendCount,
      toggleFriendRequest,
      acceptRequest,
      declineRequest,
      removeFriend,
      chats,
      sendMessage,
      markChatRead,
      notificationsRead,
      markAllNotificationsRead,
      likedComments,
      toggleCommentLike,
      aiSettings,
      setAISetting,
      brief,
      regenerateBrief,
      summaries,
      summarize,
      ask,
      askHarbor,
    }),
    [
      person,
      seenStories,
      likedStories,
      markStorySeen,
      toggleStoryLike,
      joined,
      toggleJoin,
      friendStatus,
      requests,
      friendCount,
      toggleFriendRequest,
      acceptRequest,
      declineRequest,
      removeFriend,
      chats,
      sendMessage,
      markChatRead,
      notificationsRead,
      markAllNotificationsRead,
      likedComments,
      toggleCommentLike,
      aiSettings,
      setAISetting,
      brief,
      regenerateBrief,
      summaries,
      summarize,
      ask,
      askHarbor,
    ],
  );

  return (
    <SocialContext.Provider value={value}>{children}</SocialContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

/** Everything at once. Prefer the focused hooks below. */
export function useSocial(): SocialValue {
  const ctx = useContext(SocialContext);
  if (!ctx) {
    throw new Error('useSocial must be used inside SocialProvider');
  }
  return ctx;
}

/**
 * Resolves a person id from the social seed (stories, chats, notifications)
 * to a User, in both modes. 'me' resolves to the signed-in user.
 */
export function usePerson(userId: string): User {
  return useSocial().person(userId);
}

/**
 * The signed-in user for display (Profile, Settings card, composer
 * avatars), memoised. Photos lead with my posts' images (newest first).
 * Demo mode adds the persona's cover, About rows, seed photos, friend and
 * album totals, and counts my session posts on top of the seed total.
 * Firebase mode never shows the persona: About comes from the profile's
 * location, there are no friend or album totals, and the post count is my
 * real one.
 */
export function useMe(): User {
  const { person } = useSocial();
  const { meId } = useStore();
  return useMemo(() => person(meId), [person, meId]);
}

/** `person(id)` for lists. */
export function usePeople() {
  return useSocial().person;
}

/**
 * Explore search (SPEC 3.08): every seed person except me whose name
 * contains `query` (case-insensitive), in the design's order. An empty or
 * blank query returns [] (show the browse view instead).
 */
export function usePeopleSearch(query: string): User[] {
  const { person } = useSocial();
  const q = query.trim().toLowerCase();
  return useMemo(
    () =>
      q
        ? PEOPLE_ORDER.map(person).filter(u => u.name.toLowerCase().includes(q))
        : [],
    [q, person],
  );
}

/** Stories rail and viewer. */
export function useStories() {
  const { stories, seenStories, likedStories, markStorySeen, toggleStoryLike } =
    useSocial();
  return useMemo(
    () => ({
      /** In rail order; the Story route's `index` indexes this array. */
      stories,
      isSeen: (storyId: string) => !!seenStories[storyId],
      isLiked: (storyId: string) => !!likedStories[storyId],
      /** Call when a story finishes (the rail ring turns grey). */
      markSeen: markStorySeen,
      toggleLike: toggleStoryLike,
    }),
    [stories, seenStories, likedStories, markStorySeen, toggleStoryLike],
  );
}

/** Explore: groups, topics and the masonry grid. */
export function useGroups() {
  const { joined, toggleJoin } = useSocial();
  return useMemo(
    () => ({
      groups: seedGroups,
      topics,
      exploreGrid,
      isJoined: (groupId: string) => !!joined[groupId],
      /** Returns the new joined state (toast "Joined {name}" when true). */
      toggleJoin,
    }),
    [joined, toggleJoin],
  );
}

/** Friend relationships and incoming requests. */
export function useFriends() {
  const {
    friendStatus,
    requests,
    friendCount,
    toggleFriendRequest,
    acceptRequest,
    declineRequest,
    removeFriend,
    person,
  } = useSocial();
  return useMemo(
    () => ({
      statusOf: (userId: string): FriendStatus =>
        friendStatus[userId] ?? 'none',
      /** "N friends" on the profile. */
      friendCount,
      /** Incoming requests, all states. */
      requests,
      pendingRequests: requests.filter(r => r.state === 'pending'),
      /** Explore "Add friend" / "Requested" toggle. Returns the new status. */
      toggleRequest: toggleFriendRequest,
      acceptRequest,
      declineRequest,
      removeFriend,
      mutualCount: (userId: string) => person(userId).mutualCount ?? 0,
    }),
    [
      friendStatus,
      friendCount,
      requests,
      toggleFriendRequest,
      acceptRequest,
      declineRequest,
      removeFriend,
      person,
    ],
  );
}

/** Messages list. */
export function useChats() {
  const { chats, markChatRead } = useSocial();
  return useMemo(
    () => ({
      chats,
      unreadCount: chats.filter(c => c.unread).length,
      /** Active-now rail person ids, in order. */
      activeNow,
      /** The chat with this person, if one exists. */
      chatWith: (userId: string) => chats.find(c => c.peerId === userId),
      markRead: markChatRead,
    }),
    [chats, markChatRead],
  );
}

/** One conversation. `chat` is undefined for an unknown id. */
export function useChat(chatId: string) {
  const { chats, sendMessage, markChatRead, aiSettings } = useSocial();
  const chat = chats.find(c => c.id === chatId);
  return useMemo(
    () => ({
      chat,
      /** Smart reply chips, already filtered by the Smart replies setting. */
      smartReplies: aiSettings.smartReplies ? chat?.smartReplies ?? [] : [],
      /** Appends my message, then the canned reply after 1600 ms of typing. */
      send: (text: string) => sendMessage(chatId, text),
      markRead: () => markChatRead(chatId),
    }),
    [chat, chatId, sendMessage, markChatRead, aiSettings.smartReplies],
  );
}

/** Notifications screen and the feed bell count. */
export function useNotifications() {
  const { notificationsRead, markAllNotificationsRead, requests, aiSettings } =
    useSocial();
  return useMemo(() => {
    const items: AppNotification[] = seedNotifications.map(n => {
      const req = n.requestId
        ? requests.find(r => r.id === n.requestId)
        : undefined;
      const text =
        req?.state === 'accepted'
          ? REQUEST_ACCEPTED_TEXT
          : req?.state === 'declined'
          ? REQUEST_DECLINED_TEXT
          : n.text;
      return {
        ...n,
        text,
        unread: n.fresh && !notificationsRead,
        requestState: req?.state,
      };
    });
    return {
      items,
      fresh: items.filter(n => n.fresh),
      earlier: items.filter(n => !n.fresh),
      /** The bell number: fresh items until Mark all read (4 at seed). */
      unreadCount: notificationsRead ? 0 : items.filter(n => n.fresh).length,
      allRead: notificationsRead,
      markAllRead: markAllNotificationsRead,
      /** Static AI one-liner, or null when the Brief setting is off. */
      summary: aiSettings.brief ? NOTIFICATIONS_SUMMARY : null,
    };
  }, [notificationsRead, markAllNotificationsRead, requests, aiSettings.brief]);
}

/** Harbor AI switches. */
export function useAISettings() {
  const { aiSettings, setAISetting } = useSocial();
  return useMemo(
    () => ({
      settings: aiSettings,
      set: setAISetting,
      toggle: (key: keyof AISettings) => setAISetting(key, !aiSettings[key]),
    }),
    [aiSettings, setAISetting],
  );
}

/** Comment likes (local in both modes). */
export function useCommentLikes() {
  const { likedComments, toggleCommentLike } = useSocial();
  return useMemo(
    () => ({
      isLiked: (commentId: string) => !!likedComments[commentId],
      /** Seed count plus my like. */
      countOf: (comment: Pick<Comment, 'id' | 'likeCount'>) =>
        (comment.likeCount ?? 0) + (likedComments[comment.id] ? 1 : 0),
      toggle: toggleCommentLike,
    }),
    [likedComments, toggleCommentLike],
  );
}

/**
 * Harbor Brief, shared by the feed card and the Brief tab. `regenerate()`
 * is ignored while loading and rejects on failure (toast "Couldn't refresh
 * the Brief").
 */
export function useBrief() {
  const { brief, regenerateBrief, aiSettings } = useSocial();
  return useMemo(
    () => ({
      today: brief.today,
      week: brief.week,
      loading: brief.loading,
      regenerate: regenerateBrief,
      /** The "Brief in your feed" setting. */
      enabled: aiSettings.brief,
    }),
    [brief, regenerateBrief, aiSettings.brief],
  );
}

/** "Tap refresh to summarize this thread.": shown before any summary. */
export const NO_SUMMARY_TEXT = ai.NO_SUMMARY_TEXT;

/**
 * Post screen comment summary. `text` is undefined until a summary exists;
 * `displayText` is `text` or NO_SUMMARY_TEXT, ready to render.
 * `refresh()` rejects on failure (toast "Couldn't reach Harbor AI").
 * Subscribes to the post and its comments.
 */
export function useCommentSummary(postId: string) {
  const { summaries, summarize, aiSettings, person } = useSocial();
  const post = usePost(postId).data;
  const comments = useComments(postId).data;
  const entry = summaries[postId];
  const refresh = useCallback(
    () =>
      summarize({
        postId,
        authorFirstName: firstNameOf(post ? person(post.authorId).name : ''),
        postText: post?.text ?? '',
        comments: comments.map(c => ({
          firstName: firstNameOf(person(c.authorId).name),
          text: c.text,
        })),
      }),
    [summarize, postId, post, comments, person],
  );
  return useMemo(
    () => ({
      text: entry?.text,
      /** The summary, or NO_SUMMARY_TEXT before one exists. */
      displayText: entry?.text ?? NO_SUMMARY_TEXT,
      loading: !!entry?.loading,
      refresh,
      /** The "Comment summaries" setting. */
      enabled: aiSettings.commentSummaries,
    }),
    [entry, refresh, aiSettings.commentSummaries],
  );
}

/** Brief tab "Ask Harbor" thread. */
export function useAsk() {
  const { ask, askHarbor } = useSocial();
  return useMemo(
    () => ({
      messages: ask.messages,
      loading: ask.loading,
      /** Ignores empty questions and new ones while loading. Never rejects. */
      ask: askHarbor,
      suggestions: askSuggestions,
    }),
    [ask, askHarbor],
  );
}

/**
 * Create screen "Polish with Harbor". Resolves with the rewritten text;
 * rejects on an empty draft ("Write something first") or failure.
 */
export function usePolish() {
  return ai.polishPost;
}
