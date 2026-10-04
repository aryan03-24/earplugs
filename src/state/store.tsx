import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Application, Profile, Role, Show, Ticket, Venue } from '../types'
import { seedApplications } from '../data/seed'

export interface BandEdits {
  bio: string
  tagline: string
  media: string[]
}

export interface State {
  profile: Profile
  saved: string[] // show ids
  tickets: Ticket[]
  following: string[] // band ids
  history: string[] // search terms
  media: string[] // fan media data URLs
  myShows: Show[] // shows created, hosted or booked by the musician
  customVenues: Venue[] // musician's own spots for self-hosted gigs
  checkins: Record<string, string[]> // showId -> checked-in ticket codes
  applications: Application[]
  band: BandEdits // musician's own band page
}

export const EMPTY_PROFILE: Profile = {
  role: null, phone: '', firstName: '', lastName: '', artistName: '', tagline: '', members: '', photo: null,
  homeBase: '', secondLocation: '', genres: [], notifications: false, acceptedTerms: false, onboarded: false,
}

const EMPTY: State = {
  profile: EMPTY_PROFILE,
  saved: [],
  tickets: [],
  following: [],
  history: ['Tonight', 'Free', 'My Top Genres', 'Rock', 'YouthQuake', "eli's mile high club"],
  media: [],
  myShows: [],
  customVenues: [],
  checkins: {},
  applications: [],
  band: { bio: '', tagline: '', media: [] },
}

const KEY = 'earplug-state-v3'

function load(): State {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return { ...EMPTY, ...parsed, profile: { ...EMPTY_PROFILE, ...parsed.profile }, band: { ...EMPTY.band, ...parsed.band } }
    }
  } catch { /* corrupted or blocked storage */ }
  return EMPTY
}

type ListKey = 'saved' | 'following'

export interface Actions {
  updateProfile: (p: Partial<Profile>) => void
  completeOnboarding: () => void
  switchRole: (role: Role) => void
  toggle: (list: ListKey, id: string) => void
  addTicket: (t: Ticket) => void
  updateTicket: (id: string, patch: Partial<Ticket>) => void
  removeTicket: (id: string) => void
  addHistory: (term: string) => void
  clearHistory: () => void
  addMedia: (dataUrl: string) => void
  updateBand: (b: Partial<BandEdits>) => void
  addShow: (s: Show) => void
  updateShow: (id: string, patch: Partial<Show>) => void
  addVenue: (v: Venue) => void
  toggleCheckin: (showId: string, code: string) => void
  submitApplication: (a: Application) => void
  updateApplication: (id: string, patch: Partial<Application>) => void
  reset: () => void
}

const StoreContext = createContext<({ state: State } & Actions) | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(load)

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { /* quota exceeded */ }
  }, [state])

  const actions: Actions = {
    updateProfile: p => setState(s => ({ ...s, profile: { ...s.profile, ...p } })),
    completeOnboarding: () => setState(s => ({
      ...s,
      profile: { ...s.profile, onboarded: true },
      applications: s.profile.role === 'musician' && !s.applications.length ? seedApplications(s.profile.artistName || 'My Band') : s.applications,
      band: { ...s.band, tagline: s.band.tagline || s.profile.tagline },
    })),
    // Demo helper: try the other persona without losing data (e.g. buy a ticket to your own gig).
    switchRole: role => setState(s => ({
      ...s,
      profile: { ...s.profile, role, artistName: s.profile.artistName || (role === 'musician' ? `${s.profile.firstName || 'My'} Band` : '') },
      applications: role === 'musician' && !s.applications.length ? seedApplications(s.profile.artistName || 'My Band') : s.applications,
    })),
    toggle: (list, id) => setState(s => ({ ...s, [list]: s[list].includes(id) ? s[list].filter(x => x !== id) : [...s[list], id] })),
    addTicket: t => setState(s => ({ ...s, tickets: [...s.tickets, t] })),
    updateTicket: (id, patch) => setState(s => ({ ...s, tickets: s.tickets.map(t => (t.id === id ? { ...t, ...patch } : t)) })),
    removeTicket: id => setState(s => ({ ...s, tickets: s.tickets.filter(t => t.id !== id) })),
    addHistory: term => setState(s => ({ ...s, history: [term, ...s.history.filter(h => h.toLowerCase() !== term.toLowerCase())].slice(0, 10) })),
    clearHistory: () => setState(s => ({ ...s, history: [] })),
    addMedia: url => setState(s => ({ ...s, media: [url, ...s.media] })),
    updateBand: b => setState(s => ({ ...s, band: { ...s.band, ...b } })),
    addShow: show => setState(s => ({ ...s, myShows: [...s.myShows, show] })),
    updateShow: (id, patch) => setState(s => ({ ...s, myShows: s.myShows.map(x => (x.id === id ? { ...x, ...patch } : x)) })),
    addVenue: v => setState(s => ({ ...s, customVenues: [...s.customVenues, v] })),
    toggleCheckin: (showId, code) => setState(s => {
      const list = s.checkins[showId] ?? []
      return { ...s, checkins: { ...s.checkins, [showId]: list.includes(code) ? list.filter(c => c !== code) : [...list, code] } }
    }),
    submitApplication: a => setState(s => ({ ...s, applications: [a, ...s.applications] })),
    updateApplication: (id, patch) => setState(s => ({ ...s, applications: s.applications.map(a => (a.id === id ? { ...a, ...patch } : a)) })),
    reset: () => setState(EMPTY),
  }

  return <StoreContext.Provider value={{ state, ...actions }}>{children}</StoreContext.Provider>
}

export function useStore() {
  const c = useContext(StoreContext)
  if (!c) throw new Error('useStore must be used inside <StoreProvider>')
  return c
}
