import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { Avatar, Chip, GlassButton, GlassLink, Logo, Poster, Sheet } from '../../components/ui'
import { Bookmark, Close, Pin, Share, TicketIcon } from '../../components/icons'
import { FRIENDS } from '../../data/seed'
import { MY_BAND_ID, useCatalog } from '../../state/catalog'
import { useStore } from '../../state/store'
import { availability } from '../../state/ticketing'
import { formatDate, formatTime, isPastDate, money } from '../../lib/format'
import { haptic, share, toast } from '../../lib/native'

/** Show Page – Fan View from the Figma, with live ticket availability. */
export default function ShowPage() {
  const { id } = useParams()
  const nav = useNavigate()
  const cat = useCatalog()
  const { state, toggle, requestFriend } = useStore()
  const [sheet, setSheet] = useState<'friends' | null>(null)
  const show = cat.show(id ?? '')
  if (!show) return <Navigate to="/explore" replace />

  const v = cat.venue(show.venueId)
  const bands = show.bandIds.map(b => cat.band(b)).filter(b => !!b)
  const saved = state.saved.includes(show.id)
  const myTickets = state.tickets.filter(t => t.showId === show.id && !t.transferredTo)
  const past = isPastDate(show.date)
  const isMine = show.bandIds.includes(MY_BAND_ID) && state.profile.role === 'musician'
  const plugging = FRIENDS.slice(0, Math.min(FRIENDS.length, show.plugging))
  const tiers = availability(show, v, state.tickets)
  const left = tiers.reduce((n, t) => n + t.left, 0)
  const prices = tiers.map(t => t.tier.price)
  const minPrice = Math.min(...prices), maxPrice = Math.max(...prices)
  const priceLine = maxPrice === 0 ? 'FREE' : minPrice === maxPrice ? money(minPrice) : `${minPrice === 0 ? 'Free' : money(minPrice)} – ${money(maxPrice)}`
  const soldOut = left <= 0
  const close = () => (window.history.length > 1 ? nav(-1) : nav('/explore'))

  return (
    <div className="screen show-page">
      <div className="row between pad-x top-bar">
        <Logo />
        <GlassButton size={34} aria-label="Close" onClick={close}><Close /></GlassButton>
      </div>

      <Poster hue={show.hue} photo={show.poster ?? bands[0]?.photo} className="hero">
        {show.hostedByMe && <span className="hero-badge">Artist-hosted</span>}
        {!past && left > 0 && left <= 25 && <span className="hero-badge urgent">Only {left} left</span>}
      </Poster>

      <div className="pad-x">
        <div className="row between top">
          <div className="min0">
            <h1 className="show-title">{show.title}</h1>
            <Link to={v.custom ? '#' : `/venue/${v.id}`} className="show-venue">{v.name}</Link>
            <div className="show-when">{formatDate(show.date)}<br />Doors at {formatTime(show.date)}</div>
            <div className="show-price">{priceLine}</div>
          </div>
          <div className="show-side">
            <div className="row gap-sm">
              <GlassButton size={42} aria-label="Share" onClick={() => share(show.title, `${show.title} at ${v.name}`)}><Share size={22} /></GlassButton>
              <GlassButton size={42} aria-label={saved ? 'Unsave' : 'Save'} aria-pressed={saved}
                onClick={() => { haptic(); toggle('saved', show.id); toast(saved ? 'Removed from Plugged' : 'Saved to Plugged') }}>
                <Bookmark size={22} filled={saved} />
              </GlassButton>
            </div>
            {plugging.length > 0 && (
              <button className="plugging" onClick={() => setSheet('friends')}>
                <div className="faces">{plugging.slice(0, 3).map(f => <Avatar key={f.id} name={f.name} hue={f.hue} size={40} />)}</div>
                {show.plugging > 3 && <span>+{show.plugging - 3}</span>}
              </button>
            )}
            <button className="muted small" onClick={() => setSheet('friends')}>See Who’s Plugging In</button>
          </div>
        </div>

        <div className="chip-row">{show.genres.map(g => <Chip key={g} blue>{g}</Chip>)}</div>

        {myTickets.length > 0 && (
          <Link to={`/tickets/${myTickets[0].id}`} className="have-ticket">
            <TicketIcon size={22} />
            <div className="grow"><b>You’re going</b><div className="small">{myTickets.reduce((n, t) => n + t.qty, 0)} × {myTickets[0].tierName}</div></div>
            <span className="small">View ›</span>
          </Link>
        )}

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
                {!(isMine && b.id === MY_BAND_ID) && (
                  <button className={`follow-pill${following ? ' on' : ''}`} onClick={() => { haptic(); toggle('following', b.id) }}>
                    {following ? 'FOLLOWING' : 'FOLLOW'}
                  </button>
                )}
                <GlassLink to={`/band/${b.id}`} label={`Open ${b.name}`} size={30} />
              </div>
            )
          })}
        </div>

        {tiers.length > 1 && (
          <>
            <h2 className="sub-h">Tickets</h2>
            <div className="list-card">
              {tiers.map(t => (
                <div key={t.tier.id} className="tier-row">
                  <div className="grow"><b>{t.tier.name}</b>{t.tier.note && <div className="muted small">{t.tier.note}</div>}</div>
                  <div className="right"><b>{t.tier.price ? money(t.tier.price) : 'FREE'}</b><div className={`small ${t.left <= 0 ? 'muted' : t.left <= 15 ? 'urgent' : 'muted'}`}>{t.left <= 0 ? 'Sold out' : `${t.left} left`}</div></div>
                </div>
              ))}
            </div>
          </>
        )}

        {(show.announcements?.length ?? 0) > 0 && (
          <>
            <h2 className="sub-h">Updates from the band</h2>
            {show.announcements!.slice().reverse().map((a, i) => <div key={i} className="announcement">{a.text}</div>)}
          </>
        )}

        <h2 className="sub-h">More Info</h2>
        <p className="show-bio">{show.description || bands[0]?.bio}</p>
        <div className="info-grid">
          <div><span className="muted small">Address</span><b>{v.address}{v.city ? `, ${v.city}` : ''}</b></div>
          <div><span className="muted small">Ages</span><b>{v.ages}</b></div>
          <div><span className="muted small">Capacity</span><b>{tiers.reduce((n, t) => n + t.tier.qty, 0)}</b></div>
          <div><span className="muted small">Friends going</span><b>{show.plugging}</b></div>
        </div>
        <a className="maps-link" href={`https://maps.apple.com/?q=${encodeURIComponent(`${v.name}, ${v.address}, ${v.city}`)}`} target="_blank" rel="noreferrer"><Pin size={16} /> Open in Maps</a>
      </div>

      {!past && (
        <div className="ticket-bar">
          {isMine ? (
            <button onClick={() => nav(show.createdByMe ? `/host/${show.id}` : '/gigs?tab=shows')}>MANAGE GIG</button>
          ) : show.salesPaused ? (
            <button disabled>SALES PAUSED</button>
          ) : soldOut ? (
            <button disabled>SOLD OUT</button>
          ) : (
            <button onClick={() => nav(`/show/${show.id}/tickets`)}>{myTickets.length ? 'GET MORE TICKETS' : 'GET TICKETS'}</button>
          )}
        </div>
      )}

      <Sheet open={sheet === 'friends'} onClose={() => setSheet(null)} title="Who’s Plugging In">
        {plugging.length ? (
          <div className="friend-list">
            {plugging.map(f => (
              <div key={f.id} className="row gap center-v">
                <Avatar name={f.name} hue={f.hue} size={44} />
                <div className="grow"><b>{f.name}</b><div className="muted small">{f.handle} · Going</div></div>
                {(() => {
                  const rel = state.friends.find(x => x.id === f.id)
                  if (rel?.status === 'friends') return <span className="friend-state">Friends</span>
                  if (rel?.status === 'requested') return <span className="friend-state muted">Requested</span>
                  return <button className="add-friend" onClick={() => { requestFriend(f.id); haptic(); toast(`Friend request sent to ${f.name}`) }}>Add friend</button>
                })()}
              </div>
            ))}
          </div>
        ) : <p className="muted">No one has plugged in yet. Share it and be the first!</p>}
        <p className="muted small">You’re friends once they accept your request.</p>
      </Sheet>
    </div>
  )
}
