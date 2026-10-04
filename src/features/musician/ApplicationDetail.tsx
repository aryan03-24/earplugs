import { useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { Chip, PageHeader, Screen } from '../../components/ui'
import { Send } from '../../components/icons'
import { appMessages, appStatus, STATUS_TONE, useCatalog, useNow } from '../../state/catalog'
import { useStore } from '../../state/store'
import { formatDate, formatTime, timeAgo } from '../../lib/format'
import { PitchAttachment } from './PitchReport'
import { haptic } from '../../lib/native'
import { AppCard } from './Bookings'
import { useAcceptOffer } from './useAcceptOffer'

export default function ApplicationDetail() {
  const { id } = useParams()
  const now = useNow(5000)
  const cat = useCatalog()
  const { state, updateApplication } = useStore()
  const accept = useAcceptOffer()
  const [draft, setDraft] = useState('')
  const app = state.applications.find(a => a.id === id)
  if (!app) return <Navigate to="/applications" replace />

  const venue = cat.venue(app.venueId)
  const status = appStatus(app, now)
  const joinShow = app.joinShowId ? cat.anyShow(app.joinShowId) : undefined
  const day = (s: string) => formatDate(`${s}T12:00`, { month: 'short', day: 'numeric' })
  const dateRange = app.targetStart === app.targetEnd ? day(app.targetStart) : `${day(app.targetStart)} – ${day(app.targetEnd)}`
  const msgs = appMessages(app, venue.name, now)
  // Musicians can only message a venue after the venue has written first.
  const canReply = msgs.some(m => m.from === 'venue') && status !== 'Declined' && status !== 'Withdrawn'

  const send = () => {
    const text = draft.trim()
    if (!text) return
    haptic()
    // Persist any automatic venue replies so the thread stays in order.
    updateApplication(app.id, { messages: [...msgs, { from: 'me', text, at: new Date().toISOString() }] })
    setDraft('')
  }

  return (
    <Screen className="chat-screen">
      <PageHeader title={joinShow ? joinShow.title : venue.name} back="/applications" />
      <div className="pad-x">
        <div className="row gap-sm center-v"><Chip tone={STATUS_TONE[status]}>{status}</Chip><span className="muted small">Applied {timeAgo(app.createdAt)}</span></div>
        <div style={{ height: 12 }} />
        <AppCard app={app} status={status} onAccept={() => accept(app)} />

        <h2 className="sub-h">Messages</h2>
        <div className="thread">
          {msgs.map((m, i) => (
            <div key={i} className={`bubble ${m.from}`}>
              {m.text}
              {/* The first message carries the pitch report it was sent with. */}
              {i === 0 && m.from === 'me' && app.pitch && (
                <div className="bubble-attach">
                  <PitchAttachment pitch={app.pitch} band={cat.myBand} cat={cat} venueCity={venue.city} label="Pitch report"
                    ask={joinShow ? { slot: 'Supporting act · 30–40 min', dates: `${formatDate(joinShow.date, { weekday: 'short', month: 'short', day: 'numeric' })} · ${formatTime(joinShow.date)}` } : { dates: dateRange }} />
                </div>
              )}
              <span className="bubble-time">{timeAgo(m.at)}</span>
            </div>
          ))}
        </div>

        <details className="app-details">
          <summary>Request details</summary>
          <dl>
            <dt>Type</dt><dd>{app.kind === 'join' ? 'Join the bill' : app.kind === 'open-gig' ? 'Open gig' : 'Venue pitch'}</dd>
            {joinShow && <><dt>Show</dt><dd>{joinShow.title}</dd></>}
            <dt>Act</dt><dd>{app.actName}</dd>
            <dt>Members</dt><dd>{app.members || '—'}</dd>
            <dt>Dates</dt><dd>{dateRange}</dd>
            <dt>Expected draw</dt><dd>{app.draw || '—'}</dd>
            <dt>Last shows</dt><dd>{app.lastShows || '—'}</dd>
          </dl>
        </details>
      </div>

      {canReply ? (
        <form className="composer" onSubmit={e => { e.preventDefault(); send() }}>
          <input value={draft} onChange={e => setDraft(e.target.value)} placeholder={status === 'Offered' ? 'Ask for another date…' : `Reply to ${venue.name}`} aria-label="Message" enterKeyHint="send" />
          <button type="submit" aria-label="Send" disabled={!draft.trim()}><Send /></button>
        </form>
      ) : (
        <div className="composer locked">You can reply once {venue.name} messages you.</div>
      )}
    </Screen>
  )
}
