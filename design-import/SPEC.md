# Harbor: rebuild spec for the Claude Design prototype

Source: `design-import/HarborApp.dc.html` (14 iOS screens at 390×844, one HTML template plus one `DCLogic` class component). This document replaces opening the HTML. All values are copied verbatim from that file unless a line is marked **(spec)**. A **(spec)** line is a recommendation from this document, not a value from the design.

Target: `E:\01 GITHUB REPOS\Harbor` (React Native 0.87.1, TypeScript, New Architecture). The app runs in demo mode (`src/config.ts` `DEMO_MODE = true`) on mock data. Firebase is the real backend.

## Contents

0. Conventions for reading this spec
1. Screen inventory
2. Tokens and the proposed `theme.ts`
3. Screens 01 to 14: layout, copy, icons, images, states, behaviour, motion
4. Navigation: tab bar, headers, how each screen is reached
5. Shared components to build once
6. The data model the design needs, with mock seed data
7. AI features (`claude.complete`)
8. Feasibility notes for React Native
9. Proposed split for 4 engineers, by file ownership
- Appendix A: logo and onboarding SVGs, verbatim
- Appendix B: keyframes and transitions, verbatim

---

## 0. Conventions

- **Units.** CSS `px` maps to RN dp 1:1. The prototype frame is 390 wide. Fixed widths that equal `390 - 32` (358) are written as `W - 32` (W is the window width).
- **Safe areas.** The prototype reserves a status bar of **50px** at the top. Every `padding-top:50px`, `top:52px` or `top:54px` is relative to that bar. In RN, replace `50` with `insets.top` and keep the offset: for example, `top:52px` becomes `insets.top + 2`. At the bottom, the design leaves **30px** (sometimes 32 or 34) for the home indicator. Use `max(insets.bottom, 16)` in place of 30, and add any extra (34 becomes `insets.bottom + 4`). **(spec)**
- **Device chrome is not built.** That covers the bezel (`#0E0E10`, radius 62/52), the 9:41 status bar, the dynamic island (`#0B0B0C` 122×35) and the home indicator (134×5). Only the colour logic carries over: the status bar and home indicator are **white on `story` and `profile`** (`sbColor`/`hiColor`) and `#18181B` everywhere else. Set `StatusBar barStyle="light-content"` on Story and Profile, and `"dark-content"` elsewhere.
- **`style-active="…"`** is the `:active` pressed state, which the runtime applies as `!important`. In RN it maps to `Pressable` pressed styles: `scale(x)` becomes an animated `transform: [{scale}]`, and `background:X` becomes a pressed background.
- **`box-shadow: inset 0 0 0 1px C`** is a 1px inner ring, used as a border. In RN use `borderWidth: 1, borderColor: C`, or `boxShadow` with `inset` (§8).
- **Letter-spacing** is given in `em`. RN `letterSpacing` takes dp, so multiply by the font size. The converted values are in §2.
- **Line-height** is a unitless multiplier. RN needs absolute values, so multiply by the font size (see §2). Where the design sets none, omit `lineHeight`.
- **Icons.** `ph ph-NAME` means Phosphor **regular** NAME. `ph-fill ph-NAME` means Phosphor **fill** NAME. The CSS `font-size` is the icon size. Icons inherit the text colour unless a colour is given.
- **Images.** `pic(seed,w,h)` = `https://picsum.photos/seed/{seed}/{w}/{h}`, with defaults w=800 and h=600. Avatars come from `https://i.pravatar.cc/{size}?img={n}`.
- **Prototype navigation** has three verbs: `go(x)` pushes onto a stack, `back()` pops, and `tab(x)` sets the screen and clears the stack. §4 maps them onto `src/navigation/Navigator.tsx`.
- **Toast.** `flash(text)` shows a toast for **2200 ms**. A new toast replaces the current one. Each "→ toast" below is a call to `flash`.

---

## 1. Screen inventory

| # | Design screen | RN file (change, or NEW) | Route / tab | Notes |
|---|---|---|---|---|
| 01 | onboarding | `src/screens/WelcomeScreen.tsx` (rewrite) | route `Welcome` (keep) | 3-page pager; Skip / Next / Get started |
| 02 | login | `src/screens/SignInScreen.tsx` (rewrite) | route `SignIn` (keep) | inline errors on submit; Apple + Google buttons |
| 03 | register | `src/screens/SignUpScreen.tsx` (rewrite) | route `SignUp` (keep) | live password strength, terms checkbox |
| 04 | feed | `src/screens/HomeScreen.tsx` (rewrite) | tab `home` (keep key) | translucent header, stories rail, Brief card, posts |
| 05 | post | `src/screens/PostScreen.tsx` (rewrite) | route `Post` (keep; `focusComment` stays) | AI comment summary, comment composer |
| 06 | create | `src/screens/NewPostScreen.tsx` (rewrite) | route `NewPost`, presented as **modal** | add params `withPhoto?: boolean` |
| 07 | story | **NEW** `src/screens/StoryScreen.tsx` | **NEW** route `{ name: 'Story'; index: number }`, card | full-screen viewer, auto-advance |
| 08 | explore | **NEW** `src/screens/ExploreScreen.tsx` | **NEW** tab `explore` | search people, topics, groups, masonry |
| 09 | messages | **NEW** `src/screens/MessagesScreen.tsx` | **NEW** route `{ name: 'Messages' }` | active-now rail, chat list |
| 10 | chat | **NEW** `src/screens/ConversationScreen.tsx` | **NEW** route `{ name: 'Conversation'; chatId: string }` | smart replies, typing indicator. Not named `Chat`, because `ChatScreen.tsx` is the current Ask Harbor tab |
| 11 | notifications | `src/screens/ActivityScreen.tsx`, renamed in place to export `NotificationsScreen` | **NEW** route `{ name: 'Notifications' }` (no longer a tab) | AI one-line summary, friend request actions |
| 12 | brief | **NEW** `src/screens/BriefScreen.tsx` | **NEW** tab `brief` (replaces tab `chat`) | overview, Today/This week, Ask Harbor. Absorbs `ChatScreen.tsx` |
| 13 | profile | `src/screens/ProfileScreen.tsx` (rewrite) | tab `profile` (keep) | cover, Posts/Photos/About tabs |
| 14 | settings | `src/screens/SettingsScreen.tsx` (rewrite) | route `Settings` (keep) | title "Menu", AI toggles, privacy, Log out |

Existing files with no screen in the design:

- `src/screens/ChatScreen.tsx`: retire it. Its Ask Harbor behaviour moves into BriefScreen. Delete it after Brief ships, with `src/components/chat/*` and `src/data/chatReplies.ts`. `chatReplies.ts` may be mined for the offline Ask fallback (§7).
- `src/screens/MainTabs.tsx`: change the tab set to `home | explore | brief | profile`.
- `src/screens/UserProfileScreen.tsx` (route `User`) and `src/screens/EditProfileScreen.tsx` (route `EditProfile`): keep both. Restyle them with the new tokens only. The design's "Edit profile" only raises a toast. **(spec)** Push `EditProfile` from it instead.

`TabKey` in `src/navigation/TabBarContext.tsx` changes from `'home' | 'activity' | 'chat' | 'profile'` to `'home' | 'explore' | 'brief' | 'profile'`.

---

## 2. Tokens

### 2.1 Colour (every colour in the file)

| Token (proposed) | Value | Where it is used |
|---|---|---|
| `accent` | `#2F5BD3` | primary buttons, FAB, links, active tab underline, liked state, badges, my chat bubbles, unread dots, story ring (unseen), switch on |
| `accentInk` | `#2447AE` | accent text on soft or AI surfaces (Refresh, Full brief, tone chips, AI chips, audience chip, Add friend); `a:hover` |
| `accentSoft` | `#EEF2FD` | audience chip bg, "Add friend" bg; onboarding page 3 circle is `#EEF2FD` |
| `aiSurface` | `#F5F7FE` | AI cards (Brief, comment summary, Polish, notification summary), AI chips, unread notification row bg, Harbor's Ask bubbles |
| `aiBorder` | `#E1E8FB` | 1px ring on AI cards |
| `aiChipBorder` | `#DCE3F8` | 1px ring on white AI buttons and on AI chips |
| `shimmerBase` | `#E4EAFA` | shimmer gradient ends |
| `shimmerHi` | `#F8F9FE` | shimmer gradient middle |
| `ink` | `#18181B` | primary text, dark tab-bar pill, selected topic chip, unread chat text, bold names, status bar |
| `ink2` | `#27272A` | post body, comments, brief lines, notification text |
| `inkSoft` | `#3F3F46` | form labels, action-bar buttons, "I already have an account", toolbar labels, unselected topic text, active-now names |
| `sub` | `#52525B` | subtitles (16px auth copy), Brief card subtitle and caret, About icons, privacy icons, profile stats text, "Requested" / "Joined" text |
| `muted` | `#71717A` | meta text, Skip, eye toggle, overlines, timestamps (read) |
| `faint` | `#A1A1AA` | placeholders (global `::placeholder`), chevrons, "or" divider, disabled Post text, chat date stamp, Ask send (empty), disclaimer |
| `border` | `#D4D4D8` | inactive onboarding dots, seen story ring, checkbox border, disabled send buttons (comment, chat), empty-search icon; profile cover placeholder bg |
| `line` | `#E4E4E7` | card rings, divider lines, image placeholder bg, switch off, strength bar empty, social button border |
| `hairline` | `#F0F0F2` | row separators, action-bar top border, create header/footer borders, profile tab border |
| `fill` | `#F4F4F5` | inputs, soft buttons, feed 8px section dividers, comment bubbles, their chat bubbles, Settings canvas, "Coming up" tiles, pressed backgrounds |
| `pressed` | `#FAFAFA` | pressed Brief list row |
| `bg` | `#FFFFFF` (also written `#FFF` / `#fff`) | screens, cards, chips |
| `danger` | `#DC2626` | field errors, error borders, weak strength, Log out |
| `warning` | `#D97706` | "Fair" strength bars |
| `online` | `#22C55E` | online dots |
| `sunny` | `#F6B51B` | onboarding confetti only |
| `toastIcon` | `#8FB0FF` | toast check icon |
| `storyBg` | `#0B0B0C` | story backdrop; `rgba(11,11,12,…)` for story gradients |
| `frame` | `#0E0E10`, `#2C2C31` | device bezel only. Do not build. |

Alpha colours, verbatim:

- Ink-based `rgba(24,24,27,a)`, with a = `.06` (card hairline ring), `.05` (header hairline, brief card ring), `.3` (pill shadows), `.35` (cover gradient, settings button bg), `.5` (masonry chip bg, tab bar shadow, toast shadow), `.55` (frame), `.6` (photo-count badge, remove-photo button, story card gradient), `.9` (toast bg), `.12` (segmented thumb shadow), `.18` and `.1` (switch knob shadow).
- White-based `rgba(255,255,255,a)`, with a = `.92`, `.55`, `0` (feed header gradient); `.92`, `.5`, `0` (tab-bar gradient); `.82` (post and chat header); `.86` (post composer); `.88` (chat composer); `.72` (inactive tab icon); `.18` (button top highlight, settings button ring); `.2` (FAB highlight); `.08` (tab pill highlight, story input bg); `.1` (toast highlight); `.35` (story bar track); `.55` (story input border); `.9` (story avatar ring).
- Accent-based `rgba(47,91,211,.7)` (FAB shadow) and `rgba(47,91,211,.4)` (onboarding Brief card shadow).
- Story `rgba(11,11,12,.55)`, `rgba(11,11,12,0)` and `rgba(11,11,12,.6)`.

### 2.2 Typography

Family: **Geist**, at weights 400, 500, 600 and 700 (Google Fonts `Geist:wght@400;500;600;700`). Fallback `system-ui, sans-serif`. Global settings: `-webkit-font-smoothing: antialiased` and `font-feature-settings: 'tnum' 0` (proportional figures, which is the RN default).

RN family names (one family per weight, never set `fontWeight`, as with Outfit today): `Geist-Regular` (400), `Geist-Medium` (500), `Geist-SemiBold` (600), `Geist-Bold` (700).

Font sizes used: 10, 11.5, 12, 12.5, 13, 13.5, 14, 14.5, 15, 15.5, 16, 17, 18, 19*, 20*, 21*, 22, 23*, 24*, 26, 30, 31, 32, 34*. Starred sizes are icon sizes only.

Type ramp, verbatim. `ls` is letter-spacing in dp, and `lh` is line-height in dp.

| Role | Size / weight | CSS lh, ls | RN `lineHeight` / `letterSpacing` | Used for |
|---|---|---|---|---|
| `largeTitle` | 32 / 700 | normal, -0.045em | omit, or 38 **(spec)** / **-1.44** | Explore, Messages, Notifications, Brief, Menu |
| `obTitle` | 31 / 600 | 1.08, -0.035em | 33.5 / -1.085 | onboarding headlines (`text-wrap:balance`) |
| `authTitle` | 30 / 600 | 1.1, -0.035em | 33 / -1.05 | "Welcome back", "Create your account" |
| `profileName` | 26 / 700 | normal, -0.035em | omit / -0.91 | profile name |
| `composer` | 22 / 400 (17 when long) | 1.4, -0.01em | 30.8 / -0.22 (23.8 / -0.17 at 17) | create textarea |
| `wordmark` | 18 / 700 | -0.04em | – / -0.72 | "harbor" (onboarding) |
| `headerPill` | 18 / 600 | -0.03em | – / -0.54 | "Home" in feed header |
| `section` | 18 / 600 | -0.02em | – / -0.36 | "Groups for you", grid title, "Ask Harbor" |
| `navTitle` | 17 / 600 | -0.015em | – / -0.255 | "{First}'s post", "Create post" |
| `listHeader` | 17 / 600 | -0.02em | – / -0.34 | "New", "Earlier" |
| `chatName` | 17 / 600 | – | – | chat intro name |
| `cta` | 16 / 600 | -0.01em (onboarding only) | – / -0.16 | primary buttons |
| `lead` | 16 / 400 | 1.5 | 24 | auth and onboarding subcopy, `#52525B` |
| `input` | 16 / 400 | – | – | auth inputs |
| `rowTitle` | 16 / 600 | – | – | settings profile card name, chat header first name |
| `bodyLg` | 15.5 / 400 | 1.45 | 22.5 | post detail text |
| `searchInput` | 15.5 / 400 | – | – | search fields |
| `chatRowName` | 15.5 / 400 or 600 | – | – | messages list name |
| `body` | 15 / 400 | 1.45 | 21.75 | feed post text, profile bio, profile posts |
| `name` | 15 / 600 | -0.01em | – / -0.15 | post author, Brief card title |
| `bubble` | 15 / 400 | 1.38 | 20.7 | chat bubbles |
| `bodySm` | 14.5 / 400 | 1.42 | 20.6 | brief items, "What you missed" rows |
| `comment` | 14.5 / 400 | 1.4 | 20.3 | comment text, notification text |
| `ask` | 14.5 / 400 | 1.45 | 21 | Ask thread bubbles |
| `button14_5` | 14.5 / 600 | – | – | profile buttons and tabs, "Mark all read" |
| `button14` | 14 / 600 | – | – | action-bar buttons, Confirm/Delete, segmented labels, "Forgot password?" |
| `small` | 14 / 400 | 1.42–1.45 | 19.9–20.3 | notification summary, comment summary text, footers |
| `chip` | 13.5 / 600 (or 500 for AI chips) | – | – | tone chips, topic chips, Add friend, Reply |
| `label` | 13 / 600 | – | – | form labels `#3F3F46` |
| `overline` | 13 / 600 uppercase | ls .03em (PEOPLE: .02em) | – / 0.39 (0.26) | WHAT YOU MISSED, COMING UP, WAITING ON YOU, HARBOR AI, PRIVACY, PEOPLE |
| `meta` | 13 / 400 | – | – | timestamps, sub lines `#71717A` |
| `caption` | 12.5 / 400–600 | – | – | brief subtitle, story card names, comment meta |
| `micro` | 12 / 400–600 | – | – | photo-count badge, active-now names, date stamp, disclaimer (lh 1.45 = 17.4) |
| `tiny` | 11.5 / 400–600 | – | – | "AI · may miss context", "Only you see drafts", toolbar labels, masonry chips, onboarding card meta |

### 2.3 Radius (verbatim set)

`2, 3, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 17, 18, 20, 22, 24, 26, 31, 36, 52, 62, 67, 80, 999, 50%`.

Named **(spec)**:

| Name | Value | Used for |
|---|---|---|
| `xs` | 6 | shimmer lines |
| `chipSm` | 8 | audience chip |
| `btnSm` | 10 | 32px buttons |
| `btn` | 11 | 34–36px buttons |
| `md` | 12 | 40px buttons, segmented track |
| `input` | 14 | inputs, search |
| `lg` | 16 | 54px buttons, profile post image, masonry tile |
| `xl` | 18 | post images, story cards, comment bubble, settings tiles |
| `card` | 20 | AI cards, group cards, chat bubbles |
| `cardLg` | 22 | feed Brief card, header pills |
| `pill` | 999 | – |

### 2.4 Spacing (verbatim set)

Gaps: `2, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 18`. Paddings: `2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 16, 18, 20, 22, 24, 26, 28, 30, 34, 40`.

- Screen gutter is **16** in the app and **24** on the auth screens. Onboarding text uses **28**, onboarding buttons **20**.
- Feed sections are separated by an **8px `#F4F4F5` top border**.

### 2.5 Shadows (verbatim CSS, with RN mapping)

RN 0.87 runs the New Architecture, which supports the CSS-syntax `boxShadow` style prop, including spread and `inset`. Verify it on device. A legacy iOS fallback (`shadow*` props) is given in brackets **(spec)**.

