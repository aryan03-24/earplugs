import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { Avatar, Chip, GlassButton, GlassLink, Logo, Poster, Sheet } from '../../components/ui'
import { Bookmark, Close, Share } from '../../components/icons'
import { FRIENDS } from '../../data/seed'
import { MY_BAND_ID, useCatalog } from '../../state/catalog'
import { useStore } from '../../state/store'
import { formatDate, formatTime, isPastDate, priceText, shortDate } from '../../lib/format'
import { haptic, share, toast } from '../../lib/native'

export default function ShowPage() {
  const { id } = useParams()
  const nav = useNavigate()
  const cat = useCatalog()
  const { state, toggle, buyTicket } = useStore()
  const [sheet, setSheet] = useState<'tickets' | 'friends' | null>(null)
  const [qty, setQty] = useState(1)
  const show = cat.show(id ?? '')
  if (!show) return <Navigate to="/explore" replace />

  const v = cat.venue(show.venueId)
  const bands = show.bandIds.map(b => cat.band(b)).filter(b => !!b)
  const saved = state.saved.includes(show.id)
  const ticket = state.tickets.find(t => t.showId === show.id)
  const past = isPastDate(show.date)
  const isMine = show.bandIds.includes(MY_BAND_ID)
  const plugging = FRIENDS.slice(0, Math.min(FRIENDS.length, show.plugging))
  const close = () => (window.history.length > 1 ? nav(-1) : nav('/explore'))

  return (
    <div className="screen show-page">
      <div className="row between pad-x top-bar">
        <Logo />
        <GlassButton size={34} aria-label="Close" onClick={close}><Close /></GlassButton>
      </div>

      <Poster hue={show.hue} photo={bands[0]?.photo} className="hero" />

      <div className="pad-x">
        <div className="row between top">
          <div className="min0">
            <h1 className="show-title">{show.title}</h1>
            <Link to={`/venue/${v.id}`} className="show-venue">{v.name}</Link>
            <div className="show-when">{formatDate(show.date)}<br />Doors at {formatTime(show.date)}</div>
            <div className="show-price">{priceText(show.price)}</div>
          </div>
          <div className="show-side">
            <div className="row gap-sm">
              <GlassButton size={42} aria-label="Share" onClick={() => share(show.title, `${show.title} at ${v.name}`)}><Share size={22} /></GlassButton>
              <GlassButton size={42} aria-label={saved ? 'Unsave' : 'Save'} aria-pressed={saved}
                onClick={() => { haptic(); toggle('saved', show.id); toast(saved ? 'Removed from Plugged' : 'Saved to Plugged') }}>
                <Bookmark size={22} filled={saved} />
              </GlassButton>
            </div>
            <button className="plugging" onClick={() => setSheet('friends')}>
              <div className="faces">{plugging.slice(0, 3).map(f => <Avatar key={f.id} name={f.name} hue={f.hue} size={40} />)}</div>
              {show.plugging > 3 && <span>+{show.plugging - 3}</span>}
            </button>
            <button className="muted small" onClick={() => setSheet('friends')}>See Who’s Plugging In</button>
          </div>
        </div>

        <div className="chip-row">{show.genres.map(g => <Chip key={g} blue>{g}</Chip>)}</div>

        <h2 className="sub-h">Lineup</h2>
        <div className="lineup">
          {bands.map(b => {
            const following = state.following.includes(b.id)
            return (
              <div key={b.id} className="lineup-row">
                <Link to={`/band/${b.id}`} className="row gap center-v grow min0">
                  <Avatar name={b.name} hue={b.hue} photo={b.photo} />
                  <div className="min0"><div className="band-name">{b.name}</div><div className="band-genre">{b.genres[0]}</div></div>
                </Link>
                {b.id !== MY_BAND_ID && (
                  <button className={`follow-pill${following ? ' on' : ''}`} onClick={() => { haptic(); toggle('following', b.id) }}>
                    {following ? 'FOLLOWING' : 'FOLLOW'}
                  </button>
                )}
                <GlassLink to={`/band/${b.id}`} label={`Open ${b.name}`} size={30} />
              </div>
            )
          })}
        </div>

        <h2 className="sub-h">More Info</h2>
        <p className="show-bio">{bands[0]?.bio}</p>
        <div className="info-grid">
          <div><span className="muted small">Address</span><b>{v.address}, {v.city}</b></div>
          <div><span className="muted small">Ages</span><b>{v.ages}</b></div>
          <div><span className="muted small">Capacity</span><b>{v.capacity}</b></div>
          <div><span className="muted small">Going</span><b>{show.plugging + (ticket ? 1 : 0)} friends</b></div>
        </div>
        <a className="link small" href={`https://maps.apple.com/?q=${encodeURIComponent(`${v.name}, ${v.address}, ${v.city}`)}`} target="_blank" rel="noreferrer">Open in Maps</a>
      </div>

      {!past && (
        <div className="ticket-bar">
          {isMine ? (
            <button onClick={() => nav('/bookings?tab=Calendar')}>MANAGE SHOW</button>
          ) : ticket ? (
            <button onClick={() => nav('/tickets')}>VIEW MY TICKET{ticket.qty > 1 ? `S (${ticket.qty})` : ''}</button>
          ) : (
            <button onClick={() => setSheet('tickets')}>{show.price === 0 ? 'RSVP' : 'GET TICKETS'}</button>
          )}
        </div>
      )}

      <Sheet open={sheet === 'tickets'} onClose={() => setSheet(null)} title={show.title}>
        <p className="muted">{v.name} · {shortDate(show.date)} · {formatTime(show.date)}</p>
        <div className="row between center-v sheet-row">
          <span>{show.price === 0 ? 'Free RSVP' : `General Admission · $${show.price}`}</span>
          <div className="stepper">
            <button onClick={() => setQty(q => Math.max(1, q - 1))} aria-label="Fewer">−</button>
            <span aria-live="polite">{qty}</span>
            <button onClick={() => setQty(q => Math.min(8, q + 1))} aria-label="More">+</button>
          </div>
        </div>
        <div className="row between sheet-row"><span>Total</span><b>{show.price === 0 ? 'FREE' : `$${show.price * qty}`}</b></div>
        <button className="primary-btn" onClick={() => {
          haptic(20)
          buyTicket(show.id, qty)
          setSheet(null)
          toast(show.price === 0 ? 'You’re on the list!' : 'Tickets confirmed!')
        }}>{show.price === 0 ? 'Confirm RSVP' : 'Confirm Purchase'}</button>
        <p className="muted small center">Demo checkout. No payment is taken.</p>
      </Sheet>

      <Sheet open={sheet === 'friends'} onClose={() => setSheet(null)} title="Who’s Plugging In">
        {plugging.length ? (
          <div className="friend-list">
            {plugging.map(f => (
              <div key={f.id} className="row gap center-v">
                <Avatar name={f.name} hue={f.hue} size={44} />
                <div className="grow"><b>{f.name}</b><div className="muted small">{f.handle}</div></div>
                <span className="muted small">Going</span>
              </div>
            ))}
            {show.plugging > plugging.length && <p className="muted small">+{show.plugging - plugging.length} more</p>}
          </div>
        ) : <p className="muted">None of your friends have plugged in yet. Be the first!</p>}
      </Sheet>
    </div>
  )
}
