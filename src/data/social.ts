import { pic } from './mock';
import type {
  AISettings,
  AppNotification,
  BriefItem,
  Chat,
  ExploreTile,
  FriendRequest,
  Group,
  Story,
} from './types';
import type { PhosphorName } from '../components/Icon';

// Social seed for SocialContext, verbatim from the Claude Design prototype
// (design-import/SPEC.md section 6.2). Local demo state in both modes
// (DECISIONS #12). People ids refer to src/data/mock.ts `users`.

const now = Date.now();
const min = 60 * 1000;

// ---- Stories ---------------------------------------------------------------

const story = (authorId: string, seed: string, timeLabel: string): Story => ({
  id: `s-${authorId}`,
  authorId,
  seed,
  imageUrl: pic(seed, 300, 500),
  fullImageUrl: pic(seed, 780, 1688),
  timeLabel,
});

export const seedStories: Story[] = [
  story('ines', 'hb-st-lisbon', '38m'),
  story('priya', 'hb-st-larch', '2h'),
  story('mateo', 'hb-st-clay', '4h'),
  story('hana', 'hb-st-dinner', '6h'),
  story('kofi', 'hb-st-accra', '9h'),
];

// ---- Explore -----------------------------------------------------------------

export const topics = [
  'For you',
  'Home bakers',
  'Trail reports',
  'Film photography',
  'Rotterdam',
  'Ceramics',
];

const group = (
  id: string,
  name: string,
  membersLabel: string,
  seed: string,
): Group => ({ id, name, membersLabel, seed, imageUrl: pic(seed, 500, 230) });

export const seedGroups: Group[] = [
  group('g-film', 'Rotterdam Film Club', '2.4K members', 'hb-g-film'),
  group('g-bread', 'Weekend Bread Society', '18K members', 'hb-g-bread'),
  group('g-trail', 'Cascades Trail Reports', '9.1K members', 'hb-g-trail'),
];

/** Masonry: left column a-d, right column e-h. */
export const exploreGrid: ExploreTile[] = [
  { seed: 'hb-ex-a', height: 230, authorId: 'delphine' },
  { seed: 'hb-ex-b', height: 170, authorId: 'priya' },
  { seed: 'hb-ex-c', height: 200, authorId: 'kofi' },
  { seed: 'hb-ex-d', height: 260, authorId: 'ines' },
  { seed: 'hb-ex-e', height: 180, authorId: 'wren' },
  { seed: 'hb-ex-f', height: 220, authorId: 'mateo' },
  { seed: 'hb-ex-g', height: 150, authorId: 'hana' },
  { seed: 'hb-ex-h', height: 240, authorId: 'yusuf' },
];

/** `pic(seed+'-'+topicIndex, 400, height*2)`: a topic change swaps every photo. */
export const exploreTileUrl = (tile: ExploreTile, topicIndex: number) =>
  pic(`${tile.seed}-${topicIndex}`, 400, tile.height * 2);

// ---- Friends -----------------------------------------------------------------

/**
 * Who starts as a friend. Empty on purpose: the design's Explore search shows
 * "Add friend" for every match. Add ids here to seed friendships.
 */
export const seedFriendIds: string[] = [];

/** Incoming friend requests (Yusuf, notification n3). */
export const seedFriendRequests: FriendRequest[] = [
  { id: 'r-yusuf', fromId: 'yusuf', state: 'pending' },
];

/** The design's "482 friends", before any change in this session. */
export const SEED_FRIENDS_COUNT = 482;

// ---- Messages ----------------------------------------------------------------

/** Active-now rail, in order. */
export const activeNow = ['hana', 'kofi', 'priya', 'ines', 'wren', 'delphine'];

let msgSeq = 0;
const msgs = (list: [boolean, string][]) =>
  list.map(([fromMe, text], i) => ({
    id: `m${msgSeq++}`,
    fromMe,
    text,
    createdAt: now - (list.length - i) * min,
  }));

