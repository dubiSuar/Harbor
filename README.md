# Harbor

Harbor is a friends-first social app for Android and iOS, built with React Native and TypeScript on Firebase. The feed shows friends' posts in the order they were posted, and the **Harbor Brief** sums up what you missed across posts, comments and messages. Around that sit stories, groups, direct messages with smart replies, notifications with friend requests, and profiles.

The UI is a rebuild of a Claude Design prototype: Geist type, a cobalt accent on zinc, 14 screens. The design source and the implementation notes are in [`design-import/`](design-import/):

- `HarborApp.dc.html`: the prototype itself
- `SPEC.md`: screen inventory, tokens, per-screen layout and copy
- `DECISIONS.md`: the owner's choices, which override the spec
- `FOUNDATION.md`: the API reference for the theme, primitives, navigation and state

A demo mode runs the whole app on local, in-memory seed data, so it can be shown without a backend.

## Features by screen

| # | Screen | What it does |
| --- | --- | --- |
| 01 | Onboarding (`WelcomeScreen`) | 3-page pager with swipe, **Skip**, **Next** / **Get started**, and **I already have an account** |
| 02 | Sign in (`SignInScreen`) | "Welcome back". Email and password with inline errors on submit, **Forgot password?** (sends a reset link), **Sign in**, **Continue with Google**, and a **Create account** link |
| 03 | Register (`SignUpScreen`) | "Create your account". Full name, email, password with a live strength meter, a terms checkbox, **Create account** |
| 04 | Feed (`HomeScreen`, Home tab) | Header with the **Home** pill, the bell (unread count) and the messages button. Stories rail with **Create story**, a "What's on your mind" composer, the **Harbor Brief** card (expand, **Refresh**, **Full brief**), then posts with **Like** / **Comment** / **Share** and double-tap to like. Pull to refresh, more on scroll |
| 05 | Post (`PostScreen`) | Photo carousel, likes, the AI **Comment summary** card with a refresh button, the comment thread (**Like**, **Reply**), and a **Write a comment…** composer |
| 06 | Create (`NewPostScreen`, modal) | Audience picker (**Friends**, **Public**, **Close friends**), text up to 500 characters, **Polish with Harbor** (**Clearer**, **Warmer**, **Shorter**, with **Undo AI edit**), and **Photo**, **Tag**, **Place**, **Poll** tools. **Post** shows upload progress |
| 07 | Story viewer (`StoryScreen`) | Full-screen, auto-advancing, with progress bars. Tap left or right to go back or forward, hold to pause. Like and reply |
| 08 | Explore (`ExploreScreen`, Explore tab) | People search with **Add friend** / **Requested** / **Confirm**, topic chips, **Groups for you** with **Join**, and a masonry photo grid |
| 09 | Messages (`MessagesScreen`) | Active-now rail, chat list with unread markers, **New message** |
| 10 | Chat (`ConversationScreen`) | Message thread with smart-reply chips, a typing indicator and a reply from the other side |
| 11 | Notifications (`NotificationsScreen`) | AI one-line summary, **New** and **Earlier** sections, **Confirm** / **Delete** on friend requests, **Mark all read** |
| 12 | Brief (`BriefScreen`, Brief tab) | **Today** / **This week**, **What you missed**, **Coming up**, **Waiting on you** (with **Reply**), and **Ask Harbor** with suggestion chips |
| 13 | Profile (`ProfileScreen`, Profile tab) | Cover, avatar, friend and post counts, **Edit profile**, **Share**, the **Settings** gear, and **Posts** / **Photos** / **About** tabs |
| 14 | Settings (`SettingsScreen`, titled "Menu") | Profile card, shortcuts, **Harbor AI** toggles (**Brief in your feed**, **Comment summaries**, **Smart replies**, **Personalize with my posts**), **Privacy** rows, **Log out** |

Two more screens keep the new styling: another person's profile (`UserProfileScreen`, with **Add friend**, **Message** and the same three tabs) and **Edit profile** (`EditProfileScreen`: photo, name, username, bio, location).

Navigation: a floating tab bar with 4 tabs (**Home**, **Explore**, **Brief**, **Profile**, the last one shown as your avatar), plus the blue create button next to it. Messages and Notifications open from the feed header. Tapping the active tab scrolls it to the top. Android back on Explore, Brief or Profile returns to Home.

## Tech stack

