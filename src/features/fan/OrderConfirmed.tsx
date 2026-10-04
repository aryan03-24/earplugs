import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { GlassButton } from '../../components/ui'
import { Calendar, Check, Close, Send } from '../../components/icons'
import { useCatalog } from '../../state/catalog'
import { useStore } from '../../state/store'
import { downloadIcs } from '../../state/ticketing'
import { formatDate, formatTime } from '../../lib/format'
import { share } from '../../lib/native'

const METHOD = { 'apple-pay': 'Apple Pay', paypal: 'PayPal', card: 'Card', free: 'RSVP' } as const

/** "You're in." confirmation from the Figma. */
export default function OrderConfirmed() {
  const { orderId } = useParams()
  const nav = useNavigate()
  const cat = useCatalog()
  const { state } = useStore()
  const tickets = state.tickets.filter(t => t.orderId === orderId)
  const show = tickets[0] ? cat.anyShow(tickets[0].showId) : undefined
  if (!tickets.length || !show) return <Navigate to="/tickets" replace />

  const v = cat.venue(show.venueId)
  const count = tickets.reduce((n, t) => n + t.qty, 0)
  const paid = tickets.reduce((n, t) => n + t.unitPrice * t.qty + t.fees, 0)

  return (
    <div className="screen confirm-screen">
      <div className="row end pad-x top-bar">
        <GlassButton size={34} aria-label="Close" onClick={() => nav(`/show/${show.id}`, { replace: true })}><Close /></GlassButton>
      </div>
      <div className="confirm-body pad-x">
        <div className="confirm-badge"><Check size={38} /></div>
        <h1>You’re in.</h1>
        <p className="muted">Your {count} ticket{count > 1 ? 's' : ''} for {show.title} {count > 1 ? 'are' : 'is'} saved in My Tickets.</p>

        <dl className="receipt">
          <div><dt>When</dt><dd>{formatDate(show.date, { weekday: 'short', month: 'short', day: 'numeric' })} · {formatTime(show.date)}</dd></div>
          <div><dt>Where</dt><dd>{v.name}</dd></div>
          <div><dt>Paid</dt><dd>{paid ? `$${paid.toFixed(2)} · ${METHOD[tickets[0].payment]}` : 'Free RSVP'}</dd></div>
          <div><dt>Order</dt><dd>#{orderId}</dd></div>
        </dl>

        <div className="row gap confirm-actions">
          <button className="ghost-pill" onClick={() => downloadIcs(show, v)}><Calendar size={16} /> Add to calendar</button>
          <button className="ghost-pill" onClick={() => share(show.title, `I’m going to ${show.title} at ${v.name}. Come with!`, `${location.origin}/show/${show.id}`)}><Send size={16} /> Invite friends</button>
        </div>
      </div>
      <div className="flow-footer">
        <button className="primary-btn" onClick={() => nav(`/tickets/${tickets[0].id}`, { replace: true })}>View my tickets</button>
      </div>
    </div>
  )
}
