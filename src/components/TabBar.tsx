import { NavLink } from 'react-router-dom'
import { useStore } from '../state/store'
import { haptic } from '../lib/native'
import { Chart, Home, PlugIcon, Search, TicketIcon, User } from './icons'

/** Floating five-tab bar from the Figma. The third and fourth tabs change with the persona. */
export function TabBar() {
  const { state } = useStore()
  const musician = state.profile.role === 'musician'
  const tabs = [
    { to: '/explore', label: 'Explore', icon: <Home size={28} /> },
    { to: '/search', label: 'Search', icon: <Search size={24} /> },
    musician
      ? { to: '/analytics', label: 'Analytics', icon: <Chart size={24} /> }
      : { to: '/plugged', label: 'Plugged', icon: <PlugIcon size={24} /> },
    musician
      ? { to: '/bookings', label: 'Bookings', icon: <TicketIcon size={24} /> }
      : { to: '/tickets', label: 'Tickets', icon: <TicketIcon size={24} /> },
    {
      to: '/profile', label: 'Profile',
      icon: state.profile.photo ? <img src={state.profile.photo} alt="" className="tab-photo" /> : <span className="tab-avatar"><User size={20} /></span>,
    },
  ]
  return (
    <nav className="tab-bar" aria-label="Main">
      {tabs.map(t => (
        <NavLink key={t.to} to={t.to} aria-label={t.label} className="tab" onClick={() => haptic()}>
          {t.icon}
        </NavLink>
      ))}
    </nav>
  )
}
