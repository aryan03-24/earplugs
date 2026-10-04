import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Carousel, Chip, Empty, Field, GlassLink, Logo, Poster, Screen, Sheet } from '../../components/ui'
import { Chart, ChevronRight, Edit, Pin, Plus, Trash, User } from '../../components/icons'
import { GENRES } from '../../data/seed'
import { KEY_STATS } from '../../data/analytics'
import { MY_BAND_ID, useCatalog } from '../../state/catalog'
import { useStore } from '../../state/store'
import { avatarGradient, formatDate, isPastDate } from '../../lib/format'
import { resizeImage, toast } from '../../lib/native'
import { SettingsSheet } from '../account/SettingsSheet'

/** Artist Profile from the Figma: the musician's own band page, editable in place. */
export default function ArtistProfile({ toggle }: { toggle: ReactNode }) {
  const cat = useCatalog()
  const { state, updateBand, updateProfile } = useStore()
  const band = cat.myBand!
  const p = state.profile
  const [sheet, setSheet] = useState<'edit' | 'genres' | 'settings' | null>(null)
  const [editingMedia, setEditingMedia] = useState(false)
  const shows = cat.showsFor(MY_BAND_ID)
  const upcoming = shows.filter(s => !isPastDate(s.date))
  const past = shows.filter(s => isPastDate(s.date)).reverse()
  const stats = KEY_STATS['30D']
  const handle = '@' + (p.username || band.name.toLowerCase().replace(/[^a-z0-9]/g, '') + '.band')

  const addTo = async (f: File | undefined, where: 'media') => {
    if (!f) return
    const url = await resizeImage(f, 1000)
    if (where === 'media') updateBand({ media: [url, ...state.band.media] })
    toast('Added')
  }

  return (
    <Screen tabs>
      <div className="row between center-v pad-x top-bar">
        <Logo />
        {toggle}
      </div>

      <div className="profile-head pad-x">
        <label className="profile-photo" aria-label="Change band photo" style={band.photo ? undefined : { background: avatarGradient(band.hue) }}>
          {band.photo ? <img src={band.photo} alt="" /> : <User size={52} />}
          <input type="file" accept="image/*" hidden onChange={async e => { const f = e.target.files?.[0]; if (f) updateProfile({ photo: await resizeImage(f, 500) }) }} />
        </label>
        <div className="grow min0">
          <div className="row gap-sm center-v">
            <h1 className="profile-name">{band.name}</h1>
            {p.members && <span className="members"><User size={14} />{p.members}</span>}
          </div>
          <div className="row gap-sm center-v">
            <span className="muted small">{handle}</span>
            <button className="edit-pill" onClick={() => setSheet('edit')}>Edit</button>
          </div>
          <div className="row gap-sm center-v small meta-line">
            <span className="row center-v"><Pin size={14} />{band.city}</span>
            <span><b>{band.followers}</b> Followers</span>
          </div>
        </div>
      </div>

      <div className="chip-row wrap">
        {band.genres.map(g => <Chip key={g} blue>{g}</Chip>)}
        <button className="chip add-chip" aria-label="Edit genres" onClick={() => setSheet('genres')}><Plus size={14} /></button>
      </div>
      {band.tagline && <p className="pad-x tagline left">{band.tagline}</p>}

      <Link to="/analytics" className="analytics-card">
        <div className="row between center-v">
          <b className="row gap-sm center-v"><Chart size={18} /> {band.name}’s Analytics</b>
          <ChevronRight size={16} />
        </div>
        <div className="analytics-mini">
          <div><b>{stats.attendance}</b><span>Avg. attendance</span></div>
          <div><b>{stats.showUp}%</b><span>Show-up rate</span></div>
          <div><b>{stats.newFans}</b><span>New fans</span></div>
        </div>
      </Link>

      <div className="block-title row between center-v">
        <span>What We Sound Like</span>
        <div className="row gap-sm">
          {state.band.media.length > 0 && <button className="glass-btn" style={{ width: 28, height: 28 }} aria-label="Edit media" aria-pressed={editingMedia} onClick={() => setEditingMedia(e => !e)}><Edit size={13} /></button>}
          <label className="glass-btn" style={{ width: 28, height: 28 }} aria-label="Add media">
            <Plus size={14} /><input type="file" accept="image/*" hidden onChange={e => addTo(e.target.files?.[0], 'media')} />
          </label>
        </div>
      </div>
      {state.band.media.length ? (
        <Carousel>
          {state.band.media.map((m, i) => (
            <div key={i} className="media-tile wide">
              <Poster hue={band.hue} photo={m}>
                {editingMedia && (
                  <button className="media-remove" aria-label="Remove" onClick={() => updateBand({ media: state.band.media.filter((_, j) => j !== i) })}><Trash size={14} /></button>
                )}
              </Poster>
            </div>
          ))}
        </Carousel>
      ) : (
        <label className="media-empty pad-x-in">
          <Plus size={22} /><span>Add photos or clips so fans and venues can hear you</span>
          <input type="file" accept="image/*" hidden onChange={e => addTo(e.target.files?.[0], 'media')} />
        </label>
      )}

      <div className="block-title row between center-v">
        <span>Upcoming Shows</span>
        <GlassLink to="/gigs?tab=shows" label="My shows" size={26} />
      </div>
      {upcoming.length ? (
        <Carousel>{upcoming.map(s => (
          <Link key={s.id} to={s.createdByMe ? `/host/${s.id}` : `/show/${s.id}`} className="media-tile">
            <Poster hue={s.hue} photo={s.poster} label={formatDate(s.date, { month: 'short', day: 'numeric' })} />
          </Link>
        ))}</Carousel>
      ) : <Empty>No upcoming shows. <Link to="/host/new" className="link">Create one</Link></Empty>}

      <div className="block-title row between center-v">
        <span>Fan Media</span>
        <GlassLink to={`/band/${MY_BAND_ID}`} label="Public page" size={26} />
      </div>
      <Empty>Photos fans tag {band.name} in will show up here.</Empty>

      <div className="block-title"><span>Past Shows</span></div>
      {past.length ? (
        <Carousel>{past.map(s => <div key={s.id} className="media-tile"><Poster hue={s.hue} photo={s.poster} label={formatDate(s.date, { month: 'short', day: 'numeric' })} /></div>)}</Carousel>
      ) : <Empty>Your past EarPlug shows will show up here.</Empty>}

      <div className="pad-x">
        <Link to={`/band/${MY_BAND_ID}`} className="secondary-btn">View public page</Link>
        <button className="secondary-btn" onClick={() => setSheet('settings')}>Settings</button>
      </div>

      <Sheet open={sheet === 'edit'} onClose={() => setSheet(null)} title="Edit band profile">
        <Field label="Band name" value={p.artistName} onChange={v => updateProfile({ artistName: v })} />
        <Field label="Username" value={p.username} onChange={v => updateProfile({ username: v.toLowerCase().replace(/[^a-z0-9._]/g, '') })} />
        <div className="row gap">
          <div className="grow"><Field label="Home base" value={p.homeBase} onChange={v => updateProfile({ homeBase: v })} /></div>
          <div style={{ width: 110 }}><Field label="Members" inputMode="numeric" value={p.members} onChange={v => updateProfile({ members: v.replace(/\D/g, '') })} /></div>
        </div>
        <Field label="Tagline" value={state.band.tagline} onChange={v => updateBand({ tagline: v })} placeholder="Suns Out Buns Out" />
        <Field label="Bio" multiline value={state.band.bio} onChange={v => updateBand({ bio: v })} placeholder="Who you are, who plays what." />
        <button className="primary-btn" onClick={() => { setSheet(null); toast('Profile updated') }}>Done</button>
      </Sheet>

      <Sheet open={sheet === 'genres'} onClose={() => setSheet(null)} title="Genres">
        <div className="chip-row wrap flush">
          {GENRES.filter(g => g !== 'A little of everything').map(g => {
            const on = p.genres.includes(g)
            return <Chip key={g} active={on} onClick={() => updateProfile({ genres: on ? p.genres.filter(x => x !== g) : [...p.genres, g] })}>{g}</Chip>
          })}
        </div>
        <button className="primary-btn" onClick={() => setSheet(null)}>Done</button>
      </Sheet>

      <SettingsSheet open={sheet === 'settings'} onClose={() => setSheet(null)} />
    </Screen>
  )
}
