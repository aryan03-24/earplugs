import { useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { Chip, PageHeader, Screen } from '../../components/ui'
import { Send } from '../../components/icons'
import { appMessages, appStatus, STATUS_TONE, useCatalog, useNow } from '../../state/catalog'
import { useStore } from '../../state/store'
import { formatDate, timeAgo } from '../../lib/format'
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
  const msgs = appMessages(app, venue.name, now)

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
      <PageHeader title={venue.name} back="/applications" />
      <div className="pad-x">
        <div className="row gap-sm center-v"><Chip tone={STATUS_TONE[status]}>{status}</Chip><span className="muted small">Applied {timeAgo(app.createdAt)}</span></div>
        <div style={{ height: 12 }} />
        <AppCard app={app} status={status} onAccept={() => accept(app)} />

        <details className="app-details">
          <summary>Application details</summary>
          <dl>
            <dt>Act</dt><dd>{app.actName}</dd>
            <dt>Members</dt><dd>{app.members || '—'}</dd>
            <dt>Email</dt><dd>{app.email || '—'}</dd>
            <dt>Website</dt><dd>{app.website || '—'}</dd>
            <dt>Target dates</dt><dd>{formatDate(`${app.targetStart}T12:00`, { month: 'short', day: 'numeric' })} – {formatDate(`${app.targetEnd}T12:00`, { month: 'short', day: 'numeric' })}</dd>
            <dt>Sounds like</dt><dd>{app.soundsLike || '—'}</dd>
            <dt>Videos</dt><dd>{app.videos.filter(Boolean).join(', ') || '—'}</dd>
            <dt>Bill in mind</dt><dd>{app.bill || '—'}</dd>
          </dl>
        </details>

        <h2 className="sub-h">Messages</h2>
        <div className="thread">
          {msgs.map((m, i) => (
            <div key={i} className={`bubble ${m.from}`}>
              {m.text}
              <span className="bubble-time">{timeAgo(m.at)}</span>
            </div>
          ))}
        </div>
      </div>

      <form className="composer" onSubmit={e => { e.preventDefault(); send() }}>
        <input value={draft} onChange={e => setDraft(e.target.value)} placeholder={status === 'Offered' ? 'Ask for another date…' : `Message ${venue.name}`} aria-label="Message" enterKeyHint="send" />
        <button type="submit" aria-label="Send" disabled={!draft.trim()}><Send /></button>
      </form>
    </Screen>
  )
}
