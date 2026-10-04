// The pitch report: built from the musician's Analytics, shown on the Pitch page,
// attached to every booking / join-the-bill request, and frozen as a snapshot when sent.
import { useState } from 'react'
import { Chip, Poster } from '../../components/ui'
import { ChevronRight, Play, Star, Target, Up } from '../../components/icons'
import { FAN_CITIES, KEY_STATS, RECENT_SHOWS, SERIES, type Range } from '../../data/analytics'
import type { Catalog } from '../../state/catalog'
import { avatarGradient, money } from '../../lib/format'
import { toast } from '../../lib/native'
import type { Band, PitchSnapshot } from '../../types'

const RANGE_LABEL: Record<Range, string> = { '7D': 'last 7 days', '30D': 'last 30 days', '12M': 'last 12 months', All: 'all time' }

export function buildPitch(band: Band, members: string, range: Range): PitchSnapshot {
  const k = KEY_STATS[range]
  return {
    range, generatedAt: new Date().toISOString(),
    bandName: band.name, city: band.city, followers: band.followers, members, genres: band.genres,
    attendance: k.attendance, attendDelta: k.attendDelta, showUp: k.showUp, repeat: k.repeat, newFans: k.newFans,
    avgTicket: k.avgTicket, earnings: k.earnings, shows: k.shows, venues: k.venues,
    series: SERIES.map(s => ({ label: s.label, value: s.attendance })),
    fanCities: FAN_CITIES,
    recent: RECENT_SHOWS.slice(0, 3).map(s => ({ venue: s.venue, city: s.city, date: `${s.month[0]}${s.month.slice(1).toLowerCase()} ${s.day}`, attended: s.attended })),
    clips: band.media.slice(0, 2),
  }
}

/** Expected draw shown in "The ask": average attendance ± ~10%. */
export const expectedDraw = (p: PitchSnapshot) => `${Math.round(p.attendance * 0.9)}–${Math.round(p.attendance * 1.1)} fans`

