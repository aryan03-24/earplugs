import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Avatar, Carousel, Chip, Empty, GlassLink, Logo, Poster, Screen, Sheet } from '../../components/ui'
import { Pin, Plus, User } from '../../components/icons'
import { GENRES } from '../../data/seed'
import { handleFor, MY_BAND_ID, useCatalog } from '../../state/catalog'
import { useStore } from '../../state/store'
import { isPastDate } from '../../lib/format'
import { resizeImage, toast, uid } from '../../lib/native'
import { MediaTile } from '../../components/cards'
import type { Band } from '../../types'
import { SettingsSheet } from '../account/SettingsSheet'
import ArtistProfile from '../musician/ArtistProfile'

/** /profile: fans see their profile; musicians get the SOBO / Me switch from the Figma. */
export default function ProfileRoute() {
  const { state } = useStore()
  const [view, setView] = useState<'band' | 'me'>('band')
  if (state.profile.role !== 'musician') return <PersonalProfile />
  const toggle = <ProfileToggle band={state.profile.artistName || 'Band'} value={view} onChange={setView} />
  return view === 'band' ? <ArtistProfile toggle={toggle} /> : <PersonalProfile toggle={toggle} />
}

export function ProfileToggle({ band, value, onChange }: { band: string; value: 'band' | 'me'; onChange: (v: 'band' | 'me') => void }) {
  return (
    <div className="mini-seg" role="tablist" aria-label="Profile">
      <button role="tab" aria-selected={value === 'band'} className={value === 'band' ? 'on' : ''} onClick={() => onChange('band')}>{band.toUpperCase().slice(0, 8)}</button>
      <button role="tab" aria-selected={value === 'me'} className={value === 'me' ? 'on' : ''} onClick={() => onChange('me')}>Me</button>
    </div>
  )
}

