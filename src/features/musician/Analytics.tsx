import { useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { GlassButton, Logo, Screen, Segmented } from '../../components/ui'
import { ChevronRight, Down, Up } from '../../components/icons'
import { CITY_PERF, KEY_STATS, METRIC_LABEL, RANGES, RECENT_SHOWS, SERIES, VENUE_PERF, rate, type Metric, type Range } from '../../data/analytics'
import { formatDate, isPastDate, money } from '../../lib/format'
import { useCatalog, useNow } from '../../state/catalog'
import { useStore } from '../../state/store'
import { ordersFor, salesSummary } from '../../state/ticketing'
import { toast } from '../../lib/native'

function Delta({ v, suffix = '' }: { v: number; suffix?: string }) {
  if (!v) return null
  return <span className="delta">{v > 0 ? <Up /> : <Down />} {Math.abs(v)}{suffix}</span>
}

export default function Analytics() {
  const nav = useNavigate()
  const [range, setRange] = useState<Range>('30D')
  const [metric, setMetric] = useState<Metric>('attendance')
  const [perf, setPerf] = useState<'City' | 'Venue'>('City')
  const [openRow, setOpenRow] = useState<string | null>(null)
  const [allShows, setAllShows] = useState(false)
  const a = KEY_STATS[range]
  const cat = useCatalog()
  const { state } = useStore()
  const now = useNow(5000)
  const live = state.myShows.filter(s => s.hostedByMe && !s.cancelled && !isPastDate(s.date)).map(s => {
    const v = cat.venue(s.venueId)
    return { s, sum: salesSummary(s, v, ordersFor(s, v, state.tickets, now)) }
  })
  const rows = (perf === 'City' ? CITY_PERF : VENUE_PERF).map(r => ({ ...r, rate: rate(r) })).sort((x, y) => y.rate - x.rate)

  const kpis: { m: Metric; label: string; value: string; sub: ReactNode }[] = [
    { m: 'attendance', label: 'Avg. attendance', value: String(a.attendance), sub: <><Delta v={a.attendDelta} suffix="%" /> vs prev. {range}</> },
    { m: 'showUp', label: 'Show-up rate', value: `${a.showUp}%`, sub: <Delta v={a.showUpDelta} suffix=" pts" /> },
    { m: 'repeat', label: 'Repeat fans', value: `${a.repeat}%`, sub: <Delta v={a.repeatDelta} suffix=" pts" /> },
    { m: 'newFans', label: 'New fans', value: a.newFans.toLocaleString(), sub: <Delta v={a.newFansDelta} suffix="%" /> },
    { m: 'earnings', label: 'Earnings', value: money(a.earnings), sub: <><Delta v={a.earnDelta} suffix="%" /> · ${a.avgTicket} avg. ticket</> },
    { m: 'shows', label: 'Shows played', value: String(a.shows), sub: <><Delta v={a.showsDelta} /> · {a.venues} venues</> },
  ]

  return (
    <Screen tabs className="analytics">
      <div className="row between center-v pad-x top-bar">
        <div>
          <Logo />
          <h1 className="analytics-title">{cat.myBand?.name ?? 'Your'}’s Analytics</h1>
          <div className="muted small">Your shows · Bay Area</div>
        </div>
      </div>

      <div className="pad-x">
        <Segmented options={RANGES} value={range} onChange={setRange} full />

        <div className="row between baseline">
          <h2 className="sub-h">Key stats</h2>
          <span className="muted small">Tap a stat to see its trend</span>
        </div>
        <div className="kpi-grid">
          {kpis.map(k => (
            <button key={k.m} className={`kpi${metric === k.m ? ' light' : ''}`} onClick={() => setMetric(k.m)} aria-pressed={metric === k.m}>
              <span>{k.label}</span><b>{k.value}</b><small>{k.sub}</small>
            </button>
          ))}
        </div>

        <LineChart metric={metric} />


        {live.length > 0 && (
          <>
            <div className="row between baseline">
              <h2 className="sub-h">Live ticket sales</h2>
              <Link to="/gigs?tab=shows" className="muted small">My shows ›</Link>
            </div>
            <div className="list-card">
              {live.map(({ s, sum }) => (
                <Link key={s.id} to={`/host/${s.id}`} className="perf-row">
                  <div className="row between center-v">
                    <div className="left min0"><b className="ellipsis">{s.title}</b><div className="muted small">{formatDate(s.date, { month: 'short', day: 'numeric' })} · {sum.sold}/{sum.capacity} sold</div></div>
                    <div className="row center-v gap-sm"><b className="big">{money(sum.revenue)}</b><ChevronRight size={14} /></div>
                  </div>
                  <div className="bar"><div style={{ width: `${sum.pct}%` }} /></div>
                </Link>
              ))}
            </div>
          </>
        )}

        <div className="row between baseline">
          <h2 className="sub-h">Where you’re winning</h2>
          <span className="muted small">Sorted by show-up rate</span>
        </div>
        <Segmented options={['City', 'Venue'] as const} value={perf} onChange={v => { setPerf(v); setOpenRow(null) }} full />
        <div className="list-card mt">
          {rows.map((r, i) => (
            <button key={r.name} className="perf-row" onClick={() => setOpenRow(o => (o === r.name ? null : r.name))} aria-expanded={openRow === r.name}>
              <div className="row between center-v">
                <div className="left">
                  <b>{i + 1}. {r.name}</b>
                  <div className="muted small">{r.shows} show{r.shows > 1 ? 's' : ''} · {r.rsvps} RSVPs → {r.attended} attended</div>
                </div>
                <div className="row center-v gap-sm"><b className="big">{r.rate}%</b><ChevronRight size={14} className={openRow === r.name ? 'rot90' : ''} /></div>
              </div>
              <div className="bar"><div style={{ width: `${r.rate}%` }} /></div>
              {openRow === r.name && <div className="perf-detail">{r.venues.map(v => <div key={v} className="muted small">• {v} attended</div>)}</div>}
            </button>
          ))}
        </div>

        <div className="section-header flush">
          <h2>Recent shows</h2>
          <GlassButton aria-label="All recent shows" onClick={() => setAllShows(s => !s)}><ChevronRight size={18} className={allShows ? 'rot90' : ''} /></GlassButton>
        </div>
        <div className="list-card">
          {RECENT_SHOWS.slice(0, allShows ? undefined : 3).map(s => (
            <div key={s.day} className="recent-row">
              <div className="date-box"><small>{s.month}</small><b>{s.day}</b></div>
              <div className="grow min0"><b>{s.venue}</b><div className="muted small">{s.city} · {s.attended} attended · {s.newFans} new fans</div></div>
              <b>${s.earnings}</b>
            </div>
          ))}
        </div>
      </div>

      <div className="report-bar">
        <button onClick={() => { toast('Pitch report generated'); nav('/pitch') }}>GENERATE REPORT</button>
      </div>
    </Screen>
  )
}

function LineChart({ metric }: { metric: Metric }) {
  const [hover, setHover] = useState(SERIES.length - 1)
  const key: Exclude<Metric, 'shows'> = metric === 'shows' ? 'attendance' : metric
  const values = SERIES.flatMap(d => [d[key], d.prev[key]])
  const max = Math.ceil(Math.max(...values) * 1.15 / 10) * 10
  const W = 320, H = 170, padL = 30, padB = 22
  const x = (i: number) => padL + (i * (W - padL - 8)) / (SERIES.length - 1)
  const y = (v: number) => (H - padB) - (v / max) * (H - padB - 8)
  const path = (get: (i: number) => number) => SERIES.map((_, i) => `${i ? 'L' : 'M'}${x(i)},${y(get(i))}`).join(' ')
  const fmt = (v: number) => (key === 'showUp' || key === 'repeat' ? `${v}%` : key === 'earnings' ? `$${v}` : String(v))
  const unit = key === 'attendance' ? 'attended' : key === 'newFans' ? 'new fans' : key === 'earnings' ? 'earned' : METRIC_LABEL[key].toLowerCase()
  const h = SERIES[hover]
  const ticks = [0, 1, 2, 3].map(i => Math.round((max / 3) * i))

  return (
    <div className="chart-card">
      <b>{METRIC_LABEL[metric]} · last 30 days</b>
      <div className="muted small">Each point is one show</div>
      <div className="legend"><span className="lg blue" />This period <span className="lg gray" />Previous 30D</div>
      <div className="chart-tip"><b>{fmt(h[key])} {unit}</b><small>{h.label} · {h.venue}</small></div>
      <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label={`${METRIC_LABEL[metric]} chart`}>
        {ticks.map(t => (
          <g key={t}>
            <line x1={padL} x2={W} y1={y(t)} y2={y(t)} className="grid" />
            <text x={0} y={y(t) + 4} className="axis">{fmt(t)}</text>
          </g>
        ))}
        <path d={path(i => SERIES[i].prev[key])} className="prev" />
        <path d={path(i => SERIES[i][key])} className="cur" />
        <line x1={x(hover)} x2={x(hover)} y1={8} y2={H - padB} className="cursor" />
        {SERIES.map((d, i) => (
          <g key={d.label} onMouseEnter={() => setHover(i)} onClick={() => setHover(i)} style={{ cursor: 'pointer' }}>
            <rect x={x(i) - 18} y={0} width={36} height={H} fill="transparent" />
            <circle cx={x(i)} cy={y(d[key])} r={i === hover ? 5 : 3.5} className={i === hover ? 'pt on' : 'pt'} />
            <text x={x(i)} y={H - 4} textAnchor="middle" className="axis">{d.label}</text>
          </g>
        ))}
      </svg>
    </div>
  )
}
