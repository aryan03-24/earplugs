import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Chip, Empty, Poster } from '../../components/ui'
import { Search } from '../../components/icons'
import { OPEN_GIGS } from '../../data/seed'
import { APPLY_LABEL, appStatus, useCatalog, useNow } from '../../state/catalog'
import { useStore } from '../../state/store'
import { formatDate, formatTime, money } from '../../lib/format'
import type { OpenGig } from '../../types'
import { kmFrom, type City } from './BookingLocation'

const FILTERS = ['Fits my genre', 'This month', 'Paid', 'By distance'] as const
type Filter = (typeof FILTERS)[number]

/** "Find gigs": venues' open slots near your booking area. Apply opens the booking flow at the pitch step. */
export default function FindGigs({ city, radius }: { city: City; radius: number }) {
  const nav = useNavigate()
  const cat = useCatalog()
  const now = useNow(5000)
  const { state } = useStore()
  const [q, setQ] = useState('')
  const [filters, setFilters] = useState<Filter[]>([])
  const band = cat.myBand!
  const myGenres = band.genres

  const apps = state.applications.map(a => ({ a, status: appStatus(a, now) }))
  const active = apps.filter(x => x.status !== 'Withdrawn' && x.status !== 'Declined')
  const counts = {
    applied: active.length,
    viewed: active.filter(x => x.status === 'Under review' || x.status === 'Offered').length,
    booked: active.filter(x => x.status === 'Booked').length,
  }
  const applicationFor = (g: OpenGig) => apps.find(x => x.a.openGigId === g.id && x.status !== 'Withdrawn')

  const gigs = useMemo(() => {
    const s = q.trim().toLowerCase()
    let list = OPEN_GIGS.filter(g => new Date(g.applyBy).getTime() > Date.now() && kmFrom(city, cat.venue(g.venueId)) <= radius)
    if (s) list = list.filter(g => {
      const v = cat.venue(g.venueId)
      return [v.name, v.city, formatDate(g.date, { month: 'long', day: 'numeric', weekday: 'long' }), ...g.genres, g.slot].some(t => t.toLowerCase().includes(s))
    })
    if (filters.includes('Fits my genre')) list = list.filter(g => g.genres.some(x => myGenres.includes(x)))
    if (filters.includes('This month')) {
      const m = new Date().getMonth()
      list = list.filter(g => new Date(g.date).getMonth() === m)
    }
    if (filters.includes('Paid')) list = list.filter(g => g.pay > 0)
    list = [...list].sort((a, b) => filters.includes('By distance')
      ? kmFrom(city, cat.venue(a.venueId)) - kmFrom(city, cat.venue(b.venueId))
      : a.date.localeCompare(b.date))
    return list
  }, [q, filters, cat, myGenres, city, radius])

  return (
    <>
      <div className="pad-x">
        <label className="search-bar mt"><Search size={16} /><input type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="Search venues, dates, or genres" aria-label="Search gigs" /></label>
      </div>
      <div className="chip-row wrap mt">
        {FILTERS.map(f => <Chip key={f} active={filters.includes(f)} onClick={() => setFilters(fs => (fs.includes(f) ? fs.filter(x => x !== f) : [...fs, f]))}>{f}</Chip>)}
      </div>

      <div className="apply-stats pad-x">
        <Link to="/applications" className="apply-stat"><b>{counts.applied}</b><span>Applied</span></Link>
        <Link to="/applications?status=Under%20review" className="apply-stat"><b>{counts.viewed}</b><span>Viewed</span></Link>
        <Link to="/applications?status=Booked" className="apply-stat blue"><b>{counts.booked}</b><span>Booked</span></Link>
      </div>

      <h2 className="block-title">Open gigs near you</h2>
      <div className="open-gigs pad-x">
        {gigs.map(g => {
          const v = cat.venue(g.venueId)
          const app = applicationFor(g)
          return (
            <div key={g.id} className="open-gig">
              <div className="row gap center-v">
                <Poster hue={v.hue} photo={v.photo} className="og-thumb" />
                <div className="grow min0">
                  <b className="og-venue">{v.name}</b>
                  <div className="small muted">{formatDate(g.date, { weekday: 'short', month: 'short', day: 'numeric' })} · {formatTime(g.date)}</div>
                </div>
                <b className="og-pay">{g.pay ? money(g.pay) : 'Door split'}</b>
              </div>
              <div className="chip-row tight">
                <Chip blue>{g.genres[0]}{g.genres[1] ? ` ${g.genres[1].toLowerCase()}` : ''}</Chip>
                <span className="info-chip">{g.slot} · {g.setLength} min</span>
                <span className="info-chip">{v.capacity} cap</span>
              </div>
              <div className="row between center-v">
                <span className="small muted">Apply by {formatDate(g.applyBy, { month: 'short', day: 'numeric' })}</span>
                {app ? (
                  <button className="og-status" onClick={() => nav(`/bookings/${app.a.id}`)}>{APPLY_LABEL[app.status]} ›</button>
                ) : (
                  <button className="og-apply" onClick={() => nav(`/bookings/apply?gig=${g.id}`)}>Apply</button>
                )}
              </div>
            </div>
          )
        })}
        {!gigs.length && <Empty>No open gigs within {radius} km of {city}. Try a wider distance or remove a filter.</Empty>}
      </div>

      <div className="pad-x">
        <div className="pitch-direct">
          <div><b>Don’t see a fit?</b><div className="muted small">Pitch any venue near {city.split(',')[0]} directly.</div></div>
        </div>
        <Link to="/bookings/apply" className="next-pill as-link">GET BOOKED</Link>
        <Link to="/applications" className="secondary-btn">My applications</Link>
      </div>

    </>
  )
}