/** Fan Profile from the Figma (also the musician's "Me" view). */
export function PersonalProfile({ toggle }: { toggle?: ReactNode }) {
  const cat = useCatalog()
  const { state, updateProfile, addMedia, markMediaPrompted } = useStore()
  const p = state.profile
  const [editing, setEditing] = useState<'profile' | 'genres' | 'media' | null>(null)
  const [settings, setSettings] = useState(false)

  const name = [p.firstName, p.lastName].filter(Boolean).join(' ') || 'Your Name'
  const friendCount = state.friends.filter(f => f.status === 'friends').length
  const attendedShows = [...new Map(state.tickets
    .map(t => ({ t, s: cat.anyShow(t.showId) }))
    .filter(x => x.s && !x.t.transferredTo && (isPastDate(x.s.date) || state.checkins[x.s.id]?.includes(x.t.code)))
    .map(x => [x.s!.id, x.s!])).values()]
  const attachTo = async (showId: string, f?: File) => {
    if (!f) return
    const isVideo = f.type.startsWith('video/')
    if (isVideo && f.size > 3_000_000) { toast('That video is too large for the demo. Try a shorter clip.'); return }
    const url = isVideo ? await new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result as string); r.onerror = rej; r.readAsDataURL(f) }) : await resizeImage(f, 1000)
    addMedia({ id: uid('media'), url, kind: isVideo ? 'video' : 'image', showId, at: new Date().toISOString() })
    markMediaPrompted(showId)
    setEditing(null)
    toast('Added to your page and the artist’s page')
  }
  const ticketShows = state.tickets.map(t => cat.anyShow(t.showId)).filter(s => !!s)
  const attended = new Set(ticketShows.filter(s => isPastDate(s.date)).map(s => s.id)).size
  const venuesVisited = new Set(ticketShows.filter(s => isPastDate(s.date)).map(s => s.venueId)).size
  const topBands = state.following.map(id => cat.band(id)).filter((b): b is Band => !!b && b.id !== MY_BAND_ID)
  const saved = state.saved.map(id => cat.show(id)).filter(s => !!s)
  const upcomingTicket = state.tickets.find(t => { const s = cat.anyShow(t.showId); return s && !isPastDate(s.date) && !t.transferredTo })
  const ticketShow = upcomingTicket ? cat.anyShow(upcomingTicket.showId) : undefined

  return (
    <Screen tabs>
      <div className="row between center-v pad-x top-bar">
        <Logo />
        {toggle ?? <button className="link small" onClick={() => setSettings(true)}>Settings</button>}
      </div>

      <div className="profile-head pad-x">
        <label className="profile-photo" aria-label="Change photo">
          {p.photo ? <img src={p.photo} alt="" /> : <User size={52} />}
          <input type="file" accept="image/*" hidden onChange={async e => {
            const f = e.target.files?.[0]; if (f) updateProfile({ photo: await resizeImage(f, 400) })
          }} />
        </label>
        <div className="grow min0">
          <h1 className="profile-name">{name}</h1>
          <div className="row gap-sm center-v">
            <span className="muted small">{handleFor(toggle ? { ...p, username: '' } : p)}</span>
            <button className="edit-pill" onClick={() => setEditing('profile')}>Edit</button>
          </div>
          <div className="row gap-sm center-v small meta-line">
            <span className="row center-v"><Pin size={14} />{p.homeBase || 'Berkeley, CA'}</span>
            <span><b>{state.following.length}</b> Following • <b>{friendCount}</b> Friends</span>
          </div>
        </div>
      </div>

      <h2 className="block-title">My Top Genres</h2>
      <div className="chip-row wrap">
        {p.genres.map(g => <Chip key={g} blue>{g}</Chip>)}
        <button className="chip add-chip" aria-label="Edit genres" onClick={() => setEditing('genres')}><Plus size={14} /></button>
      </div>

      <div className="stat-cards pad-x">
        <div className="stat-card"><b>{attended}</b><span>Shows<br />Attended</span></div>
        <div className="stat-card"><b>{topBands.length}</b><span>Bands<br />Plugged</span></div>
        <div className="stat-card"><b>{venuesVisited}</b><span>Venues<br />Visited</span></div>
      </div>

      <h2 className="block-title">My Top Bands</h2>
      {topBands.length ? (
        <div className="top-bands pad-x">
          {topBands.slice(0, 4).map((b, i) => (
            <Link key={b.id} to={`/band/${b.id}`} className="row gap-sm center-v">
              <Avatar name={b.name} hue={b.hue} photo={b.photo} size={44} />
              <div className="band-name small-name">{b.name}</div>
              <span className="rank">#{i + 1}</span>
            </Link>
          ))}
        </div>
      ) : <Empty>Follow bands and your favorites will show up here.</Empty>}

      <div className="block-title row between center-v">
        <span>My Media</span>
        <button className="glass-btn" style={{ width: 28, height: 28 }} aria-label="Add media from a show" onClick={() => setEditing('media')}><Plus size={14} /></button>
      </div>
      {state.media.length
        ? <Carousel>{state.media.map(m => <MediaTile key={m.id} media={m} caption={m.showId ? cat.anyShow(m.showId)?.title : undefined} />)}</Carousel>
        : <Empty>After you go to a show, add a photo or video from it here.</Empty>}

      <div className="two-col pad-x">
        <div>
          <div className="row between center-v"><h2 className="block-title flush">My Saved</h2><GlassLink to="/plugged" label="All saved" size={26} /></div>
          {saved[0] ? <Link to={`/show/${saved[0].id}`}><Poster hue={saved[0].hue} label={saved[0].title} className="tile" photo={saved[0].poster ?? cat.band(saved[0].bandIds[0])?.photo} /></Link> : <div className="tile empty-tile">Nothing saved</div>}
        </div>
        <div>
          <div className="row between center-v"><h2 className="block-title flush">My Tickets</h2><GlassLink to="/tickets" label="All tickets" size={26} /></div>
          {ticketShow && upcomingTicket ? <Link to={`/tickets/${upcomingTicket.id}`}><Poster hue={ticketShow.hue} label={ticketShow.title} className="tile" photo={ticketShow.poster} /></Link> : <div className="tile empty-tile">No tickets yet</div>}
        </div>
      </div>
      {toggle && <div className="pad-x"><button className="secondary-btn" onClick={() => setSettings(true)}>Settings</button></div>}

      <Sheet open={editing === 'profile'} onClose={() => setEditing(null)} title="Edit profile">
        <div className="row gap-sm">
          <input className="inline-input" value={p.firstName} placeholder="First name" onChange={e => updateProfile({ firstName: e.target.value })} aria-label="First name" />
          <input className="inline-input" value={p.lastName} placeholder="Last name" onChange={e => updateProfile({ lastName: e.target.value })} aria-label="Last name" />
        </div>
        <input className="inline-input" value={p.username} placeholder="Username" onChange={e => updateProfile({ username: e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, '') })} aria-label="Username" />
        <input className="inline-input" value={p.homeBase} placeholder="Home base" onChange={e => updateProfile({ homeBase: e.target.value })} aria-label="Home base" />
        <button className="primary-btn" onClick={() => setEditing(null)}>Done</button>
      </Sheet>

      <Sheet open={editing === 'genres'} onClose={() => setEditing(null)} title="My Top Genres">
        <div className="chip-row wrap flush">
          {GENRES.map(g => {
            const on = p.genres.includes(g)
            return <Chip key={g} active={on} onClick={() => updateProfile({ genres: on ? p.genres.filter(x => x !== g) : [...p.genres, g] })}>{g}</Chip>
          })}
        </div>
        <button className="primary-btn" onClick={() => setEditing(null)}>Done</button>
      </Sheet>

      <Sheet open={editing === 'media'} onClose={() => setEditing(null)} title="Add media from a show">
        {attendedShows.length ? (
          <div className="menu-list">
            {attendedShows.map(s => (
              <label key={s.id} className="attach-row">
                <span className="grow"><b>{s.title}</b><span className="muted small block">{cat.venue(s.venueId).name}</span></span>
                <span className="small-pill">Choose</span>
                <input type="file" accept="image/*,video/*" hidden onChange={e => attachTo(s.id, e.target.files?.[0])} />
              </label>
            ))}
          </div>
        ) : <p className="muted">Once you’ve been to a show, you can add photos and videos from it here.</p>}
      </Sheet>

      <SettingsSheet open={settings} onClose={() => setSettings(false)} />
    </Screen>
  )
}
