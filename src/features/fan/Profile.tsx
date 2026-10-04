import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Avatar, Carousel, Chip, Empty, GlassLink, Logo, Poster, Screen, SectionHeader, Segmented, Sheet } from '../../components/ui'
import { Pin, Plus, User } from '../../components/icons'
import { GENRES } from '../../data/seed'
import { MY_BAND_ID, useCatalog } from '../../state/catalog'
import { useStore } from '../../state/store'
import type { Band } from '../../types'
import { isPastDate } from '../../lib/format'
import { resizeImage, toast } from '../../lib/native'

/** Fan profile from the Figma. Musicians see a Fan / Artist switch at the top. */
export default function Profile() {
  const nav = useNavigate()
  const cat = useCatalog()
  const { state, updateProfile, addMedia, reset, switchRole } = useStore()
  const p = state.profile
  const [editing, setEditing] = useState(false)
  const [settings, setSettings] = useState(false)

  const name = [p.firstName, p.lastName].filter(Boolean).join(' ') || 'Your Name'
  const slug = (p.firstName + (p.lastName ? '.' + p.lastName : '')).toLowerCase().replace(/[^a-z.]/g, '')
  const ticketShows = state.tickets.map(t => cat.show(t.showId)).filter(s => !!s)
  const attended = ticketShows.filter(s => isPastDate(s.date)).length
  const venuesVisited = new Set(ticketShows.filter(s => isPastDate(s.date)).map(s => s.venueId)).size
  const topBands = state.following.map(id => cat.band(id)).filter((b): b is Band => !!b && b.id !== MY_BAND_ID)
  const saved = state.saved.map(id => cat.show(id)).filter(s => !!s)
  const upcomingTickets = ticketShows.filter(s => !isPastDate(s.date))

  return (
    <Screen tabs>
      <div className="row between center-v pad-x top-bar">
        <Logo />
        {p.role === 'musician'
          ? <Segmented options={['Fan', 'Artist'] as const} value="Fan" onChange={v => v === 'Artist' && nav(`/band/${MY_BAND_ID}`)} />
          : <button className="link" onClick={() => setSettings(true)}>Settings</button>}
      </div>

      <div className="profile-head pad-x">
        <label className="profile-photo" aria-label="Change photo">
          {p.photo ? <img src={p.photo} alt="" /> : <User size={56} />}
          <input type="file" accept="image/*" hidden onChange={async e => {
            const f = e.target.files?.[0]; if (f) updateProfile({ photo: await resizeImage(f, 400) })
          }} />
        </label>
        <div className="grow min0">
          <h1 className="profile-name">{name}</h1>
          <div className="muted">@{slug || 'you'}</div>
          <div className="row gap-sm center-v small"><Pin size={16} />{p.homeBase || 'Berkeley, CA'}</div>
          <div className="small">{state.following.length} Following • 0 Friends</div>
        </div>
        <button className="link" onClick={() => setEditing(true)}>Edit</button>
      </div>

      <div className="stat-cards pad-x">
        <div className="stat-card"><b>{attended}</b><span>Shows Attended</span></div>
        <div className="stat-card"><b>{topBands.length}</b><span>Bands Plugged</span></div>
        <div className="stat-card"><b>{venuesVisited}</b><span>Venues Visited</span></div>
      </div>

      <SectionHeader title="My Top Genres" />
      <div className="chip-row wrap">
        {p.genres.length ? p.genres.map(g => <Chip key={g} blue>{g}</Chip>) : <Empty>Pick genres in Edit.</Empty>}
      </div>

      <SectionHeader title="My Top Bands" />
      {topBands.length ? (
        <div className="top-bands pad-x">
          {topBands.slice(0, 4).map((b, i) => (
            <Link key={b.id} to={`/band/${b.id}`} className="row gap-sm center-v">
              <Avatar name={b.name} hue={b.hue} photo={b.photo} />
              <div><div className="band-name">{b.name}</div><div className="muted small">#{i + 1}</div></div>
            </Link>
          ))}
        </div>
      ) : <Empty>Follow bands and your favorites will show up here.</Empty>}

      <SectionHeader title="My Media" action={
        <label className="glass-btn" style={{ width: 32, height: 32 }} aria-label="Add media">
          <Plus size={16} />
          <input type="file" accept="image/*" hidden onChange={async e => {
            const f = e.target.files?.[0]; if (f) { addMedia(await resizeImage(f, 900)); toast('Added to My Media') }
          }} />
        </label>
      } />
      {state.media.length
        ? <Carousel>{state.media.map((m, i) => <div key={i} className="media-tile"><Poster hue={0} photo={m} /></div>)}</Carousel>
        : <Empty>Add photos from shows you’ve been to.</Empty>}

      <div className="two-col pad-x">
        <div>
          <div className="row between center-v"><h2 className="sub-h">My Saved</h2><GlassLink to="/plugged" label="All saved" size={28} /></div>
          {saved[0] ? <Link to={`/show/${saved[0].id}`}><Poster hue={saved[0].hue} label={saved[0].title} className="tile" /></Link> : <div className="tile empty-tile">Nothing saved</div>}
        </div>
        <div>
          <div className="row between center-v"><h2 className="sub-h">My Tickets</h2><GlassLink to="/tickets" label="All tickets" size={28} /></div>
          {upcomingTickets[0] ? <Link to="/tickets"><Poster hue={upcomingTickets[0].hue} label={upcomingTickets[0].title} className="tile" /></Link> : <div className="tile empty-tile">No tickets yet</div>}
        </div>
      </div>

      {p.role === 'musician' && (
        <div className="pad-x"><button className="secondary-btn" onClick={() => setSettings(true)}>Settings</button></div>
      )}

      <Sheet open={editing} onClose={() => setEditing(false)} title="Edit profile">
        <div className="row gap-sm">
          <input className="inline-input" value={p.firstName} placeholder="First name" onChange={e => updateProfile({ firstName: e.target.value })} aria-label="First name" />
          <input className="inline-input" value={p.lastName} placeholder="Last name" onChange={e => updateProfile({ lastName: e.target.value })} aria-label="Last name" />
        </div>
        <input className="inline-input" value={p.homeBase} placeholder="Home base" onChange={e => updateProfile({ homeBase: e.target.value })} aria-label="Home base" />
        <div className="muted small">Top genres</div>
        <div className="chip-row wrap flush">
          {GENRES.map(g => {
            const on = p.genres.includes(g)
            return <Chip key={g} active={on} onClick={() => updateProfile({ genres: on ? p.genres.filter(x => x !== g) : [...p.genres, g] })}>{g}</Chip>
          })}
        </div>
        <button className="primary-btn" onClick={() => setEditing(false)}>Done</button>
      </Sheet>

      <Sheet open={settings} onClose={() => setSettings(false)} title="Settings">
        <label className="row between center-v sheet-row">
          <span>Notifications</span>
          <input type="checkbox" className="switch" checked={p.notifications} onChange={e => updateProfile({ notifications: e.target.checked })} />
        </label>
        <div className="row between sheet-row"><span>Phone</span><span className="muted">{p.phone || '—'}</span></div>
        <div className="row between sheet-row"><span>Account type</span><span className="muted">{p.role === 'musician' ? 'Musician' : 'Fan'}</span></div>
        <button className="secondary-btn" onClick={() => {
          const to = p.role === 'musician' ? 'fan' : 'musician'
          switchRole(to); setSettings(false); toast(`Now viewing as a ${to}`)
          nav(to === 'musician' ? '/analytics' : '/explore', { replace: true })
        }}>Switch to {p.role === 'musician' ? 'Fan' : 'Musician'} view (demo)</button>
        <p className="muted small">Keeps your data, so you can host a gig as a musician and buy a ticket to it as a fan.</p>
        <button className="danger-btn" onClick={() => { reset(); nav('/', { replace: true }) }}>Sign out & reset demo</button>
      </Sheet>
    </Screen>
  )
}
