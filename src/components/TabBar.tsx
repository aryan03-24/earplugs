import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { sideOf, useStore } from '../state/store'
import { haptic } from '../lib/native'
import { CalendarFill, Chart, Home, PlugIcon, PlusSquare, User } from './icons'

interface Tab { to: string; label: string; icon: ReactNode; end?: boolean }

/**
 * Floating glass tab bar from the Figma.
 * Musician: Gigs · Analytics · + (new show) · Profile.  Fan: Home · Plugged · Profile (Search is on Explore; Tickets live on the profile).
 */
export function TabBar() {
  const { state } = useStore()
  const p = state.profile
  const avatar = p.photo ? <img src={p.photo} alt="" className="tab-photo" /> : <span className="tab-avatar"><User size={18} /></span>

  const tabs: Tab[] = sideOf(p) === 'artist'
    ? [
        { to: '/gigs', label: 'Gigs', icon: <CalendarFill size={24} /> },
        { to: '/analytics', label: 'Analytics', icon: <Chart size={26} /> },
        { to: '/host/new', label: 'New show', icon: <PlusSquare size={26} /> },
        { to: '/profile', label: 'Profile', icon: avatar },
      ]
    : [
        { to: '/explore', label: 'Home', icon: <Home size={28} /> },
        { to: '/plugged', label: 'Plugged', icon: <PlugIcon size={24} /> },
        { to: '/profile', label: 'Profile', icon: avatar },
      ]

  return (
    <nav className={`tab-bar n${tabs.length}`} aria-label="Main">
      {tabs.map(t => (
        <NavLink key={t.to} to={t.to} end={t.end} aria-label={t.label} className="tab" onClick={() => haptic()}>
          {t.icon}
        </NavLink>
      ))}
    </nav>
  )
}
