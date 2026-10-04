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
  /** Created by a musician for a self-hosted gig (house show, backyard, etc.). */
  custom?: boolean
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
  /** Musician-hosted gig fields */
  hostedByMe?: boolean
  description?: string
  poster?: string // data URL
  tiers?: TicketTier[]
  publishedAt?: string
  salesPaused?: boolean
  cancelled?: boolean
  announcements?: { text: string; at: string }[]
}

export interface TicketTier {
  id: string
  name: string
  price: number // 0 = free RSVP
  qty: number
  note?: string
}

/** A fan's ticket (or RSVP) for a show. */
export interface Ticket {
  id: string
  code: string // shown as QR, checked at the door
  showId: string
  tierId: string
  tierName: string
  qty: number
  unitPrice: number
  fees: number
  holder: string
  purchasedAt: string
  payment: 'apple-pay' | 'card' | 'free'
  transferredTo?: string
}

/** One order on a hosted gig, as the musician sees it. */
export interface Order {
  code: string
  name: string
  tierId: string
  tierName: string
  qty: number
  total: number
  at: string
  mine?: boolean // bought on this device by the fan persona
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
