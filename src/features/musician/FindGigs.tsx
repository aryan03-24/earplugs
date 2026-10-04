import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Chip, Empty, Poster, Sheet } from '../../components/ui'
import { Search } from '../../components/icons'
import { OPEN_GIGS } from '../../data/seed'
import { KEY_STATS, RECENT_SHOWS } from '../../data/analytics'
import { APPLY_LABEL, appStatus, useCatalog, useNow } from '../../state/catalog'
import { useStore } from '../../state/store'
import { distanceKm, formatDate, formatTime, money } from '../../lib/format'
import { haptic, toast, uid } from '../../lib/native'
import type { OpenGig } from '../../types'

const FILTERS = ['Fits my genre', 'This month', 'Paid', 'By distance'] as const
type Filter = (typeof FILTERS)[number]

/** "Find gigs": venues' open slots, quick apply with the pitch report attached. */
export default function FindGigs() {
  const nav = useNavigate()
  const cat = useCatalog()
  const now = useNow(5000)
  const { state, submitApplication } = useStore()
  const [q, setQ] = useState('')
  const [filters, setFilters] = useState<Filter[]>([])
  const [applying, setApplying] = useState<OpenGig | null>(null)
  const [note, setNote] = useState('')
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
    let list = OPEN_GIGS.filter(g => new Date(g.applyBy).getTime() > Date.now())
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
      ? distanceKm(cat.venue(a.venueId)) - distanceKm(cat.venue(b.venueId))
      : a.date.localeCompare(b.date))
    return list
  }, [q, filters, cat, myGenres])

  const send = () => {
    if (!applying) return
    const g = applying
    const v = cat.venue(g.venueId)
    const day = new Date(g.date).toISOString().slice(0, 10)
    const stats = KEY_STATS['30D']
    submitApplication({
      id: uid('app'), venueId: g.venueId, openGigId: g.id, createdAt: new Date().toISOString(),
      actName: band.name, email: '', members: state.profile.members, targetStart: day, targetEnd: day, website: '',
      draw: `${stats.attendance} avg`, soundsLike: '', videos: [], genres: band.genres,
      lastShows: RECENT_SHOWS.slice(0, 3).map(s => `${s.venue} (${s.attended})`).join(', '), bill: '', offerDate: g.date,
      messages: [{ from: 'me', text: note.trim() || `Hi ${v.name}! We’d love the ${g.slot.toLowerCase()} slot on ${formatDate(g.date, { month: 'short', day: 'numeric' })}. Pitch report attached: ${stats.attendance} avg. attendance, ${stats.showUp}% show-up rate.`, at: new Date().toISOString() }],
    })
    haptic(25)
    toast(`Applied to ${v.name}`)
    setApplying(null)
    setNote('')
  }

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
                <Poster hue={v.hue} className="og-thumb" />
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
                  <button className="og-apply" onClick={() => setApplying(g)}>Apply</button>
                )}
              </div>
            </div>
          )
        })}
        {!gigs.length && <Empty>No open gigs match. Try removing a filter.</Empty>}
      </div>

      <div className="pad-x">
        <Link to="/bookings/apply" className="pitch-direct">
          <div><b>Don’t see a fit?</b><div className="muted small">Pitch any venue directly with the full Get Booked application.</div></div>
          <span className="small-pill white">Get Booked</span>
        </Link>
        <Link to="/applications" className="secondary-btn">My applications</Link>
      </div>

      <Sheet open={!!applying} onClose={() => setApplying(null)} title={applying ? `Apply to ${cat.venue(applying.venueId).name}` : ''}>
        {applying && (
          <>
            <p className="muted small">{applying.slot} · {applying.setLength} min · {formatDate(applying.date, { weekday: 'short', month: 'short', day: 'numeric' })} at {formatTime(applying.date)} · {applying.pay ? money(applying.pay) : 'Door split'}</p>
            <div className="pitch-attach">
              <div className="row between center-v"><b>Pitch report attached</b><Link to="/pitch" className="link small">Preview</Link></div>
              <div className="analytics-mini">
                <div><b>{KEY_STATS['30D'].attendance}</b><span>Avg. attendance</span></div>
                <div><b>{KEY_STATS['30D'].showUp}%</b><span>Show-up rate</span></div>
                <div><b>${KEY_STATS['30D'].avgTicket}</b><span>Avg. ticket</span></div>
              </div>
            </div>
            <textarea className="dark-input" rows={3} value={note} onChange={e => setNote(e.target.value)} placeholder="Add a note (optional): set length, gear, who you’d bring…" />
            <button className="primary-btn" onClick={send}>Send application</button>
          </>
        )}
      </Sheet>
    </>
  )
}
