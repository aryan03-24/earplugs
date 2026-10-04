import type { ReactNode, ButtonHTMLAttributes } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import ear from '../assets/ear.png'
import { Bookmark, ChevronLeft, ChevronRight, Home, Search as SearchIcon, User, Chart, Share } from './icons'
import { bandById, formatDate, priceLabel, venueById, type Band, type Show } from '../data'
import { share, useStore } from '../store'

export const Logo = ({ size = 44 }: { size?: number }) => (
  <img src={ear} alt="EarPlug" className="logo" style={{ width: size * 1.27, height: size }} />
)

export function GlassButton({ children, className = '', size = 32, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { size?: number }) {
  return (
    <button className={`glass-btn ${className}`} style={{ width: size, height: size }} {...p}>
      {children}
    </button>
  )
}

export function BackButton({ to }: { to?: string }) {
  const nav = useNavigate()
  return (
    <GlassButton aria-label="Back" onClick={() => (to ? nav(to) : window.history.length > 1 ? nav(-1) : nav('/explore'))}>
      <ChevronLeft size={18} />
    </GlassButton>
  )
}

export function Chip({ children, active, blue, onClick, small }: { children: ReactNode; active?: boolean; blue?: boolean; onClick?: () => void; small?: boolean }) {
  const cls = `chip${active ? ' active' : ''}${blue ? ' blue' : ''}${small ? ' small' : ''}`
  return onClick ? (
    <button type="button" className={cls} onClick={onClick} aria-pressed={active}>{children}</button>
  ) : (
    <span className={cls}>{children}</span>
  )
}

export function SectionHeader({ title, to }: { title: ReactNode; to?: string }) {
  return (
    <div className="section-header">
      <h2>{title}</h2>
      {to && (
        <Link to={to} className="glass-btn" aria-label={`See all`} style={{ width: 32, height: 32 }}>
          <ChevronRight size={20} />
        </Link>
      )}
    </div>
  )
}

/** Placeholder poster art generated from a hue. Uses a photo when available. */
export function Poster({ hue, label, photo, className = '', children }: { hue: number; label?: string; photo?: string; className?: string; children?: ReactNode }) {
  const style = photo
    ? { backgroundImage: `url(${photo})` }
    : { background: `radial-gradient(circle at 30% 25%, hsl(${hue} 90% 62%), transparent 55%), radial-gradient(circle at 80% 80%, hsl(${(hue + 50) % 360} 85% 45%), transparent 60%), linear-gradient(160deg, hsl(${hue} 60% 22%), hsl(${(hue + 30) % 360} 50% 8%))` }
  return (
    <div className={`poster ${className}`} style={style}>
      {label && <span className="poster-label">{label}</span>}
      {children}
    </div>
  )
}

export function Avatar({ band, size = 58 }: { band: Pick<Band, 'name' | 'hue'>; size?: number }) {
  return (
    <div className="avatar" style={{ width: size, height: size, fontSize: size * 0.36, background: `linear-gradient(135deg, hsl(${band.hue} 80% 60%), hsl(${(band.hue + 40) % 360} 70% 35%))` }}>
      {band.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
    </div>
  )
}

export function ShowCard({ show, wide }: { show: Show; wide?: boolean }) {
  return (
    <Link to={`/show/${show.id}`} className={`show-card${wide ? ' wide' : ''}`}>
      <Poster hue={show.hue} label={show.title}>
        <span className="price-tag">{priceLabel(show.price)}</span>
      </Poster>
    </Link>
  )
}

export function Carousel({ children }: { children: ReactNode }) {
  return <div className="carousel">{children}</div>
}

export function BandGrid({ bands }: { bands: Band[] }) {
  return (
    <div className="band-grid">
      {bands.map(b => (
        <Link key={b.id} to={`/band/${b.id}`} className="band-cell">
          <Avatar band={b} />
          <div>
            <div className="band-name">{b.name}</div>
            <div className="band-genre">{b.genres[0]}</div>
          </div>
        </Link>
      ))}
    </div>
  )
}

export function GigRow({ show, showShare = true }: { show: Show; showShare?: boolean }) {
  const { state, toggle } = useStore()
  const saved = state.saved.includes(show.id)
  const v = venueById(show.venueId)
  const bands = show.bandIds.map(id => bandById(id)?.name).join(', ')
  return (
    <div className="gig-row">
      <Link to={`/show/${show.id}`} className="gig-main">
        <Poster hue={show.hue} className="gig-thumb" />
        <div className="gig-text">
          <div className="gig-name">{show.title}</div>
          <div className="gig-sub">{bands}</div>
          <div className="gig-sub">{v.name} • {formatDate(show.date, { weekday: 'short', month: 'short', day: 'numeric' })}</div>
        </div>
      </Link>
      {showShare && (
        <button className="icon-btn" aria-label="Share" onClick={() => share(show.title, `${show.title} at ${v.name}`)}>
          <Share size={22} />
        </button>
      )}
      <button className="icon-btn" aria-label={saved ? 'Unsave' : 'Save'} onClick={() => toggle('saved', show.id)}>
        <Bookmark size={24} filled={saved} />
      </button>
    </div>
  )
}

export function TabBar() {
  const { state } = useStore()
  const musician = state.profile.role === 'musician'
  return (
    <nav className="tab-bar" aria-label="Main">
      <NavLink to="/explore" aria-label="Explore" className="tab"><Home size={30} /></NavLink>
      <NavLink to="/search" aria-label="Search" className="tab"><SearchIcon size={26} /></NavLink>
      {musician && <NavLink to="/analytics" aria-label="Analytics" className="tab"><Chart size={26} /></NavLink>}
      <NavLink to="/profile" aria-label="Profile" className="tab">
        {state.profile.photo ? <img src={state.profile.photo} alt="" className="tab-photo" /> : <User size={28} />}
      </NavLink>
    </nav>
  )
}

export function Screen({ children, tabs, className = '' }: { children: ReactNode; tabs?: boolean; className?: string }) {
  return (
    <div className={`screen ${tabs ? 'has-tabs' : ''} ${className}`}>
      {children}
      {tabs && <TabBar />}
    </div>
  )
}
