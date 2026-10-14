import { Easing, TextStyle, ViewStyle } from 'react-native';

/**
 * Harbor design tokens (Claude Design prototype: Geist, cobalt on zinc).
 * Source of truth: design-import/SPEC.md section 2. API notes for screen
 * owners: design-import/FOUNDATION.md.
 *
 * Rules: pick a weight with `fonts.*` (never set fontWeight), never use
 * #000, and animate only transform / opacity on the native driver.
 */

export const colors = {
  bg: '#FFFFFF',
  ink: '#18181B',
  ink2: '#27272A',
  inkSoft: '#3F3F46',
  sub: '#52525B',
  muted: '#71717A',
  faint: '#A1A1AA',
  border: '#D4D4D8',
  line: '#E4E4E7',
  hairline: '#F0F0F2',
  fill: '#F4F4F5',
  pressed: '#FAFAFA',
  accent: '#2F5BD3',
  accentInk: '#2447AE',
  accentSoft: '#EEF2FD',
  aiSurface: '#F5F7FE',
  aiBorder: '#E1E8FB',
  aiChipBorder: '#DCE3F8',
  shimmerBase: '#E4EAFA',
  shimmerHi: '#F8F9FE',
  danger: '#DC2626',
  warning: '#D97706',
  online: '#22C55E',
  sunny: '#F6B51B',
  toastIcon: '#8FB0FF',
  storyBg: '#0B0B0C',
  onAccent: '#FFFFFF',
  /** Inactive tab icon on the dark pill. */
  onInkMuted: 'rgba(255,255,255,0.72)',
  toastBg: 'rgba(24,24,27,0.9)',
  scrim60: 'rgba(24,24,27,0.6)',
  scrim50: 'rgba(24,24,27,0.5)',
  scrim35: 'rgba(24,24,27,0.35)',
  /** Card hairline ring (rgba ink .06). */
  ring06: 'rgba(24,24,27,0.06)',
  /** Header hairline (rgba ink .05). */
  ring05: 'rgba(24,24,27,0.05)',
  /** White ring on frosted dark buttons. */
  ringWhite18: 'rgba(255,255,255,0.18)',
  /**
   * Translucent bars. DECISIONS #1: no blur package, so bars use
   * `barFallback` (.86) plus a hairline; the design values are kept for a
   * later BlurView upgrade.
   */
  barHeader: 'rgba(255,255,255,0.82)',
  barComposer: 'rgba(255,255,255,0.86)',
  barChat: 'rgba(255,255,255,0.88)',
  barFallback: 'rgba(255,255,255,0.86)',
} as const;

/**
 * Geist, one family per weight (PostScript names). Android ignores
 * fontWeight on custom fonts, so never set fontWeight.
 */
export const fonts = {
  regular: 'Geist-Regular',
  medium: 'Geist-Medium',
  semibold: 'Geist-SemiBold',
  bold: 'Geist-Bold',
} as const;

/**
 * Builds a text style. `lh` is the CSS unitless line-height multiplier and
 * `em` the CSS letter-spacing in em; both are converted to dp.
 */
const t = (
  fontFamily: string,
  fontSize: number,
  lh?: number,
  em?: number,
  color: string = colors.ink,
): TextStyle => ({
  fontFamily,
  fontSize,
  color,
  ...(lh ? { lineHeight: Math.round(fontSize * lh * 100) / 100 } : null),
  ...(em ? { letterSpacing: Math.round(fontSize * em * 1000) / 1000 } : null),
});

