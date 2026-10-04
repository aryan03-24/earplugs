import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Empty } from '../../components/ui'
import { ChevronLeft, ChevronRight, Edit, QrIcon, Share } from '../../components/icons'
import { appStatus, offerDate, useCatalog, useNow } from '../../state/catalog'
import { useStore } from '../../state/store'
import { ordersFor, salesSummary } from '../../state/ticketing'
import { formatDate, formatTime, money } from '../../lib/format'
import { share } from '../../lib/native'
import type { Application, Show } from '../../types'

type Entry =
  | { kind: 'show'; date: Date; show: Show; status: 'Confirmed' | 'Draft' }
  | { kind: 'app'; date: Date; app: Application; status: 'Pending' | 'Offer' }

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
const WEEK = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

/** "My shows": month calendar of confirmed gigs, drafts and pending applications. */
export default function MyShows() {
  const now = useNow(5000)
  const { state } = useStore()
  const today = new Date()

  const entries = useMemo<Entry[]>(() => {
    const shows: Entry[] = state.myShows.filter(s => !s.cancelled).map(s => ({ kind: 'show', date: new Date(s.date), show: s, status: s.draft ? 'Draft' : 'Confirmed' }))
    const apps: Entry[] = state.applications
      .map(a => ({ a, st: appStatus(a, now) }))
      .filter(x => x.st === 'Not reviewed' || x.st === 'Under review' || x.st === 'Offered')
      .map(x => ({ kind: 'app', date: new Date(offerDate(x.a)), app: x.a, status: x.st === 'Offered' ? 'Offer' : 'Pending' }))
    return [...shows, ...apps].sort((a, b) => a.date.getTime() - b.date.getTime())
  }, [state.myShows, state.applications, now])

  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
  const next = entries.find(e => e.date.getTime() >= startOfToday)
  const [month, setMonth] = useState(() => { const d = next?.date ?? new Date(); return new Date(d.getFullYear(), d.getMonth(), 1) })
  const [selected, setSelected] = useState<string>(() => dayKey(next?.date ?? new Date()))

  const byDay = new Map<string, Entry[]>()
  for (const e of entries) byDay.set(dayKey(e.date), [...(byDay.get(dayKey(e.date)) ?? []), e])

  const first = new Date(month.getFullYear(), month.getMonth(), 1)
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
  const cells: (Date | null)[] = [...Array(first.getDay()).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1))]
  const selectedEntries = byDay.get(selected) ?? []
  const selectedDate = cells.find(d => d && dayKey(d) === selected) ?? entries.find(e => dayKey(e.date) === selected)?.date
  const monthEntries = entries.filter(e => e.date.getMonth() === month.getMonth() && e.date.getFullYear() === month.getFullYear() && dayKey(e.date) !== selected)
  const shift = (n: number) => setMonth(m => new Date(m.getFullYear(), m.getMonth() + n, 1))

  return (
    <div className="pad-x">
      <div className="cal-card">
        <div className="row between center-v cal-head">
          <b>{month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</b>
          <div className="row gap-sm">
            <button className="glass-btn" style={{ width: 30, height: 30 }} aria-label="Previous month" onClick={() => shift(-1)}><ChevronLeft size={16} /></button>
            <button className="glass-btn" style={{ width: 30, height: 30 }} aria-label="Next month" onClick={() => shift(1)}><ChevronRight size={16} /></button>
          </div>
        </div>
        <div className="cal-grid">
          {WEEK.map((w, i) => <span key={i} className="cal-dow">{w}</span>)}
          {cells.map((d, i) => {
            if (!d) return <span key={i} />
            const k = dayKey(d)
            const es = byDay.get(k) ?? []
            const isToday = k === dayKey(new Date())
            return (
              <button key={i} className={`cal-day${k === selected ? ' sel' : ''}${isToday ? ' today' : ''}`} onClick={() => setSelected(k)} aria-label={d.toDateString()}>
                {d.getDate()}
                <span className="cal-dots">
                  {es.some(e => e.status === 'Confirmed') && <i className="dot-blue" />}
                  {es.some(e => e.status !== 'Confirmed') && <i className="dot-gray" />}
                </span>
              </button>
            )
          })}
        </div>
        <div className="cal-legend"><span><i className="dot-blue" /> Confirmed</span><span><i className="dot-gray" /> Pending / draft</span></div>
      </div>

      {selectedDate && <h2 className="day-title">{selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</h2>}
      {selectedEntries.length ? selectedEntries.map(e => <EntryCard key={e.kind === 'show' ? e.show.id : e.app.id} entry={e} now={now} />)
        : <Empty>Nothing on this day. <Link to="/host/new" className="link">Create a show</Link></Empty>}

      {monthEntries.length > 0 && (
        <>
          <h2 className="day-title">This month</h2>
          {monthEntries.map(e => <EntryCard key={e.kind === 'show' ? e.show.id : e.app.id} entry={e} now={now} compact />)}
        </>
      )}
      {!entries.length && (
        <Link to="/host/new" className="host-cta">
          <b>Plan your first show</b>
          <span className="muted small">Host your own gig and sell tickets, or apply to open gigs in Find gigs.</span>
          <span className="small-pill white">+ New show</span>
        </Link>
      )}
    </div>
  )
}

function EntryCard({ entry, now, compact }: { entry: Entry; now: number; compact?: boolean }) {
    const nav = useNavigate()
    const cat = useCatalog()
    const { state } = useStore()
    if (entry.kind === 'app') {
      const v = cat.venue(entry.app.venueId)
      return (
        <Link to={`/bookings/${entry.app.id}`} className="show-entry pending">
          <div className="row between center-v"><b>{entry.app.actName} @ {v.name}</b><span className={`entry-pill ${entry.status === 'Offer' ? 'offer' : 'pending'}`}>{entry.status === 'Offer' ? 'Offer' : 'Pending'}</span></div>
          <div className="muted small">{v.name} · {formatTime(entry.date.toISOString())}{compact ? ` · ${formatDate(entry.date.toISOString(), { month: 'short', day: 'numeric' })}` : ''}</div>
          {!compact && <div className="small">{entry.status === 'Offer' ? 'The venue made an offer. Tap to accept.' : 'Waiting on the venue to reply.'}</div>}
        </Link>
      )
    }
    const s = entry.show
    const v = cat.venue(s.venueId)
    const title = s.bandIds.map(id => cat.band(id)?.name).filter(Boolean).join(' + ')
    const sum = s.hostedByMe ? salesSummary(s, v, ordersFor(s, v, state.tickets, now)) : null
    const hhmm = (t?: string) => t ? new Date(`2000-01-01T${t}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : null
    return (
      <div className={`show-entry${entry.status === 'Draft' ? ' draft' : ''}`}>
        <Link to={`/host/${s.id}`} className="block">
          <div className="row between center-v"><b>{title || s.title}</b><span className={`entry-pill ${entry.status === 'Draft' ? 'draft' : 'confirmed'}`}>{entry.status}</span></div>
          <div className="muted small">{v.name} · {formatTime(s.date)}{compact ? ` · ${formatDate(s.date, { month: 'short', day: 'numeric' })}` : ''}</div>
          {!compact && (sum ? (
            <>
              <div className="row between small sold-line"><span className="muted">Tickets sold</span><b>{sum.sold} / {sum.capacity} · {money(sum.revenue)}</b></div>
              <div className="bar"><div style={{ width: `${sum.pct}%` }} /></div>
            </>
          ) : <div className="muted small sold-line">Ticketed by {v.name}</div>)}
          {!compact && (
            <div className="small times">
              Doors {formatTime(s.date)}{s.loadIn ? ` · Load-in ${hhmm(s.loadIn)}` : ''}{s.setTime ? ` · You headline at ${hhmm(s.setTime)}` : ''}
            </div>
          )}
        </Link>
        {!compact && (
          <div className="entry-actions">
            <button onClick={() => nav(`/host/${s.id}/edit`)} disabled={!s.createdByMe}><Edit size={14} /> Edit</button>
            <button onClick={() => share(s.title, `${s.title} at ${v.name}`, `${location.origin}/show/${s.id}`)} disabled={!!s.draft}><Share size={14} /> Share</button>
            <button className="scan" onClick={() => nav(`/host/${s.id}/door`)} disabled={!s.hostedByMe || !!s.draft}><QrIcon size={15} /> Scan</button>
          </div>
        )}
      </div>
    )
}
