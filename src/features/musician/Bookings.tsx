import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Chip, Empty, PageHeader, Poster, Screen, Segmented } from '../../components/ui'
import { Message } from '../../components/icons'
import { appMessages, appStatus, offerDate, STATUS_TONE, useCatalog, useNow } from '../../state/catalog'
import { useStore } from '../../state/store'
import { formatDate, formatTime, shortDate, timeAgo } from '../../lib/format'
import type { Application, ApplicationStatus } from '../../types'
import { useAcceptOffer } from './useAcceptOffer'

const TABS = ['Applications', 'Offers', 'Messages Sent'] as const
type Tab = (typeof TABS)[number]
const STATUS_FILTERS: (ApplicationStatus | 'All')[] = ['All', 'Not reviewed', 'Under review', 'Offered', 'Booked', 'Declined']

/** "My Applications" from the Figma: applications, offers and venue messages. Calendar lives in Gigs → My shows. */
export default function Bookings() {
  const [params, setParams] = useSearchParams()
  const tab = (TABS as readonly string[]).includes(params.get('tab') ?? '') ? (params.get('tab') as Tab) : 'Applications'
  const filter = (params.get('status') as ApplicationStatus | 'All') || 'All'
  const now = useNow(5000)
  const { state } = useStore()
  const cat = useCatalog()
  const nav = useNavigate()
  const accept = useAcceptOffer()

  const apps = state.applications.map(a => ({ a, status: appStatus(a, now) }))
  const offers = apps.filter(x => x.status === 'Offered')

  return (
    <Screen tabs>
      <PageHeader title="My Applications" back="/gigs" />
      <div className="pad-x"><Link to="/bookings/apply" className="next-pill as-link getbooked-row">GET BOOKED</Link></div>
      <div className="pad-x">
        <Segmented options={TABS} value={tab} onChange={t => setParams(t === 'Applications' ? {} : { tab: t }, { replace: true })} full
          labels={{ Offers: `Offers${offers.length ? ` (${offers.length})` : ''}`, 'Messages Sent': 'Messages' }} />
      </div>

      {tab === 'Applications' && (
        <>
          <div className="chip-row padded">
            {STATUS_FILTERS.map(s => (
              <Chip key={s} active={filter === s} onClick={() => setParams(s === 'All' ? {} : { status: s }, { replace: true })}>{s === 'Not reviewed' ? 'Applied' : s === 'Under review' ? 'Viewed' : s}</Chip>
            ))}
          </div>
          <div className="app-list pad-x">
            {apps.filter(x => filter === 'All' || x.status === filter || (filter === 'Under review' && x.status === 'Offered')).map(({ a, status }) => (
              <AppCard key={a.id} app={a} status={status} onAccept={() => accept(a)} />
            ))}
            {!apps.length && <Empty>No applications yet. Apply to an open gig in <Link to="/gigs" className="link">Find gigs</Link>.</Empty>}
          </div>
        </>
      )}

      {tab === 'Offers' && (
        <div className="app-list pad-x">
          {offers.length ? offers.map(({ a, status }) => <AppCard key={a.id} app={a} status={status} onAccept={() => accept(a)} />)
            : <Empty>No open offers. Venues usually reply within a few days.</Empty>}
        </div>
      )}

      {tab === 'Messages Sent' && (
        <div className="pad-x mt">
          <div className="list-card">
            {apps.map(({ a }) => {
              const msgs = appMessages(a, cat.venue(a.venueId).name, now)
              const last = msgs[msgs.length - 1]
              return (
                <button key={a.id} className="recent-row" onClick={() => nav(`/bookings/${a.id}`)}>
                  <span className="cal-ic"><Message /></span>
                  <div className="grow min0 left">
                    <div className="row between"><b>{cat.venue(a.venueId).name}</b><span className="muted small">{last ? timeAgo(last.at) : ''}</span></div>
                    <div className="muted small ellipsis">{last ? `${last.from === 'me' ? 'You: ' : ''}${last.text}` : 'No messages'}</div>
                  </div>
                </button>
              )
            })}
            {!apps.length && <p className="muted small pad-in">No conversations yet.</p>}
          </div>
        </div>
      )}
    </Screen>
  )
}

export function AppCard({ app, status, onAccept }: { app: Application; status: ApplicationStatus; onAccept: () => void }) {
  const cat = useCatalog()
  const { updateApplication } = useStore()
  const v = cat.venue(app.venueId)
  return (
    <div className="app-card">
      <Link to={`/bookings/${app.id}`} className="app-card-top">
        <Poster hue={v.hue} photo={v.photo} className="app-art" label={v.name} />
        <div className="app-meta">
          <div className="row between center-v">
            <b>{v.name}</b>
            <Chip tone={STATUS_TONE[status]}>{status}</Chip>
          </div>
          <div className="muted small">{v.city} · Applied {timeAgo(app.createdAt)}</div>
        </div>
      </Link>
      <div className="app-body">
        <div className="small"><span className="muted">Average Audience:</span> {app.draw || '—'}</div>
        <div className="chip-row">{app.genres.map(g => <Chip key={g} blue>{g}</Chip>)}</div>
        <div className="small"><span className="muted">Last Shows:</span> {app.lastShows || '—'}</div>
        <div className="small"><span className="muted">Target Dates:</span> {formatDate(`${app.targetStart}T12:00`, { month: 'short', day: 'numeric' })} – {formatDate(`${app.targetEnd}T12:00`, { month: 'short', day: 'numeric' })}</div>
        {status === 'Offered' && <div className="offer-line">Offer: {shortDate(offerDate(app))} at {formatTime(offerDate(app))}</div>}
      </div>
      {status === 'Offered' && (
        <div className="app-actions">
          <button className="act gray" onClick={() => updateApplication(app.id, { decided: 'Withdrawn' })}>Decline</button>
          <Link to={`/bookings/${app.id}`} className="act blue">Reply</Link>
          <button className="act blue" onClick={onAccept}>Accept</button>
        </div>
      )}
      {(status === 'Not reviewed' || status === 'Under review') && (
        <div className="app-actions">
          <button className="act gray" onClick={() => updateApplication(app.id, { decided: 'Withdrawn' })}>Withdraw</button>
          <Link to={`/bookings/${app.id}`} className="act blue">View application</Link>
        </div>
      )}
      {status === 'Booked' && app.showId && (
        <div className="app-actions"><Link to={`/show/${app.showId}`} className="act blue">View show page</Link></div>
      )}
    </div>
  )
}
