// Layout and primitive building blocks shared by every screen.
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ear from '../assets/ear.png'
import { ChevronLeft, ChevronRight } from './icons'
import { avatarGradient, gradient, initials } from '../lib/format'
import { haptic } from '../lib/native'
import { TabBar } from './TabBar'

export const Logo = ({ size = 42 }: { size?: number }) => (
  <img src={ear} alt="EarPlug" className="logo" style={{ width: size * 1.27, height: size }} />
)

export function Screen({ children, tabs, className = '' }: { children: ReactNode; tabs?: boolean; className?: string }) {
  return (
    <div className={`screen ${tabs ? 'has-tabs' : ''} ${className}`}>
      {children}
      {tabs && <TabBar />}
    </div>
  )
}

/** Logo row + optional large title used at the top of tab screens. */
export function PageHeader({ title, back, right, children }: { title?: ReactNode; back?: string | true; right?: ReactNode; children?: ReactNode }) {
  return (
    <header className="page-header">
      <div className="row between center-v">
        <Logo />
        {right}
      </div>
      {title && (
        <div className="row gap-sm center-v">
          {back && <BackButton to={back === true ? undefined : back} />}
          <h1 className="large-title">{title}</h1>
        </div>
      )}
      {children}
    </header>
  )
}

export function GlassButton({ children, className = '', size = 32, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { size?: number }) {
  return (
    <button type="button" className={`glass-btn ${className}`} style={{ width: size, height: size }} {...p}>
      {children}
    </button>
  )
}

export function GlassLink({ to, label, size = 32 }: { to: string; label: string; size?: number }) {
  return (
    <Link to={to} className="glass-btn" aria-label={label} style={{ width: size, height: size }}>
      <ChevronRight size={size * 0.6} />
    </Link>
  )
}

export function BackButton({ to }: { to?: string }) {
  const nav = useNavigate()
  return (
    <GlassButton aria-label="Back" onClick={() => (to ? nav(to) : window.history.length > 1 ? nav(-1) : nav('/'))}>
      <ChevronLeft size={18} />
    </GlassButton>
  )
}

export function Chip({ children, active, blue, onClick, tone }: { children: ReactNode; active?: boolean; blue?: boolean; onClick?: () => void; tone?: string }) {
  const cls = `chip${active ? ' active' : ''}${blue ? ' blue' : ''}${tone ? ` tone-${tone}` : ''}`
  return onClick ? (
    <button type="button" className={cls} onClick={() => { haptic(); onClick() }} aria-pressed={active}>{children}</button>
  ) : (
    <span className={cls}>{children}</span>
  )
}

export function Segmented<T extends string>({ options, value, onChange, full, labels }: {
  options: readonly T[]; value: T; onChange: (v: T) => void; full?: boolean; labels?: Partial<Record<T, string>>
}) {
  return (
    <div className={`segmented${full ? ' full' : ''}`} role="tablist">
      {options.map(o => (
        <button key={o} type="button" role="tab" aria-selected={o === value} className={o === value ? 'on' : ''} onClick={() => { haptic(); onChange(o) }}>
          {labels?.[o] ?? o}
        </button>
      ))}
    </div>
  )
}

export function SectionHeader({ title, to, action }: { title: ReactNode; to?: string; action?: ReactNode }) {
  return (
    <div className="section-header">
      <h2>{title}</h2>
      {action}
      {to && <GlassLink to={to} label="See all" />}
    </div>
  )
}

/** Poster art: a photo when available, otherwise a generated gradient. */
export function Poster({ hue, label, photo, className = '', children }: { hue: number; label?: string; photo?: string; className?: string; children?: ReactNode }) {
  return (
    <div className={`poster ${className}`} style={photo ? { backgroundImage: `url(${photo})` } : { background: gradient(hue) }}>
      {label && <span className="poster-label">{label}</span>}
      {children}
    </div>
  )
}

export function Avatar({ name, hue, photo, size = 58 }: { name: string; hue: number; photo?: string | null; size?: number }) {
  return (
    <div className="avatar" style={{ width: size, height: size, fontSize: size * 0.36, ...(photo ? { backgroundImage: `url(${photo})` } : { background: avatarGradient(hue) }) }}>
      {!photo && initials(name)}
    </div>
  )
}

export function Carousel({ children }: { children: ReactNode }) {
  return <div className="carousel">{children}</div>
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="empty">{children}</p>
}

export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title?: ReactNode; children: ReactNode }) {
  if (!open) return null
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="sheet-handle" />
        {title && <h2 className="sheet-title">{title}</h2>}
        {children}
      </div>
    </div>
  )
}

export function Field({ label, value, onChange, placeholder, type = 'text', multiline, autoFocus, inputMode }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string
  multiline?: boolean; autoFocus?: boolean; inputMode?: 'numeric' | 'email' | 'url' | 'tel'
}) {
  return (
    <label className="form-field">
      <span>{label}</span>
      {multiline ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3} autoFocus={autoFocus} />
      ) : (
        <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} autoFocus={autoFocus} inputMode={inputMode} />
      )}
    </label>
  )
}
