# Harbor foundation: API reference for the screen engineers

This is the contract you build the 14 screens against. You should not need to open the foundation code. Read `SPEC.md` section 3 for your screens' layout and copy, and `DECISIONS.md` for the owner's choices, which override the spec. Paths below are relative to the repo root. Import paths are written from `src/screens/*`.

## File ownership (next phase)

Each engineer edits **only** the files in their row. You may add new files under your own component folder(s). Everything else is read-only.

| Engineer | Screens (edit) | Component folders (create / edit) |
|---|---|---|
| **B: auth + create + story** | `src/screens/WelcomeScreen.tsx`, `SignInScreen.tsx`, `SignUpScreen.tsx`, `NewPostScreen.tsx`, `StoryScreen.tsx` | `src/components/auth/*`, `src/components/story/*` |
| **C: feed + post** | `src/screens/HomeScreen.tsx`, `PostScreen.tsx` | `src/components/feed/*`, `src/components/post/*` |
| **D: social** | `src/screens/ExploreScreen.tsx`, `MessagesScreen.tsx`, `ConversationScreen.tsx`, `NotificationsScreen.tsx` | `src/components/social/*` |
| **A2: you + Brief** | `src/screens/BriefScreen.tsx`, `ProfileScreen.tsx`, `SettingsScreen.tsx`, `UserProfileScreen.tsx`, `EditProfileScreen.tsx` | `src/components/profile/*`, `src/components/brief/*` |
| **Shared: read-only for everyone** | `src/theme.ts`, `src/components/ui/*`, `src/components/Icon.tsx`, `src/components/Logo.tsx`, `src/navigation/*`, `src/state/*`, `src/data/*`, `src/services/*`, `App.tsx`, `src/screens/MainTabs.tsx`, `src/components/FloatingTabBar.tsx` | – |

Rules:
- **Need a shared change?** A missing icon, a store method, a primitive prop, or a route param: report it (what, why, and which screen) instead of editing. As a stopgap, write a local helper in your own folder.
- **Legacy files are gone.** The cleanup deleted the old components outside `ui/` (`Avatar`, `Button`, `TextField`, `Toast`, `PostCard`, `SettingsRow`, `SegmentedControl`, `Skeleton`, `ErrorState`, `LargeHeader`, `CollapsingHeader`, `AuthLayout`, `ProfileHeader`, `PostGrid`, `SummaryCard`, `SuggestedPeople`, `DigestIcon`, `GoogleG`, `blobs/*`, `chat/*`), `ActivityScreen`, `ChatScreen`, `src/data/chatReplies.ts`, the deprecated theme, tab-bar and icon aliases, and the Outfit fonts. The only components left outside `ui/` are `Icon`, `Logo`, `FloatingTabBar` and `useKeyboard`, plus each area's folder.
- Cross-area links go through **routes only**. For example, C's feed opens D's Messages with `nav.push({ name: 'Messages' })`. Never import another engineer's components.
- Screens never import `src/services/ai.ts` directly. Use the SocialContext hooks, which own the loading state.

## Contents

1. Conventions (read first)
2. Theme tokens
3. Icon and Logo
4. UI primitives (`src/components/ui`)
5. Navigation: routes, `useNav`, `useTabs`, `useGoToTab`
6. Insets and scroll clearance
7. Toasts
8. Status bar
9. StoreContext (posts, comments, profile)
10. SocialContext (stories, friends, chats, notifications, Brief, AI)
11. AI service (`ai.ts`)
12. AuthContext
13. Seed data and images
14. What the foundation does not do (known limits)

---

## 1. Conventions (read first)

