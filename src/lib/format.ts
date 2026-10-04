import type { Venue } from '../types'

export function formatDate(iso: string, opts: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' }) {
  return new Date(iso).toLocaleDateString('en-US', opts)
}

export const shortDate = (iso: string) => formatDate(iso, { weekday: 'short', month: 'short', day: 'numeric' })

export function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export const priceLabel = (p: number) => (p === 0 ? 'FREE' : p < 10 ? '$' : p < 18 ? '$$' : '$$$')
export const priceText = (p: number) => (p === 0 ? 'FREE' : `$${p}`)
export const money = (n: number) => `$${n.toLocaleString()}`

export function isToday(iso: string) {
  return new Date(iso).toDateString() === new Date().toDateString()
}

export function isPastDate(iso: string) {
  return new Date(iso).getTime() < Date.now() - 6 * 3600 * 1000
}

/** Distance in km from a point (defaults to central Berkeley). */
export function distanceKm(v: Pick<Venue, 'lat' | 'lng'>, from = { lat: 37.8715, lng: -122.273 }) {
  const R = 6371
  const rad = (d: number) => (d * Math.PI) / 180
  const dLat = rad(v.lat - from.lat)
  const dLng = rad(v.lng - from.lng)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(from.lat)) * Math.cos(rad(v.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

export const initials = (name: string) => name.split(/\s+/).filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase()

export function timeAgo(iso: string) {
  const s = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 1000))
  if (s < 60) return 'just now'
  const m = Math.round(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.round(h / 24)}d ago`
}

export const gradient = (hue: number) =>
  `radial-gradient(circle at 30% 25%, hsl(${hue} 90% 62%), transparent 55%), radial-gradient(circle at 80% 80%, hsl(${(hue + 50) % 360} 85% 45%), transparent 60%), linear-gradient(160deg, hsl(${hue} 60% 22%), hsl(${(hue + 30) % 360} 50% 8%))`

export const avatarGradient = (hue: number) =>
  `linear-gradient(135deg, hsl(${hue} 80% 60%), hsl(${(hue + 40) % 360} 70% 35%))`
