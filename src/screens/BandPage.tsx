import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { BackButton, Carousel, Chip, GlassButton, Logo, Poster, SectionHeader } from '../components/ui'
import { Pin, Play, Share } from '../components/icons'
import { bandById, isPast, SHOWS, formatDate } from '../data'
import { share, toast, useStore } from '../store'

export default function BandPage() {
  const { id } = useParams()
  const { state, toggle } = useStore()
  const [playing, setPlaying] = useState(false)
  const band = bandById(id ?? '')
  if (!band) return <Navigate to="/explore" replace />

  const following = state.following.includes(band.id)
  const shows = SHOWS.filter(s => s.bandIds.includes(band.id))
  const up = shows.filter(s => !isPast(s))
  const past = shows.filter(isPast)

  return (
    <div className="screen band-page">
      <div className="row between pad-x top-bar">
        <Logo size={42} />
        <div className="row gap-sm">
          <GlassButton aria-label="Share" onClick={() => share(band.name, `Check out ${band.name} on EarPlug`)}><Share size={18} /></GlassButton>
          <BackButton />
        </div>
      </div>

      <div className="band-head">
        <div className="band-avatar" style={band.photos[0] ? { backgroundImage: `url(${band.photos[0]})` } : { background: `linear-gradient(135deg, hsl(${band.hue} 80% 60%), hsl(${(band.hue + 40) % 360} 70% 35%))` }} />
        <h1>{band.name}</h1>
        <div className="row gap-sm center-v center-h meta">
          <Pin size={18} />{band.city}<span className="dot-sep">•</span><b>{band.followers + (following ? 1 : 0)}</b> Followers
        </div>
        <div className="tagline">{band.tagline}</div>
        <div className="row gap-sm center-h">
          <button className={`pill-btn${following ? ' ghost' : ''}`} onClick={() => { toggle('following', band.id); toast(following ? `Unfollowed ${band.name}` : `Following ${band.name}`) }}>
            {following ? '✓ Following' : '+ Follow'}
          </button>
          <button className="pill-btn ghost" onClick={() => { setPlaying(p => !p); toast(playing ? 'Paused' : `Streaming ${band.name}`) }}>
            <Play size={14} /> {playing ? 'Pause' : 'Stream'}
          </button>
        </div>
      </div>

      <div className="pad-x chip-row">{band.genres.map(g => <Chip key={g} blue>{g}</Chip>)}</div>

      <SectionHeader title="What We Sound Like" />
      <Carousel>
        {(band.photos.length ? band.photos : [null, null]).map((p, i) => (
          <button key={i} className="media-tile wide" onClick={() => toast('Playing clip…')} aria-label="Play clip">
            <Poster hue={band.hue + i * 30} photo={p ?? undefined}><span className="play-dot"><Play size={14} /></span></Poster>
          </button>
        ))}
      </Carousel>

      <SectionHeader title="Upcoming Shows" />
      {up.length ? (
        <Carousel>{up.map(s => (
          <Link key={s.id} to={`/show/${s.id}`} className="media-tile">
            <Poster hue={s.hue} label={formatDate(s.date, { month: 'short', day: 'numeric' })} />
          </Link>
        ))}</Carousel>
      ) : <p className="empty">No upcoming shows yet.</p>}

      <SectionHeader title="Fan Media" />
      <Carousel>
        {band.photos.length
          ? band.photos.slice().reverse().map((p, i) => <div key={i} className="media-tile"><Poster hue={band.hue} photo={p} /></div>)
          : <p className="empty">No fan media yet.</p>}
      </Carousel>

      <SectionHeader title="Past Shows" />
      {past.length ? (
        <Carousel>{past.map(s => (
          <div key={s.id} className="media-tile"><Poster hue={s.hue} label={formatDate(s.date, { month: 'short', day: 'numeric' })} /></div>
        ))}</Carousel>
      ) : <p className="empty">No past shows on EarPlug yet.</p>}
      <div style={{ height: 32 }} />
    </div>
  )
}
