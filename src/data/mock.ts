import { DEFAULT_PREFS } from './types';
import type { Activity, Comment, Post, Prefs, User } from './types';

// Static seed data for DEMO_MODE (src/config.ts), verbatim from the Claude
// Design prototype (design-import/SPEC.md section 6.2). The demo backend
// (src/services/backend/demo.ts) copies it into memory on sign-in. The
// social seed (stories, chats, groups, notifications, Brief) lives in
// src/data/social.ts.

const now = Date.now();
const min = 60 * 1000;
const hour = 60 * min;
const day = 24 * hour;

/** `pic(seed,w,h)` from the design. */
export const pic = (seed: string, w = 800, h = 600) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`;

/** `https://i.pravatar.cc/{size}?img={n}`. */
export const avatar = (img: number, size = 160) =>
  `https://i.pravatar.cc/${size}?img=${img}`;

/** Placeholder photo the create screen attaches in demo mode. */
export const draftPhoto = () => pic(`hb-draft-${Date.now() % 97}`, 900, 675);

export const images = {
  /** Profile cover. */
  cover: pic('hb-rotterdam-cover', 800, 440),
  /** The demo user's 300 avatar (create-story card). */
  meLarge: avatar(47, 300),
};

export const ME_ID = 'me';

const person = (
  id: string,
  name: string,
  img: number,
  mutualCount: number | undefined,
  extra: Partial<User> = {},
): User => ({
  id,
  name,
  handle: id,
  photoUrl: avatar(img),
  mutualCount,
  ...extra,
});

export const users: Record<string, User> = {
  me: person('me', 'Noor Haddad', 47, undefined, {
    handle: 'noorhaddad',
    location: 'Rotterdam',
    bio: 'Architect. Mostly bridges, bread, and long walks along the Maas.',
    coverUrl: images.cover,
    friendsCount: 482,
    postsCount: 131,
    albumsCount: 36,
    followers: 482,
    about: [
      { icon: 'briefcase', text: 'Architect at Studio Veldkamp' },
      { icon: 'house-line', text: 'Lives in Rotterdam, Netherlands' },
      { icon: 'map-pin', text: 'From Amman, Jordan' },
      { icon: 'graduation-cap', text: 'Studied at TU Delft' },
      { icon: 'calendar-blank', text: 'Joined March 2019' },
    ],
    photos: [
      'bridge',
      'bread',
      'maas',
      'tram',
      'market',
      'crane',
      'window',
      'rain',
      'bikes',
      'dune',
      'cafe',
      'tiles',
    ].map(k => pic(`hb-me-${k}`, 300, 300)),
  }),
  ines: person('ines', 'Ines Okafor-Lind', 32, 14, { location: 'Lisbon' }),
  tomasz: person('tomasz', 'Tomasz Wierzbicki', 12, 6, { location: 'Kraków' }),
  priya: person('priya', 'Priya Raghunathan', 45, 22, {
    location: 'North Cascades',
  }),
  mateo: person('mateo', 'Mateo Arriaga', 15, 9, { location: 'Oaxaca' }),
  hana: person('hana', 'Hana Sørensen', 5, 31),
  kofi: person('kofi', 'Kofi Mensah-Boateng', 53, 11, { location: 'Accra' }),
  delphine: person('delphine', 'Delphine Aubert', 44, 8),
  yusuf: person('yusuf', 'Yusuf Karaca', 59, 9),
  wren: person('wren', 'Wren Castellanos', 26, 4),
};

/** People in the design's order, without me. */
export const PEOPLE_ORDER = [
  'ines',
  'tomasz',
  'priya',
  'mateo',
  'hana',
  'kofi',
  'delphine',
  'yusuf',
  'wren',
];

export const seedPrefs: Prefs = { ...DEFAULT_PREFS };

type SeedPost = Omit<Post, 'imageUrl' | 'audience'> & {
  audience?: Post['audience'];
};

const post = (p: SeedPost): Post => ({
  audience: 'friends',
  ...p,
  imageUrl: p.imageUrls[0],
});

