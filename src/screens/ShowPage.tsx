import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { Avatar, Chip, GlassButton, Logo, Poster } from '../components/ui'
import { Bookmark, ChevronRight, Close, Share } from '../components/icons'
import { bandById, formatDate, formatTime, showById, venueById } from '../data'
import { share, toast, useStore } from '../store'

export default function ShowPage() {
  const { id } = useParams()
  const nav = useNavigate()
  const { state, toggle } = useStore()
  const [checkout, setCheckout] = useState(false)
  const [qty, setQty] = useState(1)
  const show = showById(id ?? '')
  if (!show) return <Navigate to="/explore" replace />

  const v = venueById(show.venueId)
  const bands = show.bandIds.map(b => bandById(b)!).filter(Boolean)
  const saved = state.saved.includes(show.id)
  const hasTicket = state.tickets.includes(show.id)

  const getTickets = () => {
    if (hasTicket) { nav('/gigs?list=tickets'); return }
    setCheckout(true)
  }

  return (
    <div className="screen show-page">
      <div className="row between pad-x top-bar">
        <Logo size={42} />
        <GlassButton size={34} aria-label="Close" onClick={() => (window.history.length > 1 ? nav(-1) : nav('/explore'))}><Close /></GlassButton>
      </div>

      <Poster hue={show.hue} photo={bands[0]?.photos[0]} className="hero" />

      <div className="pad-x">
        <div className="row between top">
          <div>
            <h1 className="show-title">{show.title}</h1>
            <div className="show-venue">{v.name}</div>
            <div className="show-when">{formatDate(show.date)}<br />Doors at {formatTime(show.date)}</div>
            <div className="show-price">{show.price === 0 ? 'FREE' : `$${show.price}`}</div>
          </div>
          <div className="show-side">
            <div className="row gap-sm">
              <GlassButton size={42} aria-label="Share" onClick={() => share(show.title, `${show.title} at ${v.name}`)}><Share size={22} /></GlassButton>
              <GlassButton size={42} aria-label={saved ? 'Unsave' : 'Save'} onClick={() => { toggle('saved', show.id); toast(saved ? 'Removed from saved' : 'Saved') }}>
                <Bookmark size={22} filled={saved} />
              </GlassButton>
            </div>
            <div className="plugging">
              <div className="faces">{[0, 1, 2].map(i => <span key={i} style={{ background: `hsl(${(show.hue + i * 40) % 360} 30% 40%)` }} />)}</div>
              <span>+{show.plugging}</span>
            </div>
            <div className="muted small">See Who’s Plugging In</div>
          </div>
        </div>

        <div className="chip-row">{show.genres.map(g => <Chip key={g} blue>{g}</Chip>)}</div>

        <h2 className="sub-h">Lineup</h2>
        <div className="lineup">
          {bands.map(b => {
            const f = state.following.includes(b.id)
            return (
              <div key={b.id} className="lineup-row">
                <Link to={`/band/${b.id}`} className="row gap center-v grow">
                  <Avatar band={b} />
                  <div><div className="band-name">{b.name}</div><div className="band-genre">{b.genres[0]}</div></div>
                </Link>
                <button className={`follow-pill${f ? ' on' : ''}`} onClick={() => toggle('following', b.id)}>{f ? 'FOLLOWING' : 'FOLLOW'}</button>
                <Link to={`/band/${b.id}`} className="glass-btn" style={{ width: 30, height: 30 }} aria-label={`Open ${b.name}`}><ChevronRight size={18} /></Link>
              </div>
            )
          })}
        </div>
        <p className="show-bio">{bands[0]?.bio}</p>
        <p className="muted small">{v.address}, {v.city}</p>
      </div>

      <div className="ticket-bar">
        <button onClick={getTickets}>{hasTicket ? 'VIEW MY TICKET' : show.price === 0 ? 'RSVP' : 'GET TICKETS'}</button>
      </div>

      {checkout && (
        <div className="sheet-backdrop" onClick={() => setCheckout(false)}>
          <div className="sheet" onClick={e => e.stopPropagation()} role="dialog" aria-label="Tickets">
            <div className="sheet-handle" />
            <h2>{show.title}</h2>
            <p className="muted">{v.name} · {formatDate(show.date, { weekday: 'short', month: 'short', day: 'numeric' })} · {formatTime(show.date)}</p>
            <div className="row between center-v qty">
              <span>{show.price === 0 ? 'Free RSVP' : `General Admission · $${show.price}`}</span>
              <div className="stepper">
                <button onClick={() => setQty(q => Math.max(1, q - 1))} aria-label="Fewer">−</button>
                <span>{qty}</span>
                <button onClick={() => setQty(q => Math.min(8, q + 1))} aria-label="More">+</button>
              </div>
            </div>
            <div className="row between total"><span>Total</span><b>{show.price === 0 ? 'FREE' : `$${show.price * qty}`}</b></div>
            <button className="primary-btn" onClick={() => {
              toggle('tickets', show.id)
              setCheckout(false)
              toast(show.price === 0 ? 'You’re on the list!' : 'Tickets confirmed!')
            }}>{show.price === 0 ? 'Confirm RSVP' : 'Confirm Purchase'}</button>
            <p className="muted small center">Demo checkout. No payment is taken.</p>
          </div>
        </div>
      )}
    </div>
  )
}
