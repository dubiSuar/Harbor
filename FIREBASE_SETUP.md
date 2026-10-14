# Firebase setup

How to connect Harbor to the Firebase project `harbor-rn-2026`, from a fresh clone to a working sign-in, feed and photo upload. Follow the sections in order. Each step has a checkbox so you can track progress.

If you only need the app to run for a demo, you can skip all of this and use demo mode instead. See [Demo mode](#demo-mode-skip-firebase-entirely).

Firebase backs auth, posts, likes, comments and profiles. The social features and the AI do not use Firebase yet. See [What is not backed by Firebase yet](#14-what-is-not-backed-by-firebase-yet).

| Item | Value |
| --- | --- |
| Firebase project ID | `harbor-rn-2026` |
| Storage bucket | `harbor-rn-2026.firebasestorage.app` |
| Android package name | `com.harbor` |
| iOS bundle ID | `com.harbor` |
| Android config file | `android/app/google-services.json` |
| iOS config file | `ios/Harbor/GoogleService-Info.plist` |

Console home: <https://console.firebase.google.com/project/harbor-rn-2026/overview>

> **Order matters.** Create the Firestore database and deploy the rules (sections 7 and 8) **before anyone signs in to the app for the first time**. On every sign-in the app creates or checks the user's profile doc (`users/{uid}`). Without a database or rules, that fails: the app retries three times, then the Home tab shows **Couldn't load your feed** with "Couldn't set up your profile. Check your connection and try again." and a **Try again** button. Tapping **Try again** (or pulling to refresh) retries once the backend is ready.

---

## 0. What is already done

These are in the repo already. You do not need to redo them, but it helps to know where they are.

- **Firebase apps registered.** Both config files exist and point at `harbor-rn-2026`. Neither file contains an OAuth client yet (`"oauth_client": []` in `google-services.json`, and no `CLIENT_ID` / `REVERSED_CLIENT_ID` in the plist). Google sign-in will not work until you complete sections 2 to 5 (and section 6 on iOS).
- **Packages installed** (`package.json`): `@react-native-firebase/app`, `auth`, `firestore` and `storage` (26.4.x, modular API), `@react-native-google-signin/google-signin` (16.x), `react-native-image-picker` (8.x).
- **Android native wiring.**
  - `android/build.gradle` has `classpath("com.google.gms:google-services:4.4.2")` in `buildscript.dependencies`.
  - `android/app/build.gradle` has `apply plugin: "com.google.gms.google-services"`, and `applicationId "com.harbor"`.
  - `android/app/build.gradle` signs the **debug and release** builds with `android/app/debug.keystore` (alias `androiddebugkey`, password `android`). That keystore file exists in the repo.
  - `AndroidManifest.xml` declares the `INTERNET` and `CAMERA` permissions.
- **iOS native wiring.**
  - `ios/Harbor/AppDelegate.swift` imports `FirebaseCore` and calls `FirebaseApp.configure()` at the top of `didFinishLaunchingWithOptions`.
  - The Xcode project's bundle ID (`PRODUCT_BUNDLE_IDENTIFIER`) is `com.harbor` for Debug and Release.
  - `GoogleService-Info.plist` is referenced in `ios/Harbor.xcodeproj/project.pbxproj` and is in the `Harbor` target's resources.
  - `ios/Podfile` uses static frameworks (`use_frameworks! :linkage => :static`, overridable with the `USE_FRAMEWORKS` environment variable) and sets `$RNFirebaseAsStaticFramework = true`.
  - `ios/Harbor/Info.plist` has `NSPhotoLibraryUsageDescription` and `NSCameraUsageDescription`.
- **Auth code.** `src/services/auth.ts` implements email/password sign-up, sign-in, password reset and Google sign-in. The `webClientId` line is still commented out (see section 5).
- **Data layer.** `src/services/backend/firebase.ts` reads and writes Firestore and Cloud Storage. It is the schema reference for section 7. The app creates each user's profile doc itself on first sign-in; there is nothing to seed by hand.
- **Backend config.** `firestore.rules`, `firestore.indexes.json`, `storage.rules`, `firebase.json` and `.firebaserc` (default project `harbor-rn-2026`) are at the repo root, ready to deploy.

> **iOS is not finished.** The `REVERSED_CLIENT_ID` URL scheme and `pod install` are still to do. See section 6. Both need a Mac.

---

## 1. Prerequisites

- [ ] A Google account with Owner or Editor access to `harbor-rn-2026`.
- [ ] Node.js 22.11 or newer (`node -v`). This is the `engines` requirement in `package.json`.
- [ ] Android Studio with an Android SDK and an emulator, or an Android phone with USB debugging enabled. For Google sign-in on an emulator, use a system image **with Google Play** (not just "Google APIs").
- [ ] JDK 17 or newer. Android Studio's bundled JBR works.
- [ ] Windows environment variables, so that any terminal (including the one in Antigravity) can find Java and the Android tools. Set them under **Start > "Edit the system environment variables" > Environment Variables... > User variables**:
  - `JAVA_HOME` = `C:\Program Files\Android\Android Studio\jbr`
  - `ANDROID_HOME` = `%LOCALAPPDATA%\Android\Sdk`
  - Add `%LOCALAPPDATA%\Android\Sdk\platform-tools` to `Path` (this gives you `adb`).

  Then close and reopen your terminals and your IDE. Already-open terminals do not see the new values. Check with:

```powershell
java -version
adb devices
```

- [ ] Project dependencies installed:

```powershell
cd "E:\01 GITHUB REPOS\Harbor"
npm install
```

- [ ] Firebase CLI (needed for section 8):

```powershell
npm i -g firebase-tools
firebase login
firebase projects:list   # harbor-rn-2026 should be listed
```

> If PowerShell says `firebase.ps1 cannot be loaded because running scripts is disabled on this system`, call `firebase.cmd` instead of `firebase` (for example `firebase.cmd login`). It runs the same CLI without changing your execution policy.

- [ ] For iOS only: a Mac with Xcode and CocoaPods.

---

## 2. Enable Email/Password sign-in

- [ ] Open **Firebase console > Build > Authentication**. If you see **Get started**, click it.
- [ ] Go to the **Sign-in method** tab.
- [ ] Click **Email/Password**, switch **Enable** on. Leave **Email link (passwordless sign-in)** off.
- [ ] Click **Save**.

Direct link: <https://console.firebase.google.com/project/harbor-rn-2026/authentication/providers>

The app requires a password of at least 8 characters on sign-up (checked in `src/services/auth.ts` before Firebase is called).

---

## 3. Enable Google sign-in

- [ ] Still in **Authentication > Sign-in method**, click **Add new provider > Google**.
- [ ] Switch **Enable** on.
- [ ] Pick a **Project support email**.
- [ ] Click **Save**.

Saving creates an OAuth client of type **Web application** in the linked Google Cloud project. That is the client you need for `webClientId` in section 5. You can see it again later under **Google > Web SDK configuration > Web client ID**.

---

## 4. Add the Android SHA-1 and SHA-256 fingerprints

Google sign-in on Android only works if Firebase knows the fingerprint of the key that signed the APK. Without it you get `DEVELOPER_ERROR` (code 10).

Harbor signs **both debug and release** builds with `android/app/debug.keystore`, so one pair of fingerprints covers both.

### 4.1 Get the fingerprints

Use `signingReport`. It prints the exact key Gradle uses for each build variant, so it is the source of truth.

```powershell
cd "E:\01 GITHUB REPOS\Harbor\android"
.\gradlew signingReport
```

Find the block for `Variant: debug` and `Config: debug`. It should show `Store: ...\android\app\debug.keystore`. Copy the `SHA1` and `SHA-256` lines. The `release` variant shows the same store and the same values.

Alternative with `keytool`. It is not on the `PATH` by default on Windows, so call the copy that ships with Android Studio. Run it from the repo root and point it at the **project** keystore, because that is the one `android/app/build.gradle` uses:

```powershell
cd "E:\01 GITHUB REPOS\Harbor"
& "C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe" -list -v -keystore android\app\debug.keystore -alias androiddebugkey -storepass android
```

> **Do not use `%USERPROFILE%\.android\debug.keystore` for this project.** That is Android Studio's per-machine debug key. Harbor signs with `android/app/debug.keystore` instead, so the fingerprints differ. Only use the per-user keystore if you change `signingConfigs.debug` to point at it.

- [ ] Copied SHA-1.
- [ ] Copied SHA-256.

### 4.2 Add them to Firebase

- [ ] **Firebase console > gear icon (Project settings) > General**.
- [ ] Scroll to **Your apps** and select the Android app `com.harbor`.
- [ ] Click **Add fingerprint**, paste the SHA-1, **Save**.
- [ ] Click **Add fingerprint** again, paste the SHA-256, **Save**.

> **Release builds and the Play Store.** Right now `release` is also signed with the debug keystore (see `buildTypes.release` in `android/app/build.gradle`), so the same fingerprints cover it. When you create a real release keystore, add its SHA-1 and SHA-256 too. If you ship through Google Play with Play App Signing, also add the **app signing key** fingerprints from **Play Console > Setup > App signing**.

---

## 5. Re-download the config files and set `webClientId`

The config files on disk were downloaded before Google sign-in was enabled and before the fingerprints were added, so they have no OAuth clients (`google-services.json` has `"oauth_client": []`). Replace both, **after** sections 3 and 4.

### 5.1 Android

- [ ] **Project settings > General > Your apps > Android app `com.harbor`**.
- [ ] Click **google-services.json** to download.
- [ ] Replace `android/app/google-services.json` with the new file.
- [ ] Open it and check that `oauth_client` is no longer empty. You should see at least one entry with `"client_type": 1` (Android, tied to your SHA-1) and one with `"client_type": 3` (Web application).

### 5.2 iOS

- [ ] **Project settings > General > Your apps > Apple app `com.harbor`**.
- [ ] Click **GoogleService-Info.plist** to download.
- [ ] Replace `ios/Harbor/GoogleService-Info.plist` with the new file. Keep the same file name and location; the Xcode project already references it.
- [ ] Open it and check it now has `CLIENT_ID` and `REVERSED_CLIENT_ID` keys.

### 5.3 Set `webClientId`

The value is the **Web application** OAuth client ID. Get it from either place (they are the same string):

- the new `google-services.json`: the `client_id` of the `oauth_client` entry with `"client_type": 3`, or
- **Authentication > Sign-in method > Google > Web SDK configuration > Web client ID**.

It looks like `101207265074-xxxxxxxx.apps.googleusercontent.com`.

> **Use the Web client, not the Android or iOS one.** Passing the Android client ID (`client_type` 1) is the most common cause of `DEVELOPER_ERROR`.

- [ ] Open `src/services/auth.ts` and replace the commented line:

```ts
GoogleSignin.configure({
  webClientId: '101207265074-xxxxxxxx.apps.googleusercontent.com',
});
```

The Web client ID is not a secret. It is safe to commit.

- [ ] Rebuild the app (`npx react-native run-android`). A JS reload does not pick up a new `google-services.json`.

What happens until this is done: **Continue with Google** (on the Sign in screen) shows the toast "Google sign-in isn't set up yet. Add the webClientId (see FIREBASE_SETUP.md)." when Google returns no ID token. Other Google failures show "Couldn't sign in with Google. Try again, or use your email." Closing the Google account picker is treated as a cancel and does nothing.

---

## 6. iOS: URL scheme and pods (Mac only)

Already done in the repo: bundle ID `com.harbor`, `GoogleService-Info.plist` in the `Harbor` target, static frameworks plus `$RNFirebaseAsStaticFramework = true` in the Podfile, and the photo library and camera usage strings in `Info.plist`. Two items remain.

Google sign-in on iOS redirects back into the app through a custom URL scheme. If the scheme is missing, the app crashes as soon as you tap **Continue with Google**.

- [ ] Re-download `GoogleService-Info.plist` **after** enabling Google sign-in (section 5.2). The current file has no `REVERSED_CLIENT_ID`.
- [ ] Copy the `REVERSED_CLIENT_ID` value from the new plist (it looks like `com.googleusercontent.apps.101207265074-xxxxxxxx`).
- [ ] Add it to `ios/Harbor/Info.plist`. The file has no `CFBundleURLTypes` entry today, so add one inside the top-level `<dict>`:

```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>com.googleusercontent.apps.101207265074-xxxxxxxx</string>
    </array>
  </dict>
</array>
```

  You can do the same in Xcode: **Harbor target > Info > URL Types > +**, and paste the value into **URL Schemes**.

- [ ] Install pods. The Podfile links frameworks statically by default, so no extra flags are needed:

```bash
cd ios
pod install
```

---

## 7. Create the Firestore database

Do this, and section 8, before the first sign-in (see "Order matters" at the top).

> **The location is permanent.** You cannot move a Firestore database after you create it. Pick a region near your users. If you want Storage's no-cost quota (section 9), the bucket has to be in `US-CENTRAL1`, `US-EAST1` or `US-WEST1`; keeping Firestore in the US too (for example `us-central1` or `nam5`) keeps the two close.

- [ ] **Firebase console > Build > Firestore Database > Create database**.
- [ ] Database ID: leave it as `(default)`. The app uses the default database.
- [ ] Choose the **location**.
- [ ] Choose **Start in production mode**. This denies all reads and writes until you deploy Harbor's rules in the next section. Do not use test mode; it leaves the database open to anyone.
- [ ] Click **Create**.

### Data model (for reference)

The source of truth is the schema comment at the top of `src/services/backend/firebase.ts`, plus `firestore.rules` and `storage.rules`. Treat those files as correct if they differ from this table.

| Path | Fields |
| --- | --- |
| `users/{uid}` | name, handle, bio, location, photoUrl, photoPath, followersCount, followingCount, postsCount, createdAt, updatedAt, plus the counter markers lastPostId and lastFollowId. Public to signed-in users. No prefs here. |
| `users/{uid}/private/prefs` | pushLikes, pushComments, pushFollows, dailySummary (booleans). Owner only. The app still creates this doc on sign-in, but no screen reads or changes it any more. |
| `users/{uid}/following/{targetUid}` | createdAt. One doc per account this user follows. The current UI shows friends (local, see section 14) and no longer writes follows. |
| `users/{uid}/followers/{followerUid}` | createdAt. One doc per follower. Same as above. |
| `users/{uid}/activity/{id}` | kind (`like`, `comment`, `follow`), actorId, postId, commentId, thumbUrl, quote, createdAt, read. Ids are `like_{postId}_{actorUid}`, `follow_{actorUid}` and `comment_{commentId}`. Written by the actor, never for yourself. Still written on likes and comments, but the Notifications screen shows local seed data, not this collection. |
| `posts/{postId}` | authorId, text, imageUrl (optional), imagePath (optional), createdAt, likeCount, commentCount, plus the marker lastCommentId. A post's place and audience from the Create screen are not stored. |
| `posts/{postId}/likes/{uid}` | uid, createdAt. One doc per user who liked the post. `uid` repeats the doc id so a collection-group query can list a user's liked posts. |
| `posts/{postId}/comments/{commentId}` | authorId, text, createdAt |

How counters stay honest: every counter (`likeCount`, `commentCount`, `followersCount`, `followingCount`, `postsCount`) may only move by exactly 1, in the same write as the doc it counts, and the rules check both sides. Where one counter covers many docs, the marker field (`lastPostId`, `lastFollowId`, `lastCommentId`) names the doc that moved. Likes and follows run as Firestore transactions and are idempotent; posts and comments are written in batches.

Storage paths: `posts/{uid}/{postId}.jpg` and `avatars/{uid}.jpg`. Uploads must be JPEG, PNG, HEIC, HEIF, WebP or GIF images under 10 MB.

---

## 8. Deploy the Firestore rules and indexes

The repo root holds the backend config:

| File | Purpose |
| --- | --- |
| `firestore.rules` | Who may read and write each Firestore path |
| `firestore.indexes.json` | Composite indexes the app's queries need |
| `storage.rules` | Who may read and write each Storage path |
| `firebase.json` | Tells the CLI where the files above are |
| `.firebaserc` | Sets the default project to `harbor-rn-2026` |

The two composite indexes:

| Collection | Fields | Scope | Used by |
| --- | --- | --- | --- |
| `posts` | `authorId` Ascending, `createdAt` Descending | Collection | The **Posts** tab on Profile (yours and other users') |
| `likes` | `uid` Ascending, `createdAt` Descending | **Collection group** | The liked-posts query in the store. No current screen uses it; keep it deployed so the query keeps working |

The Home feed does not need a composite index. It is a single global query: the newest posts from everyone, by `createdAt`.

### Option A: Firebase CLI (recommended)

Run these in PowerShell (in Antigravity: **Terminal > New Terminal**), in this order. Use `firebase.cmd` instead of `firebase` if the execution policy blocks the script (see section 1).

```powershell
cd "E:\01 GITHUB REPOS\Harbor"
npm i -g firebase-tools        # once
firebase login                 # once, opens a browser
firebase deploy --only firestore:rules,firestore:indexes
```

`.firebaserc` already points at `harbor-rn-2026`, so you do not need `firebase use`.

- [ ] Deploy finished with `Deploy complete!`.
- [ ] **Firestore Database > Indexes** shows both composite indexes. New indexes show **Building** for a few minutes. They must show **Enabled** before the Profile **Posts** tab works. Until then, those views show "This view isn't ready yet: a database index is still being set up."

> **"API ... has not been used in project ... or it is disabled".** If the CLI reports a disabled API, enable it in the **Google Cloud console > APIs & Services > Library** for project `harbor-rn-2026`, wait a minute, and deploy again. The ones Harbor needs: **Cloud Firestore API**, **Firebase Rules API**, **Cloud Storage for Firebase API** and **Identity Toolkit API** (Firebase Authentication).

You deploy Storage rules in section 9, once Storage exists. After that you can deploy everything in one go:

```powershell
firebase deploy --only firestore:rules,firestore:indexes,storage
```

### Option B: paste into the console

Use this if you cannot install the CLI.

- [ ] **Firestore Database > Rules** tab. Replace the whole editor content with the contents of `firestore.rules`. Click **Publish**.
- [ ] **Firestore Database > Indexes > Composite > Create index**. Add each index from the table above by hand: same collection ID, same fields in the same order, same Ascending/Descending, same query scope. The `likes` index must use the **Collection group** scope.

Option B is easy to get wrong for indexes. If a view later says an index is still being set up and you never created it, the exact index link is in `adb logcat` (see Troubleshooting).

---

## 9. Enable Cloud Storage and deploy its rules

> **Billing: Blaze is required.** Harbor's bucket is a new-style `harbor-rn-2026.firebasestorage.app` bucket. These buckets need the **Blaze (pay-as-you-go)** plan, which needs a billing account. Blaze keeps a no-cost Storage quota, but only for buckets in `US-CENTRAL1`, `US-EAST1` or `US-WEST1`; pick one of those to stay inside it. Set a budget alert right away: **Google Cloud console > Billing > Budgets & alerts > Create budget** (for example, alert at a small monthly amount). A budget alert notifies you; it does not cap spending.

- [ ] **Firebase console > Build > Storage > Get started**.
- [ ] If asked, upgrade to Blaze and link a billing account.
- [ ] Choose **Start in production mode**.
- [ ] Pick the location (`US-CENTRAL1`, `US-EAST1` or `US-WEST1` for the no-cost quota).
- [ ] Confirm the bucket is `harbor-rn-2026.firebasestorage.app`. It must match `STORAGE_BUCKET` in the plist and `storage_bucket` in `google-services.json`.
- [ ] Deploy the rules:

```powershell
firebase deploy --only storage
```

  Or paste `storage.rules` into **Storage > Rules** and click **Publish**.

---

## 10. First-run verification

Make sure `DEMO_MODE` in `src/config.ts` is `false`. It is currently `true` in the repo, and in demo mode the app never talks to Firebase. Then build and run on Android:

```powershell
cd "E:\01 GITHUB REPOS\Harbor"
npx react-native run-android
```

Check each item:

- [ ] **Sign up.** On the onboarding screen, tap **Skip** (or **Next** through to **Get started**). Fill in **Full name**, **Email** and an 8+ character **Password**, tick the terms checkbox, and tap **Create account**.
- [ ] **Auth user exists.** **Authentication > Users** lists the new email.
- [ ] **Profile docs exist.** **Firestore Database > Data** shows `users/{uid}` (where `{uid}` matches the **User UID** column in Authentication) and `users/{uid}/private/prefs`. The handle defaults to the part of the email before the `@`.
- [ ] **Post.** Tap the blue **+** next to the tab bar, tap **Photo** and pick a photo, write a caption, tap **Post**. You should see a new `posts/{postId}` doc, a file under **Storage > posts/{uid}/**, and `postsCount` on `users/{uid}` go up.
- [ ] **Like and comment.** Double-tap the photo to like it, then open the post and send a comment from **Write a comment…**. Check `posts/{postId}/likes/{uid}`, `posts/{postId}/comments/...`, and that `likeCount` / `commentCount` changed.
- [ ] **Edit profile.** On **Profile**, tap **Edit profile**, change the bio, tap **Save**. Check `users/{uid}` changed. **Change photo** uploads to **Storage > avatars/**.
- [ ] **Profile posts.** On **Profile**, the **Posts** tab shows your post. If it says an index is still being set up, wait for the indexes to show **Enabled** (section 8). The **Photos** and **About** tabs on your own Profile show the demo persona's content (see section 14).
- [ ] **Two accounts.** Log out (**Profile** > gear > **Menu** > **Log out**, then **Log out** again to confirm), create a second account, and check that the first account's post appears in its Home feed (the feed is global). Like and comment on it, and check the counters and `users/{a}/activity/...` for the first account.
- [ ] **Google sign-in.** Log out, go to the Sign in screen, and tap **Continue with Google**. A new user with provider Google appears in Authentication.
- [ ] **Session restore.** Kill and reopen the app. You should land on Home, still signed in.
- [ ] **Logs are clean.** Watch `adb logcat` (see Troubleshooting) for `PERMISSION_DENIED` or index errors while you click around.

---

## 11. Troubleshooting

The app never shows raw Firebase errors. It shows short, friendly messages (mapped in `src/services/backend/types.ts` and `src/services/auth.ts`). In a debug build, Metro and the LogBox also print those friendly messages as `[store] ...` warnings, which tells you which call failed but not why.

The **raw** Firestore status codes, and the link that creates a missing index, are written by the native Firestore SDK to **logcat**, not to Metro. Watch them while you reproduce the problem:

```powershell
adb logcat | Select-String -Pattern "Firestore"
```

| What the app shows | Likely cause | Fix |
| --- | --- | --- |
| **Couldn't load your feed**: "Couldn't set up your profile. Check your connection and try again." | Firestore was not created, or the rules were not deployed, when the user first signed in. Or no network. | Do sections 7 and 8, then tap **Try again**. Check logcat for `PERMISSION_DENIED` or `NOT_FOUND`. |
| "This view isn't ready yet: a database index is still being set up." | A composite index is missing or still **Building** (`FAILED_PRECONDITION`) | Check **Firestore Database > Indexes**. If both exist, wait until they show **Enabled**. If one is missing, run `firebase deploy --only firestore:indexes`, or open the `https://console.firebase.google.com/...` link from logcat and click **Create index**. If you create one by hand, also add it to `firestore.indexes.json` so the next deploy keeps it. |
| "You don't have permission to do that." | Firestore or Storage rules rejected the request (`PERMISSION_DENIED` or `storage/unauthorized`). Common reasons: rules not deployed, writing a field the rules don't allow, an upload that is not an allowed image type or is 10 MB or more. | Check **Firestore Database > Rules** and **Storage > Rules** show your deployed rules and a recent publish time. Find the failing request in logcat and compare it with the matching `match` block in `firestore.rules` or `storage.rules`. The **Rules playground** on the Rules tab can replay a single request. |
| "Your session expired. Sign in again." | The request had no valid auth (`unauthenticated`) | Log out (**Profile** > gear > **Log out**) and sign back in. |
| "Can't reach Harbor right now. Check your connection." or, on sign-in, "Can't reach the server. Check your connection." | No network on the device or emulator, or a proxy / firewall blocking Google APIs | Open a browser on the device and load any page. Cold-boot the emulator. Check the PC's VPN or firewall. |
| Uploads fail or hang | Storage was never enabled, or the bucket name differs from the config files | Do section 9. Re-download both config files if the bucket name changed. |
| "Couldn't sign in with Google. Try again, or use your email." | SHA-1 / SHA-256 missing, or `google-services.json` not re-downloaded after adding them (`DEVELOPER_ERROR`, code 10) | Do sections 4 and 5. Run `.\gradlew signingReport` and compare with **Project settings > Your apps > Android**. Make sure `webClientId` is the `client_type: 3` (Web) ID. Rebuild with `run-android`, not just a JS reload. |
| "Google sign-in isn't set up yet. Add the webClientId (see FIREBASE_SETUP.md)." | `webClientId` is not set in `src/services/auth.ts` | Do section 5.3 and rebuild. |
| Nothing happens after tapping **Continue with Google** and closing the picker | That is a cancel; the app deliberately does nothing | Pick an account in the Google sheet. |
| "Google Play services is needed to sign in with Google. Update it and try again." | The emulator image has no Google Play, or Play services is out of date | Use an emulator image **with Google Play** and sign in to a Google account on the device first. |
| iOS app crashes when tapping **Continue with Google** | `REVERSED_CLIENT_ID` URL scheme missing from `Info.plist` | Do section 6. Make sure the plist you copied the value from is the re-downloaded one. |
| CLI: `API ... has not been used in project ... or it is disabled` | A Google Cloud API is off for the project | Enable it (section 8) and deploy again. |
| PowerShell: `firebase.ps1 cannot be loaded` | Script execution policy | Use `firebase.cmd` instead of `firebase`. |
| Build error mentioning `google-services` or "No matching client found for package name" | `google-services.json` is missing, or its package name is not `com.harbor` | Re-download the Android config from the `com.harbor` app and put it in `android/app/`. |
| App works but shows sample data and nothing reaches Firebase | `DEMO_MODE` is `true` | Set it to `false` in `src/config.ts` and rebuild. |

---

## 12. Security notes

- **Never commit service-account keys.** These are JSON files with `"type": "service_account"` and a `private_key`. The app does not need one. If one is ever committed, delete the key in **Google Cloud console > IAM & Admin > Service accounts > Keys** immediately; removing it from git is not enough.
- **The client config files are not secrets.** `google-services.json` and `GoogleService-Info.plist` identify the project; the API key inside is restricted by the security rules, not by being hidden. They are specific to `harbor-rn-2026`, though, so anyone building from a fork against another project must replace them.
- **Rules are the real security boundary.** Anyone can call the Firebase APIs with the client config. Keep `firestore.rules` and `storage.rules` strict and deploy them every time they change.
- **Keystores.** `.gitignore` ignores `*.keystore` except `debug.keystore`. Keep it that way. Never commit a release keystore or its passwords.
- **Next step: App Check.** Firebase App Check (Play Integrity on Android, App Attest / DeviceCheck on iOS) makes Firebase reject requests that do not come from your real app. It needs the `@react-native-firebase/app-check` package and some setup; it is not installed yet.

---

## 13. Known limitations

- **Counters rely on client writes.** There are no Cloud Functions yet. Like, comment, follow and post counters, and activity entries, are written by the clients. The rules are hardened (every counter is paired with the doc it counts, see section 7), but the long-term answer is to move counters and activity into Cloud Functions.
- **Deleting a post leaves its subcollections behind.** Firestore does not delete `posts/{postId}/likes` and `posts/{postId}/comments` when the parent doc is deleted. The orphans are unreachable from the app. The clean fix is a Cloud Function triggered on post delete that calls `recursiveDelete` on the post's path. For one-off manual cleanup, the CLI can do it: `firebase firestore:delete posts/<postId> --recursive`.
- **Handles are not unique.** Two users can pick the same handle. Enforcing this needs a `handles/{handle}` collection written in a transaction, or a Cloud Function.
- **No push notifications.** Nothing sends notifications yet.
- **No App Check yet** (see section 12).

---

## 14. What is not backed by Firebase yet

With `DEMO_MODE = false`, these still run on local seed data from `src/data/social.ts` and `src/data/mock.ts`, held in `src/state/SocialContext.tsx`. They are the same for every account and reset when the app restarts:

- **Social features:** stories, groups and joins, friends and friend requests (**Add friend**, **Confirm**), chats and messages, notifications (including **Mark all read**), comment likes, and the Harbor AI toggles in Settings.
- **AI:** the Harbor Brief, the comment summary, **Polish with Harbor** and **Ask Harbor** (`src/services/ai.ts`) return static sample answers after a short delay. Smart replies and the Notifications summary are fixed strings. There is no model call and no API key anywhere.
- **Profile extras:** the cover, the **About** rows, the **Photos** tab and the friend and album counts on your own Profile come from the demo persona.
- **Post fields:** the place and audience chosen on the Create screen are not written to Firestore, and share counts read 0.
- **Seed links:** Brief lines and notifications point at seed post ids (`p1` to `p6`), which do not exist in Firestore. Tapping them opens that person's profile instead (or, for Brief lines, their newest real post if they have one).

Recommended next steps, in order:

1. **Friends and friend requests in Firestore.** Add `users/{uid}/friends` and a `friendRequests` collection, with rules that only let the two people involved write. Then switch the feed from global to friends-only if that is the product direction.
2. **Notifications from Firestore.** Show `users/{uid}/activity` (already written on likes and comments) on the Notifications screen, and add friend-request items.
3. **Chats.** `chats/{chatId}` with a `members` array and a `messages` subcollection, readable only by members.
4. **Stories and groups.** Stories with an expiry time and an image in Storage; groups with a membership subcollection.
5. **AI through a Cloud Function.** A callable function that checks the user, calls a Claude model with the API key held in Secret Manager, and returns the text. `complete()` in `src/services/ai.ts` is the single place to switch over; the prompts are already built there. Never ship the key in the app.
6. **Cloud Functions for counters and cleanup**, App Check, and handle uniqueness (section 13).

Keep the hooks that `SocialContext` exports unchanged while doing this, so the screens do not need to change. [docs/ANTIGRAVITY.md](docs/ANTIGRAVITY.md) has ready-to-paste prompts for steps 1 to 5.

---

## Demo mode: skip Firebase entirely

`src/config.ts` exports `DEMO_MODE`. It is currently `true`. With `true`, auth and data are fully local:

- The design's seeded people, posts, comments, stories, groups, chats and notifications, kept in memory.
- Sign in with any valid email and any password of 8+ characters. **Continue with Google** also works and signs in a local demo user; no Google account is used.
- No Firebase project needed.
- Sessions and data are not persisted: every launch starts signed out, and each sign-in starts from a fresh copy of the seed data.
- The seeded images are `picsum.photos` and `i.pravatar.cc` URLs, so the device still needs a network connection to show them. Demo mode means "no backend needed", not "fully offline".

Use it as a safety net for demos. See [DEMO_CHECKLIST.md](DEMO_CHECKLIST.md). Set it to `false` for real Firebase testing, and rebuild.