/** The type ramp (SPEC 2.2). Override `color` per use where the spec does. */
export const type = {
  /** 32/700 -1.44: Explore, Messages, Notifications, Brief, Menu. */
  largeTitle: { ...t(fonts.bold, 32, undefined, -0.045), lineHeight: 38 },
  /** 31/600 lh 33.5: onboarding headlines. */
  obTitle: t(fonts.semibold, 31, 1.08, -0.035),
  /** 30/600 lh 33: "Welcome back", "Create your account". */
  authTitle: t(fonts.semibold, 30, 1.1, -0.035),
  /** 26/700: profile name. */
  profileName: t(fonts.bold, 26, undefined, -0.035),
  /** 22/400 lh 30.8: create textarea (use `composerSm` when long). */
  composer: t(fonts.regular, 22, 1.4, -0.01),
  /** 17/400 lh 23.8: create textarea with a photo or 90+ chars. */
  composerSm: t(fonts.regular, 17, 1.4, -0.01),
  /** 18/700: "harbor" wordmark. */
  wordmark: t(fonts.bold, 18, undefined, -0.04),
  /** 18/600: "Home" in the feed header pill. */
  headerPill: t(fonts.semibold, 18, undefined, -0.03),
  /** 18/600: "Groups for you", grid title, "Ask Harbor". */
  section: t(fonts.semibold, 18, undefined, -0.02),
  /** 17/600: "{First}'s post", "Create post". */
  navTitle: t(fonts.semibold, 17, undefined, -0.015),
  /** 17/600: "New", "Earlier". */
  listHeader: t(fonts.semibold, 17, undefined, -0.02),
  /** 17/600: chat intro name. */
  chatName: t(fonts.semibold, 17),
  /** 16/600 white: primary buttons. */
  cta: t(fonts.semibold, 16, undefined, undefined, colors.onAccent),
  /** 16/400 lh 24 #52525B: auth and onboarding subcopy. */
  lead: t(fonts.regular, 16, 1.5, undefined, colors.sub),
  /** 16/400: auth inputs. */
  input: t(fonts.regular, 16),
  /** 16/600: settings profile card name, chat header name. */
  rowTitle: t(fonts.semibold, 16),
  /** 15.5/400 lh 22.5: post detail text. */
  bodyLg: t(fonts.regular, 15.5, 1.45, undefined, colors.ink2),
  /** 15.5/400: search fields. */
  searchInput: t(fonts.regular, 15.5),
  /** 15/400 lh 21.75 #27272A: feed post text, bios. */
  body: t(fonts.regular, 15, 1.45, undefined, colors.ink2),
  /** 15/600 -0.15: post author, Brief card title. */
  name: t(fonts.semibold, 15, undefined, -0.01),
  /** 15/400 lh 20.7: chat bubbles. */
  bubble: t(fonts.regular, 15, 1.38),
  /** 14.5/400 lh 20.6: brief items, "What you missed" rows. */
  bodySm: t(fonts.regular, 14.5, 1.42, undefined, colors.ink2),
  /** 14.5/400 lh 20.3: comment and notification text. */
  comment: t(fonts.regular, 14.5, 1.4, undefined, colors.ink2),
  /** 14.5/400 lh 21: Ask thread bubbles. */
  ask: t(fonts.regular, 14.5, 1.45, undefined, colors.ink2),
  /** 14.5/600: profile buttons and tabs, "Mark all read". */
  button14_5: t(fonts.semibold, 14.5),
  /** 14/600: action-bar buttons, Confirm/Delete, segmented labels. */
  button: t(fonts.semibold, 14),
  /** 14/400 lh 20.3: summaries, footers. */
  small: t(fonts.regular, 14, 1.45, undefined, colors.ink2),
  /** 13.5/600: tone, topic chips, Add friend, Reply. */
  chip: t(fonts.semibold, 13.5),
  /** 13.5/500 #2447AE: AI chips (smart replies, Ask suggestions). */
  chipAi: t(fonts.medium, 13.5, undefined, undefined, colors.accentInk),
  /** 13/600 #3F3F46: form labels. */
  label: t(fonts.semibold, 13, undefined, undefined, colors.inkSoft),
  /** 13/600 uppercase #71717A ls .39: section overlines. */
  overline: {
    ...t(fonts.semibold, 13, undefined, 0.03, colors.muted),
    textTransform: 'uppercase',
  },
  /** 13/400 #71717A: timestamps and sub lines. */
  meta: t(fonts.regular, 13, undefined, undefined, colors.muted),
  /** 12.5/400 #71717A. */
  caption: t(fonts.regular, 12.5, undefined, undefined, colors.muted),
  /** 12/400 #71717A. */
  micro: t(fonts.regular, 12, undefined, undefined, colors.muted),
  /** 11.5/400 #71717A. */
  tiny: t(fonts.regular, 11.5, undefined, undefined, colors.muted),
} satisfies Record<string, TextStyle>;

/** Named radii (SPEC 2.3). Other verbatim values are written inline. */
export const radius = {
  xs: 6,
  chipSm: 8,
  btnSm: 10,
  btn: 11,
  md: 12,
  input: 14,
  lg: 16,
  xl: 18,
  card: 20,
  cardLg: 22,
  pill: 999,
};

export const space = {
  xxs: 2,
  xs: 4,
  s6: 6,
  sm: 8,
  s10: 10,
  md: 12,
  s14: 14,
  lg: 16,
  s18: 18,
  s20: 20,
  s22: 22,
  xl: 24,
  s28: 28,
  /** App screen gutter. */
  gutter: 16,
  /** Auth screen gutter. */
  authGutter: 24,
};

/**
 * CSS-syntax shadows for the New Architecture `boxShadow` style prop
 * (supports spread and inset). Use as `{ boxShadow: shadow.pill }`, or the
 * ready-made objects in `elevation`.
 */