export const seedPosts: Post[] = [
  post({
    id: 'p1',
    authorId: 'ines',
    text: 'Third attempt at pastéis de nata from scratch and the lamination finally held. Butter ratios are in the comments for everyone who asked.',
    imageUrls: [pic('hb-nata-lisbon', 900, 675)],
    aspect: '4/3',
    place: 'Lisbon',
    createdAt: now - 42 * min,
    likeCount: 214,
    likedByMe: false,
    commentCount: 38,
    shareCount: 6,
  }),
  post({
    id: 'p2',
    authorId: 'tomasz',
    text: 'Our neighborhood library is extending Saturday hours starting October 3. If you use the reading room, the city survey on the new schedule closes Wednesday.',
    imageUrls: [],
    aspect: '4/3',
    place: 'Kraków',
    createdAt: now - 1 * hour,
    likeCount: 87,
    likedByMe: true,
    commentCount: 19,
    shareCount: 24,
  }),
  post({
    id: 'p3',
    authorId: 'priya',
    text: 'Maple Pass Loop. 14.3 km, 820 m of gain, and one very judgmental marmot.',
    imageUrls: [
      pic('hb-cascade-larch', 720, 900),
      pic('hb-cascade-ridge', 720, 900),
      pic('hb-cascade-lake', 720, 900),
    ],
    aspect: '4/5',
    place: 'North Cascades',
    createdAt: now - 3 * hour,
    likeCount: 1208,
    likedByMe: false,
    commentCount: 142,
    shareCount: 31,
  }),
  post({
    id: 'p4',
    authorId: 'mateo',
    text: 'The studio is finally done. Six months, one very patient landlord, and more clay dust than I will ever admit to.',
    imageUrls: [pic('hb-clay-studio', 900, 675)],
    aspect: '4/3',
    place: 'Oaxaca',
    createdAt: now - 1 * day,
    likeCount: 356,
    likedByMe: false,
    commentCount: 47,
    shareCount: 3,
  }),
  // My posts (profile Posts tab).
  post({
    id: 'p5',
    authorId: ME_ID,
    text: 'Walked the Erasmusbrug at 6 AM before the cyclists woke up. Worth the alarm.',
    imageUrls: [pic('hb-me-bridge', 900, 675)],
    aspect: '4/3',
    place: 'Rotterdam',
    createdAt: now - 2 * day,
    likeCount: 148,
    likedByMe: false,
    commentCount: 23,
    shareCount: 0,
  }),
  post({
    id: 'p6',
    authorId: ME_ID,
    text: 'Sourdough number 41. Still not the one, but closer.',
    imageUrls: [pic('hb-me-bread', 900, 675)],
    aspect: '4/3',
    place: 'Rotterdam',
    createdAt: now - 5 * day,
    likeCount: 96,
    likedByMe: false,
    commentCount: 14,
    shareCount: 0,
  }),
];

/** `[who, text, minutesAgo, likes]` per post, oldest first. */
const COMMENTS: Record<string, [string, string, number, number][]> = {
  p1: [
    ['kofi', 'Butter ratio please. Mine always leaks in the oven.', 18, 12],
    [
      'ines',
      '250 g cold butter per 500 g flour. Three folds, 20 minutes in the fridge between each.',
      15,
      41,
    ],
    [
      'delphine',
      'A marble slab changed everything for me. Worth it if you bake more than twice a year.',
      11,
      7,
    ],
    [
      'yusuf',
      'Tried this last weekend and mine looked like scrambled eggs in a cup. Going again Saturday.',
      6,
      3,
    ],
  ],
  p2: [
    ['hana', 'Thank you for flagging this. Filled it in.', 40, 5],
    ['wren', 'Do the Sunday hours change too?', 32, 1],
    ['tomasz', 'Sunday stays the same, 10 to 4.', 28, 4],
  ],
  p3: [
    ['kofi', 'Which trailhead did you start from?', 130, 6],
    [
      'priya',
      'Rainy Pass. Go counter-clockwise, the views open up faster.',
      120,
      18,
    ],
    ['delphine', 'The larches in two weeks will be unreal.', 60, 9],
  ],
  p4: [
    ['priya', 'Mateo!! It looks incredible.', 20 * 60, 4],
    ['hana', 'Are you running weekend classes?', 18 * 60, 11],
    ['mateo', 'Starting November. Four people per class.', 17 * 60, 14],
  ],
};

export const seedComments: Comment[] = Object.entries(COMMENTS).flatMap(
  ([postId, list]) =>
    list.map(([authorId, text, minsAgo, likeCount], i) => ({
      id: `${postId}-c${i + 1}`,
      postId,
      authorId,
      text,
      createdAt: now - minsAgo * min,
      likeCount,
    })),
);

/**
 * Seeded comment summaries (the design's initial `cSum`), also the demo AI
 * output for these posts.
 */
export const commentSummaries: Record<string, string> = {
  p1: 'Most commenters want the butter ratio. Ines answered in the thread: 250 g of cold butter per 500 g of flour, three folds, chilled between each. Others recommend a marble slab.',
  p2: 'People are thanking Tomasz and filling in the survey. Sunday hours stay the same, 10 AM to 4 PM.',
  p3: 'Friends are asking about the route. Priya started at Rainy Pass and suggests going counter-clockwise; the larches peak in about two weeks.',
  p4: 'Friends are congratulating Mateo on the studio. Weekend classes start in November with four people per class.',
};

/**
 * Legacy activity feed (StoreContext `activity`). The design's
 * notifications live in src/data/social.ts (`useNotifications()`).
 */
export const seedActivity: Activity[] = [
  {
    id: 'a1',
    kind: 'like',
    actorId: 'priya',
    othersCount: 24,
    postId: 'p5',
    thumbUrl: pic('hb-me-bridge', 900, 675),
    createdAt: now - 12 * min,
    read: false,
  },
  {
    id: 'a2',
    kind: 'comment',
    actorId: 'kofi',
    postId: 'p5',
    quote: 'This bridge again? Never gets old.',
    thumbUrl: pic('hb-me-bridge', 900, 675),
    createdAt: now - 3 * hour,
    read: false,
  },
  {
    id: 'a3',
    kind: 'commentLike',
    actorId: 'tomasz',
    createdAt: now - 25 * day,
    read: true,
  },
];

// Who I already follow (feed / suggestions plumbing; the UI shows friends).
export const seedFollowing: Record<string, boolean> = {
  hana: true,
};
