/**
 * Harbor AI (SPEC section 7). Demo-only for now (DECISIONS #5): every
 * function builds the exact prompt a future server call would send, then
 * answers with a deterministic, mock-data-driven result after an artificial
 * 600-1100 ms delay. No network, no API keys in the app.
 *
 * To go live later, replace `complete()` with a call to a server-side proxy
 * (e.g. a Firebase callable `aiComplete` that calls the Anthropic Messages
 * API with a server-held key) and drop the `demo` answers. The signatures
 * stay the same.
 *
 * Screens do not import this file: they use the SocialContext hooks
 * (`useBrief`, `useCommentSummary`, `useAsk`, `usePolish`), which own the
 * loading state.
 */

import { commentSummaries } from '../data/mock';
import { ASK_UPCOMING, briefToday } from '../data/social';
import type { BriefItem } from '../data/types';

// ---------------------------------------------------------------------------
// Transport
// ---------------------------------------------------------------------------

export type AIMessage = { role: 'user' | 'assistant'; content: string };
export type AIRequest = {
  system?: string;
  messages: AIMessage[];
  max_tokens: number;
};

export const AI_DELAY_MIN = 600;
export const AI_DELAY_MAX = 1100;

/** Stable 600-1100 ms delay per request, so runs are reproducible. */
export function aiDelayFor(key: string): number {
  let h = 0;
  for (let i = 0; i < key.length; i++) {
    h = (h * 31 + key.charCodeAt(i)) % 1000003;
  }
  return AI_DELAY_MIN + (Math.abs(h) % (AI_DELAY_MAX - AI_DELAY_MIN + 1));
}

const sleep = (ms: number) =>
  new Promise<void>(resolve => setTimeout(resolve, ms));

/**
 * The single model call. Demo: waits, then returns the precomputed `demo`
 * answer. Live (later): POST `req` to the proxy and return its text.
 */
async function complete(req: AIRequest, demo: string): Promise<string> {
  const key = req.messages.map(m => m.content).join('\n');
  await sleep(aiDelayFor(key));
  return String(demo).trim();
}

// ---------------------------------------------------------------------------
// 7.1 Harbor Brief
// ---------------------------------------------------------------------------

export type BriefPostInput = {
  postId: string;
  authorId: string;
  firstName: string;
  text: string;
  likes: number;
  comments: number;
};

export type BriefInput = {
  /** Friends' posts, newest first (not mine). */
  posts: BriefPostInput[];
  /** People who may start a line: id + first name, me excluded. */
  people: { id: string; firstName: string }[];
  /**
   * Which prepared answer the demo returns: even = the seeded Today lines,
   * odd = lines derived from `posts`. SocialContext bumps it per refresh.
   */
  variant?: number;
};

export const BRIEF_PROMPT =
  'You write the "Brief" recap in a friends-only social app. From these posts, write exactly 3 lines. Each line is one plain sentence under 22 words that starts with the person\'s first name. No bullets, numbering, emoji, or intro.';

export function briefRequest(posts: BriefPostInput[]): AIRequest {
  const block = posts
    .map(
      p =>
        `${p.firstName}: ${p.text} (${p.likes} likes, ${p.comments} comments)`,
    )
    .join('\n');
  return {
    messages: [{ role: 'user', content: `${BRIEF_PROMPT}\n\n${block}` }],
    max_tokens: 300,
  };
}

/**
 * The design's parser: split lines, strip bullets/numbering, keep 3, and
 * attribute each to the first person whose first name it starts with
 * (falling back to 'ines'). Returns [] when nothing usable came back.
 */
export function parseBrief(
  raw: string,
  people: { id: string; firstName: string }[],
  posts: BriefPostInput[] = [],
): BriefItem[] {
  return raw
    .split('\n')
    .map(l => l.replace(/^[-*•\d.\s]+/, '').trim())
    .filter(Boolean)
    .slice(0, 3)
    .map(text => {
      const who = people.find(p => text.startsWith(p.firstName));
      const authorId = who?.id ?? 'ines';
      const postId = posts.find(p => p.authorId === authorId)?.postId;
      return postId ? { authorId, text, postId } : { authorId, text };
    });
}

