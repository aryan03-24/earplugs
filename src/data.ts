// Sample data for the prototype. Replace with a real API later.
import live1 from './assets/live1.jpg'
import live2 from './assets/live2.jpg'

export const GENRES = [
  'Hiphop', 'Pop', 'R&B', 'Jazz', 'Country', 'Punk', 'Classical',
  'K-pop', 'EDM', 'Blues', 'Indie', 'Alternative', 'Rock', 'A little of everything',
]

export interface Venue {
  id: string
  name: string
  city: string
  address: string
  lat: number
  lng: number
}

export interface Band {
  id: string
  name: string
  genres: string[]
  city: string
  tagline: string
  bio: string
  followers: number
  hue: number
  photos: string[]
}

export interface Show {
  id: string
  title: string
  venueId: string
  bandIds: string[]
  date: string // ISO, local time
  price: number // 0 = free
  genres: string[]
  hue: number
  plugging: number // friends going
}

export const VENUES: Venue[] = [
  { id: 'starry', name: 'The Starry Plough', city: 'Berkeley', address: '3101 Shattuck Ave', lat: 37.8553, lng: -122.2669 },
  { id: 'parish', name: 'The New Parish', city: 'Oakland', address: '1743 San Pablo Ave', lat: 37.8066, lng: -122.2735 },
  { id: 'cornerstone', name: 'Cornerstone', city: 'Berkeley', address: '2367 Shattuck Ave', lat: 37.8669, lng: -122.2678 },
  { id: 'eli', name: "Eli's Mile High Club", city: 'Oakland', address: '3629 MLK Jr Way', lat: 37.8278, lng: -122.2709 },
  { id: 'gilman', name: '924 Gilman', city: 'Berkeley', address: '924 Gilman St', lat: 37.8796, lng: -122.2993 },
  { id: 'bottom', name: 'Bottom of the Hill', city: 'San Francisco', address: '1233 17th St', lat: 37.7650, lng: -122.3963 },
  { id: 'freight', name: 'Freight & Salvage', city: 'Berkeley', address: '2020 Addison St', lat: 37.8710, lng: -122.2690 },
]

export const BANDS: Band[] = [
  { id: 'sobo', name: 'SOBO', genres: ['Indie', 'Alternative', 'Rock'], city: 'Berkeley, CA', tagline: 'Suns Out Buns Out', bio: 'SOBO is a band from UC Berkeley made up of Matthew Fehr (Drums), Mathew Dip (Lead Guitar), Gala Basco (Lead Vocals + Rhythm Guitar), & Anandi Joshi (Bass Guitar).', followers: 640, hue: 230, photos: [live1, live2] },
  { id: 'youthquake', name: 'YouthQuake', genres: ['Punk', 'Rock'], city: 'Oakland, CA', tagline: 'Loud, fast, local', bio: 'Four-piece East Bay punk band playing basements and back rooms since 2024.', followers: 412, hue: 0, photos: [] },
  { id: 'velvet', name: 'Velvet Static', genres: ['Indie', 'Pop'], city: 'Berkeley, CA', tagline: 'Dream pop for night drives', bio: 'Hazy guitars, big choruses, and a drum machine named Gary.', followers: 289, hue: 290, photos: [] },
  { id: 'lowtide', name: 'Low Tide Choir', genres: ['Jazz', 'R&B'], city: 'San Francisco, CA', tagline: 'Neo-soul collective', bio: 'A rotating cast of SF musicians blending jazz harmony with R&B grooves.', followers: 905, hue: 190, photos: [] },
  { id: 'mosspit', name: 'Moss Pit', genres: ['Punk', 'Alternative'], city: 'Berkeley, CA', tagline: 'Garden-variety punk', bio: 'Three friends, two chords, one van that mostly works.', followers: 158, hue: 120, photos: [] },
  { id: 'kilowatt', name: 'Kilowatt Kids', genres: ['EDM', 'Pop'], city: 'Oakland, CA', tagline: 'Bedroom bangers', bio: 'Live electronic duo with synths, samplers, and too many cables.', followers: 733, hue: 50, photos: [] },
  { id: 'dustbowl', name: 'Dust Bowl Revival', genres: ['Country', 'Blues'], city: 'Berkeley, CA', tagline: 'Porch songs, amplified', bio: 'Americana trio with banjo, slide guitar and three-part harmonies.', followers: 377, hue: 30, photos: [] },
  { id: 'versefive', name: 'Verse Five', genres: ['Hiphop', 'R&B'], city: 'Oakland, CA', tagline: 'Bay Area bars', bio: 'Hip-hop crew with a live band backing every set.', followers: 1204, hue: 330, photos: [] },
]

