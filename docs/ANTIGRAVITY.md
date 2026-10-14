# Working on Harbor in Google Antigravity (Windows)

Google Antigravity is a VS Code-based editor with built-in AI agents, a terminal and a browser. This guide covers using it on this repo.

> Antigravity's UI changes often. Where this guide names a panel or menu, the exact label may differ in your version. Anything VS Code-standard (Explorer, integrated terminal, Source Control, keyboard shortcuts like `` Ctrl+` ``) should work as described. Agent-specific features are described generically.

---

## 1. Open the project

1. **File > Open Folder...** and pick `E:\01 GITHUB REPOS\Harbor`.
2. Open the repo root, not `android/` or `src/`. The agent needs to see `package.json`, the docs and the rules files to give good answers.
3. If asked whether you trust the folder's authors, trust it (it is your repo).
4. If Antigravity offers to install recommended extensions, the useful ones are ESLint, Prettier and a React Native / TypeScript extension. None are required.

> The folder path has spaces (`01 GITHUB REPOS`). Always quote it in the terminal.

---

## 2. Set up the Windows environment (once)

Antigravity's terminals, and its agent, inherit the Windows environment variables from when the IDE started. React Native's Android build needs Java and the Android SDK to be findable. Set these under **Start > "Edit the system environment variables" > Environment Variables... > User variables**:

