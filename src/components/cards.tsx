// Domain cards: shows, bands, venues, gigs.
import { Link } from 'react-router-dom'
import type { Band, Show, Venue } from '../types'
import { useCatalog } from '../state/catalog'
import { useStore } from '../state/store'
import { priceLabel, shortDate } from '../lib/format'
import { haptic, share, toast } from '../lib/native'
import { Avatar, Poster } from './ui'
import { Bookmark, Share } from './icons'

export function ShowCard({ show, size = 'md' }: { show: Show; size?: 'md' | 'lg' }) {
  const { band } = useCatalog()
  return (
    <Link to={`/show/${show.id}`} className={`show-card ${size}`}>
      <Poster hue={show.hue} label={show.title} photo={band(show.bandIds[0])?.photo}>
        <span className="price-tag">{priceLabel(show.price)}</span>
      </Poster>
    </Link>
  )
}

export function BandGrid({ bands }: { bands: Band[] }) {
  return (
    <div className="band-grid">
      {bands.map(b => (
        <Link key={b.id} to={`/band/${b.id}`} className="band-cell">
          <Avatar name={b.name} hue={b.hue} photo={b.photo} />
          <div className="min0">
            <div className="band-name">{b.name}</div>
            <div className="band-genre">{b.genres[0]}</div>
          </div>
        </Link>
      ))}
    </div>
  )
}

export function VenueCard({ venue, count }: { venue: Venue; count: number }) {
  return (
    <Link to={`/venue/${venue.id}`} className="venue-card">
      <Poster hue={venue.hue} label={venue.name} />
      <span className="venue-count">{count} upcoming</span>
    </Link>
  )
}

export function SaveButton({ showId, size = 24 }: { showId: string; size?: number }) {
  const { state, toggle } = useStore()
  const saved = state.saved.includes(showId)
  return (
    <button type="button" className="icon-btn" aria-label={saved ? 'Unsave' : 'Save'} aria-pressed={saved}
      onClick={() => { haptic(); toggle('saved', showId); toast(saved ? 'Removed from Plugged' : 'Saved to Plugged') }}>
      <Bookmark size={size} filled={saved} />
    </button>
  )
}

export function GigRow({ show, showShare = true }: { show: Show; showShare?: boolean }) {
  const { venue, band } = useCatalog()
  const v = venue(show.venueId)
  const bands = show.bandIds.map(id => band(id)?.name).filter(Boolean).join(', ')
  return (
    <div className="gig-row">
      <Link to={`/show/${show.id}`} className="gig-main">
        <Poster hue={show.hue} className="gig-thumb" photo={band(show.bandIds[0])?.photo} />
        <div className="gig-text">
          <div className="gig-name">{show.title}</div>
          <div className="gig-sub">{bands}</div>
          <div className="gig-sub">{v.name} • {shortDate(show.date)}</div>
        </div>
      </Link>
      {showShare && (
        <button type="button" className="icon-btn" aria-label="Share" onClick={() => share(show.title, `${show.title} at ${v.name}`, `${location.origin}/show/${show.id}`)}>
          <Share size={22} />
        </button>
      )}
      <SaveButton showId={show.id} />
    </div>
  )
}