- React Native 0.87 (New Architecture, Hermes), React 19, TypeScript
- Firebase via React Native Firebase 26 (modular API): Authentication, Cloud Firestore, Cloud Storage
- Geist (Regular, Medium, SemiBold, Bold), bundled from `assets/fonts` and linked with `react-native.config.js`
- `phosphor-react-native` for icons
- `react-native-svg` for icons, the logo, gradients and onboarding art
- `@react-native-google-signin/google-signin` 16 for Google sign-in
- `react-native-image-picker` 8 for photos
- `react-native-safe-area-context` for insets
- A small custom stack navigator (no navigation library), with the design's push, modal and fade transitions
- Jest, ESLint, Prettier

Firebase project: `harbor-rn-2026`. Android package and iOS bundle ID: `com.harbor`.

## Project structure

```text
src/
  config.ts              DEMO_MODE switch and FEED_PAGE_SIZE
  theme.ts               Tokens: colors, fonts (Geist), type scale, radius, space,
                         shadows, motion, layout
  components/
    FloatingTabBar.tsx     4-tab pill bar plus the create button
    Icon.tsx               Phosphor icon wrapper
    Logo.tsx               Harbor logo (SVG)
    useKeyboard.ts         Keyboard visibility and height hook
    ui/                    Shared primitives: AICard, Avatar, Badge, Bubble, Button,
                           Chip, ComposerBar, FadeIn, Gradient, Header, IconButton,
                           ListRow, Overline, PressableScale, SegmentedTabs, Shimmer,
                           States (empty / error), TextField, Toast, Toggle,
                           TypingDots, motion helpers
    auth/                  Onboarding art, pager dots, strength meter, terms checkbox
    feed/                  Feed header, story rail, Brief card, composer row,
                           post card, skeleton
    post/                  Post body, image carousel, heart burst, comment row,
                           comment summary card
    story/                 Story progress bars, app-active hook
    social/                Chat row, conversation parts, group card, masonry grid,
                           notification row, person row
    brief/                 Brief sections, Ask Harbor
    profile/               ProfileView (shared by Profile and UserProfile)
  data/
    mock.ts                Seed people, posts, comments and image helpers
    social.ts              Seed stories, groups, chats, notifications, Brief,
                           settings rows
    time.ts                Relative time formatting
    types.ts               Shared data types
  navigation/
    Navigator.tsx          Stack navigator and the Route type
    TabBarContext.tsx      Tab state, scroll-to-top
    PaneVisibleContext.ts  Tells a tab pane whether it is on screen
    insets.ts              Tab bar geometry and scroll clearance
  screens/                 Welcome, SignIn, SignUp, MainTabs (tab container),
                           Home, Explore, Brief, Profile, Post, NewPost, Story,
                           Messages, Conversation, Notifications, Settings,
                           UserProfile, EditProfile
  services/
    ai.ts                  Harbor AI: Brief, comment summary, Polish, Ask Harbor
                           (static sample answers for now)
    auth.ts                Firebase Auth and Google sign-in (webClientId here),
                           plus the local demo auth
    media.ts               Photo picker wrapper
    backend/
      types.ts               Backend interface, validation, friendly errors
      firebase.ts            Firestore + Cloud Storage adapter (schema comment)
      demo.ts                In-memory adapter seeded from data/mock.ts
      index.ts               Picks the adapter from DEMO_MODE
  state/
    AuthContext.tsx        Current user, session restore
    StoreContext.tsx       Posts, likes, comments, profile, on a backend adapter
    storeTypes.ts          Contract between the data layer and the UI
    SocialContext.tsx      Stories, groups, friends, chats, notifications,
                           AI settings and AI state (local in both modes)
```

Posts, likes, comments and your profile go through `StoreContext`, which runs against Firebase or the demo adapter. Everything social and AI goes through `SocialContext`, which is local in both modes (see Known limitations).

Backend config at the repo root: `firestore.rules`, `storage.rules`, `firestore.indexes.json`, `firebase.json`, `.firebaserc`.

## Getting started

### 1. Install

