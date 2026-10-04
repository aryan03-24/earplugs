import { Link } from 'react-router-dom'
import { Poster } from '../../components/ui'
import { Mic } from '../../components/icons'
import { useCatalog, useNow } from '../../state/catalog'
import { useStore } from '../../state/store'
import { ordersFor, salesSummary } from '../../state/ticketing'
import { formatDate, formatTime, isPastDate, money } from '../../lib/format'
import type { Show } from '../../types'

/** List of the musician's own gigs with live sales, plus a call to host one. */
export function HostingList() {
  const cat = useCatalog()
  const { state } = useStore()
  const now = useNow(5000)
  const all = state.myShows.slice().sort((a, b) => a.date.localeCompare(b.date))
  const upcoming = all.filter(s => !isPastDate(s.date) && !s.cancelled)
  const past = all.filter(s => isPastDate(s.date) || s.cancelled)

  const totals = upcoming.filter(s => s.hostedByMe).reduce((acc, s) => {
    const sum = salesSummary(s, cat.venue(s.venueId), ordersFor(s, cat.venue(s.venueId), state.tickets, now))
    return { sold: acc.sold + sum.sold, revenue: acc.revenue + sum.revenue }
  }, { sold: 0, revenue: 0 })

  return (
    <div className="pad-x">
      {upcoming.some(s => s.hostedByMe) && (
        <div className="hosting-totals">
          <div><b>{upcoming.length}</b><span>Upcoming</span></div>
          <div><b>{totals.sold}</b><span>Tickets sold</span></div>
          <div><b>{money(totals.revenue)}</b><span>Revenue</span></div>
        </div>
      )}

      {upcoming.length ? (
        <div className="gig-cards">{upcoming.map(s => <GigCard key={s.id} show={s} now={now} />)}</div>
      ) : (
        <Link to="/host/new" className="host-cta">
          <div className="host-cta-art"><Mic /></div>
          <b>Host your own gig</b>
          <span className="muted small">House show, backyard, or a room you rented. Set ticket tiers, sell on EarPlug, and check fans in at the door.</span>
          <span className="small-pill white">Host a Gig</span>
        </Link>
      )}

      {past.length > 0 && (
        <>
          <h2 className="sub-h">Past & cancelled</h2>
          <div className="gig-cards">{past.map(s => <GigCard key={s.id} show={s} now={now} />)}</div>
        </>
      )}
    </div>
  )
}

function GigCard({ show, now }: { show: Show; now: number }) {
  const cat = useCatalog()
  const { state } = useStore()
  const v = cat.venue(show.venueId)
  const sum = salesSummary(show, v, ordersFor(show, v, state.tickets, now))
  return (
    <Link to={`/host/${show.id}`} className={`gig-card${show.cancelled ? ' faded' : ''}`}>
      <Poster hue={show.hue} photo={show.poster ?? cat.myBand?.photo} className="gig-card-art" />
      <div className="grow min0">
        <div className="row between center-v">
          <b className="ellipsis">{show.title}</b>
          {show.cancelled ? <span className="status-pill s-cancelled">Cancelled</span> : !show.hostedByMe && <span className="status-pill s-venue">Venue</span>}
        </div>
        <div className="muted small">{formatDate(show.date, { weekday: 'short', month: 'short', day: 'numeric' })} · {formatTime(show.date)} · {v.name}</div>
        {show.hostedByMe ? (
          <>
            <div className="bar"><div style={{ width: `${sum.pct}%` }} /></div>
            <div className="row between small"><span>{sum.sold}/{sum.capacity} sold</span><b>{money(sum.revenue)}</b></div>
          </>
        ) : <div className="muted small">Ticketed by the venue</div>}
      </div>
    </Link>
  )
}
