import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import QRCode from 'qrcode'
import { Avatar, GlassButton, Poster, Sheet } from '../../components/ui'
import { Calendar, Close, Pin, Send } from '../../components/icons'
import { FRIENDS } from '../../data/seed'
import { useCatalog, useNow } from '../../state/catalog'
import { useStore } from '../../state/store'
import { downloadIcs } from '../../state/ticketing'
import { formatDate, formatTime, isPastDate } from '../../lib/format'
import { haptic, toast } from '../../lib/native'

/** Full-screen ticket pass: QR for the door, countdown, transfer, calendar, refund. */
export default function TicketPass() {
  const { id } = useParams()
  const nav = useNavigate()
  const cat = useCatalog()
  const now = useNow(30_000)
  const { state, updateTicket, removeTicket } = useStore()
  const [sheet, setSheet] = useState<'transfer' | 'refund' | null>(null)
  const ticket = state.tickets.find(t => t.id === id)
  const show = ticket ? cat.anyShow(ticket.showId) : undefined
  if (!ticket || !show) return <Navigate to="/tickets" replace />

  const v = cat.venue(show.venueId)
  const checkedIn = state.checkins[show.id]?.includes(ticket.code)
  const past = isPastDate(show.date)
  const free = ticket.unitPrice === 0
  const status = show.cancelled ? 'Cancelled' : ticket.transferredTo ? 'Transferred' : checkedIn ? 'Checked in' : past ? 'Used' : 'Valid'

  return (
    <div className="screen pass-screen">
      <div className="row between center-v pad-x top-bar">
        <b>Your Ticket</b>
        <GlassButton size={34} aria-label="Close" onClick={() => (window.history.length > 1 ? nav(-1) : nav('/tickets'))}><Close /></GlassButton>
      </div>

      <div className="pass">
        <Poster hue={show.hue} photo={show.poster ?? cat.band(show.bandIds[0])?.photo} className="pass-art">
          <span className={`pass-status s-${status.replace(' ', '-').toLowerCase()}`}>{status}</span>
        </Poster>
        <div className="pass-body">
          <Link to={`/show/${show.id}`}><h1 className="pass-title">{show.title}</h1></Link>
          <div className="muted">{v.name}</div>
          <div className="pass-grid">
            <div><span>Date</span><b>{formatDate(show.date, { weekday: 'short', month: 'short', day: 'numeric' })}</b></div>
            <div><span>Doors</span><b>{formatTime(show.date)}</b></div>
            <div><span>Ticket</span><b>{ticket.tierName}</b></div>
            <div><span>Admits</span><b>{ticket.qty}</b></div>
          </div>
          {!past && !show.cancelled && !ticket.transferredTo && <Countdown to={show.date} now={now} />}
        </div>
        <div className="pass-tear" />
        <div className="pass-qr">
          {ticket.transferredTo ? (
            <p className="muted center">You sent this ticket to <b>{ticket.transferredTo}</b>.</p>
          ) : show.cancelled ? (
            <p className="muted center">This gig was cancelled. {free ? '' : 'Your payment has been refunded.'}</p>
          ) : (
            <>
              <QR value={`EARPLUG|${ticket.code}|${show.id}`} dim={checkedIn || past} />
              <div className="pass-code">{ticket.code}</div>
              <div className="muted small">{checkedIn ? 'Scanned at the door. Enjoy the show!' : 'Show this at the door · brightness up'}</div>
            </>
          )}
          <div className="muted small">{ticket.holder}</div>
        </div>
      </div>

      {!past && !show.cancelled && !ticket.transferredTo && (
        <div className="pass-actions pad-x">
          <button onClick={() => downloadIcs(show, v)}><Calendar /> Calendar</button>
          <a href={`https://maps.apple.com/?q=${encodeURIComponent(`${v.name}, ${v.address}, ${v.city}`)}`} target="_blank" rel="noreferrer"><Pin size={18} /> Directions</a>
          {!checkedIn && <button onClick={() => setSheet('transfer')}><Send /> Transfer</button>}
        </div>
      )}
      {!past && !show.cancelled && !ticket.transferredTo && !checkedIn && (
        <div className="pad-x"><button className="text-danger" onClick={() => setSheet('refund')}>{free ? 'Cancel RSVP' : 'Request refund'}</button></div>
      )}

      <Sheet open={sheet === 'transfer'} onClose={() => setSheet(null)} title="Send ticket to a friend">
        <p className="muted small">They’ll get the ticket in their EarPlug wallet and yours will stop working.</p>
        <div className="friend-list">
          {FRIENDS.map(f => (
            <button key={f.id} className="row gap center-v friend-pick" onClick={() => {
              updateTicket(ticket.id, { transferredTo: f.name })
              haptic(20); setSheet(null); toast(`Sent to ${f.name}`)
            }}>
              <Avatar name={f.name} hue={f.hue} size={44} />
              <div className="grow left"><b>{f.name}</b><div className="muted small">{f.handle}</div></div>
              <span className="small-pill">Send</span>
            </button>
          ))}
        </div>
      </Sheet>

      <Sheet open={sheet === 'refund'} onClose={() => setSheet(null)} title={free ? 'Cancel your RSVP?' : 'Request a refund?'}>
        <p className="muted">
          {free ? 'Your spot will be released to someone else.'
            : `You’ll get $${(ticket.unitPrice * ticket.qty).toFixed(2)} back to your ${ticket.payment === 'apple-pay' ? 'Apple Pay card' : 'Visa •••• 4242'}. Service fees aren’t refundable.`}
        </p>
        <button className="danger-btn" onClick={() => { removeTicket(ticket.id); toast(free ? 'RSVP cancelled' : 'Refund requested'); nav('/tickets', { replace: true }) }}>
          {free ? 'Cancel RSVP' : 'Refund tickets'}
        </button>
        <button className="secondary-btn" onClick={() => setSheet(null)}>Keep my {free ? 'spot' : 'tickets'}</button>
      </Sheet>
    </div>
  )
}

function Countdown({ to, now }: { to: string; now: number }) {
  const ms = new Date(to).getTime() - now
  if (ms <= 0) return <div className="countdown live">Doors are open</div>
  const d = Math.floor(ms / 86400e3), h = Math.floor((ms % 86400e3) / 3600e3), m = Math.floor((ms % 3600e3) / 60e3)
  return <div className="countdown">Doors in {d > 0 && <b>{d}d </b>}<b>{h}h </b><b>{m}m</b></div>
}

function QR({ value, dim }: { value: string; dim?: boolean }) {
  const [src, setSrc] = useState('')
  useEffect(() => {
    QRCode.toDataURL(value, { margin: 1, width: 480 }).then(setSrc).catch(() => setSrc(''))
  }, [value])
  return <div className={`qr${dim ? ' dim' : ''}`}>{src && <img src={src} alt="Ticket QR code" />}</div>
}