Requirements: Node.js 22.11+, Android Studio with an emulator or a device, JDK 17+ (Android Studio's bundled JBR works). iOS needs a Mac with Xcode and CocoaPods. On Windows, set `JAVA_HOME` and `ANDROID_HOME` and put `platform-tools` on your `PATH` (see section 1 of [FIREBASE_SETUP.md](FIREBASE_SETUP.md#1-prerequisites)).

```powershell
cd "E:\01 GITHUB REPOS\Harbor"
npm install
```

### 2. Pick a mode

`DEMO_MODE` in `src/config.ts` is currently `true`.

**Demo mode (`DEMO_MODE = true`).** No backend. Auth and data are local and in memory, seeded from `src/data/`, and reset when the app restarts. Sign in with any valid email and any password of 8+ characters, or with **Continue with Google** (a local demo user). You are the demo persona, Noor Haddad, unless you register with a different name. Images load from `picsum.photos` and `i.pravatar.cc`, so the device still needs a network connection.

**Firebase (`DEMO_MODE = false`).** Follow [FIREBASE_SETUP.md](FIREBASE_SETUP.md): enable the sign-in providers, add the SHA fingerprints, re-download the config files, set `webClientId`, create Firestore, deploy the rules and indexes, then enable Storage (Blaze plan) and deploy its rules.

> Create Firestore and deploy the rules **before the first sign-in**. The app sets up each user's profile doc on sign-in, and shows "Couldn't set up your profile..." if the database is not ready.

### 3. Run

Android (Windows, macOS or Linux):

```powershell
npm start                       # Metro, in its own terminal
npx react-native run-android    # in a second terminal
```

iOS (Mac only):

```bash
cd ios && pod install && cd ..
npx react-native run-ios
```

Two iOS setup items are still open: the `REVERSED_CLIENT_ID` URL scheme in `Info.plist` (after re-downloading the plist with Google sign-in enabled) and `pod install`. See section 6 of [FIREBASE_SETUP.md](FIREBASE_SETUP.md#6-ios-url-scheme-and-pods-mac-only).

If you add or change fonts in `assets/fonts`, re-link them:

```powershell
npx react-native-asset
```

## Scripts

| Command | What it does |
| --- | --- |
| `npm start` | Start Metro |
| `npm run android` | Build and run on Android |
| `npm run ios` | Build and run on iOS (Mac) |
| `npm test` | Run Jest: 4 suites (`App.test.tsx`, `shell.demo.test.tsx`, `social.demo.test.tsx`, `store.demo.test.tsx`), all against demo data |
| `npm run lint` | Run ESLint |
| `npx tsc --noEmit` | Type-check without emitting files |

## Docs

- [FIREBASE_SETUP.md](FIREBASE_SETUP.md): connect the app to Firebase, step by step, with troubleshooting
- [DEMO_CHECKLIST.md](DEMO_CHECKLIST.md): pre-demo runbook, the 14-screen demo script and the demo-mode Plan B
- [docs/ANTIGRAVITY.md](docs/ANTIGRAVITY.md): working on this repo in Google Antigravity on Windows
- [design-import/](design-import/): the design prototype, spec, decisions and foundation reference

## Known limitations

- **The AI answers are static sample text.** The Brief, comment summaries, Polish and Ask Harbor in `src/services/ai.ts` build the prompt a real call would send, wait 600 to 1100 ms, then return a deterministic answer made from the seed data. There is no model call and no API key in the app. Smart replies and the Notifications summary are fixed strings.
- **Social features are local demo state in both modes.** Stories, groups, chats, friend requests, notifications, comment likes and the Harbor AI toggles live in `SocialContext`, seeded from `src/data/social.ts`. They reset when the app restarts, and in Firebase mode they are not stored in Firestore.
- **Firebase mode is partial.** Posts, likes, comments, profile edits and auth use Firebase. A post's place and audience are not stored, share counts read 0, and your Profile shows the demo persona's cover, About rows and photos.
- **No real blur.** Translucent headers and the tab bar use a semi-opaque white fallback plus a hairline, and fade zones are gradients. A BlurView is a possible later upgrade.
- **Apple sign-in is not built.** The "Continue with Apple" button from the design is hidden.
- **Create attaches one photo.** In demo mode it attaches a placeholder photo instead of opening the picker. Tag, Poll, **New message** and Messages search only show a toast or do nothing.
- No Cloud Functions yet. Counters are written by the clients, under hardened rules. Deleting a post does not delete its likes and comments subcollections.
- Handle uniqueness is not enforced. No push notifications. No App Check.
- The rebuild has not yet been walked through on a device (see `design-import/RESUME.md`, step 4).
- iOS is not finished: the Google sign-in URL scheme and `pod install` still need a Mac.