| Token | CSS | Use |
|---|---|---|
| `pill` | `0 8px 24px -14px rgba(24,24,27,.3), inset 0 0 0 1px rgba(24,24,27,.06)` | feed header pills [offset 0/8, radius 10, opacity .12, plus a 1px border] |
| `chip` | `0 12px 30px -12px rgba(24,24,27,.3), inset 0 0 0 1px rgba(24,24,27,.06)` | onboarding "Hana and 23 others" chip |
| `obCard` | `0 24px 48px -24px rgba(47,91,211,.4), inset 0 0 0 1px rgba(24,24,27,.05)` | onboarding Brief card |
| `tabBar` | `0 18px 36px -16px rgba(24,24,27,.5), inset 0 1px 0 rgba(255,255,255,.08)` | dark tab pill |
| `fab` | `0 18px 36px -14px rgba(47,91,211,.7), inset 0 1px 0 rgba(255,255,255,.2)` | create FAB |
| `toast` | `0 12px 30px -10px rgba(24,24,27,.5), inset 0 1px 0 rgba(255,255,255,.1)` | toast |
| `knob` | `0 3px 8px rgba(24,24,27,.18), 0 1px 1px rgba(24,24,27,.1)` | switch knob |
| `thumb` | `0 1px 3px rgba(24,24,27,.12)` | segmented thumb |
| `btnHighlight` | `inset 0 1px 0 rgba(255,255,255,.18)` | primary buttons (top highlight) |
| `headerHairline` | `0 1px 0 rgba(24,24,27,.05)` | chat header bottom line |
| `composerHairline` | `0 -1px 0 rgba(24,24,27,.06)` | post composer top line |
| rings | `inset 0 0 0 1px #E4E4E7 / #E1E8FB / #DCE3F8`; `inset 0 0 0 1px rgba(255,255,255,.18)` | borders |
| avatar rings | `0 0 0 2px rgba(255,255,255,.9)` (story header); `0 0 0 2px #18181B` (active avatar tab) | outer rings |

### 2.6 Blur / materials (verbatim)

| Surface | CSS |
|---|---|
| Feed header zone (132 tall) | layer 1: `backdrop-filter: blur(16px) saturate(160%)` masked by `linear-gradient(180deg, #000 0%, #000 50%, transparent 100%)`; layer 2: `linear-gradient(180deg, rgba(255,255,255,.92) 0%, rgba(255,255,255,.55) 55%, rgba(255,255,255,0) 100%)` |
| Tab-bar zone (140 tall, bottom) | layer 1: `blur(16px) saturate(160%)` masked by `linear-gradient(0deg, #000 0%, #000 45%, transparent 100%)`; layer 2: `linear-gradient(0deg, rgba(255,255,255,.92) 0%, rgba(255,255,255,.5) 55%, rgba(255,255,255,0) 100%)` |
| Post header, chat header | `background: rgba(255,255,255,.82); backdrop-filter: blur(20px) saturate(180%)` |
| Post composer | `rgba(255,255,255,.86)` + `blur(20px) saturate(180%)` |
| Chat composer | `rgba(255,255,255,.88)` + `blur(20px) saturate(180%)` |
| Photo-count badge, remove-photo button, masonry chip, story input | `blur(10px)` |
| Toast, profile settings button | `blur(14px)` |

### 2.7 Motion

- Easings: `cubic-bezier(.16,1,.3,1)` (out-expo-like, "smooth"); `cubic-bezier(.34,1.56,.64,1)` ("spring", overshoot); `cubic-bezier(.34,1.3,.64,1)` (switch knob); `ease`; `linear`.
- RN: `Easing.bezier(0.16, 1, 0.3, 1)` etc.
- `prefers-reduced-motion: reduce` sets every animation and transition to 0.01ms. In RN, honour `AccessibilityInfo.isReduceMotionEnabled()` by setting durations to 0.

All keyframes and transitions are in Appendix B.

### 2.8 Proposed `src/theme.ts` (spec)

```ts
import { Easing, TextStyle } from 'react-native';

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
  onInkMuted: 'rgba(255,255,255,0.72)',
  toastBg: 'rgba(24,24,27,0.9)',
  scrim60: 'rgba(24,24,27,0.6)',
  scrim50: 'rgba(24,24,27,0.5)',
  scrim35: 'rgba(24,24,27,0.35)',
  barHeader: 'rgba(255,255,255,0.82)',
  barComposer: 'rgba(255,255,255,0.86)',
  barChat: 'rgba(255,255,255,0.88)',
} as const;

export const fonts = {
  regular: 'Geist-Regular',
  medium: 'Geist-Medium',
  semibold: 'Geist-SemiBold',
  bold: 'Geist-Bold',
} as const;

const t = (fontFamily: string, fontSize: number, lh?: number, em?: number, color: string = colors.ink): TextStyle => ({
  fontFamily, fontSize, color,
  ...(lh ? { lineHeight: Math.round(fontSize * lh * 100) / 100 } : null),
  ...(em ? { letterSpacing: Math.round(fontSize * em * 1000) / 1000 } : null),
});

export const type = {
  largeTitle: t(fonts.bold, 32, undefined, -0.045),
  obTitle: t(fonts.semibold, 31, 1.08, -0.035),
  authTitle: t(fonts.semibold, 30, 1.1, -0.035),
  profileName: t(fonts.bold, 26, undefined, -0.035),
  section: t(fonts.semibold, 18, undefined, -0.02),
  navTitle: t(fonts.semibold, 17, undefined, -0.015),
  listHeader: t(fonts.semibold, 17, undefined, -0.02),
  lead: t(fonts.regular, 16, 1.5, undefined, colors.sub),
  cta: t(fonts.semibold, 16, undefined, undefined, colors.onAccent),
  bodyLg: t(fonts.regular, 15.5, 1.45, undefined, colors.ink2),
  body: t(fonts.regular, 15, 1.45, undefined, colors.ink2),
  name: t(fonts.semibold, 15, undefined, -0.01),
  bubble: t(fonts.regular, 15, 1.38),
  bodySm: t(fonts.regular, 14.5, 1.42, undefined, colors.ink2),
  comment: t(fonts.regular, 14.5, 1.4, undefined, colors.ink2),
  button: t(fonts.semibold, 14),
  small: t(fonts.regular, 14, 1.45, undefined, colors.ink2),
  chip: t(fonts.semibold, 13.5),
  label: t(fonts.semibold, 13, undefined, undefined, colors.inkSoft),
  overline: { ...t(fonts.semibold, 13, undefined, 0.03, colors.muted), textTransform: 'uppercase' },
  meta: t(fonts.regular, 13, undefined, undefined, colors.muted),
  caption: t(fonts.regular, 12.5, undefined, undefined, colors.muted),
  micro: t(fonts.regular, 12, undefined, undefined, colors.muted),
  tiny: t(fonts.regular, 11.5, undefined, undefined, colors.muted),
} satisfies Record<string, TextStyle>;

export const radius = { xs: 6, chipSm: 8, btnSm: 10, btn: 11, md: 12, input: 14, lg: 16, xl: 18, card: 20, cardLg: 22, pill: 999 };
export const space = { xxs: 2, xs: 4, s6: 6, sm: 8, s10: 10, md: 12, s14: 14, lg: 16, s18: 18, s20: 20, s22: 22, xl: 24, s28: 28, gutter: 16, authGutter: 24 };

/** CSS-syntax shadows (New Architecture `boxShadow`). See §2.5 for fallbacks. */
export const shadow = {
  pill: '0 8px 24px -14px rgba(24,24,27,.3), inset 0 0 0 1px rgba(24,24,27,.06)',
  chip: '0 12px 30px -12px rgba(24,24,27,.3), inset 0 0 0 1px rgba(24,24,27,.06)',
  obCard: '0 24px 48px -24px rgba(47,91,211,.4), inset 0 0 0 1px rgba(24,24,27,.05)',
  tabBar: '0 18px 36px -16px rgba(24,24,27,.5), inset 0 1px 0 rgba(255,255,255,.08)',
  fab: '0 18px 36px -14px rgba(47,91,211,.7), inset 0 1px 0 rgba(255,255,255,.2)',
  toast: '0 12px 30px -10px rgba(24,24,27,.5), inset 0 1px 0 rgba(255,255,255,.1)',
  knob: '0 3px 8px rgba(24,24,27,.18), 0 1px 1px rgba(24,24,27,.1)',
  thumb: '0 1px 3px rgba(24,24,27,.12)',
  btnHighlight: 'inset 0 1px 0 rgba(255,255,255,.18)',
} as const;

export const blur = { header: 20, zone: 16, chip: 10, toast: 14 } as const; // saturate(160–180%) dropped in RN

export const ease = {
  smooth: Easing.bezier(0.16, 1, 0.3, 1),
  spring: Easing.bezier(0.34, 1.56, 0.64, 1),
  knob: Easing.bezier(0.34, 1.3, 0.64, 1),
  css: Easing.bezier(0.25, 0.1, 0.25, 1), // CSS `ease`
};
export const duration = { press: 200, pressSpring: 250, chip: 200, fade: 350, fadeSm: 300, fadeLg: 500, push: 450, rise: 500, pager: 620, toast: 450, toastHold: 2200, shimmer: 1200, dot: 1200 };

export const layout = {
  tabBar: { height: 62, side: 16, bottom: 30, gap: 10, pad: 7, itemH: 48, fab: 62 },
  feedHeaderZone: 132, tabZone: 140, headerPillH: 44,
};
export const hitSlop = { top: 10, bottom: 10, left: 10, right: 10 };
```

### 2.9 Differences from the current `src/theme.ts`

| Area | Current | New |
|---|---|---|
| Font | Outfit (Regular/Medium/SemiBold/Bold/ExtraBold) | **Geist** (Regular/Medium/SemiBold/Bold). There is no ExtraBold, so `fonts.heavy` is removed. As of this writing the Geist TTFs are already in `assets/fonts/` and linked in `ios/Harbor/Info.plist`, `project.pbxproj` and `android/app/src/main/assets/fonts/`. Outfit is still bundled; remove it at cleanup. |
| Canvas | warm `canvas #F6F4F0` | removed. Screens are `#FFFFFF`; Settings uses `#F4F4F5` |
| Ink | `#141414` | `#18181B` (zinc 900), with `ink2 #27272A` added |
| inkSoft | `#3A3A3C` | `#3F3F46` |
| muted | `#6E6E73` | `#71717A` |
| faint | `#A3A3A8` | `#A1A1AA` |
| line | `#E6E3DD` (warm) | `#E4E4E7` |
| lineSoft | `#EFECE7` | `hairline #F0F0F2` |
| fill | `#F1EFEA` | `#F4F4F5` |
| accent | `#2F6FE4` | **`#2F5BD3`** (cobalt) |
| accentSoft | `#EAF1FD` | `#EEF2FD`, plus new AI surfaces `#F5F7FE` / `#E1E8FB` / `#DCE3F8` |
| accentInk | `#1A3F8F` | `#2447AE` |
| danger | `#B8301F` | `#DC2626`; `warning #D97706` and `online #22C55E` are new |
| skyTop / skyBottom | onboarding sky wash | removed |
| `blob` palette | 6 glossy sphere tones | **removed**. There are no blob characters; avatars are photos. Only `#F6B51B` survives as onboarding confetti |
| Type | display 34/40 -0.9, hero 30/35 -0.8, body 16/23 | largeTitle 32 bold -1.44; body 15 / 21.75; see the ramp in §2.2 |
| Radius | sm 12 / md 16 / lg 22 / xl 30 | a finer set (§2.3); inputs 14, cards 20, images 18 |
| Shadow | warm-tinted `soft` / `lifted` | zinc/cobalt CSS shadows with negative spread (§2.5) |
| Tab bar | `TAB_BAR_HEIGHT 64`, `TAB_BAR_SIDE 20` (`src/navigation/insets.ts`) | **62** tall, **16** side inset, 30 from bottom, plus a separate 62×62 FAB |
| Materials | none | blur and gradient materials (§2.6) |

---

## 3. Screens

Each screen below has a structure listed top to bottom. Dimensions are `W×H`. `p` is padding and `m` is margin (CSS order: top right bottom left). `r` is radius. Text is given as `size/weight/colour`.

### 01 Onboarding → `WelcomeScreen.tsx`

**Container.** Absolute fill, column, `paddingTop 50 (insets.top)`, `paddingBottom 30`, bg `#FFFFFF`. Entrance: `hb-fade .5s ease`.

1. **Top bar.** Height 48, p `0 24`, row, `space-between`, centred.
   - Left: wordmark row, gap 8. Logo SVG at 30×30 (Appendix A), then text `harbor`, 18/700, ls -0.04em, `#18181B`.
   - Right: button `Skip`, 15/500 `#71717A`, p `8 4`. Tap goes to `register`.
2. **Pager.** `flex:1`, overflow hidden, `touch-action: pan-y`.
   - Track is 300% wide with 3 pages. `transform: translateX(-(ob*33.3333)%)`, with transition `transform .62s cubic-bezier(.16,1,.3,1)`.
   - Swipe: on pointer-up, `dx = upX - downX`. If `dx < -40` and `ob < 2`, go to `ob+1`. If `dx > 40` and `ob > 0`, go to `ob-1`. There is no drag-follow in the design.
   - Each page is a column: an **art box 390×350** (relative; children absolute, coordinates relative to the page), then a **text block** with p `14 28 0`:
     - `h1`: 31/600, lh 1.08, ls -0.035em, `#18181B`, `text-wrap:balance`.
     - `p`: margin-top 12, 16/400, lh 1.5, `#52525B`, `text-wrap:pretty`.
   - **Page 1 copy.** h1 `Stay close to the people you'd actually call.` p `Your feed shows friends, family, and the groups you've joined, in the order they posted.`
   - **Page 1 art.** Decorative SVG (Appendix A, "ob1"), then images, all with bg `#E4E4E7` and cover fit:
     - `https://picsum.photos/seed/hb-ob-picnic/400/620` at left 44, top 28, 160×250, r `80 80 28 28` (TL TR BR BL).
     - `https://picsum.photos/seed/hb-ob-harbour/400/400` at left 176, top 62, 148×148, circle, with a **6px white border** (box-sizing border-box).
     - `https://picsum.photos/seed/hb-ob-table/500/260` at left 208, top 226, 150×72, r 36.
     - Chip at left 150, bottom 12. Row, gap 8, p `7 13 7 7`, bg `#FFFFFF`, r 999, shadow `chip`, 13/500. It holds a 24px circle `#2F5BD3` containing `ph-fill heart` 12 white, then the text `Hana and 23 others`.
   - **Page 2 copy.** h1 `Share the whole album, not just one good shot.` p `Post up to 20 photos at once, tag friends, and choose who sees each post.`
   - **Page 2 art.** SVG "ob2", then:
     - `…/hb-ob-coast/520/640` at left 36, top 34, 176×214, r 36.
     - `…/hb-ob-market/400/220` at left 222, top 34, 134×74, r `67 67 0 0`.
     - `…/hb-ob-bike/400/400` at left 222, top 114, 134×134, circle.
     - `…/hb-ob-bread/400/220` at left 36, top 256, 176×66, r `0 0 33 33`.
     - Tile at left 222, top 258, 134×62, r 31, bg `#2F5BD3`. Row, centred, gap 8, white 14/600: `ph images` 18, then `12 photos`.
   - **Page 3 copy.** h1 `Catch up in thirty seconds.` p `Harbor Brief summarizes what you missed across posts, comments, and messages. Turn it off anytime.`
   - **Page 3 art.** SVG "ob3" (includes the r150 `#EEF2FD` circle), then:
     - `…/hb-ob-hike/300/300` at left 30, top 40, 84×84, circle, 5px white border.
     - Centred card (left 50%, top 50%, translate -50%), width 278, bg white, r 26, p 16, shadow `obCard`.
       - Header row: gap 9, mb 12. A 28 circle `#2F5BD3` holding `ph-fill sparkle` 15 white. Beside it, `Harbor Brief` 14/600 over `Since 7:40 AM · 23 posts` 11.5 `#71717A`.
       - Lines: column, gap 10, 13/400, lh 1.35, `#3F3F46`. Each row has gap 8 and a 20px circle avatar:
         - `https://i.pravatar.cc/80?img=32` with `Ines shared her pastéis de nata recipe.`
         - `…?img=12` with `Tomasz's library survey closes Wednesday.`
         - `…?img=45` with `Priya's hike is today's most-liked post.`
3. **Dots.** Row, gap 6, p `0 28 20`. Each dot is height 6 and r 3. Width is **22 when active** and 6 otherwise. Bg is `#2F5BD3` when active and `#D4D4D8` otherwise. Transition `all .45s cubic-bezier(.16,1,.3,1)`, which animates the width.
4. **Buttons.** Column, gap 6, p `0 20`.
   - Primary: height 56, r 999, bg `#2F5BD3`, white 16/600 ls -0.01em, shadow `btnHighlight`. Pressed `scale(.98)` (transform .2s smooth). Label `Next`, or `Get started` when `ob===2`. Tap: if `ob<2`, go to `ob+1`; otherwise go to `register`.
   - Secondary: height 44, 15/500 `#3F3F46`, `I already have an account`. Goes to `login`.

**State.** `ob: 0|1|2`.

**(spec)** For RN, use a horizontal `ScrollView` with `pagingEnabled` (this gives drag-follow). Keep `ob` in sync from `onMomentumScrollEnd`, and have Next call `scrollTo({x: ob*W})`. Alternatively use a `PanResponder` with the 40px threshold and `Animated.timing` 620ms with `ease.smooth`.

### 02 Login → `SignInScreen.tsx`

**Container.** Scroll, p `50 24 30`, column. Entrance `hb-push .45s cubic-bezier(.16,1,.3,1)`.

