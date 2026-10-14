# Prompt: build the Harbor web app

Paste everything below the line into Google Antigravity or a Claude Code session opened at the repo root (`E:\01 GITHUB REPOS\Harbor`).

---

Build **Harbor Web**, the web counterpart of the Harbor React Native app in this repo. It must use the **same Firebase project, data, security rules and accounts** as the mobile app, so anything done on one shows up live on the other.

## Read these first (sources of truth)
- **Design:** `design-import/HarborApp.dc.html` (the Claude Design prototype, 14 screens), `design-import/SPEC.md` (exact tokens, layouts, copy, motion) and `design-import/DECISIONS.md` (the owner's choices: Geist, a cobalt `#2F5BD3` accent on zinc, no Apple sign-in, static AI answers, the friends model).
- **Data model:** the schema comment at the top of `src/services/backend/firebase.ts`, plus `firestore.rules`, `storage.rules` and `firestore.indexes.json`. The web app must write data in exactly the shapes and patterns these rules accept.
- **Behaviour:** `src/state/storeTypes.ts` (the store contract), `src/state/StoreContext.tsx`, `src/state/SocialContext.tsx`, `src/services/ai.ts`, `src/services/auth.ts` (the error-message mapping), and `src/data/mock.ts` / `src/data/social.ts` (demo seed).
- **Setup:** `FIREBASE_SETUP.md`. Project `harbor-rn-2026`, bucket `harbor-rn-2026.firebasestorage.app`.

## Stack and location
- A new folder `web/`. Do not modify the mobile app (`src/`, `android/`, `ios/`, `App.tsx`), except to extract shared pure TypeScript (types, validation, seed data) into `shared/` if that clearly reduces duplication. In that case update the mobile imports and keep `npx tsc --noEmit` and `npx jest` passing at the root.
- **Build:** Vite, React 19, TypeScript (strict), React Router.
- **Firebase:** the Firebase JS SDK v11+ (modular: `firebase/app`, `auth`, `firestore`, `storage`).
- **Styling:** CSS Modules, or one tokens file of CSS variables mirroring `src/theme.ts`. No UI kit.
- **Fonts and icons:** the Geist font (self-host from `assets/fonts/Geist-*.ttf`, or `@fontsource/geist`), and `@phosphor-icons/react` (the same icon set as mobile).
- **Firebase config:** read it from `web/.env.local` (`VITE_FIREBASE_*`), with a committed `web/.env.example`. Never commit real keys or service accounts.
- **Hosting:** Firebase Hosting. Add a `hosting` block to the root `firebase.json` (public `web/dist`, SPA rewrite to `/index.html`). Keep the existing firestore and storage entries.

## Must stay in sync with mobile (non-negotiable)
1. **Auth:** Email/Password and Google (`signInWithPopup`, with redirect fallback on mobile browsers). Same accounts as the phone app. On first sign-in, create the `users/{uid}` profile and `users/{uid}/private/prefs` exactly as `ensureProfile` does in `firebase.ts` (a create-only transaction). Map Firebase error codes to the same friendly messages as `src/services/auth.ts`.
2. **Writes follow the same patterns the rules enforce:**
   - Like and unlike, follow and unfollow run in `runTransaction`, and read first (no-op if already in that state).
   - Counters change only by `increment(±1)` in the same batch or transaction as the doc they count, with the marker fields (`users.lastPostId`, `users.lastFollowId`, `posts.lastCommentId`).
   - Activity docs use the deterministic ids `like_{postId}_{actorUid}`, `comment_{commentId}` and `follow_{actorUid}`, and are never written for yourself.
   - Port the logic from `firebase.ts` function by function; don't invent new shapes.
3. **Storage:** posts go to `posts/{uid}/{postId}.jpg` and avatars to `avatars/{uid}.jpg`. Content types: jpeg, png, heic, heif, webp, gif. Size under 10 MB. Resize client-side to 2048px max and roughly 0.8 quality before upload (canvas), with a progress bar from `uploadBytesResumable`.
4. **Live updates:** `onSnapshot` for the feed (one realtime query with a growing limit, as in StoreContext), post, comments, profile and activity. Optimistic like and comment, with rollback.
5. **No rule changes needed.** If something truly requires one, stop and explain why before changing `firestore.rules`, because mobile depends on it.

## Screens (web adaptation of the 14 design screens)
- **Responsive:**
  - Below 768px: the mobile design as-is, with a bottom tab bar (Home, Explore, Brief, Profile) and the create button.
  - From 1024px: a 3-column layout. The left nav rail has the logo, the same 4 destinations, Messages, Notifications, Settings and a Create button. The centre column is about 600px wide. The right rail shows the Brief card, Active now and suggestions.
  - Keep the design's tokens, type, copy and components.
- **Routes:**
  - `/welcome`, `/login`, `/register`
  - `/` (feed), `/post/:id`, `/create` (modal on desktop), `/story/:index`
  - `/explore`, `/messages`, `/messages/:chatId`, `/notifications`
  - `/brief`, `/profile`, `/u/:uid`, `/settings`, `/settings/profile` (edit profile)
  - Auth-guard everything except auth pages. Deep links work on refresh.
- **Web interactions:**
  - Keyboard: Enter sends, Esc closes modals and stories, arrow keys move between stories and carousel images.
  - Hover states.
  - Double-click to like on images.
  - Drag-and-drop or paste a photo into Create.
  - Focus-visible rings in the accent.
- **Demo mode:** a `VITE_DEMO_MODE=true` flag runs fully on the local seed (`src/data/*`, via `shared/` if extracted), matching mobile's `DEMO_MODE`, so the site can be demoed without Firebase.

## Phase 1 vs phase 2
- **Phase 1 (build now):** everything above. Posts, likes, comments, profiles, avatars, prefs, activity and auth sync live with mobile. Stories, groups, chats, friend requests, the friend-based notifications and AI answers mirror the mobile app's current behaviour: local demo state, with `ai.ts`-style static answers. In the UI, label them clearly in code comments as not synced yet.
- **Phase 2 (only on request):** move stories, groups, chats/messages, friend requests and notifications to Firestore, with new collections and rules, for **both** apps at once, keeping the `SocialContext` hook signatures. Add a Cloud Function that proxies AI calls to Claude, with the API key in Secret Manager and never in a client. Propose the schema and rules in a short design note first, and wait for approval.

## Quality bar
- **Accessibility:** WCAG AA contrast, semantic HTML, labelled controls, full keyboard navigation, and `prefers-reduced-motion` respected.
- **Performance:** a Lighthouse score of 90+ on mobile, lazy-loaded routes, `loading="lazy"` on images, and virtualised long lists where needed.
- **States:** loading skeletons, empty states, inline errors, toasts, and offline-friendly error copy, matching mobile's wording.
- **Code:** no `any`, ESLint and Prettier configured, and Vitest + React Testing Library tests for:
  - the auth flow;
  - the like transaction's no-op path;
  - comment optimistic rollback;
  - image resize;
  - route guards.
- No emojis in the UI. No pure `#000`.

## Deliverables
1. The `web/` app with README instructions:
   - `cd web; npm install; npm run dev`
   - `npm run build`
   - `firebase deploy --only hosting`
   - how to add the Web app in the Firebase console and fill `.env.local`;
   - adding the hosting domain and `localhost` to Authentication > Settings > Authorized domains (Google sign-in fails without it).
2. A sync check, run against a test Firebase project or the emulator suite (`firebase emulators:start`), not production:
   - sign in on the web with an account created on mobile;
   - post on the web and confirm the doc shape matches mobile's;
   - like and comment;
   - confirm the counters and activity docs look identical to ones mobile writes.
   - Report the results.
3. Update `FIREBASE_SETUP.md` with a short "Web app" section, and `docs/ANTIGRAVITY.md` with the web commands.
4. A final report:
   - what's built;
   - what syncs and what doesn't yet;
   - any rule or schema question that came up;
   - the test results.

Work in stages and verify each one (type-check, tests, build) before moving on: setup, then auth, then feed and post, then create, then profile, then the remaining screens, then the responsive desktop layout, then the tests and docs.
