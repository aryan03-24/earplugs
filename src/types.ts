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
  photo?: string
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
  loadIn?: string // "17:00"
  setTime?: string // "21:15", when the host band goes on
  draft?: boolean // saved but not published to fans
  /** Who sells tickets: EarPlug (musician runs the door) or the venue's own system. */
  ticketing?: 'earplug' | 'venue'
  /** Gigs at a registered venue wait for the venue to approve them. */
  venueApproval?: 'pending' | 'approved'
  approvalRequestedAt?: string
  /** Venue-ticketed gigs: attendance reported back by the venue after the show. */
  attendanceRequestedAt?: string
  attendance?: number
}

/** Fan-uploaded photo/video from a show they attended. */
export interface FanMedia {
  id: string
  url: string
  kind: 'image' | 'video'
  showId?: string
  at: string
}

export interface Friendship {
  id: string // friend id
  status: 'requested' | 'friends'
  at: string
}

/** A slot a venue has posted for musicians to apply to ("Open gigs near you"). */
export interface OpenGig {
  id: string
  venueId: string
  date: string // ISO
  pay: number
  slot: 'Opener' | 'Support' | 'Headliner'
  setLength: number // minutes
  genres: string[]
  applyBy: string // ISO
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
  payment: 'apple-pay' | 'paypal' | 'card' | 'free'
  orderId: string // shown on the confirmation, e.g. EP-48213
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
  openGigId?: string // set when applying to a posted open gig
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
  username: string
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
  location: boolean
  acceptedTerms: boolean
  onboarded: boolean
  signedIn: boolean
}