1. Logo SVG at 56×56, margin-top 34.
2. `h1` `Welcome back`, m `26 0 8`, `authTitle` (30/600, lh 1.1, ls -0.035em).
3. `p` `Sign in to see what your people have been up to.`, m `0 0 28`, 16/400, lh 1.5, `#52525B`.
4. Fields: column, gap 18. Each field is a column with gap 8.
   - Label 13/600 `#3F3F46`.
   - Input: height 52, r 14, bg `#F4F4F5`, **border 1.5** (`transparent`, or `#DC2626` on error; transition `border-color .2s`), p `0 16`, 16px text, placeholder colour `#A1A1AA`.
   - **Email.** Label `Email`. Placeholder `noor@haddad.studio`, `type=email`.
   - **Password.** Label `Password`. Placeholder `At least 8 characters`. Padding-right 50. An eye button sits absolute at right 6, top 6: 40×40, icon 20 `#71717A`, `ph eye`, or `ph eye-slash` while shown. It toggles `show`.
   - Error row: 13/400 `#DC2626`, row, gap 6, `ph warning-circle` (13), then the message.
     - Email: `Enter a valid email address.`
     - Password: `Password must be at least 8 characters.`
5. `Forgot password?` is right-aligned with m `12 0 22`, 14/600 `#2F5BD3`. It toasts `Reset link sent to your email`.
6. Primary button: height 54, r 16, bg `#2F5BD3`, white 16/600, shadow `btnHighlight`. Label `Sign in`, or `Signing in…` while loading (opacity 0.7, transition `.2s`). Pressed scale .98.
7. Divider: row, gap 12, m `24 0`. A 1px `#E4E4E7` line (`flex:1`) on each side of `or`, which is 13 `#A1A1AA`.
8. Social buttons: column, gap 10. Each is height 52, r 16, border 1.5 `#E4E4E7`, row centred, gap 10, 15/600 `#18181B`, pressed scale .98. Icon size 20.
   - `ph-fill apple-logo` with `Continue with Apple`.
   - `ph google-logo` with `Continue with Google`.
   - Both run `tab('feed')` and toast `Signed in as Noor`.
9. Spacer: `flex:1`, minHeight 20.
10. Footer: centred, 14.5 `#52525B`, `New to Harbor? ` followed by the button `Create account` (600 `#2F5BD3`). It goes to `register`.

**State.** `login {email, pw, show, err:{email?,pw?}, loading}`.

**Behaviour (`submitLogin`).**
- Validation runs **only on submit**. `email` must match `/^\S+@\S+\.\S+$/`, and `pw.length >= 8`. Errors are set together. Typing in a field clears **that** field's error.
- If valid: `loading=true` for **900 ms**. Then clear `pw`, set `loading=false`, run `tab('feed')`, and toast `Signed in as Noor`.
- **(spec)** In RN, call `AuthContext` sign-in. The toast uses the user's first name. Map the "Continue with Google" button to the existing Google sign-in. "Continue with Apple" is an owner decision (§8).

### 03 Register → `SignUpScreen.tsx`

**Container.** Same as login (p `50 24 30`, `hb-push`).

1. Back button: m `4 0 0 -10`, 44×44, `ph caret-left` 24. It runs `back()`.
2. `h1` `Create your account`, m `14 0 8`, `authTitle`.
3. `p` `Use the name your friends know you by.`, m `0 0 26`, `lead`.
4. Fields: column, gap 18. Same field style as login, but with no error icon and the error text 13 `#DC2626` alone.
   - `Full name`: placeholder `Noor Haddad`. Error `Enter your name.`
   - `Email`: placeholder `noor@haddad.studio`. Error `Enter a valid email address.`
   - `Password`: secure, placeholder `At least 8 characters`, no eye toggle. Below it is a **strength row**: row, centred, gap 10.
     - Bars: `flex:1`, 4 equal columns, gap 4. Each bar is height 4, r 2, with transition `background .3s`.
     - Label: 12.5 `#71717A`, minWidth 44, right-aligned.
     - Error `Use at least 8 characters.`
   - **Terms checkbox** (the whole row is a button): row, `align-items:flex-start`, gap 12, 14/400, lh 1.45, `#52525B`.
     - Box: 22×22, r 7, border 1.5. Bg `#2F5BD3` if agreed, else `#FFFFFF`. Border `#2F5BD3` if agreed, `#DC2626` if errored, else `#D4D4D8`. Transition `all .2s`. Inside is `ph check` 13 white, always rendered and visible only on blue.
     - Text: `I agree to the Terms and Privacy Policy. Harbor never sells your data.`
   - Terms error: `Please accept the terms to continue.`, 13 `#DC2626`, margin-top -8.
5. Spacer: `flex:1`, minHeight 24.
6. Primary button (as login): `Create account`, or `Creating account…` with opacity .7.
7. Footer: margin-top 18, centred, 14.5 `#52525B`, `Already have an account? ` followed by `Sign in` (600 `#2F5BD3`). It goes to `login`.

**Strength.**
- `score` starts at 0. Add 1 each for `pw.length>=8`, `/[A-Z]/`, `/\d/` and `/[^A-Za-z0-9]/`.
- Bar `i` is coloured when `i < score`: `#DC2626` if `score<2`, `#D97706` if `score<3`, else `#2F5BD3`. Otherwise it is `#E4E4E7`.
- Label: `''` when the password is empty, else `['Weak','Weak','Fair','Good','Strong'][score]`.

**Submit (`submitReg`).**
- Errors: `name.trim().length<2`, an email that fails the regex, `pw.length<8`, and `!agree`. Editing a field (or toggling the box) clears its error.
- If valid: loading for **1000 ms**, then `tab('feed')` and toast `Welcome to Harbor, {first word of name}`.

### 04 Feed → `HomeScreen.tsx` (tab `home`)

**Container.** Absolute fill. Entrance `hb-fade .35s ease`. The scroll fills the screen with p `110 0 130` (the top clears the floating header, the bottom clears the tab bar). **(spec)** Use `insets.top + 60` at the top and the tab clearance at the bottom.

Scroll content, top to bottom:

1. **Composer row.** Row, centred, gap 10, p `2 16 14`.
   - My avatar 40, circle, `https://i.pravatar.cc/160?img=47`.
   - Pill button: `flex:1`, height 40, r 20, bg `#F4F4F5`, left-aligned, p `0 16`, 15/400 `#71717A`, text `What's on your mind, Noor?` (use `me.firstName`). Pressed scale .98. Goes to `create`.
   - Photo button: 40×40, `ph image-square` 23 `#2F5BD3`. It goes to `create` **with a placeholder photo pre-attached** (`pic('hb-draft-'+(Date.now()%97),900,675)`).
2. **Stories rail.** Horizontal scroll, gap 8, p `0 16 16`.
   - **Create story card.** 104×172, r 18, overflow hidden, bg white, ring `#E4E4E7`, pressed scale .96 (transform .25s smooth). Goes to `create`.
     - Image `https://i.pravatar.cc/300?img=47`, full width, height 118, cover.
     - Plus badge: absolute, centred horizontally, top 102, 32×32 circle, bg `#2F5BD3`, 3px white border, `ph plus` 16 white.
     - Label `Create story`: absolute bottom 12, centred, 12.5/600 `#18181B`.
   - **Story card** (×5, from `stories`). 104×172, r 18, bg `#E4E4E7`, pressed scale .96.
     - Image `pic(seed,300,500)` covers the card.
     - Overlay `linear-gradient(180deg, rgba(24,24,27,0) 45%, rgba(24,24,27,.6) 100%)`.
     - Avatar: 36 circle at top 8, left 8, with a **3px border**: `#2F5BD3` when unseen, `#D4D4D8` when seen.
     - Name: first name, absolute left/right/bottom 10, white 12.5/600, left-aligned.
     - Tap runs `openStory(i)`.
3. **Harbor Brief card.** Shown only when `set.brief` (the Settings toggle "Brief in your feed").
   - Section: border-top **8 `#F4F4F5`**, p `14 16`.
   - Card: r 22, bg `#F5F7FE`, ring `#E1E8FB`, p `14 14 12`.
   - **Header button** (full width, toggles `briefOpen`, default `true`): row, gap 10.
     - A 32 circle `#2F5BD3` holding `ph-fill sparkle` 17 white.
     - Text column: `Harbor Brief` 15/600 ls -0.01em, over `While you were away · 23 posts` 12.5 `#52525B`.
     - `ph caret-down` 18 `#52525B`, rotated **180°** when open. Transition `transform .4s smooth`.
   - **Body** (when open): margin-top 12, column, gap 11, `hb-fade .3s ease`.
     - **Loading:** 3 shimmer lines, column, gap 9, p `4 0`. Each is height 12 and r 6. Widths are 100%, 86% and 64%.
     - **Ready:** `briefItems`. Each row has gap 9, `align-items:flex-start`, 14.5/400, lh 1.42, `#27272A`, and a 22 circle avatar with margin-top 1.
     - **Footer row** (gap 6, margin-top 2):
       - `Refresh` button: height 32, p `0 12`, r 10, bg white, ring `#DCE3F8`, gap 6, 13/600 `#2447AE`, `ph arrow-clockwise` before the label. Pressed .96. Runs `regenBrief` (AI, §7).
       - `Full brief` button: height 32, p `0 12`, r 10, gap 4, 13/600 `#2447AE`, with `ph arrow-right` **after** the label. Runs `tab('brief')`.
       - `AI · may miss context`: margin-left auto, 11.5 `#71717A`.
4. **Posts** (`feedPosts`, from the `PostCard` component in §5). Each is an `article` with p `14 0 4` and border-top **8 `#F4F4F5`**.
   - **Header.** Row, gap 10, p `0 16`.
     - Avatar 40, bg `#E4E4E7`.
     - Column: name 15/600 ls -0.01em. Meta row (gap 4, 13 `#71717A`): `{time} · {place}`, then `ph users` 13 (audience glyph).
     - More button: 36×36, `ph dots-three` 20 `#71717A`. Toasts `Post saved`.
   - **Text** (if any): m `10 16 0`, 15/400, lh 1.45, `#27272A`, `text-wrap:pretty`. Tap opens the post.
   - **Images** (if any): margin-top 12, horizontal scroll, gap 6, p `0 16`, scroll-snap `x mandatory` with `scroll-padding 0 16`.
     - Each image: width **358 for one image** (`W-32`), **296 when there are several**; `aspect-ratio` = the post's `ratio` (`4/3` or `4/5`); r 18; bg `#E4E4E7`; snap-align start.
     - **Double-tap** an image to toggle like (it calls `like()`, which toggles).
     - **Photo-count badge** (multi only): absolute top 10, right 26, p `4 9`, r 999, bg `rgba(24,24,27,.6)`, blur 10, white 12/600. Text: `{n} photos`.
   - **Counts row.** Row, `space-between`, p `12 16 6`, 13 `#71717A`.
     - Left: an 18 circle `#2F5BD3` holding `ph-fill heart` 10 white, gap 6, then `likesText`, which is `likes.toLocaleString('en-US')` (e.g. `1,208`).
     - Right: button `{comments, en-US grouped} comments · {shares} shares`, 13 `#71717A`. Opens the post.
   - **Action bar.** Row, m `0 8`, border-top 1 `#F0F0F2`, padding-top 2. It holds 3 buttons, each `flex:1`, height 42, r 10, row centred, gap 7, 14/600, with a 20 icon.
     - **Like:** `ph heart`, or `ph-fill heart` when liked. Colour `#2F5BD3` when liked, else `#3F3F46`. Label `Like` or `Liked`. Pressed: scale .92 and bg `#F4F4F5`. Transition `transform .25s cubic-bezier(.34,1.56,.64,1), background .15s`.
     - **Comment:** `ph chat-circle`, label `Comment`, `#3F3F46`. Pressed bg `#F4F4F5`. Opens the post.
     - **Share:** `ph share-fat`, label `Share`. Toasts `Link copied`.
5. **End cap.** Border-top 8 `#F4F4F5`, p `28 24`, centred, 14 `#71717A`: `You're all caught up from the last 24 hours.`

**Floating header** (over the scroll, `pointer-events:none` except the pills):
- Material layers: 132 tall, z 20/21 (§2.6 "Feed header zone").
- Pill row: absolute top **52**, left/right 16, height 44, z 22, row, `space-between`.
  - **Left pill** (not tappable): row, gap 8, height 44, p `0 16 0 6`, r 22, bg `#FFFFFF`, shadow `pill`. Logo at 32×32, then `Home` 18/600 ls -0.03em.
  - **Right group** (gap 8):
    - **Bell pill:** height 44, minWidth 44, p `0 14`, r 22, bg white, shadow `pill`, row, gap 6. `ph bell` 21, plus the unread count `4` (14/600) when `unread > 0`. Pressed scale .94 (transform .2s). Goes to `notifications`.
    - **Messages button:** 44×44 circle, bg white, shadow `pill`, `ph chat-circle-dots` 21. A **dot** sits at top 8, right 9: 9×9, `#2F5BD3`, with a 2px white border (content-box, so 13 total). The dot is **always shown**. Pressed .94. Goes to `messages`.

**State.** `posts`, `seen{}`, `briefOpen` (default true), `briefLoading`, `brief[]`, `set.brief`.
- `unread = allRead ? 0 : notifs.filter(n=>n.fresh).length`, which is 4 at seed.

### 05 Post detail → `PostScreen.tsx`

**Container.** Bg white, entrance `hb-push .45s smooth`. The scroll fills the screen with p `98 0 110`.

1. **Author row.** Row, gap 10, p `6 16 0`.
   - Avatar 40.
   - Name 15/600 over `{time} · {place}` 13 `#71717A`.
   - There is no audience icon and no more button.
2. **Text** (if any): m `10 16 0`, **15.5**/400, lh 1.45, `#27272A`.
3. **Images:** horizontal snap row, gap 6, p `12 16 0`, with the same widths, ratios and radius as the feed, and double-tap to like. There is **no count badge**.
4. **Action row.** Row, m `10 8 0`, border-top **and** border-bottom 1 `#F0F0F2`. Each button is `flex:1`, height 42, row centred, gap 7, 14/600, with a 20 icon. Press: scale .92 with the spring transition.
   - Like: heart (regular, or fill when liked) and **`likesText`** (e.g. `214`). Colour as in the feed.
   - Comment: `ph chat-circle` and the **comment count number**. Focuses the comment input.
   - Share: `ph share-fat` and the **share count number**. Toasts `Link copied`.
5. **Comment summary** (when `set.csum`): m `14 16 6`, r 20, bg `#F5F7FE`, ring `#E1E8FB`, p `13 14`.
   - Header: row, gap 8, mb 8.
     - `ph-fill sparkle` 17 `#2F5BD3`.
     - `Comment summary` 13.5/600.
     - `· {comments} comments` 12.5 `#71717A`.
     - Refresh button at margin-left auto: 30×30, r 9, bg white, ring `#DCE3F8`, `ph arrow-clockwise` 16 `#2447AE`. Runs `sumComments` (AI, §7).
   - **Loading:** 2 shimmer lines (height 11, r 6, widths 100% and 72%, gap 8, p `4 0`).
   - **Ready:** `p` 14/400, lh 1.45, `#27272A`, showing `cSum[pid]`, or `Tap refresh to summarize this thread.` when there is none.
6. **Sort row.** Row, `space-between`, p `12 16 4`. `Most relevant` 15/600, then `ph caret-down` `#71717A`. Inert.
7. **Comments.** Column, gap 4. Each comment is a row with gap 10, p `6 16`, `hb-fade .35s ease`.
   - Avatar 34.
   - Content column (`flex:1`):
     - **Bubble:** inline-block (`alignSelf:'flex-start'`, maxWidth 100%), bg `#F4F4F5`, r 18, p `8 13 9`. Name 13.5/600, then text 14.5/400, lh 1.4, `#27272A`.
     - **Meta row:** row, gap 16, p `4 12 0`, 12.5/500 `#71717A`.
       - `{time}`.
       - `Like` (600). `#2F5BD3` when liked, else `#71717A`. Toggles the comment like and its count.
       - `Reply` (600). Sets the draft to `@{First} ` and focuses the input.
       - When likes > 0: at margin-left auto, row, gap 4, `ph-fill heart` `#2F5BD3` and `{likes}`.

**Header bar** (absolute top, z 20): height 98, p `50 8 0`, row centred, gap 2, bg `rgba(255,255,255,.82)` with blur 20 saturate 180%.
- Back: 44×44, `ph caret-left` 24.
- Title: `{First}'s post`, 17/600, ls -0.015em.

**Composer** (absolute bottom, z 20): p `10 12 30`, row centred, gap 10, bg `rgba(255,255,255,.86)` with blur 20 saturate 180%, top hairline `0 -1px 0 rgba(24,24,27,.06)`.
- My avatar 34.
- Input: `flex:1`, height 40, r 20, bg `#F4F4F5`, no border, p `0 16`, 15px. Placeholder `Write a comment…`. **Enter submits.**
- Send: 40 circle, `ph-fill paper-plane-right` 19 white. Bg `#2F5BD3` when the trimmed draft is non-empty, else `#D4D4D8`. Transition `background .2s, transform .2s`. Pressed scale .9.

**Behaviour.**
- `addComment` ignores an empty draft. Otherwise it appends `{who:'me', text, time:'Just now', likes:0}`, increments the post's `comments`, and clears the draft.
- **(spec)** Keep `focusComment` route param support. The composer rides the keyboard (the existing `useKeyboard`).

### 06 Create post → `NewPostScreen.tsx` (modal)

**Container.** Bg white, column, `paddingTop 50`. Entrance `hb-rise .5s smooth` (translateY 56 to 0, with a fade).

1. **Header.** Height 52, p `0 12`, border-bottom 1 `#F0F0F2`, row, `space-between`.
   - Close: 40×40, `ph x` 22. Runs `back()`.
   - Title `Create post`, 17/600, ls -0.015em.
   - `Post` button: height 34, p `0 16`, r 12, 15/600. When it can post, bg `#2F5BD3` and text `#FFFFFF`; otherwise bg `#F4F4F5` and text `#A1A1AA`. Transition `all .2s`. Pressed scale .95.
     - `canPost = draft.text.trim() || draft.photo`.
