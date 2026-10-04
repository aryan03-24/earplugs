// "Join the bill": active gigs a musician can ask to be added to as a supporting act.
import { Link, useNavigate } from 'react-router-dom'
import { Avatar, Chip, Empty, Poster } from '../../components/ui'
import { APPLY_LABEL, appStatus, MY_BAND_ID, useCatalog, useNow } from '../../state/catalog'
import { useStore } from '../../state/store'
import { formatDate, formatTime } from '../../lib/format'
import type { Show } from '../../types'
import { kmFrom, type City } from './BookingLocation'

const MAX_ACTS = 4 // a bill with this many acts is full

/** Upcoming gigs within `radius` km of `city` (optionally only at one venue), soonest first. */
export function useJoinableGigs({ city, radius, venueId, excludeVenueId }: { city?: City; radius?: number; venueId?: string; excludeVenueId?: string }) {
  const cat = useCatalog()
  return cat.upcoming.filter(s => {
    const v = cat.venue(s.venueId)
    if (s.createdByMe || v.custom) return false
    if (venueId && s.venueId !== venueId) return false
    if (excludeVenueId && s.venueId === excludeVenueId) return false
    if (city && radius != null && kmFrom(city, v) > radius) return false
    return true
  })
}

export function JoinGigCard({ show }: { show: Show }) {
  const nav = useNavigate()
  const cat = useCatalog()
  const now = useNow(5000)
  const { state } = useStore()
  const v = cat.venue(show.venueId)
  const bands = show.bandIds.map(id => cat.band(id)).filter(b => !!b)
  const onBill = show.bandIds.includes(MY_BAND_ID)
  const req = state.applications.find(a => a.joinShowId === show.id && appStatus(a, now) !== 'Withdrawn')
  const status = req ? appStatus(req, now) : null
  const full = bands.length >= MAX_ACTS
  const fit = show.genres.filter(g => cat.myBand?.genres.includes(g))

  return (
    <div className="join-card">
      <Link to={`/show/${show.id}`} className="row gap center-v">
        <Poster hue={show.hue} photo={show.poster ?? bands[0]?.photo} className="join-art" />
        <div className="grow min0">
          <b className="ellipsis block">{show.title}</b>
          <div className="muted small">{v.name} · {formatDate(show.date, { weekday: 'short', month: 'short', day: 'numeric' })} · {formatTime(show.date)}</div>
          <div className="lineup-mini">
            {bands.slice(0, 4).map(b => <Avatar key={b.id} name={b.name} hue={b.hue} photo={b.photo} size={22} />)}
            <span className="muted small ellipsis">{bands.map(b => b.name).join(', ')}</span>
          </div>
        </div>
      </Link>
      <div className="chip-row tight">
        {fit.length > 0 ? <Chip blue>Fits your sound · {fit[0]}</Chip> : <span className="info-chip">{show.genres[0]}</span>}
        <span className="info-chip">{full ? 'Bill is full' : `${MAX_ACTS - bands.length} slot${MAX_ACTS - bands.length > 1 ? 's' : ''} open`}</span>
        <span className="info-chip">{v.capacity} cap</span>
      </div>
      <div className="row between center-v">
        <span className="muted small">{show.plugging} fans plugged in</span>
        {onBill ? <span className="og-status on">You’re on the bill</span>
          : req && status ? <button className="og-status" onClick={() => nav(`/bookings/${req.id}`)}>{APPLY_LABEL[status]} ›</button>
            : <button className="og-apply" disabled={full} onClick={() => nav(`/bookings/apply?join=${show.id}`)}>Request to join</button>}
      </div>
    </div>
  )
}

export function JoinGigList({ shows, empty }: { shows: Show[]; empty: string }) {
  return shows.length
    ? <div className="open-gigs pad-x">{shows.map(s => <JoinGigCard key={s.id} show={s} />)}</div>
    : <Empty>{empty}</Empty>
}
