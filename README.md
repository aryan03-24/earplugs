# EarPlug

Find live shows near you (fans) and grow your draw (musicians). Built from the "EarPlug-Proto-Screens" Figma file.

## Run it

```bash
npm install
npm run dev        # open http://localhost:5173
```

The app is mobile-first. On a laptop it shows inside a phone frame. On your phone, open the
"Network" URL that `npm run dev -- --host` prints (same Wi-Fi).

## What's in it

- **Welcome**: choose Fan or Musician
- **Onboarding**: phone, code (demo: any 6 digits), name, photo, home base, genres, notifications, terms
- **Explore**: List/Map toggle, filters (Tonight, Free, My Top Genres, By Distance), carousels
- **Search**: live search across shows, bands and venues, plus search history
- **Show page**: save, share, follow bands, RSVP / buy tickets (demo checkout)
- **Band profile**: follow, stream, media, upcoming and past shows
- **Fan profile**: editable profile, photo upload, genres, media, saved shows and tickets
- **Analytics** (musicians): 7D/30D/12M/All stats, interactive chart, city and venue performance
- **Pitch report** (musicians): pick a venue, send it, print or save as PDF

## Code map

- `src/data.ts`: sample shows, bands, venues and analytics (swap for a real API)
- `src/store.tsx`: app state, saved to the browser's localStorage
- `src/screens/`: one file per screen
- `src/components/`: shared UI and icons