2. **Body.** Scroll, `flex:1`, p `16 16 20`.
   - **Author row** (gap 10):
     - Avatar 44.
     - Column: `Noor Haddad` 15/600, then the **audience chip**: margin-top 3, height 26, p `0 10`, r 8, bg `#EEF2FD`, text `#2447AE` 12.5/600, row, gap 5. It holds the audience icon, the label, then `ph caret-down`. Tap cycles the audience:
       - 0 = `Friends` with `ph users`
       - 1 = `Public` with `ph globe-hemisphere-west`
       - 2 = `Close friends` with `ph star`
   - **Textarea:** margin-top 14, rows 5 (multiline; **(spec)** minHeight ≈ 5 lines), no border, transparent.
     - Font size **22 while `text.length < 90` and there is no photo**, else **17**. lh 1.4, ls -0.01em.
     - Placeholder `What's on your mind, Noor?`.
   - **Undo** (when `prevText` is set): `Undo AI edit`, 13/600 `#2F5BD3`, row, gap 5, with `ph arrow-counter-clockwise`, mb 10. Restores `prevText`.
   - **Photo** (when there is a draft photo): mb 14, `hb-fade .35s`.
     - Image: full width, aspect 4/3, r 18, bg `#E4E4E7`.
     - Remove button: absolute top 10, right 10, 32 circle, bg `rgba(24,24,27,.6)` with blur 10, `ph x` 16 white.
   - **Polish card:** r 20, bg `#F5F7FE`, ring `#E1E8FB`, p `13 14`.
     - Header row (gap 8): `ph-fill sparkle` 17 `#2F5BD3`, then `Polish with Harbor` 14/600, then `Only you see drafts` 11.5 `#71717A` at margin-left auto.
     - Tone row (gap 8, margin-top 11). Each tone button is height 34, p `0 13`, r 11, bg white, ring `#DCE3F8`, 13.5/600 `#2447AE`, gap 6, pressed .95.
       - `Clearer` with `ph text-align-left`
       - `Warmer` with `ph sun`
       - `Shorter` with `ph arrows-in-line-horizontal`
       - While a polish runs, the **other** tones get opacity 0.5.
     - While polishing: one shimmer bar, margin-top 12, height 10, r 5.
3. **Toolbar.** 4 equal columns, p `8 8 34`, border-top 1 `#F0F0F2`. Each item is height 56, a centred column, gap 4, 11.5/500 `#3F3F46`, r 12, pressed bg `#F4F4F5`. Icons are 24.
   - `ph image-square` (`#2F5BD3`), `Photo`. Attaches `pic('hb-draft-'+(Date.now()%97),900,675)`.
   - `ph user-plus`, `Tag`. Toasts `Tagging opens your friends list`.
   - `ph map-pin`, `Place`. Toasts `Location added: Rotterdam`.
   - `ph chart-bar-horizontal`, `Poll`. Toasts `Polls are coming soon`.

**State.** `draft {text, photo|null, aud:0|1|2}`, `prevText|null`, `polishing: tone|null`.

**Behaviour.**
- **polish(tone):**
  - If the text is empty, toast `Write something first`.
  - If a polish is already running, ignore the tap.
  - Otherwise call the AI (§7). On success, set `prevText = original` and `text = output with leading/trailing quotes stripped`. On error, toast `Couldn't reach Harbor AI`.
- **submitPost:**
  - Needs text or a photo.
  - Prepends `{who:'me', time:'Just now', place:'Rotterdam', text, imgs: photo?[photo]:[], ratio:'4/3', likes:0, comments:0, shares:0}`.
  - Resets the draft, runs `tab('feed')`, and toasts `Posted to {Friends|Public|Close friends}`.
- **(spec)**
  - In Firebase mode the Photo button opens the real picker (`react-native-image-picker`, already used). Demo mode attaches a placeholder.
  - Keep the existing upload-progress path in `createPost`.
  - Audience and place are new fields (§6).
  - Keep `initialText` and add `withPhoto`.

### 07 Story → NEW `StoryScreen.tsx`

**Container.** Bg `#0B0B0C`, entrance `hb-fade .3s ease`. Status bar and home indicator are white.

1. Image: `pic(seed,780,1688)`, absolute fill, cover.
2. Gradient: `linear-gradient(180deg, rgba(11,11,12,.55) 0%, rgba(11,11,12,0) 22%, rgba(11,11,12,0) 70%, rgba(11,11,12,.6) 100%)`.
3. **Tap zones:** left **35%** (previous) and right **65%** (next), both from top 110 to bottom 110.
4. **Progress bars:** absolute top **54**, left/right 10, row, gap 4. One bar per story: `flex:1`, height 3, r 2, track `rgba(255,255,255,.35)`, overflow hidden. The fill is white, `transform-origin:left`, `scaleX(v)`, where v = 1 for past stories, `prog` for the current one and 0 for later ones.
5. **Header:** absolute top **68**, left 12, right 6, row, gap 10, white.
   - Avatar 36 with ring `0 0 0 2px rgba(255,255,255,.9)`.
   - Name 14.5/600, then time 13 at opacity .75, margin-left 8.
   - Close: 40×40, `ph x` 24. Runs `back()`.
6. **Footer:** absolute bottom **32**, left/right 12, row, gap 10.
   - Reply input: `flex:1`, height 44, r 22, border 1.5 `rgba(255,255,255,.55)`, bg `rgba(255,255,255,.08)` with blur 10, p `0 18`, white 15px. Placeholder `Reply to {First}…` (placeholder colour is the global `#A1A1AA`).
   - Like: 44×44, icon 26 white, `ph heart`, or `ph-fill heart` when liked. Toggles `storyLiked[story]`. Pressed scale .85, transition `transform .3s cubic-bezier(.34,1.56,.64,1)`.
   - Send: 44×44, `ph paper-plane-tilt` 24 white. If the reply is non-empty, clear it and toast `Reply sent`. Enter in the input does the same.

**Timing.**
- A 55 ms interval adds 0.011 to `prog` while the screen is `story`. That is 91 ticks, or about **5.0 s per story**.
- When `prog` reaches 1, call `nextStory()`:
  - Mark the current story seen (the ring turns grey in the feed).
  - If there is a next story, advance and reset `prog` to 0.
  - Otherwise, `back()` if the viewer was pushed, else wrap to 0.
- `prevStory`: `story = max(0, story-1)`, `prog = 0`. It does not mark anything seen.
- `openStory(i)`: `story = i`, `prog = 0`, then `go('story')`.
- **(spec)** Use `Animated.timing(progress, {toValue:1, duration:5000, easing:Easing.linear, useNativeDriver:true})` with `transformOrigin:'left'`, and restart it on index change. Pause while the app is backgrounded. Optionally pause while the reply input is focused or on long-press; the design does not specify this. Prefetch the next image.

### 08 Explore → NEW `ExploreScreen.tsx` (tab `explore`)

**Container.** Scroll, p `50 0 100`, `hb-fade .35s`. There is no translucent header.

1. Title: p `10 16 0`, `Explore`, 32/700, ls -0.045em.
2. **Search:** m `12 16 0`, relative.
   - `ph magnifying-glass` 19 `#71717A`, absolute left 14, top 12.
   - Input: height 44, r 14, bg `#F4F4F5`, p `0 16 0 42`, 15.5px. Placeholder `Search people, groups, posts`.
3. **Searching** (`q.trim()` non-empty): p `18 16 0`.
   - Overline `PEOPLE`, 13/600 `#71717A`, ls .02em, mb 6.
   - Results: every person except me whose `name.toLowerCase()` includes the query. Each row has gap 12, p `9 0`, `hb-fade .3s`.
     - Avatar 48.
     - Name 15/600 over `{mutual} mutual friends` 13 `#71717A`.
     - Button: height 34, p `0 14`, r 11, 13.5/600, transition all .2s, pressed .95. Toggles `added[k]` with no toast.
       - Default: `Add friend`, bg `#EEF2FD`, text `#2447AE`.
       - Added: `Requested`, bg `#F4F4F5`, text `#52525B`.
   - **Empty** (no matches): p `40 12`, centred.
     - `ph magnifying-glass` 34 `#D4D4D8`.
     - `No one matches "{q}"`, margin-top 10, 16/600.
     - `Try a first name, or search a group.`, margin-top 4, 14 `#71717A`.
4. **Browsing** (empty query):
   - **Topic chips:** horizontal, gap 8, p `14 16 4`. Each chip is height 34, p `0 14`, r 17, 13.5/600, transition all .2s.
     - Selected: bg `#18181B`, text `#FFFFFF`.
     - Unselected: bg `#F4F4F5`, text `#3F3F46`.
     - Topics: `For you`, `Home bakers`, `Trail reports`, `Film photography`, `Rotterdam`, `Ceramics`. Default 0.
   - **Section header:** row, baseline, `space-between`, p `18 16 10`. `Groups for you` 18/600 ls -0.02em, then `See all` 14/600 `#2F5BD3` (inert).
   - **Groups rail:** horizontal snap (x mandatory), gap 10, p `0 16 4`.
     - Card: width 244, r 20, overflow hidden, ring `#E4E4E7`.
     - Image: `pic(seed,500,230)`, full width, height 112.
     - Body: p `11 12 12`, row, gap 10.
       - Text column: name 14.5/600, one line with ellipsis, over members 12.5 `#71717A`.
       - Button: height 32, p `0 13`, r 10, 13/600, pressed .95. Default `Join` (bg `#2F5BD3`, white). Joined: `Joined` (bg `#F4F4F5`, `#52525B`).
     - Joining toasts `Joined {name}`. Tapping again unjoins silently.
   - **Grid title:** p `22 16 10`, 18/600 ls -0.02em. `Photos from friends` when the topic is 0, else the topic's name.
   - **Masonry:** 2 columns, column gap 8, p `0 16`. Tiles are not tappable.
     - Each tile: mb 8, r 16, overflow hidden. The image is full width at its listed height (§6), cover, bg `#E4E4E7`.
     - Author chip: absolute left 8, bottom 8, row, gap 6, p `3 8 3 3`, r 999, bg `rgba(24,24,27,.5)` with blur 10, white 11.5/600. It holds an 18 avatar and the first name.
     - Image URL: `pic('{seed}-{topic}', 400, height*2)`, so changing the topic swaps every photo.
     - Column fill (the CSS `column-count` balance): left column gets tiles **a, b, c, d**; right column gets **e, f, g, h**.

### 09 Messages → NEW `MessagesScreen.tsx`

**Container.** Bg white, scroll, p `50 0 40`, `hb-push`.

1. Top row: p `4 8 0`, `space-between`.
   - Back: 44, `ph caret-left` 24.
   - New: 44, `ph note-pencil` 22. Toasts `Pick a friend to message`.
2. Title `Messages`: p `0 16`, 32/700 ls -0.045em.
3. Search: same as Explore, with placeholder `Search messages`. **Non-functional** in the design.
4. **Active-now rail.** No heading text in the design. Horizontal, gap 14, p `18 16 8`.
   - Each item: width 62, column centred, gap 6.
     - Avatar 58, with an online dot at right 1, bottom 1: 15×15, `#22C55E`, 3px white border.
     - First name, 12 `#3F3F46`.
   - People, in order: `hana, kofi, priya, ines, wren, delphine`.
   - Tap opens that person's chat if one exists (hana c2, kofi c3, delphine c4, wren c5). Otherwise it toasts `Say hi to {First}` (priya, ines).
5. **Chat list:** p `6 0`. Each row is a button: full width, row, gap 12, p `10 16`, pressed bg `#F4F4F5` (transition .15s).
   - Avatar 56.
   - Text column:
     - Name 15.5, weight **600 if unread**, else 400.
     - Preview line, 14, colour `#18181B` and weight 600 if unread, else `#71717A` and 400. One line with ellipsis. Text: `{"You: " if mine}{last text} · {time}`.
   - Unread dot: 10×10 `#2F5BD3`, when unread.
   - Tap runs `openChat(cid)`, which marks it read and goes to `chat`.

### 10 Chat → NEW `ConversationScreen.tsx`

**Container.** Bg white, `hb-push`.

**Scroll:** fills the screen, p `112 14 150`, column, gap 5. It auto-scrolls to the bottom on open, on a new message and when typing toggles.
1. **Intro:** column centred, gap 6, p `10 0 18`.
   - Avatar 72.
   - Name 17/600.
   - `Friends since 2021 · {mutual} mutual friends`, 13 `#71717A`.
2. Date stamp `Today 9:02 AM`: centred, 12 `#A1A1AA`, p `4 0 8`.
3. **Bubbles:** a row justified end (mine) or start (theirs).
   - Bubble: maxWidth 76%, p `9 14`, 15/400, lh 1.38, `hb-fade .3s`.
   - Mine: bg `#2F5BD3`, white text, r `20 20 6 20` (bottom-right is 6).
   - Theirs: bg `#F4F4F5`, text `#18181B`, r `20 20 20 6` (bottom-left is 6).
4. **Typing** (while `typing`): a bubble with p `13 15`, r `20 20 20 6`, bg `#F4F4F5`, row, gap 4. It holds 3 dots, 7×7 `#71717A`, with `hb-dot 1.2s infinite` delays of 0, .15s and .3s.

**Header** (absolute top, z 20): height 104, p `50 8 0`, row, gap 6, bg `rgba(255,255,255,.82)` with blur 20 sat 180%, plus a bottom hairline `0 1px 0 rgba(24,24,27,.05)`.
- Back: 40×44, `ph caret-left` 24.
- Avatar 38, with an online dot at bottom-right: 12×12 `#22C55E`, 2px white border.
- Text column (`flex:1`, padding-left 4): first name 16/600 over `Active now` 12.5 `#71717A`.
- Phone: 40, `ph phone` 22 `#2F5BD3`.
- Video: 40, `ph video-camera` 23 `#2F5BD3`.
- Both toast `Calling {First}…`.

