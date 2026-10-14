# Implementation decisions (owner-approved direction + defaults)

Owner answers:
- Follow the Claude Design file (Geist, cobalt on zinc) for ALL 14 screens. The blob/Outfit look is retired.
- Tab bar: the design's 4 tabs: Home, Explore, Brief, Profile (avatar). Create opens from the design's create button; Messages and Notifications from header icons.
- AI features: static sample answers, built from mock data. No network calls. No API keys in the app.
- New features (stories, explore/groups, messages/chat, notifications with friend requests, profile photos/about): fully working UI on demo data.

Defaults chosen for the spec's open questions (SPEC.md section 8):
1. Blur: no new native packages. Use semi-opaque white (rgba(255,255,255,0.86)) plus a hairline for translucent headers and tab bar, and a gradient fade where the design fades. Note the BlurView as a later upgrade.
2. Transitions: use the design's motion. Push is a 28px slide plus a fade over 450ms; create/modal rises 56px over 500ms. Easing per SPEC.md. Back reverses it.
3. Friends model: follow the design (Add friend / Requested / Friends, friend requests, "N friends"). Implement it in the social layer on demo data. The existing follow API may stay underneath for the feed/suggestions, but the UI shows friend language.
4. Activity and Ask Harbor leave the tab bar. Notifications is a pushed screen. Ask Harbor lives inside Brief.
5. AI: canned demo answers only (services/ai.ts with a deterministic, mock-data-driven fallback and the same async shape as a future server call, with an artificial 600-1100ms delay).
6. "Continue with Apple": hide it (not implemented, no dead controls). Keep Google + email.
7. Demo persona: use the design's seed people and content verbatim, including the demo user from the design. If the signed-in user has a name, it overrides the seed name.
8. Push / daily-summary settings: drop them; Settings follows the design's rows only.
9. Comment summary: show it as the design does.
10. Double-tap: like only (never unlike); the heart button toggles.
11. Story: pause on press-and-hold and while the reply input is focused; tap left/right to go back/forward; auto-advance per SPEC.md.
12. Firebase mode: the new social features (stories, groups, chats, friend requests) come from the local demo seed in both modes, isolated in `src/state/SocialContext.tsx` so Firestore can replace it later. Existing Firebase posts, likes, comments, profile and auth keep working.
13. Tab bar items: follow the design's layout exactly.

Global rules: Geist via `fonts.*` (never fontWeight). Phosphor icons via `phosphor-react-native` (already installed). No #000. No emojis. Animations use transform/opacity only, native driver, with cleanup. Labels on every control, touch targets ≥44. Don't run an emulator, Metro or Gradle, and don't install packages.
