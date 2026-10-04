import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sheet } from '../../components/ui'
import { AppleLogo, Check } from '../../components/icons'
import { useStore } from '../../state/store'
import { availability, downloadIcs, feesFor, ticketCode } from '../../state/ticketing'
import { formatTime, money, shortDate } from '../../lib/format'
import { haptic, uid } from '../../lib/native'
import type { Show, Ticket, Venue } from '../../types'

type Step = 'select' | 'pay' | 'processing' | 'done'
const cents = (n: number) => `$${n.toFixed(2)}`

/** Three-step ticket checkout in a bottom sheet: tier → payment → confirmation. */
export function Checkout({ show, venue, open, onClose }: { show: Show; venue: Venue; open: boolean; onClose: () => void }) {
  const nav = useNavigate()
  const { state, addTicket } = useStore()
  const tiers = availability(show, venue, state.tickets)
  const firstOpen = tiers.find(t => t.left > 0)
  const [tierId, setTierId] = useState(firstOpen?.tier.id ?? tiers[0]?.tier.id)
  const [qty, setQty] = useState(1)
  const [step, setStep] = useState<Step>('select')
  const [method, setMethod] = useState<'apple-pay' | 'card'>('apple-pay')
  const [ticket, setTicket] = useState<Ticket | null>(null)

  const sel = tiers.find(t => t.tier.id === tierId) ?? tiers[0]
  const unit = sel?.tier.price ?? 0
  const maxQty = Math.min(8, sel?.left ?? 0)
  const subtotal = unit * qty
  const fees = feesFor(unit, qty)
  const total = subtotal + fees
  const free = unit === 0
  const holder = [state.profile.firstName, state.profile.lastName].filter(Boolean).join(' ') || 'You'

  const close = () => {
    onClose()
    // Reset after the sheet animates away.
    setTimeout(() => { setStep('select'); setQty(1); setTicket(null) }, 250)
  }

  const confirm = (payment: Ticket['payment']) => {
    setStep('processing')
    haptic(15)
    setTimeout(() => {
      const t: Ticket = {
        id: uid('tkt'), code: ticketCode(), showId: show.id, tierId: sel.tier.id, tierName: sel.tier.name, qty,
        unitPrice: unit, fees, holder, purchasedAt: new Date().toISOString(), payment,
      }
      addTicket(t)
      setTicket(t)
      setStep('done')
      haptic(30)
    }, free ? 400 : 1200)
  }

  return (
    <Sheet open={open} onClose={close}>
      {step === 'select' && (
        <>
          <div className="checkout-head">
            <h2 className="sheet-title">{free ? 'RSVP' : 'Get Tickets'}</h2>
            <p className="muted small">{show.title} · {venue.name} · {shortDate(show.date)}, {formatTime(show.date)}</p>
          </div>
          <div className="tier-list" role="radiogroup" aria-label="Ticket type">
            {tiers.map(({ tier, left }) => {
              const soldOut = left <= 0
              return (
                <button key={tier.id} type="button" role="radio" aria-checked={tierId === tier.id} disabled={soldOut}
                  className={`tier${tierId === tier.id ? ' on' : ''}${soldOut ? ' sold-out' : ''}`}
                  onClick={() => { setTierId(tier.id); setQty(1); haptic() }}>
                  <div className="grow left">
                    <b>{tier.name}</b>
                    {tier.note && <div className="muted small">{tier.note}</div>}
                    <div className={`small ${left <= 15 && !soldOut ? 'urgent' : 'muted'}`}>
                      {soldOut ? 'Sold out' : left <= 15 ? `Only ${left} left` : `${left} available`}
                    </div>
                  </div>
                  <b className="tier-price">{tier.price === 0 ? 'FREE' : money(tier.price)}</b>
                </button>
              )
            })}
          </div>
          {sel && sel.left > 0 && (
            <>
              <div className="row between center-v sheet-row">
                <span>Quantity</span>
                <div className="stepper">
                  <button onClick={() => setQty(q => Math.max(1, q - 1))} aria-label="Fewer" disabled={qty <= 1}>−</button>
                  <span aria-live="polite">{qty}</span>
                  <button onClick={() => setQty(q => Math.min(maxQty, q + 1))} aria-label="More" disabled={qty >= maxQty}>+</button>
                </div>
              </div>
              {!free && (
                <div className="price-breakdown">
                  <div className="row between"><span className="muted">{qty} × {sel.tier.name}</span><span>{cents(subtotal)}</span></div>
                  <div className="row between"><span className="muted">Service fees</span><span>{cents(fees)}</span></div>
                  <div className="row between total"><b>Total</b><b>{cents(total)}</b></div>
                </div>
              )}
              <button className="primary-btn" onClick={() => (free ? confirm('free') : setStep('pay'))}>
                {free ? `Confirm RSVP${qty > 1 ? ` for ${qty}` : ''}` : `Continue · ${cents(total)}`}
              </button>
            </>
          )}
          {!firstOpen && <p className="muted center">This show is sold out.</p>}
        </>
      )}

      {step === 'pay' && (
        <>
          <button className="link small" onClick={() => setStep('select')}>‹ Back</button>
          <h2 className="sheet-title">Payment</h2>
          <div className="order-summary">
            <div className="row between"><span>{qty} × {sel.tier.name}</span><b>{cents(total)}</b></div>
            <div className="muted small">{show.title} · {shortDate(show.date)}</div>
          </div>
          <div className="pay-methods" role="radiogroup" aria-label="Payment method">
            <button role="radio" aria-checked={method === 'apple-pay'} className={`pay-method${method === 'apple-pay' ? ' on' : ''}`} onClick={() => setMethod('apple-pay')}>
              <span className="pay-logo apple"><AppleLogo size={13} />Pay</span><span className="grow left">Apple Pay</span><span className="radio" />
            </button>
            <button role="radio" aria-checked={method === 'card'} className={`pay-method${method === 'card' ? ' on' : ''}`} onClick={() => setMethod('card')}>
              <span className="pay-logo visa">VISA</span><span className="grow left">Visa •••• 4242</span><span className="radio" />
            </button>
          </div>
          {method === 'apple-pay'
            ? <button className="apple-pay-btn" onClick={() => confirm('apple-pay')}><AppleLogo size={20} /> Pay · {cents(total)}</button>
            : <button className="primary-btn" onClick={() => confirm('card')}>Pay {cents(total)}</button>}
          <p className="muted small center">Demo checkout. No payment is taken.</p>
        </>
      )}

      {step === 'processing' && (
        <div className="processing" aria-live="polite">
          <div className="spinner" />
          <p>{free ? 'Saving your spot…' : 'Processing payment…'}</p>
        </div>
      )}

      {step === 'done' && ticket && (
        <div className="confirm">
          <div className="confirm-check"><Check size={34} /></div>
          <h2>{free ? 'You’re on the list!' : 'You’re going!'}</h2>
          <p className="muted">{ticket.qty} × {ticket.tierName} for {show.title}<br />{shortDate(show.date)} · Doors {formatTime(show.date)}</p>
          <button className="primary-btn" onClick={() => { close(); nav(`/tickets/${ticket.id}`) }}>View Ticket</button>
          <button className="secondary-btn" onClick={() => downloadIcs(show, venue)}>Add to Calendar</button>
        </div>
      )}
    </Sheet>
  )
}