| Variable | Value |
| --- | --- |
| `JAVA_HOME` | `C:\Program Files\Android\Android Studio\jbr` (Android Studio's bundled JDK) |
| `ANDROID_HOME` | `%LOCALAPPDATA%\Android\Sdk` |
| `Path` (add an entry) | `%LOCALAPPDATA%\Android\Sdk\platform-tools` (gives you `adb`) |

Then **quit and restart Antigravity** completely. Terminals opened before the change do not see the new values. Check in a new terminal:

```powershell
java -version
adb devices
echo $env:ANDROID_HOME
```

For Google sign-in on an emulator, create the device in Android Studio's Device Manager with a system image that has **Google Play** (the Play Store icon), not just "Google APIs".

---

## 3. Use the integrated terminal

Open it with **Terminal > New Terminal** (or `` Ctrl+` ``). On Windows it opens PowerShell by default, which is what the commands below assume. It starts in the repo root.

Everyday commands:

```powershell
npm install                       # after pulling or changing package.json
npm start                         # Metro bundler (keep it running in its own terminal tab)
npx react-native run-android      # build and install on the emulator or device
npm test                          # Jest
npx tsc --noEmit                  # type check
npm run lint                      # ESLint
```

SHA-1 / SHA-256 for Firebase (debug and release are both signed with `android/app/debug.keystore`, so one pair covers both):

```powershell
cd android; .\gradlew signingReport; cd ..
```

Or, without Gradle, with Android Studio's `keytool` (run from the repo root):

```powershell
& "C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe" -list -v -keystore android\app\debug.keystore -alias androiddebugkey -storepass android
```

Firebase backend deploy, in this order. Create the Firestore database in the console first, and deploy the rules **before anyone signs in** (see [FIREBASE_SETUP.md](../FIREBASE_SETUP.md), sections 7 to 9). `.firebaserc` already points at `harbor-rn-2026`.

```powershell
npm i -g firebase-tools                                     # once
firebase login                                              # once, opens a browser
firebase deploy --only firestore:rules,firestore:indexes
# now enable Storage in the console (Blaze plan), then:
firebase deploy --only storage
```

> If PowerShell refuses with `firebase.ps1 cannot be loaded because running scripts is disabled`, use `firebase.cmd` in place of `firebase` (for example `firebase.cmd login`). If the CLI says an API is disabled, enable it in the Google Cloud console for `harbor-rn-2026`: Cloud Firestore API, Firebase Rules API, Cloud Storage for Firebase API, Identity Toolkit API.

Reading errors. The app shows friendly messages only. The raw Firestore codes and the link that creates a missing index are in logcat, not Metro:

```powershell
adb logcat | Select-String -Pattern "Firestore"
```

Tips:

- Use one terminal tab for Metro and another for commands. Use the **+** in the terminal panel to add a tab. Use a third tab for `adb logcat` while testing against Firebase.
- `adb` must be on your `PATH` (section 2). Check with `adb devices`.
- iOS commands (`cd ios; pod install`) only work on a Mac.

---

## 4. Use the agent

Open the agent panel (the chat or agent view in the side panel; the name varies between versions). Give it the task in plain language.

What makes a prompt work on this repo:

- **Point at the file that holds the truth.** `FIREBASE_SETUP.md` for setup, `firestore.rules` / `storage.rules` for permissions, `src/services/backend/firebase.ts` for the Firestore and Storage calls (and the schema comment at its top), `src/state/storeTypes.ts` for the store contract between UI and data layer, `src/state/SocialContext.tsx` for stories, groups, friends, chats, notifications and AI state, `src/services/ai.ts` for the AI features, and `design-import/SPEC.md` / `DECISIONS.md` / `FOUNDATION.md` for how each screen should look and behave.
- **Paste the full error.** The app only shows friendly messages ("You don't have permission to do that."). Paste that, plus the raw lines from `adb logcat` (filter "Firestore"), which carry the real code (`PERMISSION_DENIED`, `FAILED_PRECONDITION`) and any index link.
- **Ask for a verification step** at the end ("run `npm test` and `npx tsc --noEmit`, and show me the output").
- **Say what it must not touch.** For example "do not change `firestore.rules`" when you are fixing UI.

### Ready-to-paste prompts

**1. Walk through Firebase setup**

```text
Read FIREBASE_SETUP.md. I have finished sections 1 to 3. Walk me through section 4 (SHA fingerprints)
and section 5 (re-download config files, set webClientId). Run `.\gradlew signingReport` in android/
and show me the SHA-1 and SHA-256 for the debug variant (release uses the same
android/app/debug.keystore). After I replace google-services.json, check that its oauth_client is
no longer empty and contains an entry with client_type 3, and put that client_id into webClientId
in src/services/auth.ts. Do not change anything else.
```

**2. Fix a permission-denied error**

```text
The app shows "You don't have permission to do that." when <action, e.g. liking a post>.
Here are the matching lines from `adb logcat | Select-String -Pattern "Firestore"`:

<paste the logcat lines here>

Find the call in src/services/backend/firebase.ts that makes this Firestore request (the store in
src/state/StoreContext.tsx calls it), then read the matching match block in firestore.rules.
Remember the rules pair every counter with the doc it counts (see the header comment in
firestore.rules). Explain exactly which rule condition fails and why. Propose the smallest fix,
in the app code if the app is sending the wrong data, or in the rules if the rule is wrong.
Do not loosen the rules to `allow read, write: if true` or anything similar. Show me the diff
before applying it.
```

**3. Fix a missing index**

```text
The app says "This view isn't ready yet: a database index is still being set up." and logcat
shows "The query requires an index" with this link:

<paste link and error from adb logcat>

First check whether the index is already in firestore.indexes.json (it may just be Building in
the console). If it is missing, add the matching composite index (keep the existing ones; the
likes index must stay COLLECTION_GROUP scope), find the query in src/services/backend/firebase.ts
that needs it, and tell me the command to deploy only the indexes. Do not deploy it yourself.
```

**4. Add a Cloud Function to clean up deleted posts**

```text
Deleting a post in Harbor leaves posts/{postId}/likes and posts/{postId}/comments behind
(see "Known limitations" in FIREBASE_SETUP.md and the note in deletePost in
src/services/backend/firebase.ts). Add a Firebase Cloud Function (2nd gen, TypeScript, in a new
functions/ folder) that runs when a posts/{postId} document is deleted and removes its
subcollections with the Admin SDK's recursiveDelete. The app already deletes the Storage image
(best effort), so only delete it in the function if it still exists.
Update firebase.json to include the functions config. Explain what plan this needs and how to
deploy it. Do not change app code.
```

**5. Prepare the demo**

```text
Read DEMO_CHECKLIST.md. Run `npm test`, `npx tsc --noEmit` and `npm run lint` and summarise any
failures. Then tell me the current value of DEMO_MODE in src/config.ts, and whether webClientId
is set in src/services/auth.ts. Check every bold label in the demo script table against the
screens in src/screens and the components they use, and list any label that no longer matches.
List anything in the "Rough edges" section that you can see is still true in the code.
Do not edit any files.
```

**6. Explain a part of the code before changing it**

```text
Explain how a like works end to end in this app: from the double-tap in
src/components/post/ImageCarousel.tsx and the Like button in src/components/feed/FeedPostCard.tsx,
through toggleLike in src/state/StoreContext.tsx (contract: src/state/storeTypes.ts) and setLike
in src/services/backend/firebase.ts, to the Firestore documents, counters and activity item it
writes in its transaction, and which rules in firestore.rules allow it. Do not edit any files.
```

**7. Connect the SocialContext features to Firestore**

```text
Read design-import/DECISIONS.md (item 12), design-import/FOUNDATION.md sections 10 and 14,
src/state/SocialContext.tsx and src/data/social.ts. Today stories, groups, friends and friend
requests, chats, notifications, comment likes and the Harbor AI settings are local seed state in
both modes and reset on restart.

Plan, then implement in small steps, a Firestore-backed version for Firebase mode only:
1. Propose a schema (collections, fields, ids) for each feature, consistent with the existing
   schema comment at the top of src/services/backend/firebase.ts. Show it to me before coding.
2. Add the reads and writes to the Backend interface in src/services/backend/types.ts, implement
   them in firebase.ts, and keep demo.ts working from the existing seed data.
3. Change SocialContext to call the backend instead of local state. Keep every hook signature
   used by the screens the same, so no screen file changes.
4. Add matching match blocks to firestore.rules (owner-only writes, friends-only reads where it
   applies; never `if true`) and any composite indexes to firestore.indexes.json.
5. Extend __tests__/social.demo.test.tsx so demo mode still passes.
Start with friend requests and friends, then notifications, then chats, then the rest.
Run `npm test`, `npx tsc --noEmit` and `npm run lint` after each step. Do not deploy.
```

**8. Replace the static AI answers with a Cloud Function that calls Claude**

```text
Read src/services/ai.ts and design-import/SPEC.md section 7. Every AI feature (Brief, comment
summary, Polish, Ask Harbor) already builds the request a real call would send and goes through
a single `complete(req, demo)` function, which today returns a static sample answer after a delay.

1. Add a Firebase Cloud Function (2nd gen, TypeScript, in a new functions/ folder): an HTTPS
   callable `aiComplete` that requires a signed-in user, validates the request shape
   (system, messages, max_tokens, with sane size limits), calls the Anthropic Messages API with
   a Claude model, and returns the text. Read the API key from Secret Manager with
   `defineSecret('ANTHROPIC_API_KEY')`. The key must never be in the app, in the repo or in
   a .env file that gets committed.
2. Add per-user rate limiting in the function.
3. In src/services/ai.ts, change `complete()` so that when DEMO_MODE is false it calls the
   callable (add @react-native-firebase/functions) and returns its text; keep the demo answers
   when DEMO_MODE is true and as a fallback on error. Keep every exported signature the same.
4. Update firebase.json for functions. Tell me the commands to set the secret and deploy,
   and which plan this needs. Do not deploy, and do not set the secret yourself.
Run `npm test`, `npx tsc --noEmit` and `npm run lint` at the end.
```

---

## 5. Guardrails

Agents are fast and confident. Keep control of what lands in the repo.

- **Review every diff** before accepting it. Use the agent's diff view, or **Source Control** (`Ctrl+Shift+G`) to see each changed file.
- **Commit yourself.** Read `git status` before every commit. Do not let the agent commit or push on its own unless you asked for exactly that.
- **Never commit secrets:**
  - release keystores (`*.keystore`, `*.jks`) and their passwords. `.gitignore` already ignores `*.keystore` except `debug.keystore`;
  - service-account JSON files (contain `"type": "service_account"` and a `private_key`). The app never needs one;
  - `.env` files with tokens.
  If an agent creates or downloads any of these into the repo, delete it and check `git status`.
- **Know which mode you are in.** `DEMO_MODE` in `src/config.ts` is currently `true`. Set it to `false` for real Firebase testing. Demo mode bypasses Firebase entirely, so a passing check in demo mode (all 4 Jest suites run on demo data) proves nothing about the backend.
- **Never put an AI API key in the app.** Model calls belong in a Cloud Function with the key in Secret Manager (prompt 8).
- **Do not let the agent loosen security rules** to make an error go away. Fix the cause.
- **Do not let the agent deploy** (`firebase deploy`) without telling you first. Deploys change the live project for everyone.
- **Watch terminal commands** the agent wants to run. Approve installs and deletes only when you understand them.
- **Browser actions:** if the agent uses the built-in browser on the Firebase console, it acts as your signed-in Google account. Watch what it clicks, especially anything that deletes data, changes billing or upgrades the plan.

---

## 6. Where things live

| Path | What it is |
| --- | --- |
| `App.tsx` | App root: providers, the route-to-screen switch, status bar |
| `src/config.ts` | `DEMO_MODE` switch (currently `true`) and feed page size |
| `src/theme.ts` | Design tokens: colors (cobalt on zinc), Geist fonts, type scale, radius, spacing, shadows, motion |
| `src/navigation/Navigator.tsx` | Stack navigator and the `Route` type (every screen and its params) |
| `src/navigation/TabBarContext.tsx` | The 4 tabs (`home`, `explore`, `brief`, `profile`) and scroll-to-top |
| `src/screens/MainTabs.tsx` | Tab container: Home, Explore, Brief, Profile, plus the create button |
| `src/screens/` | One file per screen (Welcome, SignIn, SignUp, Home, Post, NewPost, Story, Explore, Messages, Conversation, Notifications, Brief, Profile, Settings, UserProfile, EditProfile) |
| `src/components/ui/` | Shared primitives (Button, Header, TextField, Avatar, Chip, AICard, Toast, ...) |
| `src/components/{auth,feed,post,story,social,brief,profile}/` | Per-area components for those screens |
| `src/components/FloatingTabBar.tsx`, `Icon.tsx`, `Logo.tsx` | Tab bar, Phosphor icon wrapper, logo |
| `src/services/auth.ts` | Firebase Auth and Google sign-in; `webClientId` lives here. Also the local demo auth |
| `src/services/ai.ts` | Harbor AI: Brief, comment summary, Polish, Ask Harbor. Static sample answers behind one `complete()` function |
| `src/state/AuthContext.tsx` | Current user and session restore |
| `src/state/StoreContext.tsx` | Posts, likes, comments and profile exposed to screens, built on a backend adapter |
| `src/state/storeTypes.ts` | The store contract between the data layer and the UI (changelog comment at the top) |
| `src/state/SocialContext.tsx` | Stories, groups, friends, chats, notifications, comment likes, AI settings and AI state. Local seed state in both modes |
| `src/services/backend/` | Data layer: `types.ts` (Backend interface, validation, friendly errors), `firebase.ts` (Firestore + Storage, schema comment), `demo.ts` (in-memory demo), `index.ts` (picks one from `DEMO_MODE`) |
| `src/data/` | Types, seed data (`mock.ts` for people and posts, `social.ts` for the social features), time formatting |
| `assets/fonts/` | Geist TTFs, linked by `react-native.config.js` |
| `design-import/` | The Claude Design prototype (`HarborApp.dc.html`), `SPEC.md`, `DECISIONS.md`, `FOUNDATION.md`, `RESUME.md` |
| `__tests__/` | Jest suites, all on demo data |
| `firestore.rules`, `storage.rules` | Security rules |
| `firestore.indexes.json` | Firestore composite indexes |
| `firebase.json`, `.firebaserc` | Firebase CLI config and default project |
| `android/app/google-services.json` | Android Firebase config |
| `android/app/build.gradle` | Android app build, signing config |
| `ios/Harbor/GoogleService-Info.plist`, `ios/Harbor/Info.plist` | iOS Firebase config; photo and camera permission strings (the Google `REVERSED_CLIENT_ID` URL scheme is still to add, on a Mac) |
| `ios/Podfile` | CocoaPods config: static frameworks, `$RNFirebaseAsStaticFramework = true` |
| `android/app/debug.keystore` | Signs debug and release builds; its SHA-1 / SHA-256 go into Firebase |
| `FIREBASE_SETUP.md` | Step-by-step Firebase setup and troubleshooting |
| `DEMO_CHECKLIST.md` | Pre-demo runbook |
