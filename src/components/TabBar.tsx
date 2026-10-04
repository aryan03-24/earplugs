import { NavLink } from 'react-router-dom'
import { useStore } from '../state/store'
import { haptic } from '../lib/native'
import { Calendar, Home, PlugIcon, Plus, Search, TicketIcon, User } from './icons'

interface Tab { to: string; label: string; icon: React.ReactNode; end?: boolean }

/**
 * Floating glass tab bar from the Figma.
 * Musician: Home · Gigs · + (new show) · Profile.  Fan: Home · Search · Plugged · Tickets · Profile.
 */
export function TabBar() {
  const { state } = useStore()
  const p = state.profile
  const avatar = p.photo ? <img src={p.photo} alt="" className="tab-photo" /> : <span className="tab-avatar"><User size={18} /></span>

  const tabs: Tab[] = p.role === 'musician'
    ? [
        { to: '/explore', label: 'Home', icon: <Home size={28} /> },
        { to: '/gigs', label: 'Gigs', icon: <Calendar size={24} /> },
        { to: '/host/new', label: 'New show', icon: <Plus size={24} /> },
        { to: '/profile', label: 'Profile', icon: avatar },
      ]
    : [
        { to: '/explore', label: 'Home', icon: <Home size={28} /> },
        { to: '/search', label: 'Search', icon: <Search size={24} /> },
        { to: '/plugged', label: 'Plugged', icon: <PlugIcon size={24} /> },
        { to: '/tickets', label: 'Tickets', icon: <TicketIcon size={24} />, end: true },
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
