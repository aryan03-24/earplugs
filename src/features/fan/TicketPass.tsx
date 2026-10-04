import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import QRCode from 'qrcode'
import { Avatar, BackButton, Sheet } from '../../components/ui'
import { Calendar, Pin, Send, TicketIcon } from '../../components/icons'
import { FRIENDS } from '../../data/seed'
import { useCatalog, useNow } from '../../state/catalog'
import { useStore } from '../../state/store'
import { downloadIcs } from '../../state/ticketing'
import { formatDate, formatTime, isPastDate } from '../../lib/format'
import { haptic, toast } from '../../lib/native'

const REFRESH_MS = 30_000

/** "My Tickets" pass from the Figma: one blue card per admission, rotating QR. */
export default function TicketPass() {
  const { id } = useParams()
  const nav = useNavigate()
  const cat = useCatalog()
  const now = useNow(1000)
  const { state, updateTicket, removeTicket } = useStore()
  const [index, setIndex] = useState<number | null>(null)
  const [sheet, setSheet] = useState<'transfer' | 'refund' | null>(null)
  const ticket = state.tickets.find(t => t.id === id)
  const show = ticket ? cat.anyShow(ticket.showId) : undefined
  if (!ticket || !show) return <Navigate to="/tickets" replace />

  // Every admission in the order gets its own pass ("Ticket 1 of 2").
  const order = state.tickets.filter(t => t.orderId === ticket.orderId && t.showId === ticket.showId)
  const passes = order.flatMap(t => Array.from({ length: t.qty }, (_, i) => ({ t, n: i + 1 })))
  const start = passes.findIndex(p => p.t.id === ticket.id)
  const cur = passes[index ?? Math.max(0, start)] ?? passes[0]
  const t = cur.t
  const v = cat.venue(show.venueId)
  const checkedIn = state.checkins[show.id]?.includes(t.code)
  const past = isPastDate(show.date)
  const inactive = !!t.transferredTo || !!show.cancelled
  const window = Math.floor(now / REFRESH_MS)
  const secsLeft = Math.ceil((REFRESH_MS - (now % REFRESH_MS)) / 1000)
  const free = t.unitPrice === 0

  return (
    <div className="screen pass-screen">
      <div className="row between center-v pad-x top-bar">
        <BackButton to="/tickets" />
        <b>My Tickets</b>
        <span style={{ width: 32 }} />
      </div>

      {passes.length > 1 && (
        <div className="pad-x">
          <div className="segmented full">
            {passes.map((p, i) => (
              <button key={`${p.t.id}-${p.n}`} className={cur === p ? 'on' : ''} onClick={() => setIndex(i)}>Ticket {i + 1} of {passes.length}</button>
            ))}
          </div>
        </div>
      )}

      <div className={`blue-pass${inactive || past ? ' inactive' : ''}`}>
        <div className="bp-tier">{t.tierName.toUpperCase()}</div>
        <h1 className="bp-title">{show.title}</h1>
        <div className="bp-when">{formatDate(show.date, { weekday: 'short', month: 'short', day: 'numeric' })} · Doors {formatTime(show.date)}</div>
        <div className="bp-where">{v.name}{v.city ? ` · ${v.city.replace(/, [A-Z]{2}$/, '')}` : ''}</div>
        <div className="bp-rule" />
        {inactive ? (
          <div className="bp-note">{show.cancelled ? `This gig was cancelled.${free ? '' : ' You’ve been refunded.'}` : `Sent to ${t.transferredTo}`}</div>
        ) : (
          <>
            <QR value={`EARPLUG|${t.code}|${cur.n}|${window}`} dim={checkedIn || past} />
            <div className="bp-holder">{t.holder}</div>
            <div className="bp-fine">
              {checkedIn ? '✓ Checked in. Enjoy the show!' : past ? 'This show has ended' : `Code refreshes every 30 seconds (${secsLeft}s) · Screenshots won’t scan`}
            </div>
            <div className="bp-code">{t.code}{t.qty > 1 ? ` · ${cur.n}/${t.qty}` : ''}</div>
          </>
        )}
      </div>

      {!inactive && !past && (
        <>
          <div className="row gap pad-x pass-buttons">
            <button className="wallet-btn" onClick={() => { haptic(20); toast('Added to Apple Wallet') }}><TicketIcon size={18} /> Add to Wallet</button>
            <button className="transfer-btn" disabled={checkedIn} onClick={() => setSheet('transfer')}><Send size={16} /> Transfer</button>
          </div>
          <p className="muted small center">Turn your brightness up at the door</p>
          <div className="row gap pad-x pass-links">
            <button onClick={() => downloadIcs(show, v)}><Calendar size={16} /> Calendar</button>
            <a href={`https://maps.apple.com/?q=${encodeURIComponent(`${v.name}, ${v.address}, ${v.city}`)}`} target="_blank" rel="noreferrer"><Pin size={16} /> Directions</a>
            <button onClick={() => nav(`/show/${show.id}`)}>Show info</button>
          </div>
          {!checkedIn && <button className="text-danger" onClick={() => setSheet('refund')}>{free ? 'Cancel RSVP' : 'Request refund'}</button>}
        </>
      )}

      <Sheet open={sheet === 'transfer'} onClose={() => setSheet(null)} title={`Transfer ${t.qty > 1 ? `${t.qty} tickets` : 'ticket'}`}>
        <p className="muted small">They’ll get it in their EarPlug wallet and your QR code will stop working.</p>
        <div className="friend-list">
          {FRIENDS.map(f => (
            <button key={f.id} className="row gap center-v friend-pick" onClick={() => {
              updateTicket(t.id, { transferredTo: f.name }); haptic(20); setSheet(null); toast(`Sent to ${f.name}`)
            }}>
              <Avatar name={f.name} hue={f.hue} size={44} />
              <div className="grow left"><b>{f.name}</b><div className="muted small">{f.handle}</div></div>
              <span className="small-pill">Send</span>
            </button>
          ))}
        </div>
      </Sheet>

      <Sheet open={sheet === 'refund'} onClose={() => setSheet(null)} title={free ? 'Cancel your RSVP?' : 'Request a refund?'}>
        <p className="muted">{free ? 'Your spot will be released to someone else.' : `You’ll get $${(t.unitPrice * t.qty).toFixed(2)} back. Service fees aren’t refundable.`}</p>
        <button className="danger-btn" onClick={() => { removeTicket(t.id); toast(free ? 'RSVP cancelled' : 'Refund requested'); nav('/tickets', { replace: true }) }}>{free ? 'Cancel RSVP' : `Refund ${t.tierName}`}</button>
        <button className="secondary-btn" onClick={() => setSheet(null)}>Keep my {free ? 'spot' : 'tickets'}</button>
      </Sheet>
    </div>
  )
}

function QR({ value, dim }: { value: string; dim?: boolean }) {
  const [src, setSrc] = useState('')
  useEffect(() => {
    QRCode.toDataURL(value, { margin: 1, width: 440 }).then(setSrc).catch(() => setSrc(''))
  }, [value])
  return <div className={`bp-qr${dim ? ' dim' : ''}`}>{src && <img src={src} alt="Ticket QR code" />}</div>
}
