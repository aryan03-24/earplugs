// Read-side helpers that combine sample data with what the user created.
import { useEffect, useMemo, useState } from 'react'
import { BANDS, SHOWS, VENUES } from '../data/seed'
import { distanceKm, isPastDate, isToday } from '../lib/format'
import type { Application, ApplicationStatus, Band, Message, Show, Venue } from '../types'
import { useStore, type State } from './store'

export const MY_BAND_ID = 'me'

export function myBand(state: State): Band | null {
  const p = state.profile
  // Kept in fan view too (demo persona switch) so self-hosted gigs still show their headliner.
  if (p.role !== 'musician' && !p.artistName) return null
  return {
    id: MY_BAND_ID,
    name: p.artistName || 'My Band',
    genres: p.genres.filter(g => g !== 'A little of everything').length ? p.genres.filter(g => g !== 'A little of everything') : ['Indie'],
    city: p.homeBase || 'Berkeley, CA',
    tagline: state.band.tagline || p.tagline,
    bio: state.band.bio || `${p.artistName || 'We'} ${p.members ? `are a ${p.members}-piece` : 'are a'} band from ${p.homeBase || 'the Bay Area'}.`,
    followers: 640 + (state.following.includes(MY_BAND_ID) ? 1 : 0),
    hue: 230,
    photo: p.photo ?? undefined,
    media: state.band.media,
  }
}

export function useCatalog() {
  const { state } = useStore()
  return useMemo(() => {
    const mine = myBand(state)
    const bands = mine ? [mine, ...BANDS] : BANDS
    const shows = [...SHOWS, ...state.myShows.filter(s => !s.cancelled && !s.draft)]
    const venues = [...VENUES, ...state.customVenues]
    const venue = (id: string): Venue => venues.find(v => v.id === id) ?? VENUES[0]
    const band = (id: string) => bands.find(b => b.id === id)
    const show = (id: string) => shows.find(s => s.id === id)
    const upcoming = shows.filter(s => !isPastDate(s.date)).sort((a, b) => a.date.localeCompare(b.date))
    const showsFor = (bandId: string) => shows.filter(s => s.bandIds.includes(bandId)).sort((a, b) => a.date.localeCompare(b.date))
    const showsAt = (venueId: string) => upcoming.filter(s => s.venueId === venueId)
    const show_ = (id: string) => show(id) ?? state.myShows.find(s => s.id === id) // includes cancelled, for managers
    const hosted = state.myShows.filter(s => s.hostedByMe || s.createdByMe).sort((a, b) => a.date.localeCompare(b.date))
    return { bands, shows, upcoming, venues: VENUES, allVenues: venues, venue, band, show, anyShow: show_, showsFor, showsAt, hosted, myBand: mine }
  }, [state])
}

export type Catalog = ReturnType<typeof useCatalog>

export const FILTERS = ['Tonight', 'Free', 'My Top Genres', 'By Distance'] as const
export type Filter = (typeof FILTERS)[number]

export function applyFilters(shows: Show[], filters: Filter[], myGenres: string[], venue: Catalog['venue']) {
  let out = shows
  if (filters.includes('Tonight')) out = out.filter(s => isToday(s.date))
  if (filters.includes('Free')) out = out.filter(s => s.price === 0)
  if (filters.includes('My Top Genres') && myGenres.length && !myGenres.includes('A little of everything'))
    out = out.filter(s => s.genres.some(g => myGenres.includes(g)))
  if (filters.includes('By Distance'))
    out = [...out].sort((a, b) => distanceKm(venue(a.venueId)) - distanceKm(venue(b.venueId)))
  return out
}

export function search(cat: Catalog, q: string) {
  const s = q.trim().toLowerCase()
  if (!s) return { shows: [] as Show[], bands: [] as Band[], venues: [] as Venue[] }
  const has = (t: string) => t.toLowerCase().includes(s)
  return {
    shows: cat.upcoming.filter(sh => has(sh.title) || sh.genres.some(has) || has(cat.venue(sh.venueId).name) || has(cat.venue(sh.venueId).city) || sh.bandIds.some(b => has(cat.band(b)?.name ?? ''))),
    bands: cat.bands.filter(b => has(b.name) || b.genres.some(has)),
    venues: cat.venues.filter(v => has(v.name) || has(v.city)),
  }
}

/** Re-render every `ms` so time-based state (application review progress) stays current. */
export function useNow(ms = 5000) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), ms)
    return () => window.clearInterval(t)
  }, [ms])
  return now
}

// Venues "review" a new application over the first couple of minutes, then make an offer.
const REVIEW_AFTER = 20_000
const OFFER_AFTER = 75_000

export function appStatus(a: Application, now = Date.now()): ApplicationStatus {
  if (a.decided) return a.decided
  const age = now - new Date(a.createdAt).getTime()
  if (age < REVIEW_AFTER) return 'Not reviewed'
  if (age < OFFER_AFTER) return 'Under review'
  return 'Offered'
}

export function offerDate(a: Application) {
  if (a.offerDate) return a.offerDate
  const d = new Date(`${a.targetStart}T20:00:00`)
  return isNaN(d.getTime()) ? new Date(Date.now() + 14 * 86400e3).toISOString() : d.toISOString()
}

/** Messages including the automatic venue reply once an offer is made. */
export function appMessages(a: Application, venueName: string, now = Date.now()): Message[] {
  const status = appStatus(a, now)
  const msgs = [...a.messages]
  if (status !== 'Not reviewed' && !a.decided && !msgs.some(m => m.from === 'venue')) {
    const at = new Date(new Date(a.createdAt).getTime() + REVIEW_AFTER).toISOString()
    msgs.push({ from: 'venue', text: `Thanks ${a.actName}! ${venueName} is reviewing your application.`, at })
  }
  if (status === 'Offered' && !a.decided && !msgs.some(m => m.text.startsWith('Good news'))) {
    const at = new Date(new Date(a.createdAt).getTime() + OFFER_AFTER).toISOString()
    msgs.push({ from: 'venue', text: `Good news — we’d like to book you. Check the Offers tab to accept.`, at })
  }
  return msgs.sort((x, y) => x.at.localeCompare(y.at))
}

export const STATUS_TONE: Record<ApplicationStatus, 'gray' | 'blue' | 'white' | 'green' | 'red'> = {
  'Not reviewed': 'gray', 'Under review': 'blue', Offered: 'white', Booked: 'green', Declined: 'red', Withdrawn: 'gray',
}

export { isPastDate }

/** Labels used on the Gigs page for application progress. */
export const APPLY_LABEL: Record<ApplicationStatus, string> = {
  'Not reviewed': 'Applied', 'Under review': 'Viewed', Offered: 'Offer', Booked: 'Booked', Declined: 'Declined', Withdrawn: 'Withdrawn',
}

export function handleFor(p: { username: string; firstName: string; lastName: string }) {
  const slug = (p.username || `${p.firstName}${p.lastName ? '.' + p.lastName : ''}`).toLowerCase().replace(/[^a-z0-9._]/g, '')
  return '@' + (slug || 'you')
}
