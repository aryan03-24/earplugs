import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { CloseButton, Carousel, Chip, Empty, Field, GlassButton, Logo, Poster, SectionHeader, Sheet } from '../../components/ui'
import { Edit, Pin, Play, Plus, Share } from '../../components/icons'
import { allFanMedia, MY_BAND_ID, useCatalog } from '../../state/catalog'
import { MediaTile } from '../../components/cards'
import { useStore } from '../../state/store'
import { avatarGradient, formatDate, isPastDate } from '../../lib/format'
import { haptic, resizeImage, share, toast } from '../../lib/native'

/** Band profile (fan POV). When it's the musician's own band, editing controls appear. */
export default function BandPage() {
  const { id } = useParams()
  const cat = useCatalog()
  const { state, toggle, updateBand, updateProfile } = useStore()
  const [playing, setPlaying] = useState(false)
  const [editing, setEditing] = useState(false)
  const band = cat.band(id ?? '')
  if (!band) return <Navigate to="/explore" replace />

  const mine = band.id === MY_BAND_ID
  const following = state.following.includes(band.id)
  const shows = cat.showsFor(band.id)
  const upcoming = shows.filter(s => !isPastDate(s.date))
  const past = shows.filter(s => isPastDate(s.date) || state.media.some(m => m.showId === s.id)).reverse()
  // Fan photos/videos tagged to any of this band's gigs.
  const fanMedia = allFanMedia(state).filter(m => m.showId && shows.some(s => s.id === m.showId))

  const addMedia = async (f?: File) => {
    if (!f) return
    updateBand({ media: [await resizeImage(f, 1000), ...state.band.media] })
    toast('Added to What We Sound Like')
  }

  return (
    <div className="screen band-page">
      <div className="row between pad-x top-bar">
        <Logo />
        <div className="row gap-sm">
          <GlassButton aria-label="Share" onClick={() => share(band.name, `Check out ${band.name} on EarPlug`)}><Share size={18} /></GlassButton>
          <CloseButton />
        </div>
      </div>

      <div className="band-head">
        <div className="band-avatar" style={band.photo ? { backgroundImage: `url(${band.photo})` } : { background: avatarGradient(band.hue) }} />
        <h1>{band.name}</h1>
        <div className="row gap-sm center-v center-h meta">
          <Pin size={18} />{band.city}<span className="dot-sep">•</span><b>{band.followers + (following && !mine ? 1 : 0)}</b> Followers
        </div>
        {band.tagline && <div className="tagline">{band.tagline}</div>}
        <div className="row gap-sm center-h">
          {mine ? (
            <button className="pill-btn" onClick={() => setEditing(true)}><Edit size={13} /> Edit Profile</button>
          ) : (
            <button className={`pill-btn${following ? ' ghost' : ''}`} onClick={() => { haptic(); toggle('following', band.id); toast(following ? `Unfollowed ${band.name}` : `Following ${band.name}`) }}>
              {following ? '✓ Following' : '+ Follow'}
            </button>
          )}
          <button className="pill-btn ghost" onClick={() => { setPlaying(p => !p); toast(playing ? 'Paused' : `Streaming ${band.name}`) }}>
            <Play size={14} /> {playing ? 'Pause' : 'Stream'}
          </button>
        </div>
      </div>

      <div className="pad-x chip-row">{band.genres.map(g => <Chip key={g} blue>{g}</Chip>)}</div>
      <p className="pad-x show-bio">{band.bio}</p>

      <SectionHeader title="What We Sound Like" action={mine && (
        <label className="glass-btn" style={{ width: 32, height: 32 }} aria-label="Add media">
          <Plus size={16} /><input type="file" accept="image/*" hidden onChange={e => addMedia(e.target.files?.[0])} />
        </label>
      )} />
      {band.media.length ? (
        <Carousel>
          {band.media.map((p, i) => (
            <button key={i} className="media-tile wide" onClick={() => toast('Playing clip…')} aria-label="Play clip">
              <Poster hue={band.hue} photo={p}><span className="play-dot"><Play size={14} /></span></Poster>
            </button>
          ))}
        </Carousel>
      ) : <Empty>{mine ? 'Add photos or clips so fans and venues can hear you.' : 'No clips yet.'}</Empty>}

      <SectionHeader title="Upcoming Shows" action={mine && <Link to="/host/new" className="link small">+ Host a gig</Link>} />
      {upcoming.length ? (
        <Carousel>{upcoming.map(s => (
          <Link key={s.id} to={`/show/${s.id}`} className="media-tile">
            <Poster hue={s.hue} photo={s.poster} label={formatDate(s.date, { month: 'short', day: 'numeric' })} />
          </Link>
        ))}</Carousel>
      ) : <Empty>No upcoming shows yet.</Empty>}

      <SectionHeader title="Fan Media" />
      {fanMedia.length ? (
        <Carousel>{fanMedia.map(m => <MediaTile key={m.id} media={m} caption={cat.anyShow(m.showId!)?.title} />)}</Carousel>
      ) : <Empty>No fan media yet. Fans can add photos and videos after they go to a show.</Empty>}

      <SectionHeader title="Past Shows" />
      {past.length ? (
        <div className="past-gigs pad-x">{past.map(s => {
          const media = fanMedia.filter(m => m.showId === s.id)
          return (
            <div key={s.id} className="past-gig">
              <div className="row between center-v"><b>{s.title}</b><span className="muted small">{formatDate(s.date, { month: 'short', day: 'numeric' })}</span></div>
              <div className="muted small">{cat.venue(s.venueId).name}</div>
              {media.length > 0 && <div className="past-gig-media">{media.map(m => <MediaTile key={m.id} media={m} />)}</div>}
            </div>
          )
        })}</div>
      ) : <Empty>No past shows on EarPlug yet.</Empty>}
      <div style={{ height: 32 }} />

      {mine && (
        <Sheet open={editing} onClose={() => setEditing(false)} title="Edit band profile">
          <Field label="Band name" value={state.profile.artistName} onChange={v => updateProfile({ artistName: v })} />
          <Field label="Tagline" value={state.band.tagline} onChange={v => updateBand({ tagline: v })} placeholder="Suns Out Buns Out" />
          <Field label="Bio" multiline value={state.band.bio} onChange={v => updateBand({ bio: v })} placeholder="Who you are, who plays what." />
          <Field label="Home base" value={state.profile.homeBase} onChange={v => updateProfile({ homeBase: v })} />
          <label className="secondary-btn">
            Change band photo
            <input type="file" accept="image/*" hidden onChange={async e => {
              const f = e.target.files?.[0]; if (f) updateProfile({ photo: await resizeImage(f, 500) })
            }} />
          </label>
          <button className="primary-btn" onClick={() => { setEditing(false); toast('Profile updated') }}>Done</button>
        </Sheet>
      )}
    </div>
  )
}