function day(offset: number, hour: number) {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  d.setHours(hour, 0, 0, 0)
  return d.toISOString()
}

export const SHOWS: Show[] = [
  { id: 's1', title: 'Sunset Sessions', venueId: 'starry', bandIds: ['sobo', 'velvet'], date: day(0, 19), price: 0, genres: ['Indie', 'Alternative', 'Rock'], hue: 230, plugging: 8 },
  { id: 's2', title: 'Basement Riot', venueId: 'gilman', bandIds: ['youthquake', 'mosspit'], date: day(0, 20), price: 12, genres: ['Punk', 'Rock'], hue: 0, plugging: 3 },
  { id: 's3', title: 'Neo Soul Night', venueId: 'freight', bandIds: ['lowtide'], date: day(1, 20), price: 18, genres: ['Jazz', 'R&B'], hue: 190, plugging: 5 },
  { id: 's4', title: 'Synth City', venueId: 'parish', bandIds: ['kilowatt'], date: day(2, 21), price: 15, genres: ['EDM', 'Pop'], hue: 50, plugging: 11 },
  { id: 's5', title: 'Porch Light', venueId: 'cornerstone', bandIds: ['dustbowl'], date: day(3, 19), price: 0, genres: ['Country', 'Blues'], hue: 30, plugging: 2 },
  { id: 's6', title: 'Bars & Brass', venueId: 'eli', bandIds: ['versefive', 'lowtide'], date: day(4, 21), price: 10, genres: ['Hiphop', 'R&B'], hue: 330, plugging: 6 },
  { id: 's7', title: 'SOBO Live in SF', venueId: 'bottom', bandIds: ['sobo'], date: day(6, 20), price: 10, genres: ['Indie', 'Alternative', 'Rock'], hue: 250, plugging: 14 },
  { id: 's8', title: 'Dream Pop Drive', venueId: 'cornerstone', bandIds: ['velvet', 'kilowatt'], date: day(8, 20), price: 8, genres: ['Indie', 'Pop'], hue: 290, plugging: 4 },
  { id: 's9', title: 'Gilman All-Ages', venueId: 'gilman', bandIds: ['mosspit', 'youthquake', 'sobo'], date: day(10, 18), price: 0, genres: ['Punk', 'Alternative'], hue: 120, plugging: 9 },
  { id: 's10', title: 'Late Night Jazz', venueId: 'freight', bandIds: ['lowtide'], date: day(12, 22), price: 20, genres: ['Jazz'], hue: 200, plugging: 1 },
  // Past shows (used on band profiles and analytics)
  { id: 'p1', title: 'Fall Kickoff', venueId: 'starry', bandIds: ['sobo'], date: day(-6, 20), price: 8, genres: ['Indie', 'Rock'], hue: 220, plugging: 0 },
  { id: 'p2', title: 'Parish Presents', venueId: 'parish', bandIds: ['sobo', 'velvet'], date: day(-10, 20), price: 10, genres: ['Indie'], hue: 260, plugging: 0 },
  { id: 'p3', title: 'Cornerstone Locals', venueId: 'cornerstone', bandIds: ['sobo'], date: day(-14, 19), price: 6, genres: ['Rock'], hue: 210, plugging: 0 },
]

export const venueById = (id: string) => VENUES.find(v => v.id === id)!
export const bandById = (id: string) => BANDS.find(b => b.id === id)
export const showById = (id: string) => SHOWS.find(s => s.id === id)

export const isPast = (s: Show) => new Date(s.date).getTime() < Date.now() - 6 * 3600 * 1000
export const upcoming = () => SHOWS.filter(s => !isPast(s)).sort((a, b) => a.date.localeCompare(b.date))

export function isTonight(s: Show) {
  const d = new Date(s.date)
  const now = new Date()
  return d.toDateString() === now.toDateString()
}

export function formatDate(iso: string, opts: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' }) {
  return new Date(iso).toLocaleDateString('en-US', opts)
}

export function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export const priceLabel = (p: number) => (p === 0 ? 'FREE' : p < 10 ? '$' : p < 18 ? '$$' : '$$$')

