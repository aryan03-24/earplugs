import { useState } from 'react'
import { BackButton, Chip, GlassButton, Poster } from '../components/ui'
import { ArrowUp, Download, Play, Star, Target, Up } from '../components/icons'
import { ATTENDANCE_SERIES, VENUES, bandById } from '../data'
import { share, toast } from '../store'

const FAN_CITIES = [
  { name: 'Berkeley', pct: 48 },
  { name: 'Oakland', pct: 27 },
  { name: 'San Francisco', pct: 25 },
]
const PLAYED = [
  { name: 'The Starry Plough', city: 'Berkeley', date: 'Sep 27', attended: 104 },
  { name: 'The New Parish', city: 'Oakland', date: 'Sep 23', attended: 95 },
  { name: 'Cornerstone', city: 'Berkeley', date: 'Sep 19', attended: 74 },
]

export default function Pitch() {
  const band = bandById('sobo')!
  const [venueId, setVenueId] = useState('bottom')
  const [picking, setPicking] = useState(false)
  const [sent, setSent] = useState(false)
  const venue = VENUES.find(v => v.id === venueId)!
  const max = Math.max(...ATTENDANCE_SERIES.map(d => d.value))
  const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

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
          <Poster hue={210} className="prep-thumb" />
          <div className="grow"><small className="muted">PREPARED FOR</small><div>{venue.name}, {venue.city === 'San Francisco' ? 'SF' : venue.city}</div></div>
          <button className="small-pill" onClick={() => setPicking(p => !p)}>{picking ? 'Done' : 'Edit'}</button>
        </div>
        {picking && (
          <div className="list-card">
            {VENUES.map(v => (
              <button key={v.id} className={`list-item${v.id === venueId ? ' selected' : ''}`} onClick={() => { setVenueId(v.id); setPicking(false); setSent(false) }}>
                <b>{v.name}</b><span className="muted small">{v.city}</span>
              </button>
            ))}
          </div>
        )}

        <div className="band-head compact">
          <div className="band-avatar" style={{ backgroundImage: `url(${band.photos[0]})` }} />
          <h1>{band.name}</h1>
          <div className="meta">{band.city} • {band.followers} Followers</div>
          <div className="tagline">{band.tagline}</div>
          <div className="chip-row center-h">{band.genres.map(g => <Chip key={g} blue>{g}</Chip>)}</div>
        </div>

        <h2 className="sub-h">Overview</h2>
        <div className="overview">
          <div><b>86</b><span>Avg.<br />Attendance</span></div>
          <div><b>72%</b><span>Show-up<br />Rate</span></div>
          <div><b>$8</b><span>Avg.<br />Ticket</span></div>
        </div>

        <h2 className="sub-h">Why book {band.name}</h2>
        <div className="list-card why">
          <div><span className="why-ic"><Up size={12} /></span><div><b>Growing draw</b><div className="muted small">Attendance up 12% over the last 30 days</div></div></div>
          <div><span className="why-ic"><Star /></span><div><b>Fans come back</b><div className="muted small">20% of attendees have seen {band.name} 2+ times</div></div></div>
          <div><span className="why-ic"><Target /></span><div><b>Already pulling {venue.city === 'San Francisco' ? 'SF' : venue.city} fans</b><div className="muted small">98 fans attended their last show nearby</div></div></div>
        </div>

        <h2 className="sub-h">Attendance by show</h2>
        <div className="bar-chart">
          {ATTENDANCE_SERIES.map((d, i) => (
            <div key={d.label} className="bar-col">
              <span>{d.value}</span>
              <div className={i === ATTENDANCE_SERIES.length - 1 ? 'b on' : 'b'} style={{ height: `${(d.value / max) * 110}px` }} />
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
          {PLAYED.map((p, i) => (
            <div key={p.name} className="recent-row">
              <Poster hue={200 + i * 20} className="prep-thumb" />
              <div className="grow"><b>{p.name}</b><div className="muted small">{p.city} · {p.date}</div></div>
              <div className="center"><b className="big">{p.attended}</b><div className="muted small">attended</div></div>
            </div>
          ))}
        </div>

        <h2 className="sub-h">What we sound like</h2>
        <div className="two-col">
          {band.photos.map((p, i) => (
            <button key={i} className="media-tile wide" onClick={() => toast('Playing clip…')}><Poster hue={0} photo={p}><span className="play-dot"><Play size={14} /></span></Poster></button>
          ))}
        </div>

        <h2 className="sub-h">The ask</h2>
        <div className="ask">
          <div><span>Preferred dates</span><b>Fri/Sat, Nov 7 – Dec 13</b></div>
          <div><span>Expected draw</span><b>90–110 fans</b></div>
          <div><span>Suggested ticket</span><b>$10 · we promote on EarPlug</b></div>
        </div>

        <button className="primary-btn" disabled={sent} onClick={() => { setSent(true); toast(`Sent to ${venue.name}`) }}>
          {sent ? `Sent to ${venue.name} ✓` : 'Send to venue'}
        </button>
        <button className="secondary-btn" onClick={() => window.print()}><Download /> Download PDF</button>
        <p className="muted small center">Stats verified by EarPlug ticket check-ins</p>
      </div>
    </div>
  )
}
