# Where we paused (Claude Design rebuild)

Goal: rebuild the app to match the Claude Design file `HarborApp.dc.html` (14 screens).
Source and plan, all in this folder:
- `HarborApp.dc.html`: the design (local copy from claude.ai/design project 9600fce9-63e3-4ab3-9966-c60452081a78)
- `SPEC.md`: the full implementation spec
- `DECISIONS.md`: the owner's answers and the defaults chosen

## State when paused
The foundation, the 14 screens, the shared follow-ups, the cleanup and the code-level integration review with its fixes are done (steps 1 to 4 below). What remains is the on-device walkthrough by the owner (step 5).

History: the foundation agent was first stopped partway, with the repo in a consistent state (`npx tsc --noEmit` 0 errors, `npx jest` passing).

Done or present (verify before relying on it):
- Geist fonts bundled and linked (`assets/fonts`); `phosphor-react-native` installed. The `tsconfig.json` path alias for Phosphor icon types was added.
- `src/components/ui/*`: shared primitives (AICard, Avatar, Badge, Bubble, Button, Chip, ComposerBar, FadeIn, Gradient, Header, IconButton, ListRow, Overline, PressableScale, SegmentedTabs, Shimmer, States, TextField, Toast, Toggle, TypingDots, motion).
- `src/data/social.ts`, `src/state/SocialContext.tsx`, `src/services/ai.ts`; mock data re-seeded.
- New routes (Story, Messages, Conversation, Notifications, NewPost params) and stub screens (Story, Explore, Messages, Conversation, Brief, Notifications).
- TabKey is now home / explore / brief / profile.
- Tests: `__tests__/social.demo.test.tsx`, `__tests__/shell.demo.test.tsx`.

Steps:
1. ~~Finish the foundation.~~ Done: audited and completed; `FOUNDATION.md` is the API reference and ownership table for the screen engineers. Checks: tsc 0 errors, eslint 0 errors, jest 4 suites / 9 tests passing.
2. Screen agents, in parallel, by file ownership (SPEC section 9):
   - B: Welcome/onboarding, SignIn, SignUp, NewPost, Story
   - C: Home feed, Post
   - D: Explore, Messages, Conversation, Notifications
   - A2: Brief, Profile, Settings, UserProfile, EditProfile
   Done: all 14 screens are built.
3. Shared changes and cleanup: **done.**
   - Shared changes the screen engineers asked for (FOUNDATION.md documents them): Button `highlight` / `iconSize` / `pressedScale` / `ai` variant; TextField `multiline` + `inputStyle` (BioField deleted); ShimmerLines `padding`; ComposerBar `maxLength` / `editable` / `autoFocus` / `disabled`; `useCommentSummary().displayText` + `NO_SUMMARY_TEXT` from SocialContext; AuthContext `signIn` / `signUp` / `signInWithGoogle` resolve with the User (`watchSignedInUser` removed); `nav.popTo(route)`; the Jest `Image.prefetch` mock resolves.
   - Cleanup: the legacy components, `blobs/*`, `chat/*`, ActivityScreen, ChatScreen and `chatReplies.ts` are deleted; the deprecated theme, tab-bar, icon and toast aliases are removed; the Outfit fonts are removed and re-linked (Android assets, iOS `UIAppFonts` and the Xcode project list only Geist); `design-system/` is deleted; the unused `User.hue` and mock images are gone.
   - Checks: prettier, `npx tsc --noEmit` 0 errors, `npx eslint src App.tsx __tests__` 0 errors and 0 warnings, `npx jest` 4 suites / 9 tests passing.

4. **Integration review (code): done.** A code-level review against the design and SPEC found 19 issues; all are fixed in code (see the list below). Checks: prettier, `npx tsc --noEmit` 0 errors, `npx eslint src App.tsx __tests__` 0 errors and 0 warnings, `npx jest` 5 suites / 15 tests passing (new: `__tests__/navigation.test.tsx` for the double-push guard; Messages search, profile photos with a new post and the chat bump in `social.demo.test.tsx`).
   - Android keyboard height: `useKeyboard` uses `screen height - endCoordinates.screenY` (the nav bar is included; the app is edge-to-edge). iOS is unchanged.
   - Authors are tappable everywhere (feed card, Post author row, comments, Explore people, Conversation header, Story header) through `useOpenProfile()`: `User`, or the Profile tab for me.
   - Tab bar fits at 320 to 389 (tighter paddings below 390, no active label below 350, measured from the Geist metrics; see `FloatingTabBar.tsx`).
   - Welcome scales its art by the measured pager height, and steps the type down on very short screens, so the copy is never clipped. Onboarding page 2 now says "Add a photo to any post, tag friends, and choose who sees each post." (Create attaches one photo, not 20.)
   - Firebase mode no longer shows the demo persona on the real profile. My posts' photos lead the Photos tab; the posts count includes this session's posts in demo mode. `useMe()` is memoised.
   - Navigator: double-push guard. SignIn "Create account" uses `popTo`.
   - Inert controls now act: Explore "See all", the Post sort toggle (Most relevant / Newest), Settings privacy rows, Messages search.
   - Smaller fixes: UserProfile Confirm toast, the feed messages dot (only with unread chats), Create story card uses my photo, chats move to the top as "now" after sending, Conversation scrolls to the end when the keyboard opens, toasts clear the composer / toolbar / reply row with the keyboard up, `BriefCard` and the Create polish card use `AICard`, Explore "PEOPLE" uses `Overline`, one `src/utils/errors.ts` (`messageOf`), EditProfile's header matches Create's, the Conversation back button is 40x44 with 6 gaps, `Shimmer` pauses off screen, Post comments and the Profile lists are virtualised (`FlatList`), EmptyState keeps its button reachable, Story waits while a screen reader is on, the Brief disclaimer uses `colors.muted`, the Brief footer and comment-summary header don't wrap at 320-360, and the composer rests at the design's 30 on home-indicator devices.

## What's left
5. **On-device walkthrough (owner).** Nobody has run Metro, an emulator or Gradle during the rebuild. Walk all 14 screens against `HarborApp.dc.html` and SPEC section 3 on a real iOS and Android device, then report what needs fixing. In particular:
   - The cross-screen flows: auth to tabs and log out, Create to Home, Brief to Conversation, Notifications to Post / User, Settings to Profile, Register / Sign in links (`popTo` both ways), tapping authors (including my own, which goes to the Profile tab).
   - Native checks: Geist renders on both platforms after the re-link; `boxShadow` rings and insets look right; the keyboard: ComposerBar, the toast above it, the Brief Ask padding and the multiline bio field, on Android with 3-button and gesture navigation.
   - Narrow and short devices: the tab bar at 320 / 360 / 375, Welcome at 375x667, 360x640 and 320x568.
   - Firebase mode: sign-in, posting, comments and profile edits against a real project; the Profile tab shows the real user (no persona cover, About from location, no friend or album totals).
   - Known small gaps: NewPost "Undo AI edit" is still a local inline link (no Button size fits an unboxed 13px text link).

To resume, tell Claude: "continue the Claude Design rebuild from design-import/RESUME.md".