function cut(text: string, words: number) {
  const list = text.replace(/\s+/g, ' ').trim().split(' ');
  const head = list
    .slice(0, words)
    .join(' ')
    .replace(/[.,;:!?]+$/, '');
  return list.length > words ? `${head}…` : head;
}

function demoBrief(input: BriefInput): string {
  if ((input.variant ?? 0) % 2 === 0 || input.posts.length === 0) {
    return briefToday.map(b => b.text).join('\n');
  }
  return [...input.posts]
    .sort((a, b) => b.likes - a.likes)
    .slice(0, 3)
    .map(
      p =>
        `${p.firstName} posted "${cut(
          p.text,
          7,
        )}", with ${p.likes.toLocaleString('en-US')} likes and ${
          p.comments
        } comments.`,
    )
    .join('\n');
}

/**
 * Feed Brief card "Refresh". Resolves with up to 3 items; an empty array
 * means "keep the old brief".
 */
export async function generateBrief(input: BriefInput): Promise<BriefItem[]> {
  const raw = await complete(briefRequest(input.posts), demoBrief(input));
  return parseBrief(raw, input.people, input.posts);
}

// ---------------------------------------------------------------------------
// 7.2 Comment summary
// ---------------------------------------------------------------------------

export type CommentSummaryInput = {
  postId: string;
  authorFirstName: string;
  postText: string;
  /** Oldest first. */
  comments: { firstName: string; text: string }[];
};

export function commentSummaryRequest(input: CommentSummaryInput): AIRequest {
  const lines = input.comments.map(c => `${c.firstName}: ${c.text}`).join('\n');
  return {
    messages: [
      {
        role: 'user',
        content: `Summarize the comments on this social post in two plain sentences, under 45 words total. No preamble, no emoji.\n\nPost by ${input.authorFirstName}: ${input.postText}\n\nComments:\n${lines}`,
      },
    ],
    max_tokens: 200,
  };
}

export const NO_SUMMARY_TEXT = 'Tap refresh to summarize this thread.';

function demoCommentSummary(input: CommentSummaryInput): string {
  const seeded = commentSummaries[input.postId];
  if (seeded) {
    return seeded;
  }
  if (input.comments.length < 2) {
    return 'Not enough comments to summarize yet.';
  }
  const last = input.comments[input.comments.length - 1];
  return `${input.comments.length} friends commented. Most recent: "${cut(
    last.text,
    12,
  )}"`;
}

/** Post screen "Comment summary" refresh. */
export async function summarizeComments(
  input: CommentSummaryInput,
): Promise<string> {
  return complete(commentSummaryRequest(input), demoCommentSummary(input));
}

// ---------------------------------------------------------------------------
// 7.3 Polish with Harbor
// ---------------------------------------------------------------------------

export type PolishTone = 'Clearer' | 'Warmer' | 'Shorter';

export function polishRequest(text: string, tone: PolishTone): AIRequest {
  return {
    messages: [
      {
        role: 'user',
        content: `Rewrite this social media post to be ${tone.toLowerCase()}. Keep it first person, keep every fact, no emoji, no hashtags. Return only the rewritten post.\n\n${text}`,
      },
    ],
    max_tokens: 300,
  };
}

/** DEMO BEHAVIOUR: deterministic local rewrites (no canned text in the design). */
function demoPolish(text: string, tone: PolishTone): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (tone === 'Shorter') {
    const first = clean.match(/^.*?[.!?](\s|$)/)?.[0]?.trim();
    if (first && first.length < clean.length) {
      return first;
    }
    const words = clean.split(' ');
    const keep = Math.max(1, Math.ceil(words.length * 0.6));
    return `${words
      .slice(0, keep)
      .join(' ')
      .replace(/[,;:]+$/, '')}.`;
  }
  if (tone === 'Clearer') {
    const expanded = clean.replace(/\s*&\s*/g, ' and ');
    const capitalised = expanded.replace(
      /(^|[.!?]\s+)([a-z])/g,
      (_m, pre: string, ch: string) => pre + ch.toUpperCase(),
    );
    return /[.!?]$/.test(capitalised) ? capitalised : `${capitalised}.`;
  }
  // Warmer
  return clean.includes('!')
    ? clean
    : `${clean} Can't wait to share more soon.`;
}