// Distance from Berkeley center, km
export function distanceKm(v: Venue, from = { lat: 37.8715, lng: -122.273 }) {
  const R = 6371
  const dLat = ((v.lat - from.lat) * Math.PI) / 180
  const dLng = ((v.lng - from.lng) * Math.PI) / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((from.lat * Math.PI) / 180) * Math.cos((v.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

export function searchAll(q: string) {
  const s = q.trim().toLowerCase()
  if (!s) return { shows: [], bands: [], venues: [] }
  const shows = upcoming().filter(sh =>
    sh.title.toLowerCase().includes(s) ||
    sh.genres.some(g => g.toLowerCase().includes(s)) ||
    venueById(sh.venueId).name.toLowerCase().includes(s) ||
    sh.bandIds.some(b => bandById(b)?.name.toLowerCase().includes(s)),
  )
  const bands = BANDS.filter(b => b.name.toLowerCase().includes(s) || b.genres.some(g => g.toLowerCase().includes(s)))
  const venues = VENUES.filter(v => v.name.toLowerCase().includes(s) || v.city.toLowerCase().includes(s))
  return { shows, bands, venues }
}

// Artist analytics sample series (SOBO)
export const ANALYTICS = {
  '7D': { attendance: 104, attendDelta: 9, showUp: 76, showUpDelta: 4, repeat: 22, repeatDelta: 2, newFans: 22, newFansDelta: 6, earnings: 312, earnDelta: 4, avgTicket: 8, shows: 1, showsDelta: 0, venues: 1 },
  '30D': { attendance: 86, attendDelta: 12, showUp: 72, showUpDelta: 5, repeat: 20, repeatDelta: 3, newFans: 140, newFansDelta: 18, earnings: 1240, earnDelta: 9, avgTicket: 8, shows: 6, showsDelta: -1, venues: 4 },
  '12M': { attendance: 71, attendDelta: 31, showUp: 68, showUpDelta: 9, repeat: 17, repeatDelta: 6, newFans: 980, newFansDelta: 44, earnings: 11380, earnDelta: 52, avgTicket: 7, shows: 48, showsDelta: 12, venues: 15 },
  'All': { attendance: 64, attendDelta: 0, showUp: 66, showUpDelta: 0, repeat: 15, repeatDelta: 0, newFans: 1210, newFansDelta: 0, earnings: 14020, earnDelta: 0, avgTicket: 7, shows: 61, showsDelta: 0, venues: 18 },
} as const
export type Range = keyof typeof ANALYTICS

export const ATTENDANCE_SERIES = [
  { label: 'Sep 5', value: 62, prev: 58, venue: 'Cornerstone' },
  { label: 'Sep 10', value: 70, prev: 66, venue: 'The New Parish' },
  { label: 'Sep 14', value: 78, prev: 60, venue: 'The Starry Plough' },
  { label: 'Sep 19', value: 74, prev: 72, venue: 'Cornerstone' },
  { label: 'Sep 23', value: 95, prev: 70, venue: 'The New Parish' },
  { label: 'Sep 27', value: 104, prev: 77, venue: 'The Starry Plough' },
]

export const CITY_PERF = [
  { name: 'Oakland', shows: 2, rsvps: 180, attended: 151 },
  { name: 'Berkeley', shows: 3, rsvps: 240, attended: 178 },
  { name: 'San Francisco', shows: 1, rsvps: 160, attended: 98 },
]
export const VENUE_PERF = [
  { name: 'The Starry Plough', shows: 2, rsvps: 130, attended: 112 },
  { name: 'The New Parish', shows: 2, rsvps: 140, attended: 117 },
  { name: 'Cornerstone', shows: 1, rsvps: 110, attended: 74 },
  { name: 'Bottom of the Hill', shows: 1, rsvps: 160, attended: 98 },
]
export const RECENT_SHOWS = [
  { month: 'SEP', day: 27, venue: 'The Starry Plough', city: 'Berkeley', attended: 104, newFans: 22, earnings: 312 },
  { month: 'SEP', day: 23, venue: 'The New Parish', city: 'Oakland', attended: 95, newFans: 31, earnings: 285 },
  { month: 'SEP', day: 19, venue: 'Cornerstone', city: 'Berkeley', attended: 74, newFans: 12, earnings: 198 },
]
