import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { BackButton, Chip, Logo, Poster } from '../../components/ui'
import { useCatalog } from '../../state/catalog'
import { useStore } from '../../state/store'
import { availability } from '../../state/ticketing'
import { formatDate, formatTime } from '../../lib/format'
import { haptic, toast } from '../../lib/native'

export interface CartLine { tierId: string; qty: number }
export interface Cart { showId: string; lines: CartLine[] }
const MAX_PER_ORDER = 8
const doors = (iso: string) => formatTime(iso).replace(' ', '')

/** "Select Ticket" (Fan Ticket Wallet 1–2 in the Figma). */
export default function SelectTickets() {
  const { id } = useParams()
  const nav = useNavigate()
  const cat = useCatalog()
  const { state } = useStore()
  const [qty, setQty] = useState<Record<string, number>>({})
  const show = cat.show(id ?? '')
  if (!show) return <Navigate to="/explore" replace />
  if (show.salesPaused) return <Navigate to={`/show/${show.id}`} replace />

  const v = cat.venue(show.venueId)
  const host = cat.band(show.bandIds[0])
  const tiers = availability(show, v, state.tickets)
  const total = Object.values(qty).reduce((a, b) => a + b, 0)

  const set = (tierId: string, n: number, left: number) => {
    const others = total - (qty[tierId] ?? 0)
    const next = Math.max(0, Math.min(n, left, MAX_PER_ORDER - others))
    if (n > next) toast(next === left ? 'That’s all that’s left of this ticket' : `Max ${MAX_PER_ORDER} tickets per order`)
    haptic()
    setQty(q => ({ ...q, [tierId]: next }))
  }

  const go = () => {
    const lines = Object.entries(qty).filter(([, n]) => n > 0).map(([tierId, n]) => ({ tierId, qty: n }))
    nav('/checkout', { state: { showId: show.id, lines } satisfies Cart })
  }

  return (
    <div className="screen flow">
      <div className="pad-x top-bar"><Logo /></div>
      <div className="pad-x">
        <div className="flow-title"><BackButton /><h1>Select Ticket</h1></div>

        <div className="show-summary">
          <Poster hue={show.hue} photo={show.poster ?? host?.photo} className="summary-art" />
          <div className="min0">
            <b className="summary-title">{show.title}</b>
            <div className="summary-sub">{host?.name} @ {v.name}</div>
            <div className="summary-line">{formatDate(show.date, { weekday: 'long', month: 'long', day: 'numeric' })}</div>
            <div className="summary-line">Doors at {doors(show.date)}</div>
            <div className="chip-row tight">{show.genres.slice(0, 3).map(g => <Chip key={g} blue>{g}</Chip>)}</div>
          </div>
        </div>

        <div className="tier-cards">
          {tiers.map(({ tier, left }) => {
            const n = qty[tier.id] ?? 0
            const soldOut = left <= 0
            return (
              <div key={tier.id} className={`tier-card${soldOut ? ' sold-out' : ''}`}>
                <div className="qty-stepper">
                  <button onClick={() => set(tier.id, n - 1, left)} disabled={n === 0} aria-label={`Remove ${tier.name}`}>−</button>
                  <span className={`stub${n > 0 ? ' on' : ''}`} aria-live="polite" aria-label={`${n} ${tier.name}`}>{n}</span>
                  <button onClick={() => set(tier.id, n + 1, left)} disabled={soldOut} aria-label={`Add ${tier.name}`}>+</button>
                </div>
                <div className="tier-info">
                  <b>{tier.name}</b>
                  <span>{formatDate(show.date, { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                  <span>Doors at {doors(show.date)}</span>
                  <b className="tier-cost">{soldOut ? 'SOLD OUT' : tier.price === 0 ? 'FREE' : `$${tier.price.toFixed(2)} USD`}</b>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {total > 0 && (
        <div className="flow-footer">
          <button className="next-pill" onClick={go}>NEXT</button>
        </div>
      )}
    </div>
  )
}
