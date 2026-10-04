import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronRight, ScanIcon } from '../../components/icons'
import { dayKey, keyToDate, MonthCalendar } from '../../components/MonthCalendar'
import { appStatus, offerDate, useCatalog, useNow } from '../../state/catalog'
import { useStore } from '../../state/store'
import { ordersFor, salesSummary } from '../../state/ticketing'
import { formatDate, formatTime, money } from '../../lib/format'
import { share } from '../../lib/native'
import type { Application, Show } from '../../types'

type Entry =
  | { kind: 'show'; date: Date; show: Show; status: 'Confirmed' | 'Draft' }
  | { kind: 'app'; date: Date; app: Application; status: 'Pending' | 'Offer' }

// "7:30" / "9:15" style times used in the Figma's day card.
const short = (d: Date) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).replace(/ [AP]M$/, '')
const hhmm = (t?: string) => (t ? new Date(`2000-01-01T${t}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '')

/** "My shows" (Gigs Page 2 – Artist): month calendar + the selected day's shows. */
export default function MyShows() {
  const now = useNow(5000)
  const cat = useCatalog()
  const { state } = useStore()
  const today = new Date()
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()

  const entries = useMemo<Entry[]>(() => {
    const shows: Entry[] = state.myShows.filter(s => !s.cancelled).map(s => ({ kind: 'show', date: new Date(s.date), show: s, status: s.draft ? 'Draft' : 'Confirmed' }))
    // Bills you were added to (accepted join requests) also go on your calendar.
    const joined: Entry[] = state.billAdds.map(id => cat.show(id)).filter((s): s is Show => !!s).map(s => ({ kind: 'show', date: new Date(s.date), show: s, status: 'Confirmed' }))
    const apps: Entry[] = state.applications
      .map(a => ({ a, st: appStatus(a, now) }))
      .filter(x => x.st === 'Not reviewed' || x.st === 'Under review' || x.st === 'Offered')
      .map(x => ({ kind: 'app', date: new Date(offerDate(x.a)), app: x.a, status: x.st === 'Offered' ? 'Offer' : 'Pending' }))
    return [...shows, ...joined, ...apps].sort((a, b) => a.date.getTime() - b.date.getTime())
  }, [state.myShows, state.applications, state.billAdds, cat, now])

  const firstUpcoming = entries.find(e => e.date.getTime() >= startOfToday)
  const [month, setMonth] = useState(() => { const d = firstUpcoming?.date ?? today; return new Date(d.getFullYear(), d.getMonth(), 1) })
  const [selected, setSelected] = useState(() => dayKey(firstUpcoming?.date ?? today))

  const byDay = new Map<string, Entry[]>()
  for (const e of entries) byDay.set(dayKey(e.date), [...(byDay.get(dayKey(e.date)) ?? []), e])
  const dots = new Map<string, 'blue' | 'gray'>([...byDay].map(([k, es]) => [k, es.some(e => e.status === 'Confirmed') ? 'blue' : 'gray']))

  const selectedDate = keyToDate(selected)
  const dayEntries = byDay.get(selected) ?? []
  const later = entries.filter((e): e is Extract<Entry, { kind: 'show' }> =>
    e.kind === 'show' && e.status === 'Confirmed' && e.date.getMonth() === month.getMonth() && e.date.getFullYear() === month.getFullYear() && dayKey(e.date) !== selected)

  return (
    <div className="pad-x">
      <MonthCalendar month={month} onMonth={setMonth} selected={[selected]} onSelect={setSelected} dots={dots} />

      <h2 className="day-title">{selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</h2>
      {dayEntries.length
        ? dayEntries.map(e => <DayCard key={e.kind === 'show' ? e.show.id : e.app.id} entry={e} now={now} />)
        : <p className="muted small day-empty">No shows this day.</p>}

      {later.length > 0 && (
        <>
          <h2 className="day-title">This month</h2>
          <div className="month-list">
            {later.map(e => (
              <button key={e.show.id} className="month-row" onClick={() => setSelected(dayKey(e.date))}>
                <span className="month-date"><small>{formatDate(e.show.date, { weekday: 'short' }).toUpperCase()}</small><b>{e.date.getDate()}</b></span>
                <span className="grow min0 left"><b className="ellipsis block">{e.show.title}</b><span className="muted small">{formatTime(e.show.date)}</span></span>
                <ChevronRight size={14} />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function DayCard({ entry, now }: { entry: Entry; now: number }) {
  const nav = useNavigate()
  const cat = useCatalog()
  const { state } = useStore()

  if (entry.kind === 'app') {
    const v = cat.venue(entry.app.venueId)
    return (
      <Link to={`/bookings/${entry.app.id}`} className="day-card">
        <div className="row between center-v"><b className="day-card-title">{entry.app.joinShowId ? `Join: ${cat.anyShow(entry.app.joinShowId)?.title}` : `${entry.app.actName} @ ${v.name}`}</b><span className={`entry-pill ${entry.status === 'Offer' ? 'offer' : 'pending'}`}>{entry.status}</span></div>
        <div className="day-card-sub">{v.name} · {formatTime(entry.date.toISOString())}</div>
        <div className="day-card-times">{entry.status === 'Offer' ? 'Offer received · tap to review and accept' : 'Application sent · waiting on the venue'}</div>
      </Link>
    )
  }

  const s = entry.show
  const v = cat.venue(s.venueId)
  const title = s.bandIds.map(id => cat.band(id)?.name).filter(Boolean).join(' + ') || s.title
  const sum = s.hostedByMe && !s.draft ? salesSummary(s, v, ordersFor(s, v, state.tickets, now)) : null
  const times = [`Doors ${short(new Date(s.date))}`, s.loadIn && `Load-in ${hhmm(s.loadIn)}`, s.setTime && `You headline at ${short(new Date(`2000-01-01T${s.setTime}`))}`].filter(Boolean).join(' · ')

  return (
    <div className="day-card">
      <Link to={s.createdByMe ? `/host/${s.id}` : `/show/${s.id}`} className="block">
        <div className="row between center-v"><b className="day-card-title">{title}</b><span className={`entry-pill ${entry.status === 'Draft' ? 'draft' : 'confirmed'}`}>{s.venueApproval === 'pending' ? 'Pending' : entry.status}</span></div>
        <div className="day-card-sub">{v.name} · {formatTime(s.date)}</div>
        {sum ? (
          <>
            <div className="row between center-v day-card-sold"><span>Tickets sold</span><b>{sum.sold} / {sum.capacity} · {money(sum.revenue)}</b></div>
            <div className="day-bar"><div style={{ width: `${sum.pct}%` }} /></div>
          </>
        ) : !s.draft && <div className="row between center-v day-card-sold"><span>Tickets</span><b>Sold by {v.name}</b></div>}
        <div className="day-card-times">{times}</div>
      </Link>
      <div className="day-actions">
        <button onClick={() => nav(`/host/${s.id}/edit`)} disabled={!s.createdByMe}>Edit</button>
        <button onClick={() => share(s.title, `${s.title} at ${v.name}`, `${location.origin}/show/${s.id}`)} disabled={!!s.draft}>Share</button>
        <button className="scan" onClick={() => nav(`/host/${s.id}/door`)} disabled={!s.hostedByMe || !!s.draft}><ScanIcon /> Scan</button>
      </div>
    </div>
  )
}
