import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { Chip, CloseButton, Empty, Logo, Poster, SectionHeader, Segmented } from '../../components/ui'
import { GigRow } from '../../components/cards'
import { Pin } from '../../components/icons'
import { OPEN_GIGS } from '../../data/seed'
import { APPLY_LABEL, appStatus, useCatalog, useNow } from '../../state/catalog'
import { sideOf, useStore } from '../../state/store'
import { formatDate, formatTime, money } from '../../lib/format'
import { cityFor } from '../musician/BookingLocation'
import { JoinGigList, useJoinableGigs } from '../musician/JoinBill'

/** Venue page. Fans see what's coming up; musicians see active gigs to join and open slots to apply for. */
export default function VenuePage() {
  const { id } = useParams()
  const cat = useCatalog()
  const { state } = useStore()
  const venue = cat.venues.find(v => v.id === id)
  if (!venue) return <Navigate to="/" replace />
  return sideOf(state.profile) === 'artist' ? <MusicianVenue venueId={venue.id} /> : <FanVenue venueId={venue.id} />
}

function VenueHeader({ venueId, stats }: { venueId: string; stats?: { label: string; value: string | number }[] }) {
  const cat = useCatalog()
  const v = cat.venue(venueId)
  return (
    <>
      <div className="row between pad-x top-bar"><Logo /><CloseButton /></div>
      <Poster hue={v.hue} photo={v.photo} className="hero short" />
      <div className="pad-x">
        <h1 className="show-title">{v.name}</h1>
        <div className="row gap-sm center-v muted"><Pin size={16} />{v.address}, {v.city}</div>
        <div className="venue-stats">
          {(stats ?? [{ label: 'Capacity', value: v.capacity }, { label: 'Ages', value: v.ages }]).map(s => (
            <div key={s.label}><b>{s.value}</b><span>{s.label}</span></div>
          ))}
        </div>
      </div>
    </>
  )
}

function FanVenue({ venueId }: { venueId: string }) {
  const cat = useCatalog()
  const shows = cat.showsAt(venueId)
  return (
    <div className="screen">
      <VenueHeader venueId={venueId} />
      <SectionHeader title="Upcoming at this venue" />
      {shows.length ? <div className="gig-list">{shows.map(s => <GigRow key={s.id} show={s} />)}</div> : <Empty>Nothing on the calendar yet.</Empty>}
    </div>
  )
}

const TABS = ['Join a bill', 'Open slots'] as const

function MusicianVenue({ venueId }: { venueId: string }) {
  const nav = useNavigate()
  const cat = useCatalog()
  const now = useNow(5000)
  const { state } = useStore()
  const v = cat.venue(venueId)
  const [tab, setTab] = useState<(typeof TABS)[number]>('Join a bill')
  const here = useJoinableGigs({ venueId })
  const nearby = useJoinableGigs({ city: cityFor(v.city), radius: 15, excludeVenueId: venueId })
  const slots = OPEN_GIGS.filter(g => g.venueId === venueId && new Date(g.applyBy).getTime() > Date.now())
  const myApps = state.applications.filter(a => a.venueId === venueId)
  const appFor = (gigId: string) => state.applications.find(a => a.openGigId === gigId && appStatus(a, now) !== 'Withdrawn')

  return (
    <div className="screen venue-musician">
      <VenueHeader venueId={venueId} stats={[
        { label: 'Capacity', value: v.capacity },
        { label: 'Active gigs', value: here.length },
        { label: 'Open slots', value: slots.length },
      ]} />

      <div className="pad-x mt">
        <Segmented options={TABS} value={tab} onChange={setTab} full />
      </div>

      {tab === 'Join a bill' ? (
        <>
          <SectionHeader title={`Active gigs at ${v.name}`} />
          <JoinGigList shows={here} empty={`No upcoming gigs at ${v.name} yet. Check Open slots or pitch them directly.`} />
          <SectionHeader title="Active gigs nearby" />
          <p className="muted small pad-x section-sub">Within 15 km of {v.city}. Ask the headliner to add you as a supporting act.</p>
          <JoinGigList shows={nearby.slice(0, 6)} empty="No other active gigs nearby right now." />
        </>
      ) : (
        <>
          <SectionHeader title="Open slots" />
          {slots.length ? (
            <div className="open-gigs pad-x">
              {slots.map(g => {
                const app = appFor(g.id)
                return (
                  <div key={g.id} className="open-gig">
                    <div className="row between center-v">
                      <div><b className="og-venue">{formatDate(g.date, { weekday: 'short', month: 'short', day: 'numeric' })}</b><div className="muted small">{formatTime(g.date)} · Apply by {formatDate(g.applyBy, { month: 'short', day: 'numeric' })}</div></div>
                      <b className="og-pay">{g.pay ? money(g.pay) : 'Door split'}</b>
                    </div>
                    <div className="chip-row tight">
                      <Chip blue>{g.genres.slice(0, 2).join(' · ')}</Chip>
                      <span className="info-chip">{g.slot} · {g.setLength} min</span>
                    </div>
                    <div className="row end">
                      {app ? <button className="og-status" onClick={() => nav(`/bookings/${app.id}`)}>{APPLY_LABEL[appStatus(app, now)]} ›</button>
                        : <button className="og-apply" onClick={() => nav(`/bookings/apply?gig=${g.id}`)}>Apply</button>}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : <Empty>{v.name} hasn’t posted open slots right now.</Empty>}

          <div className="pad-x">
            <div className="pitch-direct">
              <div><b>Pitch {v.name} directly</b><div className="muted small">Send your pitch report from Analytics with your preferred dates.</div></div>
            </div>
            <Link to={`/bookings/apply?venue=${venueId}`} className="next-pill as-link">PITCH {v.name.toUpperCase()}</Link>
          </div>
        </>
      )}

      {myApps.length > 0 && (
        <>
          <SectionHeader title="Your requests here" to="/applications" />
          <div className="list-card pad-x-in">
            {myApps.map(a => (
              <Link key={a.id} to={`/bookings/${a.id}`} className="list-item">
                <div className="min0"><b className="ellipsis block">{a.joinShowId ? cat.anyShow(a.joinShowId)?.title : a.kind === 'open-gig' ? 'Open slot' : 'Venue pitch'}</b><span className="muted small">{formatDate(`${a.targetStart}T12:00`, { month: 'short', day: 'numeric' })}</span></div>
                <span className="og-status">{APPLY_LABEL[appStatus(a, now)]}</span>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
