# EarPlug

A mobile app for live music, built from the "EarPlug-Proto-Screens" Figma file. It has two personas:

- **Fans** find shows near them, RSVP or buy tickets, follow bands and save gigs.
- **Musicians** track their draw, apply to venues, accept offers and publish shows to fans.

## Run it

```bash
npm install
npm run dev         # http://localhost:5173 (shows a phone frame on desktop)
npm run dev:phone   # same, plus a Network URL you can open on your phone (same Wi-Fi)
```

### Install on a phone (no app store needed)

Run `npm run build && npx vite preview --host`, open the Network URL on your phone, then:
- **iPhone (Safari):** Share → Add to Home Screen
- **Android (Chrome):** menu → Install app

It opens full-screen with the EarPlug icon and keeps working offline.

### Native iOS / Android apps (Capacitor)

The `ios/` and `android/` folders are native projects that wrap the same code.

```bash
npm run ios       # build, sync, open in Xcode       (needs Xcode installed)
npm run android   # build, sync, open in Android Studio (needs Android Studio)
```

Run `npm run mobile:sync` after any code change to copy it into both native projects.

## What each persona can do

| | Fan | Musician |
|---|---|---|
| Onboarding | phone → code → name → photo → home → genres → notifications → terms | phone → code → artist name → band info → photo → home → genres → notifications → terms |
| Tab bar | Explore · Search · **Plugged** · **Tickets** · Profile | Explore · Search · **Analytics** · **Bookings** · Profile |
| Discover | List/Map, filters, Popular, Recommended, Bands, Friends, Venues Hosting | Same |
| Shows | Save, share, RSVP/buy tickets, see who's plugging in, follow bands | Manage own shows |
| Own pages | Profile, Plugged (saved/following/from bands), Tickets with QR codes | Band profile (editable), Analytics, Pitch Report, Get Booked (11 steps), My Applications (Applications / Calendar / Offers / Messages), Add a Show |

**How the two personas connect:** when a musician accepts an offer or adds a show, it is published as a
real show page. Fans see it in Explore and Search, and can follow the band and get tickets.

**Simulated venue replies:** venues "review" a new application after about 20 seconds and send an
offer after about 75 seconds, so you can try the full booking flow.

## Code structure

```
src/
  App.tsx              routes and persona access rules (fan-only / musician-only screens)
  types.ts             shared data types
  data/                sample content (seed.ts) and analytics numbers (analytics.ts)
  state/
    store.tsx          app state + actions, saved to localStorage
    catalog.ts         read helpers: combines sample data with user-created shows and bands
  lib/                 formatting and device helpers (toast, share, haptics, image resize)
  components/          shared UI (ui.tsx), domain cards (cards.tsx), TabBar, icons
  features/
    onboarding/        Welcome, Setup
    discover/          Explore, Search, MoreGigs, ShowPage, BandPage, VenuePage (both personas)
    fan/               Profile, Plugged, Tickets
    musician/          Analytics, Pitch, Bookings, ApplicationDetail, GetBooked, NewShow
```

To connect a real backend, replace `data/seed.ts` and the actions in `state/store.tsx` with API calls.
The screens only use `useStore()` and `useCatalog()`, so they don't need to change.

## Demo notes

- No real text messages, payments or accounts. Any 6-digit code works and checkout is simulated.
- Profile → Settings → **Sign out & reset demo** clears everything so you can try the other persona.
