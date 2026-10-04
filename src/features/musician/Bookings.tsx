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
// Four simple buckets instead of every raw status. Offers have their own tab.
const FILTERS = ['Active', 'Waiting', 'Booked', 'Closed'] as const
type Filter = (typeof FILTERS)[number]
const inFilter = (s: ApplicationStatus, f: Filter) =>
  f === 'Active' ? !['Declined', 'Withdrawn'].includes(s)
    : f === 'Waiting' ? s === 'Not reviewed' || s === 'Under review'
      : f === 'Booked' ? s === 'Booked'
        : s === 'Declined' || s === 'Withdrawn'
/** Friendlier names for statuses on cards. */
export const STATUS_LABEL: Record<ApplicationStatus, string> = {
  'Not reviewed': 'Sent', 'Under review': 'Viewed', Offered: 'Offer', Booked: 'Booked', Declined: 'Declined', Withdrawn: 'Withdrawn',
}

/** "My Applications" from the Figma: applications, offers and venue messages. Calendar lives in Gigs → My shows. */
export default function Bookings() {
  const [params, setParams] = useSearchParams()
  const tab = (TABS as readonly string[]).includes(params.get('tab') ?? '') ? (params.get('tab') as Tab) : 'Applications'
  const filter = ((FILTERS as readonly string[]).includes(params.get('filter') ?? '') ? params.get('filter') : 'Active') as Filter
  const now = useNow(5000)
  const { state } = useStore()
  const cat = useCatalog()
  const nav = useNavigate()
  const accept = useAcceptOffer()

  const apps = state.applications.map(a => ({ a, status: appStatus(a, now) }))
  const offers = apps.filter(x => x.status === 'Offered')
  const shown = apps.filter(x => inFilter(x.status, filter))

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
            {FILTERS.map(f => (
              <Chip key={f} active={filter === f} onClick={() => setParams(f === 'Active' ? {} : { filter: f }, { replace: true })}>{f}</Chip>
            ))}
          </div>
          <div className="app-list pad-x">
            {shown.map(({ a, status }) => <AppCard key={a.id} app={a} status={status} onAccept={() => accept(a)} />)}
            {!shown.length && <Empty>{apps.length ? 'Nothing here.' : <>No requests yet. Find a gig in <Link to="/gigs" className="link">Gigs</Link>.</>}</Empty>}
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
  const joinShow = app.joinShowId ? cat.anyShow(app.joinShowId) : undefined
  const sameDay = app.targetStart === app.targetEnd
  return (
    <div className="app-card">
      <Link to={`/bookings/${app.id}`} className="app-card-top">
        <Poster hue={joinShow?.hue ?? v.hue} photo={joinShow?.poster ?? v.photo} className="app-art" label={v.name} />
        <div className="app-meta">
          <div className="row between center-v">
            <b className="ellipsis">{joinShow ? joinShow.title : v.name}</b>
            <Chip tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</Chip>
          </div>
          <div className="muted small">{joinShow ? `Join the bill · ${v.name}` : app.kind === 'open-gig' ? `Open gig · ${v.city}` : v.city} · {timeAgo(app.createdAt)}</div>
        </div>
      </Link>
      <div className="app-body">
        {app.pitch && <div className="pitch-tag">Pitch report · {app.pitch.attendance} avg · {app.pitch.showUp}% show-up</div>}
        <div className="small"><span className="muted">{sameDay ? 'Date' : 'Dates'}:</span> {formatDate(`${app.targetStart}T12:00`, { month: 'short', day: 'numeric' })}{sameDay ? '' : ` – ${formatDate(`${app.targetEnd}T12:00`, { month: 'short', day: 'numeric' })}`} · <span className="muted">Draw:</span> {app.draw || '—'}</div>
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
