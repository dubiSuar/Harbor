# Demo checklist

A runbook for showing Harbor live. Do the "day before" list the day before, not the morning of.

Assumes Android. There are two ways to run the demo:

- **Demo mode** (`DEMO_MODE = true` in `src/config.ts`, the current value). No backend. Every screen is filled with the design's seed people and content. This is the recommended mode for showing all 14 screens.
- **Firebase mode** (`DEMO_MODE = false`). Auth, posts, likes, comments and profile edits are real. Firebase must be set up first (see [FIREBASE_SETUP.md](FIREBASE_SETUP.md)). Stories, groups, chats, friend requests, notifications and all AI features still come from local seed data.

If Firebase lets you down, switch to [Plan B](#plan-b-demo-mode-no-backend-needed).

---

## What is real and what is demo-only

Say this accurately if asked. Do not present demo-only features as live.

| Feature | Demo mode | Firebase mode |
| --- | --- | --- |
| Sign in, register, password reset, Google | Local fake | Real (Firebase Auth) |
| Feed posts, likes, comments, new posts, delete | In memory, seeded | Real (Firestore + Storage) |
| Edit profile (name, username, bio, location, photo) | In memory | Real |
| Profile cover, About rows, Photos tab | Seed persona | Seed persona |
| Stories, groups, chats, friend requests, notifications, comment likes | Local seed | Local seed (demo-only) |
| Harbor Brief, comment summary, Polish, Ask Harbor | Static sample answers | Static sample answers (demo-only) |
| Smart replies, Notifications AI summary | Fixed strings | Fixed strings (demo-only) |
| Harbor AI toggles in Settings | Local, reset on restart | Local, reset on restart |

Everything local resets when the app restarts.

---

## The day before

### Build

- [ ] Pull the latest code and install dependencies:

```powershell
cd "E:\01 GITHUB REPOS\Harbor"
npm install
```

- [ ] Run the checks. `npm test` runs 4 suites, all against demo data (`App.test.tsx`, `shell.demo.test.tsx`, `social.demo.test.tsx`, `store.demo.test.tsx`). Fix anything red before you go further:

```powershell
npm test
npx tsc --noEmit
npm run lint
```

- [ ] Set `DEMO_MODE` in `src/config.ts` to the mode you will demo.
- [ ] Firebase mode only: in the Firebase console, confirm the `posts` composite index (`authorId`, `createdAt`) shows **Enabled** (**Firestore Database > Indexes**). Without it the Profile **Posts** tab says "a database index is still being set up".
- [ ] Use a **release build** for the demo. It bundles the JS, runs without Metro or a USB cable, and shows no LogBox yellow boxes. It is signed with the same `debug.keystore` as debug builds (see `android/app/build.gradle`), so Google sign-in keeps working with the fingerprints you already added:

```powershell
npx react-native run-android --mode release
```

- [ ] Fallback: a debug build. It needs Metro running on your laptop for the whole demo, and any warning shows up as a yellow LogBox box at the bottom of the screen:

```powershell
npx react-native run-android
```

> If the release build fails or behaves differently, fall back to the debug build and keep Metro running. Do not debug the release build on demo day.

- [ ] Check that the Geist font renders (headings look like the design, not the system font). The rebuild has not been run on a device before, so look at every screen once.

### Seed data (Firebase mode only)

An empty feed demos badly. In demo mode the feed is already seeded; skip this section.

- [ ] Create 2 to 3 test accounts (for example `ana@...`, `ben@...`, `cara@...`) with short, readable names and different avatars. Write the passwords down somewhere private.
- [ ] Give each account a bio and a location (**Profile > Edit profile**, then **Save**) and a profile photo (**Edit profile > Change photo**; the photo saves right away and shows a "Photo updated" toast).
- [ ] Post 3 to 5 times from each account, most with photos. Mix short and longer captions. The feed is global, so every account's posts show up for everyone.
- [ ] From the secondary accounts, like and comment on the **main demo account's** posts.
- [ ] Sign in as the main demo account and check that the feed shows posts from the other accounts and that the **Posts** tab on Profile loads.
- [ ] Check **Continue with Google** once, if you plan to show it.

### Rehearse

- [ ] Do a full dry run of the [demo script](#demo-script) and time it.

---

## One hour before

- [ ] Device charged above 80 %, charger in the bag.
- [ ] **Do Not Disturb** on. Close other apps. Turn off auto-updates for the session.
- [ ] Screen brightness up, auto-lock set to a long timeout or never.
- [ ] Network check: connect to the venue Wi-Fi and open a web page. If the Wi-Fi is unreliable, use a phone hotspot. Both modes need a network for images (`picsum.photos`, `i.pravatar.cc`).
- [ ] If you are running a debug build: laptop on power, Metro running (`npm start`), device connected, `adb reverse tcp:8081 tcp:8081` done for a USB device.
- [ ] Open the app and sign in as the demo account. Stay signed in. (In demo mode a restart signs you out and resets everything; sign in again just before you start.)
- [ ] Warm the image cache: scroll the whole feed, open two or three posts, open one story, Explore, Messages and the Profile **Photos** tab. Images then load instantly during the demo.
- [ ] Firebase mode: have the photo you will post ready at the top of the device gallery. (Demo mode attaches a placeholder photo; no gallery needed.)
- [ ] If you are screen-mirroring, test the mirroring now.

---

## Demo script

About 8 minutes for all 14 screens. Labels in **bold** are the exact text on screen. The tab bar has 4 tabs, **Home**, **Explore**, **Brief** and **Profile** (your avatar), plus the blue **+** create button to its right. The bell and the messages button sit at the top right of the Home feed.

If you start signed in, begin at step 4 and show steps 1 to 3 at the end, after **Log out**.

| # | Screen | Do | Show |
| --- | --- | --- | --- |
| 1 | Onboarding | Start signed out. Swipe or tap **Next** through the 3 pages | The pitch: friends first, whole albums, "Catch up in thirty seconds" with the Brief. The last page's button reads **Get started** |
| 2 | Register | Tap **Get started** | "Create your account": **Full name**, **Email**, **Password** with the live strength meter (Weak / Fair / Good / Strong), the terms checkbox. Tap **Create account** with an empty form to show the inline errors. Then tap **Sign in** at the bottom |
| 3 | Sign in | Enter the demo email and password, tap **Sign in** | "Welcome back", inline validation, the "Signed in as ..." toast. Optionally **Continue with Google** instead. (In demo mode, any valid email and an 8+ character password work) |
| 4 | Feed | Land on **Home** | The **Home** pill, the bell with its unread count, the stories rail with **Create story**, "What's on your mind, Noor?", then the **Harbor Brief** card. Tap the card to expand it, tap **Refresh** to regenerate it. Scroll the posts; **double-tap** a photo to like it |
| 5 | Story | Tap a story in the rail | Full-screen, auto-advancing with progress bars. Tap the right side to go forward, hold to pause. Like it, type in **Reply to ...** and send ("Reply sent"). Tap **Close** (X) |
| 6 | Post | Tap Priya's hike post (3 photos) | Swipe the carousel. The **Comment summary** card: tap its refresh button to regenerate. Under **Most relevant**, like a comment. Type in **Write a comment…** and send; the comment appears at once |
| 7 | Create | Back, then tap the blue **+** | The audience pill (**Friends**, **Public**, **Close friends**). Type a rough draft, then tap **Clearer**, **Warmer** or **Shorter** under **Polish with Harbor**. Show **Undo AI edit**. Tap **Photo** and **Place**, then **Post**. Back on Home, the new post is on top with a "Posted to Friends" toast |
| 8 | Explore | Tap the **Explore** tab | Topic chips (**For you**, **Home bakers**, ...) swap the photo grid. **Groups for you**: tap **Join**. Type a name (for example "Kofi") in **Search people, groups, posts** and tap **Add friend**, which turns into **Requested** |
| 9 | Notifications | Tap the **Home** tab, then the bell | The AI summary line, **New** and **Earlier**. Yusuf's friend request: tap **Confirm** ("You and Yusuf are now friends"). Tap **Mark all read** |
| 10 | Messages | Back, then the messages button next to the bell | The active-now rail and the chat list, Mateo's chat unread |
| 11 | Chat | Tap Mateo's chat | The smart-reply chips. Tap **Saturday at 3 works**; the chips clear, the typing dots show, and Mateo replies |
| 12 | Brief | Back twice, then the **Brief** tab | **Today** / **This week**, **What you missed** (tap a line to open the post), **Coming up**, **Waiting on you** with **Reply**. Under **Ask Harbor**, tap **What did Priya post this week?**, then type your own question. Point at the disclaimer at the bottom |
| 13 | Profile | Tap the **Profile** tab (your avatar) | Cover, counts, **Edit profile**, **Share**. Switch **Posts**, **Photos** and **About**. Tap the **Profile** tab again to jump to the top. Optionally **Edit profile**, change the bio, **Save** |
| 14 | Settings | Tap the gear (top right of Profile) | Titled **Menu**. The shortcut tiles, then **Harbor AI**: switch off **Brief in your feed** and show the Brief card gone from Home. Under **Privacy**, the read-only rows. Finish with **Log out**, then **Log out** again in the confirmation |

Tips:

- Talk while the app loads, not after. Never wait in silence.
- Tapping the active tab scrolls it to the top. Android back on Explore, Brief or Profile returns to Home (on Home it leaves the app).
- AI answers take 0.6 to 1.1 seconds on purpose, with a shimmer. Keep talking through it.
- Ask Harbor answers best with the three suggestion chips or a question that names a friend (Priya, Mateo, Hana, Ines, Kofi, ...). Anything else gets "I couldn't find that".
- If something fails, say "let me show you that another way" and move to the next step. Do not debug on stage.

---

## Plan B: demo mode, no backend needed

If Firebase or Google sign-in lets you down, switch to demo mode. It needs no Firebase project: auth and data are local and in memory, with the design's seeded people, posts, comments, stories, groups, chats and notifications.

> **Demo mode is not fully offline.** The seeded images are `picsum.photos` and `i.pravatar.cc` URLs, so the device still needs a network connection to show them.

1. Open `src/config.ts` and set:

```ts
export const DEMO_MODE = true;
```

2. Rebuild and reinstall (a JS reload is not enough for a release build):

```powershell
npx react-native run-android --mode release
```

3. Sign in with any valid email and any password of 8 or more characters. **Continue with Google** also works: it signs in a local demo user without contacting Google.

Things to know:

- You are the demo persona, Noor Haddad. Registering with a different name replaces the name.
- Sessions and data live only in memory. Every app restart starts signed out, from a fresh copy of the seed data. Your demo-time posts, likes, friend requests and messages are gone after a restart.
- **Create** attaches a placeholder photo instead of opening the gallery.
- Warm the image cache after signing in, the same as for the live build.
- Do not claim during the demo that it is live data.

Do this the day before as a rehearsal, so you have seen it work. Ideally keep a second device, or a second build, already in demo mode.

> For real Firebase testing, set `DEMO_MODE` back to `false`.

---

## Rough edges to avoid during the demo

- **Do not present the AI as a live model.** The Brief, comment summaries, Polish and Ask Harbor return static sample answers built from the seed data, after a short artificial delay. If asked, say the next step is a Cloud Function that calls a model with a server-side key.
- **Do not present stories, groups, chats, friend requests or notifications as synced.** They are local demo state in both modes and reset on restart.
- **Do not tap Tag, Poll, New message or the Settings shortcut tiles** expecting a flow. They only show a toast. Messages search does nothing.
- **Do not look for "Continue with Apple".** It is not built and is hidden.
- **Do not demo the Firebase-mode Profile as the user's own data.** The cover, About rows and Photos come from the demo persona.
- **Do not delete a post** in Firebase mode. Its likes and comments subcollections are not cleaned up yet (no Cloud Functions).
- **Do not promise push notifications.** None are sent.
- **Do not try to change your username to someone else's.** Handle uniqueness is not enforced yet.
- **Do not show a fresh account on a slow network.** The first feed load and image downloads are the slowest moments. Use the warmed-up demo account.
- **Do not demo on iOS** unless you have built and tested it on a Mac. iOS still needs the `REVERSED_CLIENT_ID` URL scheme and `pod install`.
- **Do not do live Firebase console changes** (rules, indexes) during the demo. A missing index takes minutes to build.
- **If something shows a friendly error**, the details are in `adb logcat` (filter for "Firestore"), not in Metro. Look after the demo, not during it.