/**
 * Create screen tone buttons. Resolves with the rewritten text, with
 * surrounding quotes stripped. Rejects on an empty draft.
 */
export async function polishPost(
  text: string,
  tone: PolishTone,
): Promise<string> {
  if (!text.trim()) {
    throw new Error('Write something first');
  }
  const out = await complete(polishRequest(text, tone), demoPolish(text, tone));
  return out.replace(/^"|"$/g, '');
}

// ---------------------------------------------------------------------------
// 7.4 Ask Harbor
// ---------------------------------------------------------------------------

export type AskContext = {
  /** Feed posts. */
  posts: {
    authorId: string;
    fullName: string;
    firstName: string;
    time: string;
    place?: string;
    text: string;
  }[];
  /** Last message of each chat. */
  chats: { firstName: string; lastText: string }[];
  /** Signed-in user's full name. */
  meName: string;
};

export function askRequest(question: string, ctx: AskContext): AIRequest {
  const system = `You are Harbor Brief, the assistant inside a friends-only social app. The user is ${ctx.meName}. Answer in 1 to 3 short plain sentences using only this context. If the context lacks the answer, say so. No markdown, no emoji.`;
  const block = [
    'Posts:',
    ...ctx.posts.map(
      p =>
        `- ${p.fullName} (${p.time}${p.place ? `, ${p.place}` : ''}): ${
          p.text
        }`,
    ),
    ASK_UPCOMING,
    'Latest messages:',
    ...ctx.chats.map(c => `- ${c.firstName}: ${c.lastText}`),
  ].join('\n');
  return {
    system: `${system}\n\n${block}`,
    messages: [{ role: 'user', content: question }],
    max_tokens: 250,
  };
}

const ASK_CANNED: Record<string, string> = {
  'what did priya post this week?':
    "Priya posted the Maple Pass Loop in the North Cascades: 14.3 km with 820 m of gain. It's the most-liked post among your friends today.",
  'anything i should reply to?':
    'Mateo asked if Saturday still works for the studio visit. Hana also invited you to Sunday dinner at hers.',
  "what's happening this weekend?":
    "Mateo invited you to see his studio on Saturday, any time after 2. On Sunday it's Hana's birthday, and she's invited you to dinner.",
};

export const ASK_FALLBACK =
  "I can only answer from posts and messages shared with you, and I couldn't find that. Try asking about a friend by name.";

/** Shown inline (not a toast) when the call fails. */
export const ASK_ERROR = "I couldn't reach the server. Try again in a moment.";

function demoAsk(question: string, ctx: AskContext): string {
  const q = question.trim().toLowerCase().replace(/[’]/g, "'");
  if (ASK_CANNED[q]) {
    return ASK_CANNED[q];
  }
  const post = ctx.posts.find(p => q.includes(p.firstName.toLowerCase()));
  if (post) {
    const chat = ctx.chats.find(c => c.firstName === post.firstName);
    const where = post.place ? ` from ${post.place}` : '';
    const lead = `${post.firstName}'s latest post${where} (${
      post.time
    }): "${cut(post.text, 18)}"`;
    return chat
      ? `${lead}. Their last message to you: "${cut(chat.lastText, 14)}"`
      : `${lead}.`;
  }
  const chat = ctx.chats.find(c => q.includes(c.firstName.toLowerCase()));
  if (chat) {
    return `${chat.firstName}'s last message to you: "${cut(
      chat.lastText,
      18,
    )}"`;
  }
  return ASK_FALLBACK;
}

/** Brief tab "Ask Harbor". Resolves with the answer bubble text. */
export async function askHarbor(
  question: string,
  ctx: AskContext,
): Promise<string> {
  return complete(askRequest(question, ctx), demoAsk(question, ctx));
}

// ---------------------------------------------------------------------------
// 7.5 Smart replies (static in the design: "Generated on your device")
// ---------------------------------------------------------------------------

/**
 * Chat smart replies. The design keeps them static per chat, so this only
 * echoes the seeded list; SocialContext already exposes `chat.smartReplies`.
 */
export async function suggestReplies(seeded: string[]): Promise<string[]> {
  return [...seeded];
}