- **Fonts.** Geist only, chosen through `fonts.*` (`fonts.regular | medium | semibold | bold`) or a `type.*` style. **Never set `fontWeight`**: Android ignores it on custom fonts.
- **Colours.** Only `colors.*` tokens. **Never `#000`** (the darkest ink is `colors.ink` `#18181B`). Alpha values the design uses are tokens too (`scrim60`, `ring06`, and so on).
- **No emojis** in copy, labels or code comments.
- **Animation.** Animate only `transform` and `opacity`, with `useNativeDriver: true`. Stop every animation and clear every timer on unmount, using `return () => anim.stop()` in the effect. Honour reduce motion with `useReduceMotion()` (`duration: reduce ? 0 : d`). Use `ease.*` and `duration.*` from the theme. Pause perpetual loops when they are off screen (`useOnScreen()`, §5).
- **Accessibility.** Every control has an `accessibilityLabel`, and icon-only controls need one too (`IconButton` requires it). Use `accessibilityRole` and `accessibilityState` (selected, checked, disabled, busy). Touch targets are **≥ 44**: the primitives pad smaller boxes with `hitSlop`. Pad your own small controls the same way.
- **Use the shared primitives.** Never reimplement a button, chip, avatar, toggle, field, header, toast, shimmer, bubble or composer. If a primitive is almost right, use its `style` prop or report the gap.
- **Pressed states.** Use `PressableScale` (or a primitive built on it) with the design's `pressedScale`. Don't use `TouchableOpacity`.
- **Images.** Remote images (picsum, pravatar) need the network. Give image boxes `backgroundColor: colors.line` (`#E4E4E7`) as the placeholder.
- **Copy** is verbatim from SPEC section 3. Names come from data (`firstNameOf(user.name)`), never a hard-coded "Noor".
- **Blur.** None (DECISIONS #1). Translucent bars use `colors.barFallback` (`rgba(255,255,255,.86)`) plus a hairline. Fade zones use `Gradient`.
- **Formatting.** Run `npx prettier --write` on your files, then `npx tsc --noEmit`, `npx eslint src App.tsx __tests__` and `npx jest`. All four must be clean.

---

## 2. Theme tokens (`import { colors, fonts, type, radius, space, shadow, elevation, ease, duration, layout, hitSlop } from '../theme'`)

### colors

| Token | Value | Token | Value |
|---|---|---|---|
| `bg` | `#FFFFFF` | `accent` | `#2F5BD3` |
| `ink` | `#18181B` | `accentInk` | `#2447AE` |
| `ink2` | `#27272A` | `accentSoft` | `#EEF2FD` |
| `inkSoft` | `#3F3F46` | `aiSurface` | `#F5F7FE` |
| `sub` | `#52525B` | `aiBorder` | `#E1E8FB` |
| `muted` | `#71717A` | `aiChipBorder` | `#DCE3F8` |
| `faint` | `#A1A1AA` | `shimmerBase` | `#E4EAFA` |
| `border` | `#D4D4D8` | `shimmerHi` | `#F8F9FE` |
| `line` | `#E4E4E7` | `danger` | `#DC2626` |
| `hairline` | `#F0F0F2` | `warning` | `#D97706` |
| `fill` | `#F4F4F5` | `online` | `#22C55E` |
| `pressed` | `#FAFAFA` | `sunny` | `#F6B51B` (onboarding confetti) |
| `onAccent` | `#FFFFFF` | `toastIcon` | `#8FB0FF` |
| `storyBg` | `#0B0B0C` | `onInkMuted` | `rgba(255,255,255,0.72)` |
| `toastBg` | `rgba(24,24,27,0.9)` | `scrim60` | `rgba(24,24,27,0.6)` |
| `scrim50` | `rgba(24,24,27,0.5)` | `scrim35` | `rgba(24,24,27,0.35)` |
| `ring06` | `rgba(24,24,27,0.06)` | `ring05` | `rgba(24,24,27,0.05)` |
| `ringWhite18` | `rgba(255,255,255,0.18)` | `barFallback` | `rgba(255,255,255,0.86)` (**use this for bars**) |
| `barHeader` | `rgba(255,255,255,0.82)` | `barComposer` | `rgba(255,255,255,0.86)` |
| `barChat` | `rgba(255,255,255,0.88)` | | |

Other verbatim alphas (story gradients `rgba(11,11,12,.55/.0/.6)`, `rgba(255,255,255,.35)` story track, `.55` story input border, `.08` story input bg, `.9` story avatar ring) are written inline from SPEC §2.1.

### fonts
`regular: 'Geist-Regular'`, `medium: 'Geist-Medium'`, `semibold: 'Geist-SemiBold'`, `bold: 'Geist-Bold'`.

### type (TextStyle presets; `color` is included, so override it per use)

| Name | Font / size | lineHeight / letterSpacing | Default colour | Used for |
|---|---|---|---|---|
| `largeTitle` | bold 32 | 38 / -1.44 | ink | Explore, Messages, Notifications, Brief, Menu |
| `obTitle` | semibold 31 | 33.48 / -1.085 | ink | onboarding h1 |
| `authTitle` | semibold 30 | 33 / -1.05 | ink | Welcome back, Create your account |
| `profileName` | bold 26 | – / -0.91 | ink | profile name |
| `composer` | regular 22 | 30.8 / -0.22 | ink | create textarea |
| `composerSm` | regular 17 | 23.8 / -0.17 | ink | create textarea when long or with a photo |
| `wordmark` | bold 18 | – / -0.72 | ink | "harbor" |
| `headerPill` | semibold 18 | – / -0.54 | ink | "Home" pill |
| `section` | semibold 18 | – / -0.36 | ink | Groups for you, Ask Harbor |
| `navTitle` | semibold 17 | – / -0.255 | ink | {First}'s post, Create post |
| `listHeader` | semibold 17 | – / -0.34 | ink | New, Earlier |
| `chatName` | semibold 17 | – | ink | chat intro name |
| `cta` | semibold 16 | – | onAccent | primary buttons |
| `lead` | regular 16 | 24 | sub | auth and onboarding subcopy |
| `input` | regular 16 | – | ink | auth inputs |
| `rowTitle` | semibold 16 | – | ink | settings card name, chat header name |
| `bodyLg` | regular 15.5 | 22.48 | ink2 | post detail text |
| `searchInput` | regular 15.5 | – | ink | search |
| `body` | regular 15 | 21.75 | ink2 | feed text, bio |
| `name` | semibold 15 | – / -0.15 | ink | post author, Brief card title |
| `bubble` | regular 15 | 20.7 | ink | chat bubbles |
| `bodySm` | regular 14.5 | 20.59 | ink2 | brief rows |
| `comment` | regular 14.5 | 20.3 | ink2 | comments, notifications |
| `ask` | regular 14.5 | 21.03 | ink2 | Ask bubbles |
| `button14_5` | semibold 14.5 | – | ink | profile buttons and tabs, Mark all read |
| `button` | semibold 14 | – | ink | action bar, Confirm/Delete |
| `small` | regular 14 | 20.3 | ink2 | summaries, footers |
| `chip` | semibold 13.5 | – | ink | chips, Add friend |
| `chipAi` | medium 13.5 | – | accentInk | AI chips |
| `label` | semibold 13 | – | inkSoft | form labels |
| `overline` | semibold 13, uppercase | – / 0.39 | muted | section overlines |
| `meta` | regular 13 | – | muted | timestamps |
| `caption` | regular 12.5 | – | muted | captions |
| `micro` | regular 12 | – | muted | small labels |
| `tiny` | regular 11.5 | – | muted | "AI · may miss context" |

### radius
`xs 6`, `chipSm 8`, `btnSm 10`, `btn 11`, `md 12`, `input 14`, `lg 16`, `xl 18`, `card 20`, `cardLg 22`, `pill 999`. Other verbatim radii (7, 9, 17, 26, 31, 36, …) are written inline.

### space
`xxs 2`, `xs 4`, `s6 6`, `sm 8`, `s10 10`, `md 12`, `s14 14`, `lg 16`, `s18 18`, `s20 20`, `s22 22`, `xl 24`, `s28 28`, `gutter 16` (app), `authGutter 24` (auth).

### shadow (CSS strings for the New Architecture `boxShadow` prop) and elevation (ready style objects)
`shadow.pill | chip | obCard | tabBar | fab | toast | knob | thumb | btnHighlight | headerHairline | composerHairline` hold the verbatim CSS from SPEC §2.5. The 1px inner rings are `shadow.ringLine` (`#E4E4E7`), `ringAi` (`#E1E8FB`), `ringAiChip` (`#DCE3F8`), `ringWhite18` and `ringInk06`.
Use `style={{ boxShadow: shadow.pill }}` or spread `elevation.pill` (`elevation.*` covers every non-ring key above). A ring can also be `borderWidth: 1, borderColor: colors.line`. `legacyShadow.*` holds iOS/Android fallbacks, only needed if `boxShadow` misbehaves on a device.

### ease and duration
- `ease.smooth` cubic-bezier(.16,1,.3,1); `ease.spring` (.34,1.56,.64,1); `ease.knob` (.34,1.3,.64,1); `ease.css` (CSS `ease`); `ease.linear`.
- `duration`: `press 200`, `pressSpring 250`, `storyHeart 300`, `chip 200`, `fade 350`, `fadeSm 300`, `fadeLg 500`, `push 450`, `rise 500`, `pager 620`, `tab 450`, `thumb 450`, `caret 400`, `knob 400`, `track 250`, `toast 450`, `toastOut 200`, `toastHold 2200`, `shimmer 1200`, `dot 1200`, `story 5000`, `typing 1600`.

### layout, blur, hitSlop
- `layout.tabBar = { height 62, side 16, bottom 30, gap 10, pad 7, itemH 48, fab 62 }`, `layout.feedHeaderZone 132`, `layout.tabZone 140`, `layout.headerPillH 44`.
- `blur = { header 20, zone 16, chip 10, toast 14 }` is reference only (no blur package).
- `hitSlop = { top:10, bottom:10, left:10, right:10 }`.

### Removed aliases
The cleanup removed `colors.canvas | lineSoft | onInk | skyTop | skyBottom`, `blob.*`, `fonts.heavy`, `type.display | hero | title | bodyStrong`, `radius.sm`, `space.xxl`, `shadow.soft | lifted`, the legacy Icon names, the Icon `filled` / `strokeWidth` props, `resolveIconName`, `LegacyIconName`, `LegacyTabKey`, `useTabBar().minimized / setMinimized`, `useTabBarScrollHandler()` and `useAppToastOrNull()`. Use the tokens above.

---

## 3. Icon and Logo

```tsx
import { Icon, Logo } from '../components/ui';
<Icon name="heart" weight="fill" size={20} color={colors.accent} />
<Logo size={32} />   // also exported as HarborLogo; sizes 30 / 32 / 56
```

`Icon` props: `name: IconName`, `weight?: 'regular' | 'fill' | 'bold'` (default regular; `ph ph-x` = regular, `ph-fill ph-x` = fill), `size?` (default 24; equals the design's CSS font-size), `color?` (default ink), `style?`. Icons are decorative, so put the label on the pressable that holds them. Types: `IconName` (the same as `PhosphorName`), `PhosphorName`, `IconWeight`.

**Available Phosphor names (every icon in the design, plus a few extras):**
`house, compass, sparkle, caret-left, caret-right, caret-down, caret-up, arrow-clockwise, arrow-right, arrow-left, arrow-up, arrow-counter-clockwise, arrows-in-line-horizontal, x, warning-circle, eye, eye-slash, check, check-circle, magnifying-glass, images, image, image-square, camera, plus, note-pencil, pencil-simple, text-align-left, chart-bar-horizontal, sun, users, users-three, user, user-plus, dots-three, dots-three-vertical, chat-circle, chat-circle-dots, share-fat, share-network, heart, bell, paper-plane-tilt, paper-plane-right, phone, video-camera, star, globe-hemisphere-west, google-logo, apple-logo, map-pin, cake, clipboard-text, gear-six, briefcase, house-line, graduation-cap, calendar-blank, bookmark-simple, circles-three-plus, clock-counter-clockwise, rows, prohibit, download-simple, at, sign-out, lock, question, trash, anchor, squares-four`.

The old hand-drawn names (`home`, `back`, `close`, `settings` and so on) were removed in cleanup. Use the Phosphor names.

The notification kind badge icon map is `NOTIFICATION_ICON` in `src/data/types.ts` (render it with weight fill).

---

## 4. UI primitives

All are imported from `'../components/ui'` (from a screen) or `'../../components/ui'` (from `src/components/<area>/`). They take plain props: no store or navigation inside.

### PressableScale
Props: everything from `Pressable` except `style`, plus `style?`, `pressedScale?` (default .97; the design uses .98/.97/.96/.95/.94/.92/.9/.85), `spring?` (250 ms spring curve instead of 200 ms smooth), `pressedBg?`, `pressedRotate?` (degrees). `accessibilityRole` defaults to `button`.
`<PressableScale pressedScale={0.96} onPress={open} accessibilityLabel="Ines's story">…</PressableScale>`

### Avatar
Props: `uri?`, `name?` (initials fallback on `#E4E4E7`), `size?` (40), `story?: 'unseen' | 'seen'` (3px accent / border-grey edge), `border?: {width, color}` (inside the size), `ring?: {width, color}` (outer, no layout), `online?: 'lg' | 'sm'`, `style?`, `accessible?` (default false = decorative).
`<Avatar uri={u.photoUrl} name={u.name} size={36} story={isSeen ? 'seen' : 'unseen'} />`

### Button and ButtonRow
`Button` props: `label`, `onPress?`, `variant?: 'primary' | 'outline' | 'soft' | 'muted' | 'tint' | 'dangerText' | 'ghost' | 'link' | 'ai'` (primary; `link` is accent text on no fill; `ai` is white with `accentInk` text and the 1px `aiChipBorder` ring, the Brief card's "Refresh"), `size?: 'pill' | 'lg' | 'social' | 'block' | 'md' | 'confirm' | 'sm' | 'xs' | 'ghostLg' | 'text'` (lg; `text` is 44 tall, p 0 4, 14/600, for links), `icon?`, `iconWeight?`, `iconSize?` (defaults to the size preset's), `iconPosition?: 'left' | 'right'`, `loading?`, `loadingLabel?`, `disabled?`, `flex?`, `highlight?` (default true: the primary's inset top highlight; pass `false` for the design's flat primaries: Explore Join, Brief Reply, Edit profile), `pressedScale?` (overrides the preset's), `style?`, `labelStyle?`, `accessibilityLabel?`, `accessibilityHint?`, `testID?`.
The sizes: pill 56/r999, lg 54/r16, social 52/r16, block 50/r16, md 40/r12, confirm 36/r11, sm 34/r11, xs 32/r10, ghostLg 44, text 44. Each size carries its own pressed scale. Override the font size per design with `labelStyle`, for example `labelStyle={{ fontSize: 14.5 }}`. Buttons under 44 tall get vertical `hitSlop` automatically.
`<Button size="sm" label="Reply" highlight={false} onPress={reply} />`
`<Button variant="ai" size="xs" label="Refresh" icon="arrow-clockwise" iconSize={13} pressedScale={0.96} loading={loading} onPress={refresh} style={styles.refresh} />` (the style sets `paddingHorizontal: 12`)
`<Button variant="link" size="text" label="Forgot password?" onPress={reset} style={{ alignSelf: 'flex-end' }} />`
`<Button label="Sign in" loadingLabel="Signing in…" loading={busy} onPress={submit} />`
`ButtonRow` props: `children`, `gap?` (8), `style?`. `<ButtonRow><Button flex …/><Button flex variant="soft" …/></ButtonRow>`

### IconButton
Props: `icon`, **`accessibilityLabel` (required)**, `onPress?`, `weight?`, `iconSize?` (24), `color?` (ink), `size?` (44 box), `width?`, `background?`, `radius?`, `pressedScale?` (.92), `pressedBg?`, `pressedRotate?`, `spring?`, `disabled?`, `style?`, `children?` (for a badge or dot overlay), `testID?`.
`<IconButton icon="x" iconSize={22} size={40} accessibilityLabel="Close" onPress={nav.pop} />`

### Chip
Props: `label`, `onPress?`, `variant?: 'topic' | 'ai' | 'tone' | 'audience'` (topic), `selected?`, `icon?`, `compact?` (ai 32-tall smart replies), `dimmed?`, `disabled?`, `style?`, `accessibilityLabel?`.
`<Chip variant="ai" compact label={r} onPress={() => send(r)} />`

### TextField and SearchField
`TextField` props: every `TextInput` prop except `style`, plus `label?`, `error?`, `errorIcon?` (login true, register false), `helper?` (also the default `accessibilityHint`), `secure?`, `secureToggle?` (eye button), `below?` (a strength meter slot), `multiline?` (grows with its text from 52 tall, padding 14 16, top-aligned, `type.body` line height), `containerStyle?`, `inputStyle?` (merged last onto the `TextInput`, for example a taller `minHeight`). It forwards its ref to the `TextInput`.
`<TextField label="Email" placeholder="noor@haddad.studio" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} error={err.email} errorIcon />`
`<TextField label="Bio" multiline inputStyle={styles.bio} maxLength={150} helper={`${bio.length}/150`} value={bio} onChangeText={setBio} />` (`styles.bio` is `{ minHeight: 112 }`)
`SearchField` props: `TextInput` props plus `containerStyle?`. It is 44 tall with the magnifier.
`<SearchField placeholder="Search people, groups, posts" value={q} onChangeText={setQ} containerStyle={{ marginHorizontal: 16, marginTop: 12 }} />`

### Header (`compact` = Post / Chat bar; `large` = large-title screens)
- `compact` props: `variant: 'compact'`, `title?` or `children?` (custom middle), `onBack?`, `backLabel?`, `right?`, `barHeight?` (48 for Post, **54 for Chat**), `hairline?` (true), `floating?` (true: absolute over the scroll), `style?`. Its bg is `barFallback`, and its height is `insets.top + barHeight`.
  `<Header variant="compact" title={`${first}'s post`} onBack={nav.pop} />`
- `large` props: `variant: 'large'`, `title`, `onBack?`, `backLabel?`, `right?`, `leading?` (Brief's square sparkle), `safeTop?` (true: adds `insets.top`), `style?`. Put it **inside** the ScrollView. With back/right it renders the 44px icon row (p 4 8 0); without, the title gets p 10 16 0.
  `<Header variant="large" title="Messages" onBack={nav.pop} right={<IconButton icon="note-pencil" iconSize={22} accessibilityLabel="New message" onPress={…} />} />`
  For a text action such as "Mark all read", use `right={<Button variant="link" size="text" label="Mark all read" labelStyle={{ fontSize: 14.5 }} onPress={…} />}`.

### AICard and SparkleBadge
`AICard` props: `title?`, `subtitle?`, `header?: 'inline' | 'badge' | 'none'` (inline), `right?`, `loading?` (shimmer lines), `loadingLines?` (widths; default `['100%','72%']`), `typing?`, `radius?` (20; feed Brief 22, notification summary 18), `padding?: {vertical, horizontal, top, bottom}` (13/14), `children?`, `style?`.
`<AICard title="Comment summary" subtitle={`· ${n} comments`} right={refreshBtn} loading={s.loading}><Text style={type.small}>{s.displayText}</Text></AICard>`
`SparkleBadge` props: `shape?: 'circle' | 'square'`, `size?` (32 circle / 36 square). `<SparkleBadge shape="square" />`

### Shimmer, ShimmerLines, Skeleton
`Shimmer` props: `height?` (12), `width?` ('100%'), `radius?` (6), `style?`. It pauses in hidden tab panes.
`ShimmerLines` props: `widths?` (`['100%','86%','64%']`), `height?` (12), `radius?` (6), `gap?` (9), `padding?: { vertical?, horizontal? }` (4 / 0), `style?`. For the Ask bubble use `widths={['100%','60%']} height={10} radius={5} gap={7} padding={{ vertical: 0 }}`.
`Skeleton` props: `width?`, `height?`, `radius?`, `circle?`, `style?`. It is a plain `#F4F4F5` block for first-load lists only.

### TypingDots
Props: `bubble?` (true: wraps them in the chat "their" bubble), `style?`. `{chat.typing ? <TypingDots /> : null}`

### Bubble
Props: `text`, `mine`, `variant?: 'chat' | 'ask'` (chat 76% / ask 84%), `animate?` (fade in, true), `style?`. Render inside a full-width column, with gap 5 in chat.
`<Bubble text={m.text} mine={m.fromMe} />`

### ComposerBar
Props: `value`, `onChangeText`, `onSend(trimmedText)`, `placeholder`, `left?` (34 avatar or 38 photo IconButton), `top?` (smart-reply row), `tone?: 'post' | 'chat'`, `onHeight?(h)` (pad your scroll bottom with it), `onFocus?`, `onBlur?`, `maxLength?` (caps typed text; values you set in code are not cut), `editable?` (default true), `autoFocus?`, `disabled?` (blocks sending: Send greys out and the keyboard's send key does nothing, but typing still works), `style?`, `accessibilityLabel?`. It forwards its ref to the `TextInput` (`ref.current?.focus()`). It is absolutely positioned at the bottom and rides the keyboard.
`<ComposerBar ref={inputRef} tone="post" value={draft} onChangeText={setDraft} onSend={submit} maxLength={500} disabled={!post || sending} placeholder="Write a comment…" left={<Avatar uri={me.photoUrl} name={me.name} size={34} />} onHeight={setComposerH} />`

### ListGroup, ListRow, ToggleRow (Settings)
`ListGroup` props: `children`, `style?` (white r18 group, margin 0 16).
`ListRow` props: `label`, `icon?`, `value?`, `chevron?` (true), `onPress?` (rows without it are inert), `last?`, `style?`.
`ToggleRow` props: `label`, `sub?`, `value`, `onValueChange(next)`, `last?`, `style?`. The whole row toggles, and it carries `accessibilityRole="switch"`.
`<ListGroup>{aiSettingRows.map((r, i) => <ToggleRow key={r.key} label={r.label} sub={r.sub} value={settings[r.key]} onValueChange={v => set(r.key, v)} last={i === aiSettingRows.length - 1} />)}</ListGroup>`

### Toggle
Props: `value`, `onValueChange?` (omit inside a row that handles the tap), `accessibilityLabel?`, `disabled?`. It is the design's 51×31 switch. Never use the platform `Switch`.

### SegmentedControl and SegmentedTabs
Both take `tabs: string[]`, `index`, `onChange(i)`, `style?`. `SegmentedControl` is the Brief pill (h38). `SegmentedTabs` is the profile underline tabs (h46, sliding accent bar).
`<SegmentedTabs tabs={['Posts','Photos','About']} index={tab} onChange={setTab} />`

### Overline
Props: `children: string`, `padding?: {top, horizontal, bottom}` (22/16/8), `tight?` (PEOPLE letter-spacing), `style?`. `<Overline padding={{ horizontal: 28 }}>Harbor AI</Overline>` (the text is uppercased for you).

### Badge, IconBadge, UnreadDot
`Badge` props: `label`, `tone?: 'scrim' | 'count'`, `style?`. `<Badge label="3 photos" style={{ position: 'absolute', top: 10, right: 26 }} />`
`IconBadge` props: `icon`, `size?` (24), `iconSize?` (12), `borderWidth?` (2.5), `color?`, `style?`. `<IconBadge icon={NOTIFICATION_ICON[n.kind]} style={{ position: 'absolute', right: -3, bottom: -3 }} />`
`UnreadDot` props: `size?` (10), `ring?` (2px white, for the messages-button dot at size 9), `color?`, `style?`.

### EmptyState and ErrorState
`EmptyState` props: `icon?` (magnifying-glass), `title`, `body?`, `actionLabel?`, `onAction?`, `style?`. `<EmptyState title={`No one matches "${q}"`} body="Try a first name, or search a group." />`
`ErrorState` props: `title?`, `message?`, `onRetry?`, `retryLabel?`, `retrying?`, `style?`.

### Gradient
Props: `stops: {offset 0..1, color}[]`, `direction?: 'down' | 'up' | 'right'` (down = CSS 180deg), `style?`. It is non-interactive.
`<Gradient style={StyleSheet.absoluteFill} stops={[{ offset: 0.45, color: 'rgba(24,24,27,0)' }, { offset: 1, color: 'rgba(24,24,27,0.6)' }]} />`

### FadeIn
Props: `children`, `duration?` (350; use 300 for bubbles and tab content, 500 for onboarding), `delay?`, `style?`. It runs `hb-fade` on mount. `<FadeIn duration={300}>{rows}</FadeIn>`

### Hooks
- `useReduceMotion(): boolean`.
- `useToast()` (§7).
- From `'../navigation/PaneVisibleContext'`: `usePaneVisible()` (false in a hidden tab pane) and `useOnScreen()` (pane visible **and** top of the stack; use it to pause loops such as the story timer).
- From `'../components/useKeyboard'`: `useKeyboard(): { visible, height }` and `useKeyboardVisible()`.
- `useScreenKey()` and the other navigation hooks are in §5.

---

## 5. Navigation

```tsx
import { useNav, useBackOverride, useIsTopScreen, useTopRoute, useScreenKey } from '../navigation/Navigator';
import { useTabs, useGoToTab, useScrollToTop } from '../navigation/TabBarContext';
```

### Routes (`Route` in `src/navigation/Navigator.tsx`)

| Route | Params | Push with | Screen |
|---|---|---|---|
| `Welcome` | – | (auth root) | WelcomeScreen |
| `SignIn` | – | `nav.push({ name: 'SignIn' })` | SignInScreen |
| `SignUp` | – | `nav.push({ name: 'SignUp' })` | SignUpScreen |
| `Tabs` | – | (app root) | MainTabs |
| `Post` | `postId: string`, `focusComment?: boolean` | `nav.push({ name: 'Post', postId })` | PostScreen |
| `NewPost` | `initialText?: string`, `withPhoto?: boolean` | **`nav.push({ name: 'NewPost', withPhoto: true }, 'modal')`** | NewPostScreen |
| `Story` | `index: number` (into `useStories().stories`) | **`nav.push({ name: 'Story', index: i }, 'fade')`** | StoryScreen |
| `User` | `userId: string` | `nav.push({ name: 'User', userId })` | UserProfileScreen |
| `EditProfile` | – | `nav.push({ name: 'EditProfile' })` | EditProfileScreen |
| `Settings` | – | `nav.push({ name: 'Settings' })` | SettingsScreen |
| `Messages` | – | `nav.push({ name: 'Messages' })` | MessagesScreen |
| `Conversation` | `chatId: string` | `nav.push({ name: 'Conversation', chatId })` | ConversationScreen |
| `Notifications` | – | `nav.push({ name: 'Notifications' })` | NotificationsScreen |

`useNav()` returns:
- `push(route, presentation?)`.
- `pop()`.
- `replace(route)`: push, then drop the screen below.
- `popTo(route, presentation?)`: back to the nearest screen below the top with `route.name` (that screen keeps its own params). The top animates out and the screens in between drop. If no such screen is in the stack, it pushes `route` instead. If the top already has that name, it does nothing. Register's "Sign in" link uses `nav.popTo({ name: 'SignIn' })`.
- `dismiss(screenKey)`: closes one specific screen, animated if it is on top and instantly if it is covered. Get your own key from `useScreenKey()`.
- `popToRoot()`: the top screen animates out, the covered ones drop.

Motion (DECISIONS #2) is built in, so don't animate screen entrances yourself:
- `'card'` (default) is `hb-push`: translateX 28→0 plus a fade, 450 ms `ease.smooth`.
- `'modal'` is `hb-rise`: translateY 56→0 plus a fade, 500 ms.
- `'fade'` is opacity only, 300 ms.
- Back reverses the same path and timing. Reduce motion makes all of them instant.
- Tab switches fade the pane in (`hb-fade` 350 ms, in MainTabs).

Other helpers:
- `useBackOverride(fn)` takes over Android back for your screen (for example, a discard-draft confirm). Your handler decides whether to `pop()`.
- `useIsTopScreen()`: true while your screen is the top one.
- `useTopRoute()`: the route on top of the stack (null outside a navigator).
- `useScreenKey()`: the stable key of the screen you render inside (`''` outside a navigator). Pair it with `dismiss` to close your own screen even while it is covered. For example, Post closes itself when its post is deleted: `const key = useScreenKey(); … nav.dismiss(key)`.
- `useOpenProfile()` (`src/navigation/useOpenProfile.ts`): a stable `(userId) => void` that pushes `User`, or goes to the Profile tab for my own id. Pass it to memoised cards as `onAuthor`.
- **Double-push guard:** `push` / `replace` are ignored while a screen is still entering, and when the top route already has the same name and params (`sameRoute`).

### Tabs
- `TabKey = 'home' | 'explore' | 'brief' | 'profile'`.
- `useTabs()` returns `{ tab, setTab(tab), scrollToTop(tab) }`.
- **`useGoToTab()`** returns `(tab, { scrollTop?: boolean }?) => void`. This is the design's `tab(x)` from a pushed screen: it runs `popToRoot()`, then `setTab(tab)`, then optionally scrolls that tab to the top. Examples:
  - Create "Post": `goToTab('home', { scrollTop: true })`.
  - Settings profile card: `goToTab('profile')`.
  - Feed Brief card "Full brief": `goToTab('brief')`.
  - Brief "Reply": `nav.push({ name: 'Conversation', chatId: 'c1' })`.
- `useScrollToTop(tabKey, fn)`: each tab screen registers its scroll-to-top so a second tap on its active tab scrolls up, for example `useScrollToTop('home', () => listRef.current?.scrollToOffset({ offset: 0, animated: true }))`.
- Tab panes stay mounted. Hidden panes get `usePaneVisible() === false`.
- Auth success needs no navigation. `AuthContext` flips the user and App swaps to the app stack at the Home tab. Toast after awaiting the sign-in. **Log out** (`useAuth().signOut()`) lands on SignIn stacked over Welcome automatically.

---

## 6. Insets and scroll clearance

`import { useSafeAreaInsets } from 'react-native-safe-area-context'` and `import { useTabBarClearance, useTabBarOffset, TAB_BAR_HEIGHT, FAB_SIZE, TAB_ZONE_HEIGHT } from '../navigation/insets'`.

- The design's top 50 is `insets.top`. Keep the offset: `top: 52` becomes `insets.top + 2`, `top: 54` becomes `insets.top + 4`, `top: 68` becomes `insets.top + 18`.
- The design's bottom 30 is `Math.max(insets.bottom, 16)`. Add the extra on top: 32 becomes `Math.max(insets.bottom, 16) + 2`, 34 becomes `+ 4`.
- `useTabBarOffset()` is the bar's distance from the bottom, `max(insets.bottom - 4, 14)`.
- `useTabBarClearance(extra = 20)` returns `offset + 62 + extra`, the bottom padding a tab's scroll needs.

| Screen | Design padding | Use |
|---|---|---|
| Feed (tab) | top 110, bottom 130 | top `insets.top + 60`; bottom `useTabBarClearance(38)` |
| Explore (tab) | top 50, bottom 100 | top `insets.top` (Header large adds it via `safeTop`); bottom `useTabBarClearance(8)` |
| Brief (tab) | top 50, bottom 104 | bottom `useTabBarClearance(12)` |
| Profile (tab) | bottom 100 | bottom `useTabBarClearance(8)`; cover gear at `top: insets.top + 2` |
| Post | top 98, bottom 110 | top `insets.top + 48` (compact Header 48); bottom = ComposerBar `onHeight` + 10 |
| Chat | top 112, bottom 150 | top `insets.top + 54 + 8` (Header `barHeight={54}`); bottom = ComposerBar `onHeight` + 10 |
| Messages, Notifications, Settings | top 50, bottom 40 | Header large `safeTop`; bottom `Math.max(insets.bottom, 16) + 10` |
| Create (modal) | top 50; toolbar bottom 34 | top `insets.top`; toolbar paddingBottom `Math.max(insets.bottom, 16) + 4` |
| Story | bars top 54, header top 68, footer bottom 32 | `insets.top + 4`, `insets.top + 18`, `Math.max(insets.bottom, 16) + 2` |
| Auth | p 50 24 30 | top `insets.top`, sides `space.authGutter`, bottom `Math.max(insets.bottom, 16)` |
| Onboarding | top 50, bottom 30 | `insets.top`, `Math.max(insets.bottom, 16)` |

---

## 7. Toasts

```tsx
import { useToast } from '../components/ui';
const toast = useToast();
toast.show('Link copied');                       // check-circle icon, 2200 ms
toast.show('Couldn\'t reach Harbor AI', { icon: 'warning-circle' }); // or { icon: null }
```

- There is one app-level host (`ToastProvider` in `App.tsx`), so toasts survive push, pop and the auth to app switch. A new toast replaces the current one.
- **Placement is automatic** from the top route. With the tab bar (`Tabs`) it sits 106 from the bottom. On `Post` and `Conversation` it sits at 96, above the composer; on `NewPost` at 110, above the toolbar; on `Story` at 90, above the reply row. Elsewhere it sits at 40. Each value is shifted by the real bottom inset.
- With the keyboard open the toast rides above it. A screen whose bar rides the keyboard registers that bar's height with `useToastKeyboardBar(height, useIsTopScreen())` (Post, Conversation, NewPost, Story do), so the toast clears the bar too.
- It enters with `hb-toast` (450 ms), holds 2200 ms and fades out over 200 ms.

---

## 8. Status bar

`App.tsx` owns it. Don't render `<StatusBar>` in a screen. It is `light-content` (white) when the top route is `Story`, or `Tabs` with the `profile` tab active, and `dark-content` everywhere else (including Settings pushed over Profile). The auth stack is always dark. Build dark backgrounds (Story) edge to edge under the status bar.

---

## 9. StoreContext (`import { useStore, usePost, useComments, useUserPosts, useLikedPosts, useUser } from '../state/StoreContext'`)

`useStore()` returns `StoreValue` (`src/state/storeTypes.ts`):

- `mode: 'firebase' | 'demo'`, `meId: string`, `isMe(userId): boolean`.
- Feed:
  - `posts: Post[]` (newest first).
  - `feedState: 'loading' | 'ready' | 'error'` and `feedError?`.
  - `hasMore`.
  - `refreshFeed(): Promise<void>`.
  - `loadMore(): Promise<void>`, which rejects with a user-facing Error (toast it).
- `getUser(userId): User` is a sync cache: unknown ids return a nameless placeholder, so prefer `usePerson` (§10). `otherUsers: User[]`.
- Mutations are optimistic and reject with a safe message (toast `e.message`):
  - `toggleLike(postId)`: it toggles. **For double-tap call it only when `!post.likedByMe`** (DECISIONS #10).
  - `addComment(postId, text)`.
  - `createPost({ text, image?: LocalImage, place?, audience? }, onProgress?)`. In demo mode attach the placeholder photo as `image: { uri: draftPhoto() }`. In Firebase mode use `pickImage()` from `src/services/media.ts`.
  - `deletePost(postId)`.
- Follow graph (feed plumbing; the UI shows friend language from §10):
  - `following: Record<string, boolean>`.
  - `followingState` and `followingError?`.
  - `toggleFollow(userId)`.
- Legacy `activity`, `activityState`, `unreadCount` and `markAllRead()`. Don't use them for the design's notifications (use `useNotifications`).
- Profile:
  - `updateProfile({ name?, handle?, bio?, location? })`.
  - `uploadAvatar(image, onProgress?)`.
  - `prefs: Prefs` and `setPref(key, value)` (old push prefs, dropped from Settings per DECISIONS #8).

Live hooks return `Live<T> = { data: T; state: LoadState; error?: string }`:
- `usePost(postId): Live<Post | undefined>`.
- `useComments(postId): Live<Comment[]>` (oldest first).
- `useUserPosts(userId | 'me'): Live<Post[]>`.
- `useLikedPosts(): Live<Post[]>`.
- `useUser(userId | 'me'): Live<User>`.

Data shapes (`src/data/types.ts`):
- `Post`:
  - Identity and content: `id`, `authorId`, `text`, `imageUrls: string[]`, `aspect: '4/3' | '4/5'`, `place?`.
  - Counts and state: `shareCount`, `audience?: 'friends' | 'public' | 'close'`, `createdAt`, `likeCount`, `likedByMe`, `commentCount`, `pending?`.
  - Helpers: `postImages(post)` lists the photos (legacy-safe). `aspectRatioOf(post.aspect)` gives the number for the `aspectRatio` style. `postTime(createdAt)` from `src/data/time.ts` gives "Just now / 42m / 1h / Yesterday / 2 days ago / Sep 19".
- `Comment`: `id`, `postId`, `authorId`, `text`, `createdAt`, `likeCount?` (seed count; read the live count from `useCommentLikes`), `pending?`.
- `User`:
  - Core: `id`, `name`, `handle?`, `photoUrl?`, `bio?`, `location?`, `postsCount?`.
  - Social: `mutualCount?`, `coverUrl?`, `friendsCount?`, `albumsCount?`.
  - Profile tabs: `about?: {icon, text}[]`, `photos?: string[]`.
  - Helper: `firstNameOf(name)`.

---

## 10. SocialContext (`import { … } from '../state/SocialContext'`)

This is local demo state in **both** modes (DECISIONS #12), seeded from `src/data/social.ts` and in memory for the session. Each hook returns a memoised object.

| Hook | Returns |
|---|---|
| `usePerson(userId): User` | Any seed person id or `'me'`. Falls back to the seed while the cache is cold and in Firebase mode. |
| `useMe(): User` | The signed-in user, memoised (stable until it changes). `photos` lead with my posts' images, newest first. Demo mode adds the persona's `coverUrl`, `about`, seed photos, `friendsCount` (live) and `albumsCount`, and `postsCount` is the seed total plus my session posts. Firebase mode never shows the persona: `about` comes from `location`, `friendsCount` / `albumsCount` are undefined (omit them), `postsCount` is my real count. Use it for Profile, the Settings card and composer avatars. |
| `usePeople(): (userId) => User` | `person()` for lists. |
| `usePeopleSearch(query): User[]` | Explore search: everyone except me whose name contains the query (case-insensitive), in design order. Blank returns `[]`. |
| `useStories()` | `{ stories: Story[], isSeen(storyId), isLiked(storyId), markSeen(storyId), toggleLike(storyId) }`. The route's `index` indexes `stories`. Call `markSeen` when a story completes (in `next()`). |
| `useGroups()` | `{ groups: Group[], topics: string[], exploreGrid: ExploreTile[], isJoined(groupId), toggleJoin(groupId): boolean }`. On `true`, toast `Joined {name}`. Leaving is silent. Tile URL: `exploreTileUrl(tile, topicIndex)` from `src/data/social.ts`. |
| `useFriends()` | `{ statusOf(userId): 'none' \| 'requested' \| 'incoming' \| 'friend', friendCount: number, requests: FriendRequest[], pendingRequests, toggleRequest(userId): FriendStatus, acceptRequest(requestId), declineRequest(requestId), removeFriend(userId), mutualCount(userId) }`. Use "Add friend" when the status is `none` and "Requested" when it is `requested`. |
| `useChats()` | `{ chats: Chat[], unreadCount, activeNow: string[], chatWith(userId): Chat \| undefined, markRead(chatId) }`. Call `markRead` before pushing `Conversation`. If an active-now person has no chat, toast `Say hi to {First}`. |
| `useChat(chatId)` | `{ chat: Chat \| undefined, smartReplies: string[] /* already [] when the setting is off */, send(text), markRead() }`. `send` appends my message, clears the chips and sets `chat.typing` true. 1600 ms later the canned reply lands and `typing` turns false. |
| `useNotifications()` | `{ items: AppNotification[], fresh, earlier, unreadCount /* the bell number, 4 at seed */, allRead, markAllRead(), summary: string \| null /* null when the Brief setting is off */ }`. Each item: `{ id, actorId, kind, text, timeLabel, fresh, unread, requestId?, requestState?: 'pending' \| 'accepted' \| 'declined', postId? }`. Confirm and Delete call `useFriends().acceptRequest(n.requestId)` and `declineRequest(…)`; `text` updates itself. |
| `useAISettings()` | `{ settings: { brief, commentSummaries, smartReplies, personalize }, set(key, value), toggle(key) }`. Defaults are on, on, on, off. |
| `useCommentLikes()` | `{ isLiked(commentId), countOf(comment), toggle(commentId) }`. |
| `useBrief()` | `{ today: BriefItem[], week: BriefItem[], loading, regenerate(): Promise<void>, enabled }`. `BriefItem = { authorId, text, postId? }`. `regenerate` is ignored while loading. Catch it and toast `Couldn't refresh the Brief`. The feed card and the Brief tab share `today`. |
| `useCommentSummary(postId)` | `{ text?: string, displayText: string, loading, refresh(): Promise<void>, enabled }`. Render `displayText`: it is `text`, or `NO_SUMMARY_TEXT` ("Tap refresh to summarize this thread.", also exported from SocialContext) before a summary exists. Catch `refresh` and toast `Couldn't reach Harbor AI`. |
| `useAsk()` | `{ messages: AskMessage[] /* {id, fromMe, text} */, loading, ask(question), suggestions: string[] }`. `ask` ignores blank questions and anything sent while loading. It never rejects: a failure appends the inline error bubble. |
| `usePolish()` | `(text, tone: 'Clearer' \| 'Warmer' \| 'Shorter') => Promise<string>`. It rejects with `Write something first` on an empty draft. Strip nothing: quotes are already stripped. Keep `prevText` yourself for "Undo AI edit". |
| `useSocial()` | Everything above, raw. Prefer the focused hooks. |

Static copy and lists in `src/data/social.ts`:
- Brief and Ask: `briefCopy` (`feedSubtitle`, `updated`, `disclaimer`, `aiNote`), `comingUp`, `waitingOnYou` (`{ personId: 'mateo', text, chatId: 'c1' }`), `askSuggestions`.
- Chat: `chatIntro(mutual)` and `CHAT_DATE_STAMP`.
- Notifications: `NOTIFICATIONS_SUMMARY`, `REQUEST_ACCEPTED_TEXT`, `REQUEST_DECLINED_TEXT`.
- Settings: `settingsShortcuts`, `aiSettingRows`, `privacyRows`.
- Explore: `topics`, `exploreTileUrl`.

---

## 11. AI service (`src/services/ai.ts`; reference only, screens use the hooks)

These are demo-only (DECISIONS #5). Each builds the exact SPEC §7 prompt, then resolves a deterministic, seed-grounded answer after a stable 600–1100 ms delay. There is no network.

- `generateBrief(input: BriefInput): Promise<BriefItem[]>`. Refreshes alternate between the seeded Today lines and lines derived from the feed posts. `[]` means keep the old brief.
- `summarizeComments(input: CommentSummaryInput): Promise<string>`. The seeded summaries cover p1–p4. Other posts get `Not enough comments to summarize yet.` (under 2 comments) or `{n} friends commented. Most recent: "…"`.
- `polishPost(text, tone): Promise<string>`:
  - Shorter keeps the first sentence or 60% of the words.
  - Clearer capitalises, expands `&` and ends with a full stop.
  - Warmer appends ` Can't wait to share more soon.` unless the text has a `!`.
- `askHarbor(question, ctx): Promise<string>`. The 3 suggestion questions have canned answers. Otherwise it matches a friend's first name against posts or chats, and falls back to `ASK_FALLBACK`.
- Constants: `NO_SUMMARY_TEXT`, `ASK_FALLBACK`, `ASK_ERROR`, `BRIEF_PROMPT`.
- Request builders, for the future server proxy: `briefRequest`, `commentSummaryRequest`, `polishRequest`, `askRequest`.
- `suggestReplies(seeded)` echoes the static smart replies.

---

## 12. AuthContext (`import { useAuth } from '../state/AuthContext'`)

`useAuth()` returns:
- `{ user: User | null, initializing }`.
- `signIn(email, password): Promise<User>`.
- `signUp(name, email, password): Promise<User>`.
- `signInWithGoogle(): Promise<User | null>`, which resolves with `null` if the user cancels.
- `signOut()`.

The auth stack unmounts on success, so toast from the resolved user: ``const u = await signIn(email, pw); toast.show(`Signed in as ${firstNameOf(u.name)}`);``.

The calls reject with an `AuthError` whose `message` is user-safe. Password reset is `sendPasswordReset(email)` from `src/services/auth.ts`.

Demo sign-in accepts any valid email with a password of 8 or more characters. "Continue with Apple" is **hidden** (DECISIONS #6). After success, toast `Signed in as {First}` or `Welcome to Harbor, {First}`; the toast survives the stack swap.

---

## 13. Seed data and images

- **Image helpers** (`src/data/mock.ts`):
  - `pic(seed, w = 800, h = 600)` and `avatar(img, size = 160)`.
  - `draftPhoto()` is the create placeholder.
  - `images.cover` is the profile cover. `images.meLarge` is the 300 avatar (create-story card).
- **Fonts:** Geist-Regular, Medium, SemiBold and Bold are the only bundled fonts, linked from `assets/fonts` with `npx react-native-asset`.
- **People ids:** `me` (Noor Haddad, or the signed-in name), `ines`, `tomasz`, `priya`, `mateo`, `hana`, `kofi`, `delphine`, `yusuf`, `wren`. `PEOPLE_ORDER` lists them without `me`. Every person has `photoUrl` and `mutualCount`. `me` also has `handle`, `location`, `bio`, `coverUrl`, `friendsCount` (482), `postsCount` (131), `albumsCount` (36), `about` (5 rows) and `photos` (12).
- **Posts:** `p1` ines (Lisbon, 1 photo, 4/3), `p2` tomasz (Kraków, text only), `p3` priya (North Cascades, 3 photos, 4/5), `p4` mateo (Oaxaca, 1 photo, 4/3), `p5` and `p6` me (Rotterdam). **Comments** are `{postId}-c{n}`: p1 has c1–c4, and p2, p3 and p4 have c1–c3 each.
- **Stories:** `s-ines`, `s-priya`, `s-mateo`, `s-hana`, `s-kofi`, in rail order (index 0–4). Each has `imageUrl` (300×500), `fullImageUrl` (780×1688) and `timeLabel`.
- **Chats:**
  - `c1` mateo (unread)
  - `c2` hana
  - `c3` kofi
  - `c4` delphine
  - `c5` wren
  - Active now: `hana, kofi, priya, ines, wren, delphine`.
- **Groups:** `g-film` (Rotterdam Film Club), `g-bread` (Weekend Bread Society), `g-trail` (Cascades Trail Reports).
- **Notifications:**
  - Fresh: `n1` like priya, `n2` event hana, `n3` request yusuf (`requestId: 'r-yusuf'`), `n4` comment kofi (`postId: 'p5'`).
  - Earlier: `n5` group delphine, `n6` mention wren, `n7` like tomasz.
- **Friend request:** `r-yusuf`.
- **Brief:**
  - Today: ines → p1, tomasz → p2, priya → p3.
  - Week: priya → p3, delphine, kofi (no post, so push `User`).

In Firebase mode the post ids differ, so `usePost(id).data` can be `undefined`. Fall back to the author's `User` route.

---

## 14. What the foundation does not do (known limits)

- **No real blur or progressive masks** (DECISIONS #1). The header and tab-bar zones are gradient-only, and bars are `rgba(255,255,255,.86)` plus a hairline. `saturate()` is dropped. A BlurView is a later upgrade.
- **Tab item width animation** uses `LayoutAnimation` (the background, padding and label appear with a 250 ms label fade). It is not a CSS `all .45s` transition.
- **Firebase mode:**
  - Stories, groups, chats, friend requests, notifications, comment likes, AI settings and AI answers are local demo state that resets per session.
  - `place` and `audience` are not stored in Firestore, and `shareCount` reads 0.
  - The real user's profile has no cover image and no friend or album totals (the persona is demo-only).
- **AI** is canned and deterministic. There is no model call and no Cloud Function.
- **`text-wrap: balance / pretty`** has no RN equivalent. Use `textBreakStrategy="balanced"` (Android) where it matters.
- **Status-bar colour transition** (`color .3s`) uses `StatusBar animated` only.
- **"Create story"** has no story-creation flow in the design. It opens `NewPost`, as the design does.
- **Messages search** filters chats by the peer's name only (not message text).
