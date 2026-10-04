import { useState } from 'react'
import { Sheet } from '../../components/ui'
import { Pin } from '../../components/icons'
import { distanceKm } from '../../lib/format'
import { haptic } from '../../lib/native'
import type { Venue } from '../../types'

export const CITIES = [
  { name: 'Berkeley, CA', lat: 37.8715, lng: -122.273 },
  { name: 'Oakland, CA', lat: 37.8044, lng: -122.2712 },
  { name: 'San Francisco, CA', lat: 37.7749, lng: -122.4194 },
] as const
export type City = (typeof CITIES)[number]['name']

export const RADII = [5, 15, 40] as const // km

export function cityFor(homeBase: string): City {
  const hit = CITIES.find(c => homeBase.toLowerCase().includes(c.name.split(',')[0].toLowerCase()))
  return hit?.name ?? 'Berkeley, CA'
}

export function kmFrom(city: City, v: Pick<Venue, 'lat' | 'lng'>) {
  const c = CITIES.find(x => x.name === city)!
  return distanceKm(v, { lat: c.lat, lng: c.lng })
}

/** "📍 Berkeley, CA" button that opens a city + radius picker, for localizing booking. */
export function LocationButton({ city, radius, onChange }: { city: City; radius: number; onChange: (city: City, radius: number) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button className="location-tag as-button" onClick={() => setOpen(true)} aria-label={`Booking area: ${city}, within ${radius} km`}>
        <Pin size={18} />{city} <span className="muted small">· {radius} km</span>
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Where are you booking?">
        <div className="choice-list">
          {CITIES.map(c => (
            <button key={c.name} className={`select-row${c.name === city ? ' on' : ''}`} onClick={() => { haptic(); onChange(c.name, radius) }}>{c.name}</button>
          ))}
        </div>
        <div className="muted small">Distance</div>
        <div className="chip-row wrap flush">
          {RADII.map(r => (
            <button key={r} className={`select-chip${r === radius ? ' on' : ''}`} onClick={() => { haptic(); onChange(city, r) }}>Within {r} km</button>
          ))}
        </div>
        <button className="primary-btn" onClick={() => setOpen(false)}>Done</button>
      </Sheet>
    </>
  )
}