**Composer** (absolute bottom, z 20): p `8 12 30`, bg `rgba(255,255,255,.88)` with blur 20 sat 180%.
- **Smart replies** (shown when `set.replies` and the chat still has replies): horizontal, gap 6, padding-bottom 9, centred.
  - A leading `ph-fill sparkle` 15 `#2F5BD3`.
  - Chips: height 32, p `0 13`, r 16, ring `#DCE3F8`, bg `#F5F7FE`, `#2447AE` 13.5/**500**, pressed .95.
  - Tapping a chip calls `sendChat(chipText)`.
- Input row (gap 8):
  - Photo: 38, `ph image-square` 23 `#2F5BD3`. Toasts `Photo library opens here`.
  - Input: `flex:1`, height 40, r 20, bg `#F4F4F5`, p `0 16`, 15px. Placeholder `Message`. Enter sends.
  - Send: 40 circle, `ph-fill paper-plane-right` 19 white. Bg `#2F5BD3` if there is a draft, else `#D4D4D8`. Pressed .9.

**sendChat(text).**
- Append `{me:true, t}`, mark the chat read, set the chat's `replies = []` (the chips disappear for that chat), and set `typing=true`.
- After **1600 ms**, set `typing=false` and append the canned reply for that chat (§6).

### 11 Notifications → `ActivityScreen.tsx` (route `Notifications`)

**Container.** Bg white, scroll, p `50 0 40`, `hb-push`.

1. Top row: p `4 8 0`, `space-between`.
   - Back: 44, `caret-left` 24.
   - `Mark all read`: height 44, p `0 10`, 14.5/600 `#2F5BD3`. Sets `allRead=true` and toasts `All caught up`.
2. Title `Notifications`: p `0 16`, 32/700 ls -0.045em.
3. **AI summary** (when `set.brief`; the text is **static**, with no AI call): m `14 16 4`, row, gap 10, p `12 14`, r 18, bg `#F5F7FE`, ring `#E1E8FB`, 14/400, lh 1.42, `#27272A`.
   - `ph-fill sparkle` 17 `#2F5BD3`, margin-top 1.
   - Text: `25 reactions on your Maple Pass photo, a dinner invite from Hana for Sunday, and one friend request from Yusuf.`
4. `New`: p `16 16 6`, 17/600 ls -0.02em.
5. **New rows** (`fresh:true`): row, gap 12, p `10 16`. Bg `#F5F7FE` while fresh and not all read, else `#FFFFFF` (transition background .4s).
   - Avatar 54, with a badge at right -3, bottom -3: 24 circle `#2F5BD3`, 2.5px white border. Inside is the kind icon at 12, white, fill weight (§6).
   - Text: 14.5/400, lh 1.4, `#27272A`. The **name** is bold 600 `#18181B`, followed by `{text}`.
   - Time: 12.5/500, margin-top 2, `#2F5BD3` while unread, else `#71717A`.
   - **Friend request actions** (kind `request`, before it is resolved): row, gap 8, margin-top 9, pressed .97.
     - `Confirm`: `flex:1`, height 36, r 11, bg `#2F5BD3`, white 14/600. Sets `req='ok'`, the text becomes `is now your friend.`, and it toasts `You and Yusuf are now friends`.
     - `Delete`: `flex:1`, height 36, r 11, bg `#F4F4F5`, 14/600. Sets `req='no'` and the text becomes `request removed.`
6. `Earlier`: p `18 16 6`, the same style as `New`.
7. **Earlier rows:** the same layout, with no bg and the time always `#71717A`.

**(spec)** Mark-all-read only changes styling. Rows stay in their sections, as in the design. In the store, `unreadCount` must match the design's `fresh` count so the bell number agrees.

### 12 Brief → NEW `BriefScreen.tsx` (tab `brief`)

**Container.** Scroll, p `50 0 104`, `hb-fade .35s`. When the Ask thread grows, smooth-scroll to the end.

1. Title row: p `10 16 0`, gap 10.
   - A 36×36 square, **r 12**, `#2F5BD3`, holding `ph-fill sparkle` 20 white.
   - `Brief`, 32/700 ls -0.045em.
2. `Updated 8 min ago from 23 posts, 6 messages and 11 notifications.`: m `8 16 0`, 14 `#71717A`.
3. **Segmented control:** m `16 16 0`, height 38, p 3, r 12, bg `#F4F4F5`, 2 columns.
   - Thumb: absolute top 3, left 3, width `50% - 3`, height 32, r 9, white, shadow `thumb`. It slides with `translateX(0 | 100%)`, transition `.45s smooth`.
   - Labels: 14/600, `Today` and `This week`.
4. Overline `WHAT YOU MISSED`: p `22 16 8`, 13/600 `#71717A`, ls .03em.
5. **List card:** m `0 16`, r 20, ring `#E4E4E7`, overflow hidden.
   - Each row is a button: row, `flex-start`, gap 12, p `13 14`, border-bottom 1 `#F0F0F2` (the last row too), `hb-fade .35s`, pressed bg `#FAFAFA`.
     - Avatar 30.
     - Text: `flex:1`, 14.5/400, lh 1.42, `#27272A`.
     - `ph caret-right` `#A1A1AA`, margin-top 6.
   - Items: the Today list (shared state `brief`, the same list as the feed card) or `weekBrief`.
   - Tap opens that author's post if one exists. Otherwise it toasts `Opening {First}'s profile`. **(spec)** In RN, push `User`.
6. Overline `COMING UP`, then a grid: 2 columns, gap 8, m `0 16`. Each tile has p 14, r 18, bg `#F4F4F5`, an icon 22 `#2F5BD3`, a title (margin-top 10, 14.5/600, lh 1.3) and a sub line (13 `#71717A`, margin-top 2). Static.
   - `ph cake`, title `Hana's birthday`, sub `Sunday, Sep 27`.
   - `ph clipboard-text`, title `Library survey closes`, sub `Wed, Sep 30 · Tomasz`.
7. Overline `WAITING ON YOU`, then a card: m `0 16`, row, gap 12, p `12 14`, r 18, ring `#E4E4E7`.
   - Avatar 40, `https://i.pravatar.cc/160?img=15` (Mateo).
   - Text: `flex:1`, 14, lh 1.4, `#27272A`, `Mateo asked if Saturday still works for the studio visit.`
   - `Reply`: height 34, p `0 14`, r 11, bg `#2F5BD3`, white 13.5/600, pressed .95. Runs `openChat('c1')`.
8. **Ask Harbor header:** p `26 16 8`, row, gap 8. `Ask Harbor` 18/600 ls -0.02em, then `Uses only posts shared with you` 12 `#71717A`.
9. **Thread:** column, gap 8, p `0 16`.
   - Bubbles: maxWidth **84%**, p `10 14`, 14.5/400, lh 1.45, `#27272A`, `hb-fade .3s`.
     - Mine: bg `#F4F4F5`, r `20 20 6 20`, aligned right.
     - Harbor: bg `#F5F7FE`, r `20 20 20 6`, aligned left.
   - **Loading:** width 70%, p 14, r `18 18 18 6`, bg `#F5F7FE`, column, gap 7. It holds 2 shimmer lines (height 10, r 5, widths 100% and 60%).
10. **Suggestion chips:** horizontal, gap 6, p `10 16`. Each chip is height 34, p `0 13`, r 17, ring `#DCE3F8`, bg `#F5F7FE`, `#2447AE` 13.5/500, pressed .96. The chips stay visible after use.
    - `What did Priya post this week?`
    - `Anything I should reply to?`
    - `What's happening this weekend?`
11. **Ask input:** m `0 16`, row, gap 8, p `5 5 5 16`, r 22, bg `#F4F4F5`.
    - Input: `flex:1`, height 36, transparent, 15px. Placeholder `Ask about your friends' posts…`. Enter sends.
    - Send: 36 circle, `ph arrow-up` 17 white (regular). Bg `#2F5BD3` if there is a draft, else **`#A1A1AA`**.
12. Disclaimer: m `12 16 0`, 12/400, lh 1.45, `#A1A1AA`, `Harbor Brief is generated by AI and can get details wrong. It never reads private messages you haven't opened.`

**State.** `range: 0|1`, `ask: {me, t}[]`, `askDraft`, `askLoading`.
- `askHarbor(q)` ignores an empty question, or a new one while loading. It appends the user's message, clears the draft and sets loading.
- It then calls the AI (§7). On success it appends the answer. On error it appends `I couldn't reach the server. Try again in a moment.` (an inline message, not a toast).

### 13 Profile → `ProfileScreen.tsx` (tab `profile`)

**Container.** Scroll, padding-bottom 100, `hb-fade .35s`. The status bar is white.

1. **Cover:** height 210, relative.
   - Image `https://picsum.photos/seed/hb-rotterdam-cover/800/440`, bg `#D4D4D8`.
   - Overlay `linear-gradient(180deg, rgba(24,24,27,.35), rgba(24,24,27,0) 45%)`.
   - Settings button: absolute top **52**, right 14, 38 circle, bg `rgba(24,24,27,.35)` with blur 14, ring `rgba(255,255,255,.18)`, `ph gear-six` 20 white. Goes to `settings`.
2. **Identity:** p `0 16`.
   - Avatar 104 circle, **4px white border**, margin-top **-54** (it overlaps the cover), bg `#E4E4E7`. Source `https://i.pravatar.cc/300?img=47`.
   - Name `Noor Haddad`: margin-top 10, 26/700 ls -0.035em.
   - `@noorhaddad · Rotterdam`: margin-top 2, 14 `#71717A`.
   - Bio `Architect. Mostly bridges, bread, and long walks along the Maas.`: margin-top 10, 15/400, lh 1.45, `#27272A`.
   - Stats row: gap 18, margin-top 12, 14 `#52525B`. The numbers are bold 600 `#18181B`: `482` friends, `131` posts, `36` albums.
   - Buttons: row, gap 8, margin-top 14. Each is `flex:1`, height 40, r 12, 14.5/600, row centred, gap 6, pressed .97.
     - `Edit profile`: bg `#2F5BD3`, white, `ph pencil-simple`. Toasts `Edit profile opens here`. **(spec)** Push `EditProfile`.
     - `Share`: bg `#F4F4F5`, `ph share-network`. Toasts `Profile link copied`.
3. **Tabs:** 3 equal columns, margin-top 18, border-bottom 1 `#F0F0F2`.
   - Labels: height 46, 14.5/600, `#2F5BD3` when active, else `#71717A` (transition color .2s). The labels are `Posts`, `Photos` and `About`.
   - **The default tab is `Photos` (index 1).**
   - Indicator: absolute bottom -1, width 33.333%, height 2.5, centred inner bar 48 wide, r 2, `#2F5BD3`. It slides with `translateX(ptab*100%)`, transition `.45s smooth`.
4. **Posts tab:** each item has p `14 16`, border-bottom **8 `#F4F4F5`**, `hb-fade .3s`.
   - Time: 13 `#71717A`.
   - Text: m `6 0 10`, 15/400, lh 1.45.
   - Image: aspect 4/3, r 16.
   - Meta: row, gap 6, margin-top 10, 13 `#71717A`. `ph-fill heart` `#2F5BD3`, then `{likes} · {comments} comments`.
5. **Photos tab:** a 3-column grid, gap 2, padding-top 2, square tiles, no radius, edge to edge, `hb-fade .3s`. 12 photos.
6. **About tab:** p `8 16`. Each row is a row with gap 14, p `13 0`, border-bottom 1 `#F0F0F2`, 15px text, and an icon 22 `#52525B` (§6).

### 14 Settings → `SettingsScreen.tsx` ("Menu")

**Container.** Bg **`#F4F4F5`**, scroll, p `50 0 40`, `hb-push`.

1. Back row: p `4 8 0`, 44 `caret-left` 24.
2. Title `Menu`: p `0 16`, 32/700 ls -0.045em.
3. **Profile card** (a button): m `14 16 0`, row, gap 12, p 12, r 18, bg white, pressed .99. Runs `tab('profile')`.
   - Avatar 50.
   - `Noor Haddad` 16/600 over `See your profile` 13.5 `#71717A`.
   - `ph caret-right` `#A1A1AA`.
4. **Shortcuts:** a 2-column grid, gap 8, p `10 16 0`.
   - Each tile is a button: column, `flex-start`, gap 10, p 14, r 18, bg white, pressed .97. Icon 24 `#2F5BD3`, label 15/600.
   - Every tile toasts `{label} opens here`.
   - Tiles: `Friends` (`ph users-three`), `Saved` (`ph bookmark-simple`), `Groups` (`ph circles-three-plus`), `Events` (`ph calendar-blank`), `Memories` (`ph clock-counter-clockwise`), `Feeds` (`ph rows`).
5. Overline `HARBOR AI`: p `22 28 8`.
6. **AI group:** m `0 16`, r 18, bg white, overflow hidden.
   - Each row is a button: row, gap 12, p `13 14`, border-bottom 1 `#F0F0F2`. Tapping the whole row toggles.
     - Text column: label 15/500, then sub 13 `#71717A`, margin-top 1, lh 1.35.
     - **Switch:** 51×31, r 16. Bg `#2F5BD3` when on, `#E4E4E7` when off (transition .25s). Knob: 27×27 white circle, top 2, left 2, shadow `knob`, `translateX(20)` when on, transition `transform .4s cubic-bezier(.34,1.3,.64,1)`.
   - Rows (label / sub / key / default):
     1. `Brief in your feed` / `A short summary of what you missed, at the top of Home.` / `brief` / **on**. Controls the feed Brief card **and** the Notifications AI summary.
     2. `Comment summaries` / `Summaries on posts with long comment threads.` / `csum` / **on**. Controls the post summary card.
     3. `Smart replies` / `Suggested replies in Messages. Generated on your device.` / `replies` / **on**. Controls the chat chips.
     4. `Personalize with my posts` / `Let Harbor AI use your own posts to tailor summaries.` / `personal` / **off**. Has no visible effect in the prototype.
7. Overline `PRIVACY`, then a white group (same box). Each row has p 14, gap 12, 15px, an icon 21 `#52525B`, the label (`flex:1`), an optional value `#71717A`, and `ph caret-right` `#A1A1AA`. The rows are inert.
   - `ph users` `Default audience`, value `Friends`. Border-bottom.
   - `ph prohibit` `Blocked accounts`, value `2`. Border-bottom.
   - `ph download-simple` `Download your data`, no value.
8. `Log out`: m `22 16 0`, full width, height 50, r 16, bg white, `#DC2626` 15.5/600, pressed .98. Sets the screen to `login` with the stack `['onboarding']`. **(spec)** Sign out through `AuthContext`. The auth stack then starts at `Welcome`. To match the design, open `SignIn` on top of it; this needs an `initialStack` prop on `StackNavigator`, or a push on mount.

**(spec)** The existing settings (push notification switches and "daily summary" in `Prefs`) are not in the design. Whether to keep them is an owner decision (§8).

---

## 4. Navigation

### 4.1 Tab bar (feed, explore, brief, profile only)

`showTabs = ['feed','explore','brief','profile'].includes(screen)`. The bar never shows on pushed screens.

**Material.** There are two full-width layers at the bottom, both 140 tall, z 29, with `pointer-events:none`:
1. A blur layer: `blur(16px) saturate(160%)`, masked by `linear-gradient(0deg, #000 0%, #000 45%, transparent 100%)`.
2. A gradient layer: `linear-gradient(0deg, rgba(255,255,255,.92) 0%, rgba(255,255,255,.5) 55%, rgba(255,255,255,0) 100%)`.

Content scrolls underneath both.

**Geometry.** A row at absolute left 16, right 16, **bottom 30** (**(spec)** `max(insets.bottom - 4, 14)`, matching `useTabBarOffset`), z 30, centred, gap **10**.

**Pill** (`flex:1`): height **62**, r 31, bg **`#18181B`**, row, centred, padding **7**, gap **2**, shadow `tabBar`.
- **Items** (4): height 48, r 24, row, centred, gap 8. Transition `all .45s cubic-bezier(.16,1,.3,1)`. Pressed scale .94.
  - Active: bg `#FFFFFF`, colour `#18181B`, horizontal padding **16**, and the **label is shown** (14/600, ls -0.01em, no wrap).
  - Inactive: bg transparent, colour `rgba(255,255,255,.72)`, horizontal padding **12**, icon only.
  - Icons are 23: **fill when active, regular when inactive**.
    - Home: `house`
    - Explore: `compass`
    - Brief: `sparkle`
    - Profile: **the avatar tab**. A 26 circle image (`https://i.pravatar.cc/80?img=47`) with ring `0 0 0 2px #18181B` when active (inside the white pill, which gives a dark ring) and a transparent ring when inactive. Label `Profile` when active.
  - Accessibility labels: `Home`, `Explore`, `Brief`, `Profile`.
  - Tapping an item runs `tab(key)`, which switches the tab and clears the stack.
- **Packing.** The items are **left-packed**; the pill has no justify-content. At 390 wide the pill is 286, and about 20 dp of slack sits on the right. **(spec)** Keep this, or use `justifyContent:'space-between'`. This is an owner preference.
- **(spec)** Animate the active pill width with `LayoutAnimation` or a measured `Animated.Value`. Animating background, padding and label appearance natively is not possible, so cross-fade the label (opacity, 250 ms).

**Create FAB:** 62×62, r 31, bg `#2F5BD3`, `ph plus` 26 white, shadow `fab`. Pressed `scale(.9) rotate(90deg)` with transition `transform .25s cubic-bezier(.34,1.56,.64,1)`. Accessibility label `Create post`. Runs `go('create')`.

**Scroll clearance.** Feed padding-bottom 130, Explore 100, Brief 104, Profile 100. **(spec)** Use `useTabBarClearance()` with the new numbers: `offset + 62 + 20`.

**Changes to existing code.**
- `FloatingTabBar.tsx` is rewritten. The current minimise-on-scroll behaviour (`TabBarContext.minimized`) is **not in the design**. **(spec)** Drop it, or keep it off.
- `insets.ts`: `TAB_BAR_HEIGHT = 62`, `TAB_BAR_SIDE = 16`.
- `MainTabs.tsx` tab keys change to `home | explore | brief | profile`. There is no badge on any tab; the unread count lives on the feed's bell.

### 4.2 Headers (per screen)

| Screen | Header |
|---|---|
| feed | floating pills over a progressive blur and gradient zone (132 tall); content scrolls under it (§3.04) |
| post | fixed 98-tall bar `rgba(255,255,255,.82)` + blur 20; back + `{First}'s post` |
| chat | fixed 104-tall bar `rgba(255,255,255,.82)` + blur 20 + hairline; back, avatar, name/status, phone, video |
| create | opaque 52-tall bar with a bottom hairline `#F0F0F2`; close / `Create post` / `Post` |
| messages, notifications, settings | **no bar**: a 44px icon row inside the scroll, then a 32/700 large title; it all scrolls away |
| explore, brief | large title inside the scroll; no bar |
| profile | cover image with a frosted gear button; no bar |
| story | overlay header on the image |
| auth | none, except Register's back button |

### 4.3 How each screen is reached

| From | Control | Action | RN (spec) |
|---|---|---|---|
| onboarding | `Skip`, `Get started` | go register | `nav.push({name:'SignUp'})` |
| onboarding | `I already have an account` | go login | push `SignIn` |
| login | `Create account` | go register | push `SignUp` |
| register | `Sign in` | go login | push `SignIn`, or pop if SignIn is below **(spec)** |
| register | back | back (fallback: login) | pop |
| login / register success, social | – | tab feed + toast | auth state flips and `App.tsx` remounts the `Tabs` stack; the toast goes through the global toast |
| feed | composer pill, `Create story` card, FAB | go create | `push({name:'NewPost'}, 'modal')` |
| feed | photo icon in the composer row | go create with a photo | `push({name:'NewPost', withPhoto:true}, 'modal')` |
| feed | story card i | openStory(i) | `push({name:'Story', index:i})` |
| feed | **bell pill** (top right) | go notifications | `push({name:'Notifications'})` |
| feed | **chat-circle-dots** (top right) | go messages | `push({name:'Messages'})` |
| feed | post text, Comment, counts | openPost | `push({name:'Post', postId})`; the Comment button may pass `focusComment:true` **(spec)** |
| feed Brief card | `Full brief` | tab brief | `setTab('brief')` |
| any tab | tab bar | tab(x) | `setTab(x)` |
| any tab | FAB | go create | modal `NewPost` |
| create | `Post` | tab feed + toast `Posted to …` | `pop()` the modal, `setTab('home')`, scroll the feed to top |
| create | `x` | back | pop |
| messages | chat row / active-now | openChat | `push({name:'Conversation', chatId})` |
| chat | back | back (fallback: messages) | pop |
| brief | `Reply` (Waiting on you) | openChat('c1') | push `Conversation` c1 |
| brief | What-you-missed row | openPost(author's post) or toast | push `Post` / `User` |
| profile | **gear on the cover** | go settings | `push({name:'Settings'})` |
| settings | profile card | tab profile | `popToRoot()` + `setTab('profile')` |
| settings | `Log out` | login with stack [onboarding] | `signOut()` |
| story | `x`, last story ends | back | pop |

**Navigator additions (spec, `src/navigation/Navigator.tsx`).**
- `Route` gains `Story`, `Messages`, `Conversation` and `Notifications`, plus `NewPost.withPhoto`.
- Add `popToRoot()`, needed by "tab(x)" calls from pushed screens.
- Add a tabs controller (`useTabs()` → `{tab, setTab}`), exported from `TabBarContext.tsx`, so pushed screens can switch the tab under them.
- The design's push transition is **`hb-push`**: translateX 28 → 0 with opacity 0 → 1 over 450 ms, `ease.smooth`. The modal transition is **`hb-rise`**: translateY 56 → 0 with a fade over 500 ms. Today's navigator slides cards the full width over 340 ms. Whether to adopt the design curves or keep native-feeling full-width pushes is an owner decision (§8). Tab switches use `hb-fade .35s ease` (Profile, Explore, Brief, Feed).

---

## 5. Shared components (build once)

Paths are proposals. Owners are listed in §9.

| Component | File | Spec |
|---|---|---|
| `Icon` | `src/components/Icon.tsx` (rewrite) | `<Icon name="heart" weight="regular\|fill" size color />` over `phosphor-react-native` deep imports (§8). Typed union of the names in §8.3 |
| `HarborLogo` | `src/components/HarborLogo.tsx` | the mark from Appendix A; `size` 30 / 32 / 56 |
| `PressableScale` | `src/components/PressableScale.tsx` | Pressable that scales to `pressedScale` (.98 / .97 / .96 / .95 / .94 / .92 / .9 / .85) over `duration` 200 with `ease.smooth`, or the spring variant (250 ms, `ease.spring`); optional `pressedBg`; optional `pressedRotate` (FAB 90°) |
| `Avatar` | `src/components/Avatar.tsx` (rewrite) | photo circle `size`; `ring?: {width, color}` (3px story ring, 2px white story header, 2px tab), `border?` (4px white profile, 5–6px onboarding), `online?: 'lg'\|'sm'` (15/3px or 12/2px `#22C55E`), placeholder bg `#E4E4E7`. **No blobs**: show initials on `#E4E4E7` when there is no photo **(spec)** |
| `Button` | `src/components/Button.tsx` (rewrite) | variants: `primary` (h54 r16 accent + highlight), `primaryPill` (h56 r999), `outline` (h52 r16 1.5px `#E4E4E7`), `soft` (`#F4F4F5`), `sm` (h34 r11 / h32 r10 / h36 r11 / h40 r12), `tint` (`#EEF2FD`/`#2447AE`), `danger-text` (white bg, `#DC2626`); `loading` sets the label and opacity .7 |
| `TextField` | `src/components/TextField.tsx` (rewrite) | label 13/600 `#3F3F46`; h52 r14 `#F4F4F5`, 1.5px border transparent / `#DC2626`; error row with an optional `warning-circle`; `secureToggle` eye button |
| `SearchField` | `src/components/SearchField.tsx` | h44 r14 `#F4F4F5`, magnifier at 14/12, padding-left 42, 15.5px |
| `Chip` | `src/components/Chip.tsx` | `topic` (h34 r17, selected `#18181B`), `ai` (h32 r16 or h34 r17, `#F5F7FE` + ring `#DCE3F8`, `#2447AE` 500), `tone` (h34 r11 white + ring, 600, icon), `audience` (h26 r8 `#EEF2FD`) |
| `AICard` | `src/components/AICard.tsx` | bg `#F5F7FE`, 1px `#E1E8FB`, r 20 (or 22 feed / 18 notifications), padding prop; header slot with a sparkle (17 accent icon, or a 32 circle badge variant) |
| `SparkleBadge` | inside `AICard.tsx` | circle (28/32) or rounded square (36 r12) `#2F5BD3` with a white fill sparkle |
| `Shimmer` | `src/components/Shimmer.tsx` | bar `height`, `width%`, `radius`; one gradient `#E4EAFA → #F8F9FE → #E4EAFA`, 480 wide, translated -240 → 240 over 1200 ms linear, looping; `ShimmerLines` helper. Replaces the opacity-pulse `Skeleton.tsx` for AI states (Skeleton can stay for first-load lists) |
| `TypingDots` | `src/components/TypingDots.tsx` | 3 × 7px `#71717A` dots, `hb-dot` 1.2 s loop, offsets 0/150/300 ms, inside a `#F4F4F5` bubble p `13 15` r `20 20 20 6` |
| `Bubble` | `src/components/Bubble.tsx` | `mine` / `theirs` radius, colours, maxWidth % (76 chat, 84 ask), `hb-fade` on mount; used by Conversation and Brief Ask |
| `ComposerBar` | `src/components/ComposerBar.tsx` | frosted bottom bar (bg alpha prop .86/.88); left slot (avatar 34 or photo button 38); input h40 r20 `#F4F4F5`; round send 40 (paper-plane-right fill 19), active `#2F5BD3`, idle `#D4D4D8`; rides the keyboard; optional top slot (smart replies) |
| `FrostedBar` | `src/components/FrostedBar.tsx` | top bar: height = `insets.top + 48` (post) / `+54` (chat), bg `rgba(255,255,255,.82)`, optional hairline, optional blur (§8) |
| `FeedHeaderZone` | `src/components/FeedHeaderZone.tsx` | progressive white gradient (and optional blur) of 132, plus the pill row |
| `HeaderPill` | inside the above | white h44 r22 shadow `pill` |
| `TabBar` | `src/components/FloatingTabBar.tsx` (rewrite) | §4.1, including the bottom gradient zone and the FAB |
| `Toast` | `src/components/Toast.tsx` (rewrite) | one **app-level** host (rendered after the stack in `App.tsx`) so toasts survive pushes and pops: centred, bottom = 106 with tabs / 96 on post and chat / 40 otherwise (**(spec)** + `insets.bottom - 30`); p `11 16`, r 16, bg `rgba(24,24,27,.9)` (+ blur 14), white 14/500, no wrap, `check-circle` fill 18 `#8FB0FF`, shadow `toast`; enter `hb-toast` .45s; hold 2200 ms; replace on a new toast. **(spec)** Add a 200 ms fade-out |
| `LargeTitle` | `src/components/LargeTitle.tsx` (replaces `LargeHeader` / `CollapsingHeader`) | 32/700 -1.44, p `0 16`, optional back-row above (44 caret-left) with a right action slot |
| `Overline` | `src/components/Overline.tsx` | 13/600 uppercase `#71717A`, ls .39; padding prop (`22 16 8` / `22 28 8`) |
| `Group` / `ListRow` | `src/components/SettingsRow.tsx` (rewrite) | white r18 group, rows with a 1px `#F0F0F2` bottom border; `ListRow {icon(21 #52525B), label, value, chevron}`; `ToggleRow {label, sub, value}` |
| `Switch` | `src/components/Switch.tsx` | 51×31 custom switch (§3.14); do **not** use the platform `Switch` |
| `SegmentedControl` | `src/components/SegmentedControl.tsx` (restyle) | h38 p3 r12 track `#F4F4F5`, thumb r9 h32 white shadow `thumb`, 450 ms `ease.smooth` |
| `UnderlineTabs` | `src/components/UnderlineTabs.tsx` | profile tabs (§3.13) |
| `PostCard` | `src/components/PostCard.tsx` (rewrite) | §3.04 article; props: post, author, callbacks by id (keep the memo pattern and `DOUBLE_TAP_MS = 260`) |
| `ImageCarousel` | `src/components/ImageCarousel.tsx` | horizontal snap list; item width `W-32` (single) or `round(W*0.759)` (multi, 296 at 390) **(spec)**; gap 6, side padding 16, aspect ratio, r 18, double-tap handler, optional count badge |
| `StoryRail` / `StoryCard` / `CreateStoryCard` | `src/components/StoryRail.tsx` | §3.04; ring colour from `seen` |
| `CommentRow` | `src/components/CommentRow.tsx` | §3.05 |
| `NotificationRow` | `src/components/NotificationRow.tsx` | §3.11, with the kind badge and request actions |
| `PersonRow` | `src/components/PersonRow.tsx` | avatar 48, name, mutual text, action button (Explore search) |
| `GroupCard` | `src/components/GroupCard.tsx` | §3.08 |
| `MasonryGrid` | `src/components/MasonryGrid.tsx` | 2 columns, explicit item heights, author chip |
| `Gradient` | `src/components/Gradient.tsx` | thin wrapper over `react-native-svg` `LinearGradient` (vertical / horizontal, stops) for overlays, if `experimental_backgroundImage` is not used (§8) |

To delete after migration: `src/components/blobs/*`, `DigestIcon.tsx`, `GoogleG.tsx` (replaced by Phosphor `google-logo`; **(spec)** keep it if the brand-coloured G is preferred), `SuggestedPeople.tsx` (not in the design), `SummaryCard.tsx` (replaced by the feed Brief card), `components/chat/*`, `CollapsingHeader.tsx`, `LargeHeader.tsx`.

---

## 6. Data model the design needs

### 6.1 Gaps against `src/state/storeTypes.ts` / `src/data/types.ts`

| Need | Today | Add (spec) |
|---|---|---|
| Multi-image posts | `Post.imageUrl?` (single) | `imageUrls: string[]` (keep `imageUrl` as `imageUrls[0]` for compatibility), `aspect: '4/3' \| '4/5'`, `place?: string`, `shareCount: number`, `audience: 'friends' \| 'public' \| 'close'` |
| Comment likes | none | `Comment.likeCount`, `Comment.likedByMe`; store `toggleCommentLike(postId, commentId)` |
| Avatars / first name | `photoUrl?`, `hue` | `photoUrl` required in the demo seed; `firstName` derived (`name.split(' ')[0]`); `mutualCount?: number`; `online?: boolean` |
| Profile | `bio`, `location`, `followers`, `following`, `postsCount` | `coverUrl`, `friendsCount`, `albumsCount`, `about: {icon: IconName; text: string}[]`, `photos: string[]` |
| Friends | follow graph (`following`, `toggleFollow`) | `friendRequests` (incoming), `confirmRequest(id)`, `deleteRequest(id)`, outgoing `requested: Record<userId, boolean>` with `toggleFriendRequest(userId)`. **Owner decision**: map "friends" onto follows (§8) |
| Stories | none | `Story {id, authorId, imageUrl, createdAt, timeLabel}`; `seen: Record<storyId, boolean>`; `liked: Record<storyId, boolean>`; `markStorySeen`, `toggleStoryLike`, `replyToStory(storyId, text)` |
| Groups / topics | none | `Group {id, name, memberCountLabel, imageUrl}`; `joined: Record<groupId, boolean>`; `toggleJoin(groupId)`; `topics: string[]`; `exploreGrid: {seed, height, authorId}[]` |
| Chats | none (the current "chat" tab is an assistant) | `Chat {id, peerId, timeLabel, unread, messages: ChatMessage[], smartReplies: string[]}`, `ChatMessage {id, fromMe, text, createdAt}`; `openChat` (marks read), `sendMessage(chatId, text)` (demo: typing for 1600 ms, then the canned reply); `activeNow: userId[]` |
| Notifications | `Activity.kind: 'like' \| 'follow' \| 'comment' \| 'commentLike'` | kinds `like, comment, event, request, group, mention` (+ keep `follow`, `commentLike`); `Activity.text` (display text after the name); `fresh` = unread; request resolution state |
| AI settings | `Prefs {pushLikes, pushComments, pushFollows, dailySummary}` | `Prefs.aiBrief` (default true), `aiCommentSummaries` (true), `aiSmartReplies` (true), `aiPersonalize` (false) |
| Brief | `FeedSummary {count, period, bullets}` | `BriefItem {authorId, text, postId?}`; `brief.today: BriefItem[]`, `brief.week: BriefItem[]`, `brief.loading`, `regenerateBrief()`; `comingUp`, `waitingOnYou` (static); `ask: {fromMe, text}[]`, `askLoading`, `askHarbor(q)` |
| Comment summary | none | `commentSummary(postId): {text?, loading}`, `summarizeComments(postId)` |
| Polish | none | `polishDraft(text, tone: 'Clearer' \| 'Warmer' \| 'Shorter') → Promise<string>` |

**(spec) Where it lives.**
- Put the new social data (stories, groups, chats, requests, brief, ask) in a new `src/state/SocialContext.tsx` with a `src/data/social.ts` seed. It is demo-only in phase 1. This keeps the 1,548-line `StoreContext.tsx` and the Firebase backend contract stable.
- Post, comment, user and prefs field additions go into the existing `types.ts`, `mock.ts`, `demo.ts` and `firebase.ts` mapping. Firebase mapping defaults: `imageUrls = imageUrl ? [imageUrl] : []`, `shareCount 0`, `aspect '4/3'`.
- AI goes into `src/services/ai.ts`.

### 6.2 Seed data (verbatim from the script)

**People** (`P`). The demo user `me` becomes Noor; today's mock `me` is "Julian".

```ts
// key: [name, first, avatar, mutual]
me:       ['Noor Haddad',          'Noor',     'https://i.pravatar.cc/160?img=47']
ines:     ['Ines Okafor-Lind',     'Ines',     'https://i.pravatar.cc/160?img=32', 14]
tomasz:   ['Tomasz Wierzbicki',    'Tomasz',   'https://i.pravatar.cc/160?img=12', 6]
priya:    ['Priya Raghunathan',    'Priya',    'https://i.pravatar.cc/160?img=45', 22]
mateo:    ['Mateo Arriaga',        'Mateo',    'https://i.pravatar.cc/160?img=15', 9]
hana:     ['Hana Sørensen',        'Hana',     'https://i.pravatar.cc/160?img=5',  31]
kofi:     ['Kofi Mensah-Boateng',  'Kofi',     'https://i.pravatar.cc/160?img=53', 11]
delphine: ['Delphine Aubert',      'Delphine', 'https://i.pravatar.cc/160?img=44', 8]
yusuf:    ['Yusuf Karaca',         'Yusuf',    'https://i.pravatar.cc/160?img=59', 9]
wren:     ['Wren Castellanos',     'Wren',     'https://i.pravatar.cc/160?img=26', 4]
```

Larger avatar variants: `https://i.pravatar.cc/300?img=47` (create-story card, profile) and `https://i.pravatar.cc/80?img=47` (tab avatar). The current `mock.ts` uses different surnames (Kofi Mensah, Priya Raman, Yusuf Demir, Hana Sato, Tomasz Wójcik, Mateo Ruiz) and has no `delphine` or `wren`. Replace them with the list above.

**Me (profile).**
- handle `noorhaddad`, location `Rotterdam`
- bio `Architect. Mostly bridges, bread, and long walks along the Maas.`
- friends `482`, posts `131`, albums `36`
- cover `https://picsum.photos/seed/hb-rotterdam-cover/800/440`

**About rows** (icon is the regular weight):
- `briefcase` / `Architect at Studio Veldkamp`
- `house-line` / `Lives in Rotterdam, Netherlands`
- `map-pin` / `From Amman, Jordan`
- `graduation-cap` / `Studied at TU Delft`
- `calendar-blank` / `Joined March 2019`

**Photos** (12): `pic('hb-me-'+k, 300, 300)` for k in `bridge, bread, maas, tram, market, crane, window, rain, bikes, dune, cafe, tiles`.

**Posts** (feed order). `createdAt` **(spec)**: 42m, 1h, 3h and 1 day ago. Show "Yesterday" for p4.

```ts
{ id:'p1', who:'ines',   time:'42m',       place:'Lisbon',         ratio:'4/3', likes:214,  liked:false, comments:38,  shares:6,
  text:'Third attempt at pastéis de nata from scratch and the lamination finally held. Butter ratios are in the comments for everyone who asked.',
  imgs:['https://picsum.photos/seed/hb-nata-lisbon/900/675'] },
{ id:'p2', who:'tomasz', time:'1h',        place:'Kraków',                      likes:87,   liked:true,  comments:19,  shares:24,
  text:'Our neighborhood library is extending Saturday hours starting October 3. If you use the reading room, the city survey on the new schedule closes Wednesday.',
  imgs:[] },
{ id:'p3', who:'priya',  time:'3h',        place:'North Cascades', ratio:'4/5', likes:1208, liked:false, comments:142, shares:31,
  text:'Maple Pass Loop. 14.3 km, 820 m of gain, and one very judgmental marmot.',
  imgs:['https://picsum.photos/seed/hb-cascade-larch/720/900','https://picsum.photos/seed/hb-cascade-ridge/720/900','https://picsum.photos/seed/hb-cascade-lake/720/900'] },
{ id:'p4', who:'mateo',  time:'Yesterday', place:'Oaxaca',         ratio:'4/3', likes:356,  liked:false, comments:47,  shares:3,
  text:'The studio is finally done. Six months, one very patient landlord, and more clay dust than I will ever admit to.',
  imgs:['https://picsum.photos/seed/hb-clay-studio/900/675'] },
```

**My posts** (profile Posts tab). **(spec)** Seed these as `p5` and `p6` authored by `me`. This keeps `__tests__/store.demo.test.tsx`, which expects ids `p1…p6`, valid.

```ts
{ id:'p5', time:'2 days ago', text:'Walked the Erasmusbrug at 6 AM before the cyclists woke up. Worth the alarm.', img:'https://picsum.photos/seed/hb-me-bridge/900/675', likes:148, comments:23 },
{ id:'p6', time:'5 days ago', text:'Sourdough number 41. Still not the one, but closer.',                         img:'https://picsum.photos/seed/hb-me-bread/900/675',  likes:96,  comments:14 },
```

**Comments** (`[who, text, time, likes]`, all `liked:false`). The comment counts on posts (38/19/142/47) are display totals larger than the seeded lists, as in the design.

```ts
p1: ['kofi','Butter ratio please. Mine always leaks in the oven.','18m',12],
    ['ines','250 g cold butter per 500 g flour. Three folds, 20 minutes in the fridge between each.','15m',41],
    ['delphine','A marble slab changed everything for me. Worth it if you bake more than twice a year.','11m',7],
    ['yusuf','Tried this last weekend and mine looked like scrambled eggs in a cup. Going again Saturday.','6m',3]
p2: ['hana','Thank you for flagging this. Filled it in.','40m',5],
    ['wren','Do the Sunday hours change too?','32m',1],
    ['tomasz','Sunday stays the same, 10 to 4.','28m',4]
p3: ['kofi','Which trailhead did you start from?','2h',6],
    ['priya','Rainy Pass. Go counter-clockwise, the views open up faster.','2h',18],
    ['delphine','The larches in two weeks will be unreal.','1h',9]
p4: ['priya','Mateo!! It looks incredible.','20h',4],
    ['hana','Are you running weekend classes?','18h',11],
    ['mateo','Starting November. Four people per class.','17h',14]
```

**Comment summaries** (initial `cSum`; also the demo AI output):
- p1: `Most commenters want the butter ratio. Ines answered in the thread: 250 g of cold butter per 500 g of flour, three folds, chilled between each. Others recommend a marble slab.`
- p2: `People are thanking Tomasz and filling in the survey. Sunday hours stay the same, 10 AM to 4 PM.`
- p3: `Friends are asking about the route. Priya started at Rainy Pass and suggests going counter-clockwise; the larches peak in about two weeks.`
- p4: `Friends are congratulating Mateo on the studio. Weekend classes start in November with four people per class.`

**Stories** (`[who, seed, time]`). Card image `pic(seed,300,500)`; viewer image `pic(seed,780,1688)`.
- `ines` / `hb-st-lisbon` / `38m`
- `priya` / `hb-st-larch` / `2h`
- `mateo` / `hb-st-clay` / `4h`
- `hana` / `hb-st-dinner` / `6h`
- `kofi` / `hb-st-accra` / `9h`

**Brief, Today** (initial `brief`):
- ines: `Ines posted her pastéis de nata recipe. Most of the 38 comments ask about the butter ratio.`
- tomasz: `Tomasz shared a library survey on new Saturday hours. It closes Wednesday.`
- priya: `Priya's Maple Pass hike is the most-liked post among your friends today.`

**Brief, This week** (`weekBrief`):
- priya: `Priya finished three hikes this week, 46 km in total, and shared 31 photos.`
- delphine: `Delphine started Rotterdam Film Club. Four of your friends have joined.`
- kofi: `Kofi moved to Accra. 62 people commented on his announcement.`

Static Brief copy: header counts `While you were away · 23 posts` and `Updated 8 min ago from 23 posts, 6 messages and 11 notifications.`; Coming up and Waiting on you as in §3.12.

**Chats** (`id: who, time, unread, msgs [me?, text], replies`):

```ts
c1: mateo,    '9:14',   unread:true,
    [them] 'The studio is finally painted. Want to come see it Saturday?'
    [me]   'Yes! What time works?'
    [them] "Anytime after 2. I'll have coffee and questionable music."
    replies: ['Saturday at 3 works','Send me the address','Can I bring Kofi?']
c2: hana,     'Tue',    unread:false, [them] 'Sunday dinner at mine, you in?'                        replies: ["I'm in",'What can I bring?','Can we do 7?']
c3: kofi,     'Mon',    unread:false, [them] 'Photos from Accra incoming'                            replies: ['Send them!','How is the new flat?']
c4: delphine, 'Sep 20', unread:false, [them] 'The Portra roll came back. Two of the shots are yours.' replies: ['Show me','Which ones?']
c5: wren,     'Sep 18', unread:false, [me] 'You did not', [them] 'Haha I absolutely did'               replies: ['Legend',"Photos or it didn't happen"]
```

Canned auto-replies, sent after 1600 ms of typing:
- c1: `Perfect. I'll put the kettle on.`
- c2: `Great, 7 it is.`
- c3: `Uploading now`
- c4: `Sending the scans tonight`
- other: `Ha, fair.`

Active now: `hana, kofi, priya, ines, wren, delphine`. Chat intro: `Friends since 2021 · {mutual} mutual friends`; date stamp `Today 9:02 AM`.

**Notifications** (`id, who, kind, text, time, fresh`):

```ts
n1 priya    like     'and 24 others reacted to your photo from Maple Pass.'          '12m'   fresh
n2 hana     event    'invited you to Sunday dinner at hers.'                          '1h'    fresh
n3 yusuf    request  'sent you a friend request. 9 mutual friends.'                   '2h'    fresh
n4 kofi     comment  'commented on your post: "This bridge again? Never gets old."'   '3h'    fresh
n5 delphine group    'added you to Rotterdam Film Club.'                              'Tue'
n6 wren     mention  "mentioned you in a comment on Priya's post."                    'Mon'
n7 tomasz   like     'liked your comment.'                                            'Sep 19'
```

Kind icons (all fill weight): `like` = heart, `comment` = chat-circle, `event` = calendar-blank, `request` = user-plus, `group` = users-three, `mention` = at. **(spec)** `follow` = user-plus, `commentLike` = heart.

**Groups** (`[name, members, seed]`). Image `pic(seed,500,230)`.
- `Rotterdam Film Club` / `2.4K members` / `hb-g-film`
- `Weekend Bread Society` / `18K members` / `hb-g-bread`
- `Cascades Trail Reports` / `9.1K members` / `hb-g-trail`

**Topics:** `For you`, `Home bakers`, `Trail reports`, `Film photography`, `Rotterdam`, `Ceramics`.

**Explore grid** (`[seed, height, who]`). URL `pic(seed+'-'+topicIndex, 400, height*2)`.
- `hb-ex-a` / 230 / delphine
- `hb-ex-b` / 170 / priya
- `hb-ex-c` / 200 / kofi
- `hb-ex-d` / 260 / ines
- `hb-ex-e` / 180 / wren
- `hb-ex-f` / 220 / mateo
- `hb-ex-g` / 150 / hana
- `hb-ex-h` / 240 / yusuf

**Settings shortcuts:** `Friends`, `Saved`, `Groups`, `Events`, `Memories`, `Feeds` (icons in §3.14).

**AI prefs defaults:** brief **true**, csum **true**, replies **true**, personal **false**.

**Ask Harbor context**, used by the AI prompt:
- `Upcoming: Hana Sørensen's birthday Sunday Sep 27; library survey closes Wednesday Sep 30; Hana invited Noor to Sunday dinner.`

---

## 7. AI features

The prototype calls `window.claude.complete`, which exists only in the Claude Design host. React Native has no such runtime.

**(spec)** Define `src/services/ai.ts`:

```ts
export type AIRequest = { system?: string; messages: { role: 'user' | 'assistant'; content: string }[]; max_tokens: number };
export interface AI { complete(req: AIRequest): Promise<string>; }
```

- **Demo mode:** a `demoAI` that returns the canned outputs below after an 900–1200 ms delay, so the shimmer states are visible.
- **Firebase mode:** call a server-side proxy, for example a Firebase callable function `aiComplete` that calls the Anthropic Messages API with a server-held key. Never ship an API key in the app. This repo has **no Cloud Functions** configured (`firebase.json` covers firestore and storage only), and `@react-native-firebase/functions` is not installed. Both would be new. The owner chooses the model.

The helper is `ai(content, max) = complete({messages:[{role:'user', content}], max_tokens: max||400})`, and the result is `String(r).trim()`.

### 7.1 Harbor Brief refresh (`regenBrief`, feed Brief card "Refresh")

- **Prompt** (single user message, **no system**), verbatim. The text after the colon is followed by two newlines and then the posts block:

```
You write the "Brief" recap in a friends-only social app. From these posts, write exactly 3 lines. Each line is one plain sentence under 22 words that starts with the person's first name. No bullets, numbering, emoji, or intro.
```

- **Input.** The posts block has one line per post: `{First}: {text} ({likes} likes, {comments} comments)`, joined with `\n`. The full content string is `prompt + '\n\n' + posts`.
- **max_tokens:** 300.
- **Parsing.**
  - Split on `\n`, strip leading `[-*•\d.\s]+` from each line, trim, drop empty lines, keep the first 3.
  - For each line, `who` = the first person (not me) whose first name the line **starts with**, falling back to `ines`.
  - If no lines result, keep the old brief.
- **States.**
  - Ignored while already loading.
  - `briefLoading=true` and `briefOpen=true` show 3 shimmer lines.
  - On error, toast `Couldn't refresh the Brief`.
  - This also updates the Brief tab's Today list.
- **Output shape:** `{who: personKey, text: string}[3]`.
- **Demo fallback:** return the 3 seeded Today lines joined by `\n` (or **(spec)** rotate through 2 prepared sets). Parsing then runs unchanged.

### 7.2 Comment summary (`sumComments`, post refresh button)

- **Prompt** (single user message), verbatim:

```
Summarize the comments on this social post in two plain sentences, under 45 words total. No preamble, no emoji.

Post by {First}: {post text}

Comments:
{First}: {comment text}
{First}: {comment text}
…
```

- **max_tokens:** 200.
- **Output:** a plain string that replaces `cSum[pid]`.
- **States:** 2 shimmer lines while loading. On error, toast `Couldn't reach Harbor AI`. Before any summary exists, the text is `Tap refresh to summarize this thread.`
- **Demo fallback:** the 4 seeded `cSum` strings (§6.2). **(spec)** For a post with no seed (a new post), return `Not enough comments to summarize yet.` when it has fewer than 2 comments, else a templated `{n} friends commented. Most recent: "{last comment}"`.
- **(spec)** The design shows the card on every post when `set.csum` is on. The existing app shows a digest only after a thread length threshold (`PostScreen.tsx`). The design copy says "Summaries on posts with long comment threads", so keeping a threshold is defensible. Owner's call.

### 7.3 Polish with Harbor (`polish(tone)`, create screen)

- **Prompt** (single user message), verbatim. `{tone}` is lower-cased: `clearer`, `warmer` or `shorter`.

```
Rewrite this social media post to be {tone}. Keep it first person, keep every fact, no emoji, no hashtags. Return only the rewritten post.

{draft text}
```

- **max_tokens:** 300.
- **Output:** a string with surrounding `"` stripped (`/^"|"$/g`). It becomes the draft text, and `prevText` keeps the original so **Undo AI edit** can restore it.
- **States:** the active tone stays at opacity 1 and the others drop to .5, with a shimmer bar. An empty draft toasts `Write something first`. On error, toast `Couldn't reach Harbor AI`.
- **Demo fallback (spec, no canned text in the design).** Deterministic local rewrites:
  - **Shorter:** keep the first sentence (or the first 60% of the words, ending at a full stop).
  - **Clearer:** collapse whitespace, capitalise sentence starts, end with a period, and expand "&" to "and".
  - **Warmer:** keep the text and, when it has no exclamation mark, append ` Can't wait to share more soon.`
  - Mark these clearly as demo behaviour.

### 7.4 Ask Harbor (`askHarbor(q)`, Brief tab)

- **System prompt**, verbatim. It is followed by two newlines and the context block:

```
You are Harbor Brief, the assistant inside a friends-only social app. The user is Noor Haddad. Answer in 1 to 3 short plain sentences using only this context. If the context lacks the answer, say so. No markdown, no emoji.
```

- **Context block**, joined with `\n`:

```
Posts:
- {Full name} ({time}, {place}): {text}        // one line per post
Upcoming: Hana Sørensen's birthday Sunday Sep 27; library survey closes Wednesday Sep 30; Hana invited Noor to Sunday dinner.
Latest messages:
- {First}: {last message text}                  // one line per chat
```

- **Messages:** `[{role:'user', content: q}]`.
- **max_tokens:** 250.
- **Output:** a plain string, appended as a Harbor bubble.
- **States:** a shimmer bubble while loading. A new question is ignored while loading. On error, append the bubble `I couldn't reach the server. Try again in a moment.`
- **Demo fallback (spec, authored here, grounded in the seed):**
  - `What did Priya post this week?`: `Priya posted the Maple Pass Loop in the North Cascades: 14.3 km with 820 m of gain. It's the most-liked post among your friends today.`
  - `Anything I should reply to?`: `Mateo asked if Saturday still works for the studio visit. Hana also invited you to Sunday dinner at hers.`
  - `What's happening this weekend?`: `Mateo invited you to see his studio on Saturday, any time after 2. On Sunday it's Hana's birthday, and she's invited you to dinner.`
  - Anything else: keyword-match the people names through the existing `src/data/chatReplies.ts` builders. Otherwise answer `I can only answer from posts and messages shared with you, and I couldn't find that. Try asking about a friend by name.`

### 7.5 "AI" features that are static in the design (no model call)

- **Chat smart replies:** a fixed per-chat list (§6.2). The settings copy says "Generated on your device." Keep them static.
- **Notifications one-line summary:** a fixed string (§3.11). **(spec)** Derive it from the notification list in demo mode, or keep it static.
- Onboarding Brief card copy: static.

---

## 8. React Native feasibility

### 8.1 Translucency and blur

- No blur package is installed. `@react-native-community/blur` (BlurView) gives real backdrop blur on iOS and is usable on Android (v4+, with some performance cost and quirks).
- The **progressive** zones under the feed header and behind the tab bar (blur that fades out through a gradient mask) would also need `@react-native-masked-view/masked-view`. That adds two native deps and a pod install.
- **Recommendation (spec):**
  1. **Phase 1, no new native deps:**
     - Gradient-only zones. The design's white gradients (`.92 → .55/.5 → 0`) already carry most of the look, because the content is white.
     - Semi-opaque white bars, raised to `rgba(255,255,255,.94)` because there is no blur. The design's `.82` reads as see-through without blur.
     - Badge and button chips (`rgba(24,24,27,.6)`) work fine without blur.
  2. **Phase 2 (optional):** add `@react-native-community/blur` for the post and chat bars, the toast and the profile gear on iOS only, keeping the gradient zones as they are.
- **Owner decision:** approve the blur package (and masked-view), or accept the fallback.
- `saturate(160–180%)` has no RN equivalent. Drop it.

### 8.2 Geist fonts

- **Status:** `Geist-Regular`, `Geist-Medium`, `Geist-SemiBold` and `Geist-Bold` `.ttf` files are already in `assets/fonts/` and linked: `ios/Harbor/Info.plist` `UIAppFonts`, `project.pbxproj`, `android/app/src/main/assets/fonts/` and both `link-assets-manifest.json` files (static TTFs, as shipped by `@expo-google-fonts/geist` or Google Fonts).
- **Remaining work:**
  - Verify the PostScript names match the family strings (`Geist-Regular`, etc.), because iOS resolves by PostScript name.
  - Switch `theme.ts`.
  - Grep for `Outfit` and `fonts.heavy` usages.
  - Remove the Outfit files with `npx react-native-asset` after migration.
  - Licence: OFL. Keep one family per weight; Android ignores `fontWeight` on custom fonts.

### 8.3 Phosphor icons

- `phosphor-react-native@^3.0.6` is in `package.json` and `node_modules`. It needs `react-native-svg`, which is installed. All the names below exist in v3.
- **Metro does not tree-shake.** Import per icon via the package export `phosphor-react-native/src/icons/{Name}` (each module exports `{Name}Icon`) and wrap them in `Icon.tsx`. Do not import the barrel.
- **Alternative:** port about 60 SVG paths by hand. That is not needed.
- **Regular weight:**
  - Navigation and arrows: `house`, `compass`, `sparkle`, `caret-left`, `caret-right`, `caret-down`, `arrow-clockwise`, `arrow-right`, `arrow-up`, `arrow-counter-clockwise`, `arrows-in-line-horizontal`, `x`.
  - Status and form: `warning-circle`, `eye`, `eye-slash`, `check`, `magnifying-glass`.
  - Media and composing: `images`, `image-square`, `plus`, `note-pencil`, `pencil-simple`, `text-align-left`, `chart-bar-horizontal`, `sun`.
  - Social and actions: `users`, `users-three`, `user-plus`, `dots-three`, `chat-circle`, `chat-circle-dots`, `share-fat`, `share-network`, `heart`, `bell`, `paper-plane-tilt`, `phone`, `video-camera`, `star`, `globe-hemisphere-west`.
  - Profile and settings: `google-logo`, `map-pin`, `cake`, `clipboard-text`, `gear-six`, `briefcase`, `house-line`, `graduation-cap`, `calendar-blank`, `bookmark-simple`, `circles-three-plus`, `clock-counter-clockwise`, `rows`, `prohibit`, `download-simple`.
- **Fill weight:** `heart`, `sparkle`, `apple-logo`, `paper-plane-right`, `check-circle`, `chat-circle`, `calendar-blank`, `user-plus`, `users-three`, `at`, `house`, `compass`. The status-bar `cell-signal-full`, `wifi-high` and `battery-full` are device chrome and are not needed.
- The icon `size` equals the CSS `font-size`. `ph plus` in the create-story badge is styled `font-weight:700`, which has no effect on an icon font. **(spec)** Use `weight="bold"` there if a heavier plus is wanted.

### 8.4 Story auto-advance

- The design uses an interval of 55 ms × 0.011, which is about 5.0 s per story, and wraps or exits at the end. Use a native-driven `Animated.timing` for 5000 ms with linear easing on `scaleX` and `transformOrigin: 'left'` (supported on the New Architecture), then call `next()` in the completion callback (guard it with `finished`).
- Reset on prev/next.
- Stop on unmount and on `AppState` background.
- Mark a story seen in `next()`.
- Prefetch `pic(seed,780,1688)` with `Image.prefetch` for the next story.

### 8.5 Image carousels

- Use a horizontal `FlatList` or `ScrollView` with `snapToInterval = itemWidth + 6`, `snapToAlignment: 'start'`, `decelerationRate: 'fast'`, `disableIntervalMomentum`, and `contentContainerStyle={{paddingHorizontal:16, gap:6}}`. Nesting inside the vertical feed is fine.
- Double-tap: use the existing 260 ms timestamp pattern in `PostCard.tsx`. Don't block single-tap scrolling. **(spec)** Add a heart burst; the design has none.
- The design's double-tap **toggles** like, so a second double-tap unlikes. **(spec)** Consider "double-tap only likes" (Instagram convention). Owner's call.
- There is no page indicator. The count badge is static (`3 photos`).

### 8.6 Web-only CSS and its RN mapping

| CSS | RN |
|---|---|
| `backdrop-filter` | BlurView or the fallback (§8.1) |
| `mask-image` gradients | MaskedView, or drop it (gradient-only) |
| `linear-gradient` backgrounds | `experimental_backgroundImage: 'linear-gradient(...)'` (New Architecture; verify on 0.87) or `react-native-svg` `LinearGradient` (installed) |
| `box-shadow` with spread / `inset` | `boxShadow` style string (New Architecture, supports spread and inset; verify) or `shadow*` + `elevation` approximations; inset 1px rings become `borderWidth:1` |
| `text-wrap: balance / pretty` | none. Android `textBreakStrategy="balanced"`, iOS `lineBreakStrategyIOS="push-out"` |
| `column-count: 2` masonry | two explicit `View` columns (a–d / e–h) |
| `display:grid` (`repeat(n,1fr)`, `place-items:center`) | flex rows with `flex:1` children; `alignItems/justifyContent: 'center'` |
| `aspect-ratio` | `aspectRatio: 4/3` (supported) |
| `scroll-snap-*` | `snapToInterval` / `pagingEnabled` |
| `:active` (`style-active`) | `Pressable` pressed state with Animated scale |
| CSS transitions on colour / background / width | `Animated` with `useNativeDriver:false` for colours, or `LayoutAnimation`; native driver only for transform and opacity |
| `calc(50% - 3px)` | measure with `onLayout` (the existing `SegmentedControl` already does) |
| `white-space:nowrap; text-overflow:ellipsis` | `numberOfLines={1}` |
| `display:inline-block` (comment bubble) | `alignSelf:'flex-start'` |
| `transform: translate(-50%,…)` centring (toast, card) | `alignSelf:'center'` / `left:0,right:0,alignItems:'center'` |
| `::placeholder` colour | `placeholderTextColor="#A1A1AA"` |
| `prefers-reduced-motion` | `AccessibilityInfo.isReduceMotionEnabled()` |
| `onPointerDown/Up` swipe, `user-select`, `touch-action`, `cursor`, `-webkit-tap-highlight-color`, `-webkit-font-smoothing`, `font-feature-settings` | not needed / PanResponder |
| `input` Enter (`onKeyDown`) | `onSubmitEditing` + `returnKeyType="send"`; the comment and chat inputs are single-line |
| `autofocus via ref.focus()` | `TextInput` ref `.focus()` |
| `scrollTop = scrollHeight` / `scrollTo smooth` | `scrollToEnd({animated})` after content size change |

### 8.7 Other notes

- **Keyboard:** the post, chat, story and Brief composers must ride the keyboard. Reuse `src/components/useKeyboard.ts` or `KeyboardAvoidingView`.
- **Images** are remote (picsum, pravatar) and need a network connection, as `DEMO_MODE` already notes. Show `#E4E4E7` placeholders.
- **Safe areas:** design numbers assume a 50 top and a 30–34 bottom (§0).
- **Firebase mode:** stories, chats, groups, requests and AI have **no backend**. **(spec)** Phase 1: render them from the demo seed in both modes behind a `features.socialDemo` flag, or hide them in Firebase mode. Owner decision.

### 8.8 Decisions for the owner

1. **Blur:** add `@react-native-community/blur` (+ `@react-native-masked-view/masked-view`), or ship the gradient / semi-opaque fallback first. The recommendation is the fallback first.
2. **Transitions:** use the design's `hb-push` (28px slide + fade, 450 ms) and `hb-rise` (56px + fade, 500 ms), or keep the current full-width native-style pushes.
3. **Friends vs follows:** the design is friend-based ("Add friend"/"Requested", friend requests, "482 friends", mutual friends); the store is follow-based. The choice is to map friends onto follows, or add a friendship model.
4. **Tab set:** Activity and the Ask Harbor tab leave the tab bar. Notifications becomes a pushed screen from the feed bell, and Ask Harbor moves inside Brief. This needs a confirm.
5. **AI backend:** a Cloud Function proxy to the Anthropic API (new `functions/`, `@react-native-firebase/functions`, model choice), or demo-only canned AI for now.
6. **Apple sign-in:** "Continue with Apple" has no implementation. The options are to implement it, hide it (Android at least), or show a toast.
7. **Demo identity:** the demo user becomes "Noor Haddad" (the copy references Noor). Replace "Julian", and render names dynamically from `me`.
8. **Existing settings:** the push-notification switches and "Daily summary" `Prefs` are not in the design. Drop them, or move them to a sub-screen.
9. **Comment summary visibility:** show it always (design) or only on long threads (current app).
10. **Double-tap:** toggle (design) or like-only.
11. **Story extras:** pause on hold or on input focus (not in the design).
12. **Firebase mode:** the new social features are demo-only, hidden, or backed by a new Firestore schema.
13. **Tab packing:** left-packed (design) or evenly spaced.

---

## 9. Proposed split (4 engineers, by file ownership)

Rule: **every file has exactly one owner**. Others may read it but not edit it. A change needed in someone else's file goes to that owner.

### 9.1 Foundation first (Engineer A, before the others start; target 1–2 days)

Deliver these so B, C and D can build against them. Merge as one PR.

1. **Tokens:** `src/theme.ts` per §2.8. Keep temporary aliases for old keys (`colors.canvas`, `type.display`, etc.) so un-migrated screens still compile. The aliases are removed at cleanup.
2. **Fonts:** verify the Geist linking (§8.2). Outfit stays until cleanup.
3. **Icons:** `src/components/Icon.tsx` as the Phosphor wrapper with the typed name union (§8.3). `src/components/HarborLogo.tsx`.
4. **Primitives** (all in `src/components/`): `PressableScale`, `Avatar`, `Button`, `TextField`, `SearchField`, `Chip`, `AICard` (+ `SparkleBadge`), `Shimmer`, `TypingDots`, `Bubble`, `ComposerBar`, `FrostedBar`, `LargeTitle`, `Overline`, `Switch`, `SettingsRow` (Group / ListRow / ToggleRow), `SegmentedControl`, `UnderlineTabs`, `Toast` (app-level host + `useToast`), `Gradient`. Each gets a minimal story or usage note in its file header.
5. **Data and store:**
   - `src/data/types.ts` (field additions, §6.1) and `src/data/mock.ts` (re-seed, §6.2).
   - New `src/data/social.ts` (stories, chats, groups, topics, grid, notifications text, brief, about, photos).
   - `src/services/backend/demo.ts` and `firebase.ts` (the new fields map with defaults).
   - `src/state/storeTypes.ts` (contract additions: `toggleCommentLike`, AI prefs, …) and `src/state/StoreContext.tsx`.
   - New `src/state/SocialContext.tsx` (`useSocial()`: stories, chats + `sendMessage` with the typing simulation, groups / join, requests, search, brief + `regenerateBrief`, `summarizeComments`, `polishDraft`, `askHarbor`).
   - New `src/services/ai.ts` with the demo AI (§7).
   - Update `__tests__/store.demo.test.tsx`.
6. **Routes and shell:**
   - `src/navigation/Navigator.tsx`: new routes, `popToRoot`, the transition choice.
   - `src/navigation/TabBarContext.tsx`: `TabKey`, `useTabs`.
   - `src/navigation/insets.ts`: the new numbers.
   - `src/components/FloatingTabBar.tsx`: the full tab bar + FAB per §4.1.
   - `src/screens/MainTabs.tsx`: new panes.
   - `App.tsx`: renderScreen cases, toast host, StatusBar.
   - **Create stub screens** that render a title only, so the other owners begin from compiling files: `StoryScreen.tsx`, `ExploreScreen.tsx`, `MessagesScreen.tsx`, `ConversationScreen.tsx` and `BriefScreen.tsx`. Rename the `ActivityScreen` export to `NotificationsScreen`; the file is kept.

Exit criteria: the app compiles and every route and tab opens its stub; `useSocial()` returns the seeded data; `ai.complete` returns the demo outputs; the tests pass.

### 9.2 Ownership after the foundation

| Engineer | Screens | Files owned (exclusive) |
|---|---|---|
| **A: Platform + Brief / Profile / Settings** | 12 Brief, 13 Profile, 14 Settings, plus the restyle of UserProfile and EditProfile | all foundation files above, plus `src/screens/BriefScreen.tsx`, `ProfileScreen.tsx`, `SettingsScreen.tsx`, `UserProfileScreen.tsx`, `EditProfileScreen.tsx`, `src/components/ProfileHeader.tsx`, `PostGrid.tsx`; retirement of `src/screens/ChatScreen.tsx`, `src/components/chat/*`, `src/data/chatReplies.ts`, `DigestIcon.tsx`, `CollapsingHeader.tsx`, `LargeHeader.tsx`, `Skeleton.tsx`, `ErrorState.tsx`, `src/components/blobs/*`, Outfit fonts (final cleanup PR) |
| **B: Auth + Create + Story** | 01 Onboarding, 02 Login, 03 Register, 06 Create, 07 Story | `src/screens/WelcomeScreen.tsx`, `SignInScreen.tsx`, `SignUpScreen.tsx`, `NewPostScreen.tsx`, `StoryScreen.tsx`, `src/components/AuthLayout.tsx`, `GoogleG.tsx`, new `src/components/OnboardingArt.tsx` (Appendix A SVGs), new `src/components/StrengthMeter.tsx` |
| **C: Feed + Post** | 04 Feed, 05 Post | `src/screens/HomeScreen.tsx`, `PostScreen.tsx`, `src/components/PostCard.tsx`, new `ImageCarousel.tsx`, new `StoryRail.tsx`, new `FeedHeaderZone.tsx`, new `FeedBriefCard.tsx`, new `CommentRow.tsx`, `SummaryCard.tsx` (delete when replaced), `SuggestedPeople.tsx` (delete) |
| **D: Explore + Messaging + Notifications** | 08 Explore, 09 Messages, 10 Chat, 11 Notifications | `src/screens/ExploreScreen.tsx`, `MessagesScreen.tsx`, `ConversationScreen.tsx`, `ActivityScreen.tsx` (Notifications), new `src/components/PersonRow.tsx`, `GroupCard.tsx`, `MasonryGrid.tsx`, `NotificationRow.tsx`, `ChatListRow.tsx`, `ActiveNowRail.tsx` |

**Cross-team rules.**
- Shared primitives, store, types, navigation, theme and `App.tsx` belong to **A**. B, C and D file small requests to A, such as a missing Icon name or store method. A turns them around the same day.
- To unblock, a screen owner may write a **local** helper inside their own screen file and upstream it later.
- Screens consume only `useStore()`, `useSocial()`, `useNav()`, `useTabs()`, `useToast()` and `ai` through the store. No screen calls `ai.ts` directly. **(spec)** This keeps demo and Firebase interchangeable.
- B's story viewer and C's story rail meet only through `useSocial().stories / markStorySeen` and the `Story` route.
- C's feed opens D's screens only through routes (`Notifications`, `Messages`). A's Brief opens D's `Conversation` only through a route.
- **Order of merge:** A foundation, then B, C and D in parallel, then A's cleanup PR (remove the theme aliases, Outfit, blobs and dead components). The cleanup runs only after B, C and D have merged.

---

## Appendix A: SVGs, verbatim

**Harbor logo** (viewBox 0 0 64 64; rendered at 30, 32 and 56):

```xml
<svg viewBox="0 0 64 64"><rect width="64" height="64" rx="18" fill="#2F5BD3"/><path d="M20 10h24a7 7 0 0 1 7 7v9a7 7 0 0 1-7 7H35l-3 5-3-5H20a7 7 0 0 1-7-7v-9a7 7 0 0 1 7-7z" fill="#FFFFFF"/><circle cx="25.5" cy="21.5" r="2.4" fill="#2F5BD3"/><circle cx="32" cy="21.5" r="2.4" fill="#2F5BD3"/><circle cx="38.5" cy="21.5" r="2.4" fill="#2F5BD3"/><path d="M32 37v17" stroke="#FFFFFF" stroke-width="4.5" stroke-linecap="round"/><path d="M15 42c0 8 7.5 13 17 13s17-5 17-13" fill="none" stroke="#FFFFFF" stroke-width="4.5" stroke-linecap="round"/><path d="M15 42l-4 3.5M15 42l5 3M49 42l4 3.5M49 42l-5 3" stroke="#FFFFFF" stroke-width="4.5" stroke-linecap="round"/></svg>
```

**Onboarding art backgrounds** (each is `viewBox="0 0 390 350"`, absolute behind the images):

```xml
<!-- ob1 -->
<path d="M24 300c30-44 90-44 120 0" fill="none" stroke="#2F5BD3" stroke-width="6" stroke-linecap="round"/><path d="M290 40c18 0 30 12 30 30" fill="none" stroke="#2F5BD3" stroke-width="6" stroke-linecap="round"/><circle cx="352" cy="128" r="9" fill="#F6B51B"/><circle cx="60" cy="40" r="5" fill="#2F5BD3"/>
<!-- ob2 -->
<path d="M330 300l6-18 6 18 18 6-18 6-6 18-6-18-18-6z" fill="#F6B51B"/><path d="M30 60c0-16 13-28 28-28" fill="none" stroke="#2F5BD3" stroke-width="6" stroke-linecap="round"/><circle cx="46" cy="312" r="6" fill="#2F5BD3"/>
<!-- ob3 -->
<circle cx="195" cy="180" r="150" fill="#EEF2FD"/><path d="M330 56l5-15 5 15 15 5-15 5-5 15-5-15-15-5z" fill="#2F5BD3"/><path d="M40 290l3-9 3 9 9 3-9 3-3 9-3-9-9-3z" fill="#F6B51B"/><path d="M300 300c20 0 36-10 44-26" fill="none" stroke="#2F5BD3" stroke-width="6" stroke-linecap="round"/>
```

**(spec)** The art box is laid out for a 390-wide page. On other widths, centre a fixed 390×350 box, or scale it by `W/390`.

## Appendix B: Keyframes and transitions, verbatim

```css
@keyframes hb-push{from{transform:translateX(28px);opacity:0}to{transform:none;opacity:1}}
@keyframes hb-rise{from{transform:translateY(56px);opacity:0}to{transform:none;opacity:1}}
@keyframes hb-fade{from{opacity:0}to{opacity:1}}
@keyframes hb-shimmer{0%{background-position:-240px 0}100%{background-position:240px 0}}
@keyframes hb-dot{0%,80%,100%{opacity:.25;transform:translateY(0)}40%{opacity:1;transform:translateY(-3px)}}
@keyframes hb-toast{from{transform:translate(-50%,14px) scale(.96);opacity:0}to{transform:translate(-50%,0);opacity:1}}
@media (prefers-reduced-motion:reduce){*{animation-duration:.01ms!important;transition-duration:.01ms!important}}
```

**Animation uses.**

| Keyframe | Timing | Where | RN (spec) |
|---|---|---|---|
| `hb-push` | .45s `cubic-bezier(.16,1,.3,1)` | login, register, post, messages, chat, notifications, settings | translateX 28 → 0 + opacity, 450 ms `ease.smooth`, native driver |
| `hb-rise` | .5s same | create | translateY 56 → 0 + opacity, 500 ms |
| `hb-fade` | .5s ease (onboarding), .35s ease (feed, explore, brief, profile; comments; brief rows; photo preview), .3s ease (story, Brief body, profile tab content, chat bubbles, search rows, Ask bubbles) | – | opacity 0 → 1, `ease.css` |
| `hb-shimmer` | 1.2s linear infinite; gradient `linear-gradient(90deg,#E4EAFA,#F8F9FE,#E4EAFA)`, `background-size:480px 100%` | Brief card, comment summary, polish, Ask loading | an SVG gradient 480 wide inside an `overflow:hidden` bar, `translateX` looping -240 → 240 (with the bar's own offset), 1200 ms linear |
| `hb-dot` | 1.2s infinite (default ease), delays 0 / .15s / .3s | typing indicator | `Animated.loop(sequence)`: 0–40% (480 ms) to opacity 1 and y -3, 40–80% (480 ms) back to .25 and 0, then hold 240 ms; staggered start |
| `hb-toast` | .45s `cubic-bezier(.16,1,.3,1)` | toast | translateY 14 → 0, scale .96 → 1, opacity 0 → 1 |

**Transitions.**

| Transition | Where |
|---|---|
| `transform .62s cubic-bezier(.16,1,.3,1)` | onboarding pager |
| `all .45s cubic-bezier(.16,1,.3,1)` | onboarding dots (width, colour); tab items |
| `transform .45s cubic-bezier(.16,1,.3,1)` | Brief segmented thumb; profile tab indicator |
| `transform .4s cubic-bezier(.16,1,.3,1)` | Brief card caret rotation |
| `transform .4s cubic-bezier(.34,1.3,.64,1)` | switch knob |
| `background .25s` | switch track |
| `transform .2s cubic-bezier(.16,1,.3,1)` | primary buttons (press .98); login button adds `opacity .2s` |
| `transform .25s cubic-bezier(.16,1,.3,1)` | story cards (press .96) |
| `transform .25s cubic-bezier(.34,1.56,.64,1)` | Like buttons (press .92; feed adds `background .15s`); FAB (press .9, rotate 90°) |
| `transform .3s cubic-bezier(.34,1.56,.64,1)` | story heart (press .85) |
| `transform .2s` | header pills (.94), composer pill (.98), social buttons (.98), Refresh (.96), tone and AI chips (.95), settings tiles (.97) |
| `all .2s` | Post button, Add friend, Join, topic chips, checkbox |
| `background .2s, transform .2s` | send buttons (press .9) |
| `border-color .2s` | login input error borders |
| `background .3s` | password strength bars |
| `background .4s` | notification row unread → read |
| `background .15s` | chat list row press |
| `color .2s` | profile tab labels |
| `color .3s` | status bar colour |
| `opacity .2s` | login button loading |
