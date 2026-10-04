import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { BackButton, Logo, Sheet } from '../../components/ui'
import { AppleLogo, ChevronRight } from '../../components/icons'
import { useCatalog } from '../../state/catalog'
import { useStore } from '../../state/store'
import { availability, feesFor, ticketCode } from '../../state/ticketing'
import { haptic, toast, uid } from '../../lib/native'
import type { Ticket } from '../../types'
import type { Cart } from './SelectTickets'

type Method = Ticket['payment']
const usd = (n: number) => `$${n.toFixed(2)} USD`

/** Checkout from the Figma: order line, total, and Apple Pay / PayPal / Credit Card. */
export default function CheckoutPage() {
  const nav = useNavigate()
  const { state: cart } = useLocation() as { state: Cart | null }
  const cat = useCatalog()
  const { state, addTickets } = useStore()
  const [busy, setBusy] = useState<Method | null>(null)
  const [cardOpen, setCardOpen] = useState(false)
  const [card, setCard] = useState({ number: '', exp: '', cvc: '', zip: '' })
  const show = cart ? cat.show(cart.showId) : undefined
  if (!cart || !show) return <Navigate to="/explore" replace />

  const v = cat.venue(show.venueId)
  const tiers = availability(show, v, state.tickets)
  const lines = cart.lines.map(l => ({ ...l, tier: tiers.find(t => t.tier.id === l.tierId)!.tier })).filter(l => l.tier)
  const subtotal = lines.reduce((n, l) => n + l.tier.price * l.qty, 0)
  const fees = lines.reduce((n, l) => n + feesFor(l.tier.price, l.qty), 0)
  const total = subtotal + fees
  const free = total === 0
  const holder = [state.profile.firstName, state.profile.lastName].filter(Boolean).join(' ') || 'You'

  const pay = (method: Method) => {
    setBusy(method)
    haptic(15)
    setTimeout(() => {
      const orderId = `EP-${Math.floor(10000 + Math.random() * 89999)}`
      const at = new Date().toISOString()
      const tickets: Ticket[] = lines.map(l => ({
        id: uid('tkt'), code: ticketCode(), orderId, showId: show.id, tierId: l.tier.id, tierName: l.tier.name, qty: l.qty,
        unitPrice: l.tier.price, fees: feesFor(l.tier.price, l.qty), holder, purchasedAt: at, payment: method,
      }))
      addTickets(tickets)
      haptic(30)
      nav(`/order/${orderId}`, { replace: true })
    }, method === 'free' ? 500 : 1400)
  }

  const cardValid = card.number.replace(/\D/g, '').length >= 15 && /^\d{2}\/\d{2}$/.test(card.exp) && card.cvc.length >= 3 && card.zip.length >= 5

  return (
    <div className="screen flow">
      <div className="pad-x top-bar"><Logo /></div>
      <div className="pad-x">
        <div className="flow-title"><BackButton /><h1>Checkout</h1></div>
        <h2 className="flow-sub">{free ? 'Confirm your RSVP' : 'Choose Your Payment Method'}</h2>

        <div className="order-lines">
          {lines.map(l => (
            <div key={l.tier.id} className="row between small"><span>{l.tier.name} x {l.qty}</span><span>{l.tier.price ? usd(l.tier.price * l.qty) : 'FREE'}</span></div>
          ))}
          {!free && <div className="row between small muted"><span>Service fees</span><span>{usd(fees)}</span></div>}
          <div className="row between total"><b>TOTAL:</b><b>{free ? 'FREE' : usd(total)}</b></div>
        </div>

        {free ? (
          <button className="primary-btn" disabled={!!busy} onClick={() => pay('free')}>{busy ? 'Saving your spot…' : 'Confirm RSVP'}</button>
        ) : (
          <div className="pay-list">
            <button className="pay-row" disabled={!!busy} onClick={() => pay('apple-pay')}>
              <AppleLogo size={26} /><span className="grow left">{busy === 'apple-pay' ? 'Confirming with Face ID…' : 'Apple Pay'}</span>{busy === 'apple-pay' ? <span className="spinner sm" /> : <span className="chev"><ChevronRight size={14} /></span>}
            </button>
            <button className="pay-row" disabled={!!busy} onClick={() => pay('paypal')}>
              <span className="pp-logo">P</span><span className="grow left">{busy === 'paypal' ? 'Connecting to PayPal…' : 'PayPal'}</span>{busy === 'paypal' ? <span className="spinner sm" /> : <span className="chev"><ChevronRight size={14} /></span>}
            </button>
            <button className="pay-row" disabled={!!busy} onClick={() => setCardOpen(true)}>
              <span className="card-logo" /><span className="grow left">{busy === 'card' ? 'Processing…' : 'Credit Card'}</span>{busy === 'card' ? <span className="spinner sm" /> : <span className="chev"><ChevronRight size={14} /></span>}
            </button>
          </div>
        )}
        <p className="muted small center">Demo checkout. No payment is taken.</p>
      </div>

      <Sheet open={cardOpen} onClose={() => setCardOpen(false)} title="Credit Card">
        <form className="card-form" onSubmit={e => { e.preventDefault(); if (!cardValid) { toast('Check your card details'); return } setCardOpen(false); pay('card') }}>
          <input inputMode="numeric" autoComplete="cc-number" placeholder="Card number" value={card.number}
            onChange={e => setCard({ ...card, number: e.target.value.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ') })} />
          <div className="row gap">
            <input inputMode="numeric" autoComplete="cc-exp" placeholder="MM/YY" value={card.exp}
              onChange={e => { const d = e.target.value.replace(/\D/g, '').slice(0, 4); setCard({ ...card, exp: d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d }) }} />
            <input inputMode="numeric" autoComplete="cc-csc" placeholder="CVC" value={card.cvc} onChange={e => setCard({ ...card, cvc: e.target.value.replace(/\D/g, '').slice(0, 4) })} />
            <input inputMode="numeric" autoComplete="postal-code" placeholder="ZIP" value={card.zip} onChange={e => setCard({ ...card, zip: e.target.value.replace(/\D/g, '').slice(0, 5) })} />
          </div>
          <button className="primary-btn" type="submit" disabled={!cardValid}>Pay {usd(total)}</button>
          <p className="muted small center">Try 4242 4242 4242 4242 · any future date</p>
        </form>
      </Sheet>
    </div>
  )
}