export const seedChats: Chat[] = [
  {
    id: 'c1',
    peerId: 'mateo',
    timeLabel: '9:14',
    unread: true,
    typing: false,
    messages: msgs([
      [false, 'The studio is finally painted. Want to come see it Saturday?'],
      [true, 'Yes! What time works?'],
      [false, "Anytime after 2. I'll have coffee and questionable music."],
    ]),
    smartReplies: [
      'Saturday at 3 works',
      'Send me the address',
      'Can I bring Kofi?',
    ],
  },
  {
    id: 'c2',
    peerId: 'hana',
    timeLabel: 'Tue',
    unread: false,
    typing: false,
    messages: msgs([[false, 'Sunday dinner at mine, you in?']]),
    smartReplies: ["I'm in", 'What can I bring?', 'Can we do 7?'],
  },
  {
    id: 'c3',
    peerId: 'kofi',
    timeLabel: 'Mon',
    unread: false,
    typing: false,
    messages: msgs([[false, 'Photos from Accra incoming']]),
    smartReplies: ['Send them!', 'How is the new flat?'],
  },
  {
    id: 'c4',
    peerId: 'delphine',
    timeLabel: 'Sep 20',
    unread: false,
    typing: false,
    messages: msgs([
      [false, 'The Portra roll came back. Two of the shots are yours.'],
    ]),
    smartReplies: ['Show me', 'Which ones?'],
  },
  {
    id: 'c5',
    peerId: 'wren',
    timeLabel: 'Sep 18',
    unread: false,
    typing: false,
    messages: msgs([
      [true, 'You did not'],
      [false, 'Haha I absolutely did'],
    ]),
    smartReplies: ['Legend', "Photos or it didn't happen"],
  },
];

/** Canned reply after 1600 ms of typing. */
export const cannedReplies: Record<string, string> = {
  c1: "Perfect. I'll put the kettle on.",
  c2: 'Great, 7 it is.',
  c3: 'Uploading now',
  c4: 'Sending the scans tonight',
};
export const DEFAULT_CANNED_REPLY = 'Ha, fair.';

/** Conversation intro and date stamp copy. */
export const chatIntro = (mutual: number) =>
  `Friends since 2021 · ${mutual} mutual friends`;
export const CHAT_DATE_STAMP = 'Today 9:02 AM';

// ---- Notifications -----------------------------------------------------------

type SeedNotification = Omit<AppNotification, 'unread' | 'requestState'>;

export const seedNotifications: SeedNotification[] = [
  {
    id: 'n1',
    actorId: 'priya',
    kind: 'like',
    text: 'and 24 others reacted to your photo from Maple Pass.',
    timeLabel: '12m',
    fresh: true,
  },
  {
    id: 'n2',
    actorId: 'hana',
    kind: 'event',
    text: 'invited you to Sunday dinner at hers.',
    timeLabel: '1h',
    fresh: true,
  },
  {
    id: 'n3',
    actorId: 'yusuf',
    kind: 'request',
    text: 'sent you a friend request. 9 mutual friends.',
    timeLabel: '2h',
    fresh: true,
    requestId: 'r-yusuf',
  },
  {
    id: 'n4',
    actorId: 'kofi',
    kind: 'comment',
    text: 'commented on your post: "This bridge again? Never gets old."',
    timeLabel: '3h',
    fresh: true,
    postId: 'p5',
  },
  {
    id: 'n5',
    actorId: 'delphine',
    kind: 'group',
    text: 'added you to Rotterdam Film Club.',
    timeLabel: 'Tue',
    fresh: false,
  },
  {
    id: 'n6',
    actorId: 'wren',
    kind: 'mention',
    text: "mentioned you in a comment on Priya's post.",
    timeLabel: 'Mon',
    fresh: false,
  },
  {
    id: 'n7',
    actorId: 'tomasz',
    kind: 'like',
    text: 'liked your comment.',
    timeLabel: 'Sep 19',
    fresh: false,
  },
];

export const REQUEST_ACCEPTED_TEXT = 'is now your friend.';
export const REQUEST_DECLINED_TEXT = 'request removed.';

