import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type Role = 'fan' | 'musician'

export interface Profile {
  role: Role | null
  phone: string
  firstName: string
  lastName: string
  artistName: string
  photo: string | null // data URL
  homeBase: string
  secondLocation: string
  genres: string[]
  notifications: boolean
  acceptedTerms: boolean
  onboarded: boolean
}

export interface State {
  profile: Profile
  saved: string[] // show ids
  tickets: string[] // show ids
  following: string[] // band ids
  history: string[] // search terms
  media: string[] // data URLs
}

const EMPTY: State = {
  profile: {
    role: null, phone: '', firstName: '', lastName: '', artistName: '', photo: null,
    homeBase: '', secondLocation: '', genres: [], notifications: false, acceptedTerms: false, onboarded: false,
  },
  saved: [],
  tickets: [],
  following: [],
  history: ['Tonight', 'Free', 'My Top Genres', 'Rock', 'YouthQuake', "eli's mile high club"],
  media: [],
}

const KEY = 'earplug-state-v1'

function load(): State {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { ...EMPTY, ...JSON.parse(raw) }
  } catch { /* ignore */ }
  return EMPTY
}

interface Ctx {
  state: State
  updateProfile: (p: Partial<Profile>) => void
  toggle: (list: 'saved' | 'tickets' | 'following', id: string) => void
  addHistory: (term: string) => void
  addMedia: (dataUrl: string) => void
  reset: () => void
}

const StoreContext = createContext<Ctx | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(load)

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { /* quota */ }
  }, [state])

  const ctx: Ctx = {
    state,
    updateProfile: p => setState(s => ({ ...s, profile: { ...s.profile, ...p } })),
    toggle: (list, id) =>
      setState(s => ({ ...s, [list]: s[list].includes(id) ? s[list].filter(x => x !== id) : [...s[list], id] })),
    addHistory: term =>
      setState(s => ({ ...s, history: [term, ...s.history.filter(h => h.toLowerCase() !== term.toLowerCase())].slice(0, 10) })),
    addMedia: url => setState(s => ({ ...s, media: [url, ...s.media] })),
    reset: () => setState(EMPTY),
  }

  return <StoreContext.Provider value={ctx}>{children}</StoreContext.Provider>
}

export function useStore() {
  const c = useContext(StoreContext)
  if (!c) throw new Error('useStore outside provider')
  return c
}

let toastTimer: number | undefined
export function toast(msg: string) {
  let el = document.getElementById('toast')
  if (!el) {
    el = document.createElement('div')
    el.id = 'toast'
    el.className = 'toast'
    document.body.appendChild(el)
  }
  el.textContent = msg
  el.classList.add('show')
  window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => el!.classList.remove('show'), 2200)
}

export async function share(title: string, text: string) {
  const url = window.location.href
  try {
    if (navigator.share) {
      await navigator.share({ title, text, url })
      return
    }
    await navigator.clipboard.writeText(`${text} ${url}`)
    toast('Link copied')
  } catch { /* cancelled */ }
}
