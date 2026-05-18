# Food & Symptom Journal

A cross-platform food and wellness tracker for daily intake logging and care team collaboration. Built as a PWA with native Android and iOS shells via Capacitor.

## Features

- Daily food and symptom journal with meal tagging, wellbeing ratings, and photo support
- 7-day timeline overview and entry stats
- Caregiver dashboard — invite helpers who can attach private notes to your entries
- Dark / light / auto theme, adjustable font size and family
- Inactivity timeout with 2-minute warning (configurable per session)
- Reminder banner that respects a 2-minute grace period on app open
- Full offline fallback via service worker (PWA)

## Tech Stack

| Layer | Choice |
|---|---|
| UI | React 18 + Vite 6 |
| Backend | Supabase (Postgres + Auth) |
| PWA | vite-plugin-pwa (auto-updating service worker) |
| Native (Android) | Capacitor 8 + Gradle / AGP 8 |
| Native (iOS) | Capacitor 8 + Xcode / Swift Package Manager |
| Unit & component tests | Vitest + React Testing Library |
| E2E & smoke tests | Playwright (Chromium) |

## Getting Started

```bash
npm install
npm run dev          # starts Vite dev server at localhost:5173
```

### Environment variables

Create a `.env.local` file for Supabase credentials:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Without these the app runs against a built-in localStorage mock client — useful for offline development and the full test suite.

## Scripts

```bash
npm run dev              # development server
npm run build            # production build → dist/
npm test                 # unit + component tests (Vitest)
npm run test:coverage    # tests with v8 coverage report
npm run test:e2e         # full Playwright E2E suite
npm run test:smoke       # smoke tests only
npm run test:regression  # regression tests only

npm run cap:sync         # build + sync web assets to both platforms
npm run cap:android      # build + sync + open Android Studio
npm run cap:ios          # build + sync + open Xcode
```

## CI / CD

Three GitHub Actions workflows run on every push and PR to `main`:

| Workflow | Trigger | Output |
|---|---|---|
| **CI** | all branches / PRs | Vitest unit tests → Playwright E2E tests; coverage artifact |
| **Android** | all branches / PRs | Debug APK artifact (30-day retention) |
| **iOS** | all branches / PRs | Unsigned simulator build artifact (30-day retention) |

### Release builds (version tags)

Push a version tag to trigger signed release artifacts:

```bash
git tag v1.0.0 && git push --tags
```

- **Android** — signed AAB via `bundleRelease` (requires 4 repository secrets)
- **iOS** — signed IPA exported for App Store / TestFlight (requires 4 repository secrets)

#### Required secrets

| Secret | Used by |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | Android signing |
| `ANDROID_KEY_ALIAS` | Android signing |
| `ANDROID_KEY_PASSWORD` | Android signing |
| `ANDROID_STORE_PASSWORD` | Android signing |
| `IOS_CERTIFICATE_BASE64` | iOS signing |
| `IOS_CERTIFICATE_PASSWORD` | iOS signing |
| `IOS_PROVISIONING_PROFILE` | iOS signing |
| `IOS_TEAM_ID` | iOS signing |

## Project Structure

```
src/
  components/     React components (Auth, FoodLog, WeekTimeline, …)
  lib/            Hooks and utilities (supabase, settings, theme, inactivity, reminder)
  __tests__/
    unit/         Vitest unit tests for hooks and utilities
    components/   Vitest component tests (React Testing Library)
e2e/              Playwright specs (smoke, auth, journal, regression)
android/          Capacitor Android project (Gradle)
ios/              Capacitor iOS project (Xcode / SPM)
.github/
  workflows/      ci.yml · android.yml · ios.yml
```

## Testing

The suite runs entirely against the mock Supabase client — no real credentials needed.

```bash
npm test                 # 228 unit + component tests
npm run test:e2e         # 27 E2E tests (requires Playwright browsers)
npx playwright install chromium   # install browser if needed
```

Coverage is reported for `src/lib/**` and `src/components/**`.
