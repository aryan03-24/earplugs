import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Avatar, Chip, GlassButton, Logo, Poster, Screen, SectionHeader } from '../components/ui'
import { ChevronRight, Pin, Plus, User } from '../components/icons'
import { BANDS, GENRES, SHOWS, bandById, isPast } from '../data'
import { toast, useStore } from '../store'
import { resizeImage } from './Setup'

export default function Profile() {
  const nav = useNavigate()
  const { state, updateProfile, addMedia, reset } = useStore()
  const p = state.profile
  const [editing, setEditing] = useState(false)
  const [tab, setTab] = useState<'fan' | 'artist'>(p.role === 'musician' ? 'artist' : 'fan')

  const name = [p.firstName, p.lastName].filter(Boolean).join(' ') || 'Your Name'
  const slug = (p.firstName + (p.lastName ? '.' + p.lastName : '')).toLowerCase().replace(/[^a-z.]/g, '')
  const handle = '@' + (slug || 'you')
  const attended = SHOWS.filter(s => state.tickets.includes(s.id) && isPast(s)).length + 20
  const topBands = state.following.length ? state.following.map(id => bandById(id)!).filter(Boolean) : BANDS.slice(0, 2)
  const saved = SHOWS.filter(s => state.saved.includes(s.id))
  const tickets = SHOWS.filter(s => state.tickets.includes(s.id))

  return (
    <Screen tabs>
      <div className="row between pad-x top-bar">
        <Logo size={42} />
        {p.role === 'musician' && (
          <div className="segmented">
            <button className={tab === 'fan' ? 'on' : ''} onClick={() => setTab('fan')}>Fan</button>
            <button className={tab === 'artist' ? 'on' : ''} onClick={() => { setTab('artist'); nav('/band/sobo') }}>Artist</button>
          </div>
        )}
      </div>

      <div className="profile-head pad-x">
        <label className="profile-photo">
          {p.photo ? <img src={p.photo} alt="" /> : <User size={56} />}
          <input type="file" accept="image/*" hidden onChange={async e => {
            const f = e.target.files?.[0]; if (f) updateProfile({ photo: await resizeImage(f, 400) })
          }} />
        </label>
        <div className="grow">
          {editing ? (
            <div className="stack-sm">
              <input className="inline-input" value={p.firstName} placeholder="First name" onChange={e => updateProfile({ firstName: e.target.value })} />
              <input className="inline-input" value={p.lastName} placeholder="Last name" onChange={e => updateProfile({ lastName: e.target.value })} />
              <input className="inline-input" value={p.homeBase} placeholder="Home base" onChange={e => updateProfile({ homeBase: e.target.value })} />
            </div>
          ) : (
            <>
              <h1 className="profile-name">{name}</h1>
              <div className="muted">{handle}</div>
              <div className="row gap-sm center-v small"><Pin size={16} />{p.homeBase || 'Berkeley, CA'}</div>
              <div className="small">{state.following.length} Following • 0 Friends</div>
            </>
          )}
        </div>
        <button className="link" onClick={() => setEditing(e => !e)}>{editing ? 'Done' : 'Edit'}</button>
      </div>

      <div className="stat-cards pad-x">
        <div className="stat-card"><b>{attended}</b><span>Shows Attended</span></div>
        <div className="stat-card"><b>{state.following.length + 40}</b><span>Bands Plugged</span></div>
        <div className="stat-card"><b>13</b><span>Venues Visited</span></div>
      </div>

      <SectionHeader title="My Top Genres" />
      <div className="chip-row wrap pad-x">
        {editing
          ? GENRES.map(g => {
              const on = p.genres.includes(g)
              return <Chip key={g} active={on} onClick={() => updateProfile({ genres: on ? p.genres.filter(x => x !== g) : [...p.genres, g] })}>{g}</Chip>
            })
          : (p.genres.length ? p.genres : ['Indie', 'Alternative']).map(g => <Chip key={g} blue>{g}</Chip>)}
      </div>

      <SectionHeader title="My Top Bands" />
      <div className="top-bands pad-x">
        {topBands.slice(0, 4).map((b, i) => (
          <Link key={b.id} to={`/band/${b.id}`} className="row gap-sm center-v">
            <Avatar band={b} />
            <div><div className="band-name">{b.name}</div><div className="muted small">#{i + 1}</div></div>
          </Link>
        ))}
      </div>

      <div className="section-header">
        <h2>My Media</h2>
        <div className="row gap-sm">
          <label className="glass-btn" style={{ width: 32, height: 32 }} aria-label="Add media">
            <Plus size={16} />
            <input type="file" accept="image/*" hidden onChange={async e => {
              const f = e.target.files?.[0]; if (f) { addMedia(await resizeImage(f, 900)); toast('Added to My Media') }
            }} />
          </label>
        </div>
      </div>
      <div className="carousel">
        {state.media.length ? state.media.map((m, i) => <div key={i} className="media-tile"><Poster hue={0} photo={m} /></div>)
          : <p className="empty">Add photos from shows you’ve been to.</p>}
      </div>

      <div className="two-col pad-x">
        <div>
          <div className="row between center-v"><h2 className="sub-h">My Saved</h2>
            <Link to="/gigs?list=saved" className="glass-btn" style={{ width: 28, height: 28 }} aria-label="All saved"><ChevronRight size={16} /></Link></div>
          {saved[0] ? <Link to={`/show/${saved[0].id}`}><Poster hue={saved[0].hue} label={saved[0].title} className="tile" /></Link> : <div className="tile empty-tile">Nothing saved</div>}
        </div>
        <div>
          <div className="row between center-v"><h2 className="sub-h">My Tickets</h2>
            <Link to="/gigs?list=tickets" className="glass-btn" style={{ width: 28, height: 28 }} aria-label="All tickets"><ChevronRight size={16} /></Link></div>
          {tickets[0] ? <Link to={`/show/${tickets[0].id}`}><Poster hue={tickets[0].hue} label={tickets[0].title} className="tile" /></Link> : <div className="tile empty-tile">No tickets yet</div>}
        </div>
      </div>

      <div className="pad-x" style={{ marginTop: 32 }}>
        <GlassButton className="wide-glass" size={44} onClick={() => { reset(); nav('/', { replace: true }) }}>Sign out & reset demo</GlassButton>
      </div>
    </Screen>
  )
}
