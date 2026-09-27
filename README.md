# Go Live Survivor

A 90-second survival arcade game for teams implementing Dynamics CRM. Dodge bugs, failed flows, and monster Excel files while your Fixes fire automatically. When everything's on fire, hit Emergency Hotfix.

## Getting started

Requires Node.js 22.13 or later within the 22.x release line, or Node.js 24+, and npm.

```bash
npm install
npm run dev
```

Open the URL printed by Vite. On Windows, if PowerShell blocks `npm.ps1`, use `npm.cmd` with the same arguments.

- WASD or arrow keys: move; Fixes automatically fire at the nearest enemy.
- SPACE: Hotfix, with a 205 px radius and an 8-second cooldown.
- ESC: pause. Switching windows also pauses the game; you must explicitly resume it.
- From the pause screen, you can cancel the run and return to the main menu. Canceled runs do not submit or save a score; the next run starts fresh.
- Survive for 90 seconds with Stability above zero to win and earn +1,000 points.
- The boss is announced at the 65-second mark and appears two seconds later. Defeating it awards 500 base points; you do not have to defeat it to survive.

You can also play on your phone: **Touch controls (mobile)** is enabled by default on touch devices and can be toggled from the main menu. Your preference is saved. Drag the left joystick to move and tap the right button to deploy a Hotfix; you can use both at the same time. Fixes still fire automatically.

In touch mode, the game fills the window, with large controls, a pause button, and audio options available from the pause screen. Both portrait and landscape orientations are supported; landscape gives you more room. The arena keeps its aspect ratio and the entire playfield stays visible. Rotating the device pauses the game and releases the joystick; tap Continue to resume. Keyboard controls remain available.

To try it on a phone connected to the same Wi-Fi network, run `npm.cmd run dev -- --host 0.0.0.0` and open the **Network** URL printed by Vite on your phone.

Version **1.4.1** fixes startup when accessing an IP address over HTTP: local IDs use `crypto.getRandomValues()` when `crypto.randomUUID()` is unavailable. Previously, a first visit in this context would interrupt initialization, leaving the start, language, and audio controls unresponsive. Existing identities and saved runs are preserved.

## Stack and structure

Vite, TypeScript in strict mode, Phaser 3, HTML/CSS, `@supabase/supabase-js`, Vitest, and ESLint. No UI framework, custom backend, or Supabase Realtime.

```text
src/game/config/      Branding, game balance, enemies, and messages
src/game/entities/    Consultant, enemies, and projectiles
src/game/systems/     Scoring, difficulty, spawning, and combat geometry
src/game/scenes/      Phaser scene and run lifecycle
src/services/score/   Repository interface and local / Supabase implementations
src/services/        Optional authentication and synthesized audio
src/utils/           Nicknames, UTC dates, and fault-tolerant storage
src/main.ts          HTML screens, HUD, and navigation without page reloads
src/styles/          UI styles
tests/               Unit tests for engine-independent logic
```

Projectiles, enemies, and effects are destroyed when they are no longer needed. Explicit object limits are enforced; restarting clears the state and effects without recreating the page. Simulation steps are capped at 50 ms to prevent sudden jumps in combat when the browser slows down.

## Local Mode

You do not need Supabase to play or develop the game. Without environment variables, the app uses `LocalScoreRepository`, storing your nickname, sound preference, anonymous identity, and runs in `localStorage`. If the browser blocks storage, an in-memory copy is kept for the session.

The leaderboard shows real results, with no made-up players: the top 10 based on each identity's best run. A browser with only one identity will usually show a single row. Nicknames do not have to be unique; changing your nickname does not create a new user. Up to 400 recent runs and all-time best results are retained. Clearing browser data removes the local identity and saved runs.

If Supabase is configured but the initial connection or authentication fails, the game switches to Local Mode and reports the issue. If an online score submission fails, a local copy is saved and the results screen lets you know. These copies **are not automatically synced**. If fetching online results fails, the leaderboard shows local runs and clearly labels them as such.

## Access logging

In online mode, a visit is logged when the app is opened or reloaded, after the visitor is authenticated. Restarting or canceling a run does not create another log entry.

## Music and audio options

The main menu and results screen play **Dream Culture**; gameplay uses **Bit Quest**. Both tracks are by **Kevin MacLeod (incompetech.com)** and licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). The original recordings are unmodified and loop at a reduced volume. Sources, licensing, and attribution are listed in [public/audio/README.md](public/audio/README.md) and in the app's audio options.

Music starts after the first interaction, respecting the browser's autoplay restrictions. It pauses when the game is paused or the tab is hidden. When returning to a paused run, you must explicitly resume it. Opening **Audio options** during gameplay pauses the game.

Use this header button to turn off **Background music** while keeping sound effects, or turn off **Enable audio (music and effects)** to mute everything. The `gls:music` and `gls:sound` preferences are saved in the browser. MP3 files load when playback is needed, never before the first interaction. If the browser blocks audio or a file fails to load, gameplay continues normally.

## Validation

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run preview
npm run format
```

Tests cover base points, combos and their expiration, bonuses that can only be awarded once, nicknames, UTC weeks, game balance limits, projectile collisions, submission validation, and local storage. Gameplay also needs a visual check: movement, damage and invulnerability, Hotfix and its cooldown, phases, the boss, defeat, victory, and restarting.

## Static deployment

`npm run build` generates `dist/`. There is no application server. Supabase variables must be available **at build time**; changing them after deployment requires a rebuild. `base: './'` allows the app to be served from a subdirectory.

| Platform              | Configuration                                                                                 |
| --------------------- | --------------------------------------------------------------------------------------------- |
| Vercel                | Framework Vite; build `npm run build`; output `dist`; Node 22 or later.                          |
| Netlify               | Build `npm run build`; publish `dist`; Node 22 or later.                                        |
| Azure Static Web Apps | App location `/`; API location empty; output `dist`; Vite preset or custom with `npm run build`. |

You can also upload `dist/` to any HTTPS hosting provider. No SPA redirects are needed: navigation happens within the same page. Configure the two public variables with your hosting provider to enable the shared leaderboard. Without them, the deployed game runs entirely in Local Mode.

## Customization

### Version and language

This release is **1.4.1**. The footer displays the version from `package.json`, embedded at build time by Vite, so visitors can identify the build they are running. For a new release, update the version with `npm version patch --no-git-tag-version` (or `minor` for new features), build, and deploy `dist/`. The version shown in production changes only when that build is deployed.

The language selector in the header lets you choose Español or English from the main menu. It saves your preference in `localStorage` and reloads the interface while preserving your nickname. The selector is disabled during a run and on the results screen; return to the main menu to change languages. The default language is Spanish. UI text, errors, instructions, enemy descriptions, and in-game messages are centralized in `src/i18n/catalog.ts`; both translations are bundled with the app and work without a database. The name **Go Live Survivor** stays the same in both languages.

- `src/game/config/gameConfig.ts`: name, subtitle, and team; reads the version from `package.json`. The main title graphic is composed in `src/main.ts`.
- `src/game/config/enemies.ts`: labels, colors, stats, spawning, and boss configuration.
- `src/game/config/messages.ts`: defeat messages, phases, and Easter eggs.
- `src/game/config/balance.ts`: duration, movement, attacks, spawning, cooldowns, limits, and points.
- `src/game/systems/ScoreSystem.ts`: combo and scoring rules.
- `src/styles/main.css`: color palette, screens, and HUD.

Runs last 90 seconds in the MVP. If you change this, also update the repository validation, migration, UI timer, and tests. There are no achievement tables or UI yet; the run summary collects the metrics needed to add them later.