import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GlassButton, Screen } from '../components/ui'
import { ChevronRight, Close, Down, Up } from '../components/icons'
import { ANALYTICS, ATTENDANCE_SERIES, CITY_PERF, RECENT_SHOWS, VENUE_PERF, type Range } from '../data'
import { toast } from '../store'

const RANGES: Range[] = ['7D', '30D', '12M', 'All']

function Delta({ v, suffix = '' }: { v: number; suffix?: string }) {
  if (!v) return null
  return <span className="delta">{v > 0 ? <Up /> : <Down />} {Math.abs(v)}{suffix}</span>
}

export default function Analytics() {
  const nav = useNavigate()
  const [range, setRange] = useState<Range>('30D')
  const [perf, setPerf] = useState<'city' | 'venue'>('city')
  const a = ANALYTICS[range]
  const rows = (perf === 'city' ? CITY_PERF : VENUE_PERF)
    .map(r => ({ ...r, rate: Math.round((r.attended / r.rsvps) * 100) }))
    .sort((x, y) => y.rate - x.rate)

  return (
    <Screen tabs className="analytics">
      <div className="row between center-v pad-x top-bar">
        <h1 className="large-title">Analytics</h1>
        <GlassButton size={36} aria-label="Close" onClick={() => nav('/explore')}><Close /></GlassButton>
      </div>

      <div className="pad-x">
        <div className="segmented full">
          {RANGES.map(r => <button key={r} className={r === range ? 'on' : ''} onClick={() => setRange(r)}>{r}</button>)}
        </div>

        <h2 className="sub-h">Key stats</h2>
        <div className="kpi-grid">
          <div className="kpi light"><span>Avg. attendance</span><b>{a.attendance}</b><small><Delta v={a.attendDelta} suffix="%" /> vs prev. {range}</small></div>
          <div className="kpi"><span>Show-up rate</span><b>{a.showUp}%</b><small><Delta v={a.showUpDelta} suffix=" pts" /></small></div>
          <div className="kpi"><span>Repeat fans</span><b>{a.repeat}%</b><small><Delta v={a.repeatDelta} suffix=" pts" /></small></div>
          <div className="kpi"><span>New fans</span><b>{a.newFans.toLocaleString()}</b><small><Delta v={a.newFansDelta} suffix="%" /></small></div>
          <div className="kpi"><span>Earnings</span><b>${a.earnings.toLocaleString()}</b><small><Delta v={a.earnDelta} suffix="%" /> · ${a.avgTicket} avg. ticket</small></div>
          <div className="kpi"><span>Shows played</span><b>{a.shows}</b><small><Delta v={a.showsDelta} /> · {a.venues} venues</small></div>
        </div>

        <LineChart />

        <h2 className="sub-h">Where you’re winning</h2>
        <div className="segmented full two">
          <button className={perf === 'city' ? 'on' : ''} onClick={() => setPerf('city')}>City</button>
          <button className={perf === 'venue' ? 'on' : ''} onClick={() => setPerf('venue')}>Venue</button>
        </div>
        <div className="list-card">
          {rows.map((r, i) => (
            <div key={r.name} className="perf-row">
              <div className="row between center-v">
                <div>
                  <b>{i + 1}. {r.name}</b>
                  <div className="muted small">{r.shows} show{r.shows > 1 ? 's' : ''} · {r.rsvps} RSVPs → {r.attended} attended</div>
                </div>
                <div className="row center-v gap-sm"><b className="big">{r.rate}%</b><ChevronRight size={14} /></div>
              </div>
              <div className="bar"><div style={{ width: `${r.rate}%` }} /></div>
            </div>
          ))}
        </div>

        <div className="section-header flush"><h2>Recent shows</h2></div>
        <div className="list-card">
          {RECENT_SHOWS.map(s => (
            <div key={s.day} className="recent-row">
              <div className="date-box"><small>{s.month}</small><b>{s.day}</b></div>
              <div className="grow"><b>{s.venue}</b><div className="muted small">{s.city} · {s.attended} attended · {s.newFans} new fans</div></div>
              <b>${s.earnings}</b>
            </div>
          ))}
        </div>
      </div>

      <div className="ticket-bar inline">
        <button onClick={() => { toast('Pitch report generated'); nav('/pitch') }}>GENERATE REPORT</button>
      </div>
    </Screen>
  )
}

function LineChart() {
  const [hover, setHover] = useState(ATTENDANCE_SERIES.length - 1)
  const W = 320, H = 170, padL = 26, padB = 22, max = 120
  const x = (i: number) => padL + (i * (W - padL - 8)) / (ATTENDANCE_SERIES.length - 1)
  const y = (v: number) => (H - padB) - (v / max) * (H - padB - 8)
  const line = (k: 'value' | 'prev') => ATTENDANCE_SERIES.map((d, i) => `${i ? 'L' : 'M'}${x(i)},${y(d[k])}`).join(' ')
  const h = ATTENDANCE_SERIES[hover]

  return (
    <div className="chart-card">
      <b>Avg. attendance · last 30 days</b>
      <div className="muted small">Each point is one show</div>
      <div className="legend"><span className="lg blue" />This period <span className="lg gray" />Previous 30D</div>
      <div className="chart-tip"><b>{h.value} attended</b><small>{h.label} · {h.venue}</small></div>
      <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label="Attendance chart">
        {[0, 40, 80, 120].map(t => (
          <g key={t}>
            <line x1={padL} x2={W} y1={y(t)} y2={y(t)} className="grid" />
            <text x={0} y={y(t) + 4} className="axis">{t}</text>
          </g>
        ))}
        <path d={line('prev')} className="prev" />
        <path d={line('value')} className="cur" />
        <line x1={x(hover)} x2={x(hover)} y1={8} y2={H - padB} className="cursor" />
        {ATTENDANCE_SERIES.map((d, i) => (
          <g key={d.label} onMouseEnter={() => setHover(i)} onClick={() => setHover(i)} style={{ cursor: 'pointer' }}>
            <rect x={x(i) - 18} y={0} width={36} height={H} fill="transparent" />
            <circle cx={x(i)} cy={y(d.value)} r={i === hover ? 5 : 3.5} className={i === hover ? 'pt on' : 'pt'} />
            <text x={x(i)} y={H - 4} textAnchor="middle" className="axis">{d.label}</text>
          </g>
        ))}
      </svg>
    </div>
  )
}
