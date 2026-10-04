import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BackButton, Chip, GlassButton, Poster } from '../../components/ui'
import { ArrowUp, Download, Play, Star, Target, Up } from '../../components/icons'
import { FAN_CITIES, KEY_STATS, RECENT_SHOWS, SERIES } from '../../data/analytics'
import { useCatalog } from '../../state/catalog'
import { avatarGradient } from '../../lib/format'
import { share, toast, uid } from '../../lib/native'
import { useStore } from '../../state/store'

/** Pitch Report – Band → Venue. "Send to venue" files a real application in Bookings. */
export default function Pitch() {
  const nav = useNavigate()
  const cat = useCatalog()
  const { state, submitApplication } = useStore()
  const band = cat.myBand!
  const [venueId, setVenueId] = useState('bottom')
  const [picking, setPicking] = useState(false)
  const venue = cat.venue(venueId)
  const stats = KEY_STATS['30D']
  const max = Math.max(...SERIES.map(d => d.attendance))
  const short = venue.city === 'San Francisco' ? 'SF' : venue.city
  const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const media = band.media.length ? band.media : []

  const send = () => {
    const start = new Date(Date.now() + 35 * 86400e3)
    const end = new Date(start.getTime() + 2 * 86400e3)
    submitApplication({
      id: uid('app'), venueId, createdAt: new Date().toISOString(), actName: band.name, email: '', members: state.profile.members,
      targetStart: start.toISOString().slice(0, 10), targetEnd: end.toISOString().slice(0, 10), website: '', draw: '90–110',
      soundsLike: '', videos: [], genres: band.genres, lastShows: RECENT_SHOWS.slice(0, 3).map(s => `${s.venue} (${s.attended})`).join(', '), bill: '',
      messages: [{ from: 'me', text: `Pitch report attached: avg. attendance ${stats.attendance}, show-up ${stats.showUp}%, $${stats.avgTicket} avg ticket.`, at: new Date().toISOString() }],
    })
    toast(`Sent to ${venue.name}`)
    nav('/bookings')
  }

  return (
    <div className="screen pitch">
      <div className="row between center-v pad-x top-bar">
        <BackButton to="/analytics" />
        <div className="center">
          <b>Pitch Report</b>
          <div className="muted small">Generated {today}</div>
        </div>
        <GlassButton size={36} className="white" aria-label="Share" onClick={() => share(`${band.name} pitch`, `${band.name} pitch report for ${venue.name}`)}><ArrowUp /></GlassButton>
      </div>

      <div className="pad-x">
        <div className="prepared">
          <Poster hue={venue.hue} className="prep-thumb" />
          <div className="grow"><small className="muted">PREPARED FOR</small><div>{venue.name}, {short}</div></div>
          <button className="small-pill" onClick={() => setPicking(p => !p)}>{picking ? 'Done' : 'Edit'}</button>
        </div>
        {picking && (
          <div className="list-card">
            {cat.venues.map(v => (
              <button key={v.id} className={`list-item${v.id === venueId ? ' selected' : ''}`} onClick={() => { setVenueId(v.id); setPicking(false) }}>
                <b>{v.name}</b><span className="muted small">{v.city}</span>
              </button>
            ))}
          </div>
        )}

        <div className="band-head compact">
          <div className="band-avatar" style={band.photo ? { backgroundImage: `url(${band.photo})` } : { background: avatarGradient(band.hue) }} />
          <h1>{band.name}</h1>
          <div className="meta">{band.city} • {band.followers} Followers</div>
          {band.tagline && <div className="tagline">{band.tagline}</div>}
          <div className="chip-row center-h">{band.genres.map(g => <Chip key={g} blue>{g}</Chip>)}</div>
        </div>

        <h2 className="sub-h">Overview</h2>
        <div className="overview">
          <div><b>{stats.attendance}</b><span>Avg.<br />Attendance</span></div>
          <div><b>{stats.showUp}%</b><span>Show-up<br />Rate</span></div>
          <div><b>${stats.avgTicket}</b><span>Avg.<br />Ticket</span></div>
        </div>

        <h2 className="sub-h">Why book {band.name}</h2>
        <div className="list-card why">
          <div><span className="why-ic"><Up size={12} /></span><div><b>Growing draw</b><div className="muted small">Attendance up {stats.attendDelta}% over the last 30 days</div></div></div>
          <div><span className="why-ic"><Star /></span><div><b>Fans come back</b><div className="muted small">{stats.repeat}% of attendees have seen {band.name} 2+ times</div></div></div>
          <div><span className="why-ic"><Target /></span><div><b>Already pulling {short} fans</b><div className="muted small">98 {short} fans attended their last {short} show</div></div></div>
        </div>

        <h2 className="sub-h">Attendance by show</h2>
        <div className="bar-chart">
          {SERIES.map((d, i) => (
            <div key={d.label} className="bar-col">
              <span>{d.attendance}</span>
              <div className={i === SERIES.length - 1 ? 'b on' : 'b'} style={{ height: `${(d.attendance / max) * 110}px` }} />
              <small>{d.label}</small>
            </div>
          ))}
        </div>

        <h2 className="sub-h">Where the fans are</h2>
        {FAN_CITIES.map(c => (
          <div key={c.name} className="fan-city">
            <div className="row between"><b>{c.name}</b><span className="muted">{c.pct}% of fans</span></div>
            <div className="bar"><div style={{ width: `${c.pct * 1.6}%` }} /></div>
          </div>
        ))}

        <h2 className="sub-h">Venues played</h2>
        <div className="list-card">
          {RECENT_SHOWS.slice(0, 3).map((p, i) => (
            <div key={p.day} className="recent-row">
              <Poster hue={200 + i * 20} className="prep-thumb" />
              <div className="grow"><b>{p.venue}</b><div className="muted small">{p.city} · {p.month[0]}{p.month.slice(1).toLowerCase()} {p.day}</div></div>
              <div className="center"><b className="big">{p.attended}</b><div className="muted small">attended</div></div>
            </div>
          ))}
        </div>

        <h2 className="sub-h">What we sound like</h2>
        {media.length ? (
          <div className="two-col flush">
            {media.slice(0, 2).map((p, i) => (
              <button key={i} className="media-tile wide" onClick={() => toast('Playing clip…')}><Poster hue={0} photo={p}><span className="play-dot"><Play size={14} /></span></Poster></button>
            ))}
          </div>
        ) : <p className="muted small">Add clips on your band profile to include them here.</p>}

        <h2 className="sub-h">The ask</h2>
        <div className="ask">
          <div><span>Preferred dates</span><b>Fri/Sat, next 6 weeks</b></div>
          <div><span>Expected draw</span><b>90–110 fans</b></div>
          <div><span>Suggested ticket</span><b>$10 · we promote on EarPlug</b></div>
        </div>

        <button className="primary-btn" onClick={send}>Send to venue</button>
        <button className="secondary-btn" onClick={() => window.print()}><Download /> Download PDF</button>
        <p className="muted small center">Stats verified by EarPlug ticket check-ins</p>
      </div>
    </div>
  )
}
