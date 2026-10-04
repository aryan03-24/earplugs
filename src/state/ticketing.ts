// Ticketing rules shared by the fan checkout and the musician's gig dashboard.
import type { Order, Show, Ticket, TicketTier, Venue } from '../types'

export const SERVICE_FEE_RATE = 0.08
export const PER_TICKET_FEE = 0.99

const round2 = (n: number) => Math.round(n * 100) / 100

/** Shows without explicit tiers get one tier from their single price. */
export function tiersFor(show: Show, venue: Venue): TicketTier[] {
  if (show.tiers?.length) return show.tiers
  return [{ id: 'ga', name: show.price === 0 ? 'Free RSVP' : 'General Admission', price: show.price, qty: venue.capacity }]
}

export function feesFor(unitPrice: number, qty: number) {
  return unitPrice === 0 ? 0 : round2(qty * (PER_TICKET_FEE + unitPrice * SERVICE_FEE_RATE))
}

export function ticketCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let c = ''
  for (let i = 0; i < 6; i++) c += chars[Math.floor(Math.random() * chars.length)]
  return `EP-${c}`
}

const NAMES = [
  'Maya Chen', 'Jordan Reyes', 'Priya Natarajan', 'Sam Okafor', 'Leo Martins', 'Ava Kim', 'Diego Flores', 'Nora Patel',
  'Eli Brooks', 'Zoe Alvarez', 'Kai Nakamura', 'Ruby Singh', 'Omar Haddad', 'Lily Tran', 'Noah Fischer', 'Isla Moreno',
  'Theo Park', 'Mina Hassan', 'Jonah Weiss', 'Chloe Dubois', 'Ravi Mehta', 'Sofia Rossi', 'Ben Adeyemi', 'Hana Sato',
]

// Small deterministic random generator so a gig's simulated orders stay stable between renders.
function rng(seed: string) {
  let h = 2166136261
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619)
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    return ((h ^= h >>> 16) >>> 0) / 4294967296
  }
}

/**
 * Simulated demand on a hosted gig: a burst of sales right after publishing, then steady
 * sales over the next half hour, topping out around 70% of capacity.
 */
export function simulatedOrders(show: Show, venue: Venue, now = Date.now()): Order[] {
  if (!show.hostedByMe || !show.publishedAt || show.cancelled) return []
  const minutes = Math.max(0, (now - new Date(show.publishedAt).getTime()) / 60000)
  const progress = Math.min(0.7, 0.12 + minutes * 0.02)
  const rand = rng(show.id)
  const orders: Order[] = []
  for (const tier of tiersFor(show, venue)) {
    const target = Math.floor(tier.qty * progress * (tier.price > 15 ? 0.6 : 1))
    let sold = 0
    let i = 0
    while (sold < target) {
      const qty = Math.min(target - sold, rand() < 0.65 ? 1 : rand() < 0.7 ? 2 : 4)
      // Spread order times between publish time and now.
      const at = new Date(new Date(show.publishedAt).getTime() + (i + rand()) * ((now - new Date(show.publishedAt).getTime()) / Math.max(1, target))).toISOString()
      orders.push({
        code: `EP-${tier.id.slice(0, 2).toUpperCase()}${String(1000 + orders.length).slice(-3)}${Math.floor(rand() * 9)}`,
        name: NAMES[Math.floor(rand() * NAMES.length)],
        tierId: tier.id, tierName: tier.name, qty, total: qty * tier.price, at,
      })
      sold += qty
      i++
    }
  }
  return orders
}

export function ordersFor(show: Show, venue: Venue, tickets: Ticket[], now = Date.now()): Order[] {
  const mine: Order[] = tickets.filter(t => t.showId === show.id).map(t => ({
    code: t.code, name: t.transferredTo ?? t.holder, tierId: t.tierId, tierName: t.tierName,
    qty: t.qty, total: t.qty * t.unitPrice, at: t.purchasedAt, mine: true,
  }))
  return [...simulatedOrders(show, venue, now), ...mine].sort((a, b) => b.at.localeCompare(a.at))
}

export interface TierSales { tier: TicketTier; sold: number; left: number; revenue: number }

export function salesSummary(show: Show, venue: Venue, orders: Order[]) {
  const tiers: TierSales[] = tiersFor(show, venue).map(tier => {
    const sold = orders.filter(o => o.tierId === tier.id).reduce((n, o) => n + o.qty, 0)
    return { tier, sold, left: Math.max(0, tier.qty - sold), revenue: sold * tier.price }
  })
  const sold = tiers.reduce((n, t) => n + t.sold, 0)
  const capacity = tiers.reduce((n, t) => n + t.tier.qty, 0)
  const revenue = tiers.reduce((n, t) => n + t.revenue, 0)
  return { tiers, sold, capacity, revenue, pct: capacity ? Math.round((sold / capacity) * 100) : 0 }
}

/** Tickets left per tier as a fan sees it. Seed shows estimate demand from friends going. */
export function availability(show: Show, venue: Venue, tickets: Ticket[], now = Date.now()) {
  if (show.hostedByMe) return salesSummary(show, venue, ordersFor(show, venue, tickets, now)).tiers
  return tiersFor(show, venue).map(tier => {
    const sold = Math.min(tier.qty, Math.round(tier.qty * Math.min(0.92, 0.35 + show.plugging * 0.04)))
    return { tier, sold, left: tier.qty - sold, revenue: sold * tier.price }
  })
}

export function icsFor(show: Show, venue: Venue) {
  const start = new Date(show.date)
  const end = new Date(start.getTime() + 3 * 3600e3)
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//EarPlug//EN', 'BEGIN:VEVENT',
    `UID:${show.id}@earplug`, `DTSTAMP:${fmt(new Date())}`, `DTSTART:${fmt(start)}`, `DTEND:${fmt(end)}`,
    `SUMMARY:${show.title}`, `LOCATION:${venue.name}, ${venue.address}, ${venue.city}`,
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n')
}

export function downloadIcs(show: Show, venue: Venue) {
  const blob = new Blob([icsFor(show, venue)], { type: 'text/calendar' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `${show.title.replace(/[^\w]+/g, '-')}.ics`
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}