/** Static Notifications AI summary (shown when the Brief setting is on). */
export const NOTIFICATIONS_SUMMARY =
  '25 reactions on your Maple Pass photo, a dinner invite from Hana for Sunday, and one friend request from Yusuf.';

// ---- Brief -------------------------------------------------------------------

export const briefToday: BriefItem[] = [
  {
    authorId: 'ines',
    postId: 'p1',
    text: 'Ines posted her pastéis de nata recipe. Most of the 38 comments ask about the butter ratio.',
  },
  {
    authorId: 'tomasz',
    postId: 'p2',
    text: 'Tomasz shared a library survey on new Saturday hours. It closes Wednesday.',
  },
  {
    authorId: 'priya',
    postId: 'p3',
    text: "Priya's Maple Pass hike is the most-liked post among your friends today.",
  },
];

export const briefWeek: BriefItem[] = [
  {
    authorId: 'priya',
    postId: 'p3',
    text: 'Priya finished three hikes this week, 46 km in total, and shared 31 photos.',
  },
  {
    authorId: 'delphine',
    text: 'Delphine started Rotterdam Film Club. Four of your friends have joined.',
  },
  {
    authorId: 'kofi',
    text: 'Kofi moved to Accra. 62 people commented on his announcement.',
  },
];

/** Static Brief copy. */
export const briefCopy = {
  feedSubtitle: 'While you were away · 23 posts',
  updated: 'Updated 8 min ago from 23 posts, 6 messages and 11 notifications.',
  disclaimer:
    "Harbor Brief is generated by AI and can get details wrong. It never reads private messages you haven't opened.",
  aiNote: 'AI · may miss context',
};

export const comingUp: { icon: PhosphorName; title: string; sub: string }[] = [
  { icon: 'cake', title: "Hana's birthday", sub: 'Sunday, Sep 27' },
  {
    icon: 'clipboard-text',
    title: 'Library survey closes',
    sub: 'Wed, Sep 30 · Tomasz',
  },
];

export const waitingOnYou = {
  personId: 'mateo',
  text: 'Mateo asked if Saturday still works for the studio visit.',
  chatId: 'c1',
};

export const askSuggestions = [
  'What did Priya post this week?',
  'Anything I should reply to?',
  "What's happening this weekend?",
];

/** Ask Harbor context line (SPEC 7.4). */
export const ASK_UPCOMING =
  "Upcoming: Hana Sørensen's birthday Sunday Sep 27; library survey closes Wednesday Sep 30; Hana invited Noor to Sunday dinner.";

// ---- Settings ----------------------------------------------------------------

export const settingsShortcuts: { icon: PhosphorName; label: string }[] = [
  { icon: 'users-three', label: 'Friends' },
  { icon: 'bookmark-simple', label: 'Saved' },
  { icon: 'circles-three-plus', label: 'Groups' },
  { icon: 'calendar-blank', label: 'Events' },
  { icon: 'clock-counter-clockwise', label: 'Memories' },
  { icon: 'rows', label: 'Feeds' },
];

/** Settings > HARBOR AI rows, in order. `key` indexes AISettings. */
export const aiSettingRows: {
  key: keyof AISettings;
  label: string;
  sub: string;
}[] = [
  {
    key: 'brief',
    label: 'Brief in your feed',
    sub: 'A short summary of what you missed, at the top of Home.',
  },
  {
    key: 'commentSummaries',
    label: 'Comment summaries',
    sub: 'Summaries on posts with long comment threads.',
  },
  {
    key: 'smartReplies',
    label: 'Smart replies',
    sub: 'Suggested replies in Messages. Generated on your device.',
  },
  {
    key: 'personalize',
    label: 'Personalize with my posts',
    sub: 'Let Harbor AI use your own posts to tailor summaries.',
  },
];

/** Settings > PRIVACY rows (inert). */
export const privacyRows: {
  icon: PhosphorName;
  label: string;
  value?: string;
}[] = [
  { icon: 'users', label: 'Default audience', value: 'Friends' },
  { icon: 'prohibit', label: 'Blocked accounts', value: '2' },
  { icon: 'download-simple', label: 'Download your data' },
];
