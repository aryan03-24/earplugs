export type Role = 'fan' | 'musician'

export interface Venue {
  id: string
  name: string
  city: string
  address: string
  lat: number
  lng: number
  capacity: number
  ages: string
  hue: number
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
  photo?: string
  media: string[]
}

export interface Show {
  id: string
  title: string
  venueId: string
  bandIds: string[]
  date: string // ISO
  price: number // 0 = free
  genres: string[]
  hue: number
  plugging: number // friends going
  createdByMe?: boolean
}

export interface Friend {
  id: string
  name: string
  handle: string
  hue: number
}

export type ApplicationStatus = 'Not reviewed' | 'Under review' | 'Offered' | 'Booked' | 'Declined' | 'Withdrawn'

export interface Message {
  from: 'me' | 'venue'
  text: string
  at: string
}

export interface Application {
  id: string
  venueId: string
  createdAt: string
  actName: string
  email: string
  members: string
  targetStart: string // yyyy-mm-dd
  targetEnd: string
  website: string
  draw: string
  soundsLike: string
  videos: string[]
  genres: string[]
  lastShows: string
  bill: string
  /** Set when the musician or venue has made a final decision. Otherwise status is derived from age. */
  decided?: ApplicationStatus
  offerDate?: string // ISO, set when an offer is made
  showId?: string // created show once booked
  messages: Message[]
}

export interface Profile {
  role: Role | null
  phone: string
  firstName: string
  lastName: string
  artistName: string
  tagline: string
  members: string
  photo: string | null // data URL
  homeBase: string
  secondLocation: string
  genres: string[]
  notifications: boolean
  acceptedTerms: boolean
  onboarded: boolean
}
