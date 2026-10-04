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

/** "Checkout" (Fan Ticket Wallet 3 in the Figma). Free orders skip straight to confirmation. */
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
  const lines = cart.lines.map(l => ({ ...l, tier: tiers.find(t => t.tier.id === l.tierId)?.tier })).filter((l): l is typeof l & { tier: NonNullable<typeof l.tier> } => !!l.tier)
  const total = lines.reduce((n, l) => n + l.tier.price * l.qty + feesFor(l.tier.price, l.qty), 0)
  const free = total === 0
  const holder = [state.profile.firstName, state.profile.lastName].filter(Boolean).join(' ') || 'You'

  const pay = (method: Method) => {
    if (busy) return
    setBusy(method)
    haptic(15)
    setTimeout(() => {
      const orderId = `EP-${Math.floor(10000 + Math.random() * 89999)}`
      const at = new Date().toISOString()
      addTickets(lines.map(l => ({
        id: uid('tkt'), code: ticketCode(), orderId, showId: show.id, tierId: l.tier.id, tierName: l.tier.name, qty: l.qty,
        unitPrice: l.tier.price, fees: feesFor(l.tier.price, l.qty), holder, purchasedAt: at, payment: method,
      })))
      haptic(30)
      nav(`/order/${orderId}`, { replace: true })
    }, method === 'free' ? 500 : 1400)
  }

  const cardValid = card.number.replace(/\D/g, '').length >= 15 && /^\d{2}\/\d{2}$/.test(card.exp) && card.cvc.length >= 3 && card.zip.length >= 5
  const row = (method: Exclude<Method, 'free'>, icon: React.ReactNode, label: string, busyLabel: string, onClick: () => void) => (
    <button className={`pay-row${busy === method ? ' busy' : ''}`} disabled={!!busy} onClick={onClick}>
      <span className="pay-ic">{icon}</span>
      <span className="grow left">{busy === method ? busyLabel : label}</span>
      {busy === method ? <span className="spinner sm" /> : <span className="chev"><ChevronRight size={14} /></span>}
    </button>
  )

  return (
    <div className="screen flow">
      <div className="pad-x top-bar"><Logo /></div>
      <div className="pad-x">
        <div className="flow-title"><BackButton /><h1>Checkout</h1></div>
        <h2 className="flow-sub">{free ? 'Confirm Your RSVP' : 'Choose Your Payment Method'}</h2>

        <div className="order-line">
          <span>{lines.map(l => `${l.tier.name} x ${l.qty}`).join(', ')}</span>
          <span>TOTAL: {free ? 'FREE' : usd(total)}</span>
        </div>

        {free ? (
          <button className="next-pill wide" disabled={!!busy} onClick={() => pay('free')}>{busy ? 'SAVING YOUR SPOT…' : 'CONFIRM RSVP'}</button>
        ) : (
          <div className="pay-list">
            {row('apple-pay', <AppleLogo size={30} />, 'Apple Pay', 'Confirm with Face ID…', () => pay('apple-pay'))}
            {row('paypal', <span className="pp-logo">P</span>, 'PayPal', 'Connecting to PayPal…', () => pay('paypal'))}
            {row('card', <span className="card-logo" />, 'Credit Card', 'Processing…', () => setCardOpen(true))}
          </div>
        )}
      </div>

      <Sheet open={cardOpen} onClose={() => setCardOpen(false)} title="Credit Card">
        <form className="card-form" onSubmit={e => { e.preventDefault(); if (!cardValid) { toast('Check your card details'); return } setCardOpen(false); pay('card') }}>
          <input inputMode="numeric" autoComplete="cc-number" placeholder="Card number" aria-label="Card number" value={card.number}
            onChange={e => setCard({ ...card, number: e.target.value.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ') })} />
          <div className="row gap">
            <input inputMode="numeric" autoComplete="cc-exp" placeholder="MM/YY" aria-label="Expiry" value={card.exp}
              onChange={e => { const d = e.target.value.replace(/\D/g, '').slice(0, 4); setCard({ ...card, exp: d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d }) }} />
            <input inputMode="numeric" autoComplete="cc-csc" placeholder="CVC" aria-label="CVC" value={card.cvc} onChange={e => setCard({ ...card, cvc: e.target.value.replace(/\D/g, '').slice(0, 4) })} />
            <input inputMode="numeric" autoComplete="postal-code" placeholder="ZIP" aria-label="ZIP" value={card.zip} onChange={e => setCard({ ...card, zip: e.target.value.replace(/\D/g, '').slice(0, 5) })} />
          </div>
          <button className="primary-btn" type="submit" disabled={!cardValid}>Pay {usd(total)}</button>
          <p className="muted small center">Demo: 4242 4242 4242 4242, any future date. No payment is taken.</p>
        </form>
      </Sheet>
    </div>
  )
}