/** Full report, styled like the Figma Pitch Report – Band → Venue. */
export function PitchReportView({ pitch, band, cat, venueCity, ask }: {
  pitch: PitchSnapshot
  band?: Band | null
  cat: Catalog
  venueCity?: string
  ask?: { dates: string; slot?: string }
}) {
  const max = Math.max(...pitch.series.map(s => s.value), 1)
  const short = venueCity === 'San Francisco' ? 'SF' : venueCity
  const localFans = venueCity ? pitch.fanCities.find(c => c.name === venueCity) : undefined
  return (
    <div className="pitch-report">
      <div className="band-head compact">
        <div className="band-avatar" style={band?.photo ? { backgroundImage: `url(${band.photo})` } : { background: avatarGradient(band?.hue ?? 230) }} />
        <h1>{pitch.bandName}</h1>
        <div className="meta">{pitch.city} • {pitch.followers} Followers</div>
        <div className="meta">{pitch.members ? `${pitch.members} members` : 'Solo artist'}</div>
        <div className="chip-row center-h">{pitch.genres.slice(0, 5).map(g => <Chip key={g} blue>{g}</Chip>)}</div>
      </div>

      <h2 className="sub-h">Overview <span className="muted small">· {RANGE_LABEL[pitch.range]}</span></h2>
      <div className="overview">
        <div><b>{pitch.attendance}</b><span>Avg.<br />Attendance</span></div>
        <div><b>{pitch.showUp}%</b><span>Show-up<br />Rate</span></div>
        <div><b>${pitch.avgTicket}</b><span>Avg.<br />Ticket</span></div>
      </div>

      <h2 className="sub-h">Why book {pitch.bandName}</h2>
      <div className="list-card why">
        {pitch.attendDelta > 0 && <div><span className="why-ic"><Up size={12} /></span><div><b>Growing draw</b><div className="muted small">Attendance up {pitch.attendDelta}% over the {RANGE_LABEL[pitch.range]}</div></div></div>}
        <div><span className="why-ic"><Star /></span><div><b>Fans come back</b><div className="muted small">{pitch.repeat}% of attendees have seen {pitch.bandName} 2+ times</div></div></div>
        <div><span className="why-ic"><Target /></span><div>
          <b>{localFans ? `Already pulling ${short} fans` : `${pitch.newFans.toLocaleString()} new fans`}</b>
          <div className="muted small">{localFans ? `${localFans.pct}% of ${pitch.bandName}’s fans are in ${venueCity}` : `Across ${pitch.shows} shows at ${pitch.venues} venues`}</div>
        </div></div>
      </div>

      <h2 className="sub-h">Attendance by show</h2>
      <div className="bar-chart">
        {pitch.series.map((d, i) => (
          <div key={d.label} className="bar-col">
            <span>{d.value}</span>
            <div className={i === pitch.series.length - 1 ? 'b on' : 'b'} style={{ height: `${(d.value / max) * 110}px` }} />
            <small>{d.label}</small>
          </div>
        ))}
      </div>

      <h2 className="sub-h">Where the fans are</h2>
      {pitch.fanCities.map(c => (
        <div key={c.name} className="fan-city">
          <div className="row between"><b>{c.name}</b><span className="muted">{c.pct}% of fans</span></div>
          <div className="bar"><div style={{ width: `${Math.min(100, c.pct * 1.6)}%` }} /></div>
        </div>
      ))}

      <h2 className="sub-h">Venues played</h2>
      <div className="list-card">
        {pitch.recent.map((p, i) => (
          <div key={p.venue + p.date} className="recent-row">
            <Poster hue={200 + i * 20} photo={cat.venues.find(v => v.name === p.venue)?.photo} className="prep-thumb" />
            <div className="grow"><b>{p.venue}</b><div className="muted small">{p.city} · {p.date}</div></div>
            <div className="center"><b className="big">{p.attended}</b><div className="muted small">attended</div></div>
          </div>
        ))}
      </div>

      {pitch.clips.length > 0 && (
        <>
          <h2 className="sub-h">What we sound like</h2>
          <div className="two-col flush">
            {pitch.clips.map((p, i) => (
              <button key={i} type="button" className="media-tile wide" onClick={() => toast('Playing clip…')}><Poster hue={0} photo={p}><span className="play-dot"><Play size={14} /></span></Poster></button>
            ))}
          </div>
        </>
      )}

      <h2 className="sub-h">The ask</h2>
      <div className="ask">
        <div><span>{ask?.slot ? 'Slot' : 'Preferred dates'}</span><b>{ask?.slot ?? ask?.dates ?? 'Fri/Sat, next 6 weeks'}</b></div>
        {ask?.slot && <div><span>Date</span><b>{ask.dates}</b></div>}
        <div><span>Expected draw</span><b>{expectedDraw(pitch)}</b></div>
        <div><span>Suggested ticket</span><b>{money(Math.max(8, pitch.avgTicket + 2))} · we promote on EarPlug</b></div>
      </div>
      <p className="muted small center">Stats verified by EarPlug ticket check-ins · {new Date(pitch.generatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
    </div>
  )
}

/** Compact "attached" card with the headline numbers; expands to the full report. */
export function PitchAttachment({ pitch, band, cat, venueCity, ask, defaultOpen = false, label = 'Pitch report attached' }: {
  pitch: PitchSnapshot; band?: Band | null; cat: Catalog; venueCity?: string; ask?: { dates: string; slot?: string }; defaultOpen?: boolean; label?: string
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="pitch-attach">
      <button type="button" className="attach-head" onClick={() => setOpen(o => !o)} aria-expanded={open}>
        <span className="attach-ic">PDF</span>
        <span className="grow left">
          <b>{label}</b>
          <span className="muted small block">{pitch.bandName} · from your Analytics ({RANGE_LABEL[pitch.range]})</span>
        </span>
        <ChevronRight size={14} className={open ? 'rot90' : ''} />
      </button>
      <div className="analytics-mini">
        <div><b>{pitch.attendance}</b><span>Avg. attendance</span></div>
        <div><b>{pitch.showUp}%</b><span>Show-up rate</span></div>
        <div><b>{pitch.repeat}%</b><span>Repeat fans</span></div>
      </div>
      {open && <div className="attach-body"><PitchReportView pitch={pitch} band={band} cat={cat} venueCity={venueCity} ask={ask} /></div>}
    </div>
  )
}