export const shadow = {
  pill: '0 8px 24px -14px rgba(24,24,27,.3), inset 0 0 0 1px rgba(24,24,27,.06)',
  chip: '0 12px 30px -12px rgba(24,24,27,.3), inset 0 0 0 1px rgba(24,24,27,.06)',
  obCard:
    '0 24px 48px -24px rgba(47,91,211,.4), inset 0 0 0 1px rgba(24,24,27,.05)',
  tabBar:
    '0 18px 36px -16px rgba(24,24,27,.5), inset 0 1px 0 rgba(255,255,255,.08)',
  fab: '0 18px 36px -14px rgba(47,91,211,.7), inset 0 1px 0 rgba(255,255,255,.2)',
  toast:
    '0 12px 30px -10px rgba(24,24,27,.5), inset 0 1px 0 rgba(255,255,255,.1)',
  knob: '0 3px 8px rgba(24,24,27,.18), 0 1px 1px rgba(24,24,27,.1)',
  thumb: '0 1px 3px rgba(24,24,27,.12)',
  btnHighlight: 'inset 0 1px 0 rgba(255,255,255,.18)',
  headerHairline: '0 1px 0 rgba(24,24,27,.05)',
  composerHairline: '0 -1px 0 rgba(24,24,27,.06)',
  /** 1px inner rings (borders that take no layout space). */
  ringLine: 'inset 0 0 0 1px #E4E4E7',
  ringAi: 'inset 0 0 0 1px #E1E8FB',
  ringAiChip: 'inset 0 0 0 1px #DCE3F8',
  ringWhite18: 'inset 0 0 0 1px rgba(255,255,255,.18)',
  ringInk06: 'inset 0 0 0 1px rgba(24,24,27,.06)',
};

/**
 * Ready-made style objects: `boxShadow` (New Architecture) for every shadow
 * token. If boxShadow ever misbehaves on a device, swap in `legacyShadow`.
 */
export const elevation = {
  pill: { boxShadow: shadow.pill },
  chip: { boxShadow: shadow.chip },
  obCard: { boxShadow: shadow.obCard },
  tabBar: { boxShadow: shadow.tabBar },
  fab: { boxShadow: shadow.fab },
  toast: { boxShadow: shadow.toast },
  knob: { boxShadow: shadow.knob },
  thumb: { boxShadow: shadow.thumb },
  btnHighlight: { boxShadow: shadow.btnHighlight },
  headerHairline: { boxShadow: shadow.headerHairline },
  composerHairline: { boxShadow: shadow.composerHairline },
} satisfies Record<string, ViewStyle>;

/** iOS shadow* + Android elevation approximations of the CSS shadows (SPEC 2.5). */
export const legacyShadow = {
  pill: {
    shadowColor: '#18181B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  tabBar: {
    shadowColor: '#18181B',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  fab: {
    shadowColor: '#2F5BD3',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 12,
  },
  toast: {
    shadowColor: '#18181B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 10,
  },
  knob: {
    shadowColor: '#18181B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 3,
  },
  thumb: {
    shadowColor: '#18181B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 1.5,
    elevation: 1,
  },
} satisfies Record<string, ViewStyle>;

/** Backdrop blur radii from the design, for a later BlurView upgrade. */
export const blur = { header: 20, zone: 16, chip: 10, toast: 14 } as const;

export const ease = {
  /** cubic-bezier(.16,1,.3,1): pushes, pills, thumbs, toasts. */
  smooth: Easing.bezier(0.16, 1, 0.3, 1),
  /** cubic-bezier(.34,1.56,.64,1): like buttons, FAB, story heart. */
  spring: Easing.bezier(0.34, 1.56, 0.64, 1),
  /** cubic-bezier(.34,1.3,.64,1): switch knob. */
  knob: Easing.bezier(0.34, 1.3, 0.64, 1),
  /** CSS `ease`: fades. */
  css: Easing.bezier(0.25, 0.1, 0.25, 1),
  linear: Easing.linear,
};

/** Durations in ms (SPEC 2.7 and Appendix B). */
export const duration = {
  press: 200,
  pressSpring: 250,
  storyHeart: 300,
  chip: 200,
  fade: 350,
  fadeSm: 300,
  fadeLg: 500,
  push: 450,
  rise: 500,
  pager: 620,
  tab: 450,
  thumb: 450,
  caret: 400,
  knob: 400,
  track: 250,
  toast: 450,
  toastOut: 200,
  toastHold: 2200,
  shimmer: 1200,
  dot: 1200,
  story: 5000,
  typing: 1600,
};

export const layout = {
  tabBar: {
    height: 62,
    side: 16,
    bottom: 30,
    gap: 10,
    pad: 7,
    itemH: 48,
    fab: 62,
  },
  feedHeaderZone: 132,
  tabZone: 140,
  headerPillH: 44,
};

export const hitSlop = { top: 10, bottom: 10, left: 10, right: 10 };
