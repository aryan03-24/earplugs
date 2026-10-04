import { useMemo, useState, type ReactNode } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Chip, CloseButton, Logo } from '../../components/ui'
import { ChevronLeft, ChevronRight, Search } from '../../components/icons'
import { dayKey, keyToDate, MonthCalendar } from '../../components/MonthCalendar'
import { OPEN_GIGS } from '../../data/seed'
import { KEY_STATS, RECENT_SHOWS } from '../../data/analytics'
import { useCatalog } from '../../state/catalog'
import { useStore } from '../../state/store'
import { ordersFor } from '../../state/ticketing'
import { formatDate, isPastDate } from '../../lib/format'
import { haptic, toast, uid } from '../../lib/native'
import { cityFor, kmFrom, LocationButton, type City } from './BookingLocation'

const MAX_DATES = 3

/**
 * Booking application: 1) venue  2) dates  3) send your most recent pitch report.
 * If EarPlug hasn't tracked any of your shows yet, step 3 asks for the missing numbers.
 * Applying to an open gig skips straight to step 3 (venue and date are already known).
 */
export default function GetBooked() {
  const nav = useNavigate()
  const [params] = useSearchParams()
  const cat = useCatalog()
  const { state, submitApplication } = useStore()
  const band = cat.myBand!
  const openGig = OPEN_GIGS.find(g => g.id === params.get('gig'))

  const [city, setCity] = useState<City>(cityFor(state.profile.homeBase))
  const [radius, setRadius] = useState(15)
  const [q, setQ] = useState('')
  const [venueId, setVenueId] = useState(openGig?.venueId ?? params.get('venue') ?? '')
  const [dates, setDates] = useState<string[]>(openGig ? [dayKey(new Date(openGig.date))] : [])
  const [month, setMonth] = useState(() => { const d = openGig ? new Date(openGig.date) : new Date(); return new Date(d.getFullYear(), d.getMonth(), 1) })
  const [step, setStep] = useState(openGig ? 2 : params.get('venue') ? 1 : 0)
  const [note, setNote] = useState('')
  const [manual, setManual] = useState({ draw: '', lastShows: '', video: '' })

  // "Tracked" = EarPlug has real numbers from a show you ran or reported.
  const tracked = state.myShows.some(s => (s.hostedByMe && ordersFor(s, cat.venue(s.venueId), state.tickets).length > 0) || (isPastDate(s.date) && s.attendance != null))
  const stats = KEY_STATS['30D']

  const venues = useMemo(() => cat.venues
    .map(v => ({ v, km: kmFrom(city, v) }))
    .filter(x => x.km <= radius && (!q.trim() || `${x.v.name} ${x.v.city}`.toLowerCase().includes(q.trim().toLowerCase())))
    .sort((a, b) => a.km - b.km), [cat, city, radius, q])

  const toggleDate = (k: string) => {
    haptic()
    if (dates.includes(k)) { setDates(dates.filter(x => x !== k)); return }
    if (dates.length >= MAX_DATES) { toast(`Pick up to ${MAX_DATES} dates`); return }
    setDates([...dates, k].sort((a, b) => keyToDate(a).getTime() - keyToDate(b).getTime()))
  }

  const manualOk = tracked || (manual.draw.trim() !== '' && manual.lastShows.trim() !== '')
  const steps: { title: string; valid: boolean; body: ReactNode }[] = [
    {
      title: 'Which venue do you want to play?', valid: !!venueId,
      body: (
        <>
          <div className="row between center-v"><span className="muted small">Booking near</span><LocationButton city={city} radius={radius} onChange={(c, r) => { setCity(c); setRadius(r) }} /></div>
          <label className="search-bar"><Search size={16} /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Search venues" aria-label="Search venues" /></label>
          <div className="choice-list">
            {venues.map(({ v, km }) => (
              <button key={v.id} type="button" className={`select-row${venueId === v.id ? ' on' : ''}`} onClick={() => { setVenueId(v.id); haptic() }}>
                <span className="grow left"><b>{v.name}</b><span className="select-sub">{v.city} · {km.toFixed(1)} km · cap. {v.capacity} · {v.ages}</span></span>
              </button>
            ))}
            {!venues.length && <p className="muted small">No venues within {radius} km of {city}. Try a wider distance.</p>}
          </div>
        </>
      ),
    },
    {
      title: 'When do you want to play?', valid: dates.length > 0,
      body: (
        <>
          <p className="setup-copy plain center">Pick up to {MAX_DATES} dates that work for you.</p>
          <MonthCalendar month={month} onMonth={setMonth} selected={dates} onSelect={toggleDate} disablePast legend={false} />
          {dates.length > 0 && <div className="chip-row wrap flush center-h">{dates.map(k => <Chip key={k} blue>{formatDate(keyToDate(k).toISOString(), { weekday: 'short', month: 'short', day: 'numeric' })}</Chip>)}</div>}
        </>
      ),
    },
    {
      title: 'Send your pitch', valid: manualOk,
      body: (
        <>
          <div className="pitch-summary">
            <div className="row between center-v">
              <div><div className="muted small">To</div><b>{venueId ? cat.venue(venueId).name : '—'}</b></div>
              <div className="right"><div className="muted small">{dates.length > 1 ? 'Dates' : 'Date'}</div><b>{dates.map(k => formatDate(keyToDate(k).toISOString(), { month: 'short', day: 'numeric' })).join(', ')}</b></div>
            </div>
            {openGig && <div className="muted small">{openGig.slot} · {openGig.setLength} min · {openGig.pay ? `$${openGig.pay}` : 'Door split'}</div>}
          </div>

          {tracked ? (
            <div className="pitch-attach">
              <div className="row between center-v"><b>Most recent pitch report</b><Link to="/pitch" className="link small">Preview</Link></div>
              <div className="muted small">{band.name} · {band.city} · {state.profile.members ? `${state.profile.members} members` : 'Solo'}</div>
              <div className="analytics-mini">
                <div><b>{stats.attendance}</b><span>Avg. attendance</span></div>
                <div><b>{stats.showUp}%</b><span>Show-up rate</span></div>
                <div><b>${stats.avgTicket}</b><span>Avg. ticket</span></div>
              </div>
            </div>
          ) : (
            <>
              <p className="setup-copy plain center">EarPlug hasn’t tracked any of your shows yet, so add the numbers venues look for.</p>
              <label className="labeled-field"><span>Typical draw (people)</span><input inputMode="numeric" value={manual.draw} onChange={e => setManual({ ...manual, draw: e.target.value.replace(/[^\d–-]/g, '') })} /></label>
              <label className="labeled-field"><span>Last 3 shows & attendance</span><textarea rows={3} value={manual.lastShows} onChange={e => setManual({ ...manual, lastShows: e.target.value })} placeholder="ex. Cornerstone – 74" /></label>
              <label className="labeled-field"><span>Video link (optional)</span><input inputMode="url" value={manual.video} onChange={e => setManual({ ...manual, video: e.target.value })} /></label>
            </>
          )}
          <label className="labeled-field"><span>Note to the venue (optional)</span><textarea rows={3} value={note} onChange={e => setNote(e.target.value)} /></label>
        </>
      ),
    },
  ]
  const cur = steps[step]
  const last = step === steps.length - 1

  const send = () => {
    const v = cat.venue(venueId)
    const sorted = dates.map(keyToDate).sort((a, b) => a.getTime() - b.getTime())
    const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    submitApplication({
      id: uid('app'), venueId, openGigId: openGig?.id, createdAt: new Date().toISOString(),
      actName: band.name, email: '', members: state.profile.members, targetStart: iso(sorted[0]), targetEnd: iso(sorted[sorted.length - 1]),
      website: '', draw: tracked ? `${stats.attendance} avg` : manual.draw, soundsLike: '', videos: manual.video ? [manual.video] : [], genres: band.genres,
      lastShows: tracked ? RECENT_SHOWS.slice(0, 3).map(s => `${s.venue} (${s.attended})`).join(', ') : manual.lastShows, bill: '',
      offerDate: openGig?.date,
      messages: [{ from: 'me', text: note.trim() || `Hi ${v.name}! ${band.name} would love to play ${sorted.map(d => formatDate(d.toISOString(), { month: 'short', day: 'numeric' })).join(' / ')}. ${tracked ? 'Our pitch report is attached.' : `We usually draw ${manual.draw} people.`}`, at: new Date().toISOString() }],
    })
    haptic(30)
    toast(`Sent to ${v.name}`)
    nav('/applications', { replace: true })
  }

  const next = () => {
    if (!cur.valid) { toast(step === 0 ? 'Choose a venue' : step === 1 ? 'Pick at least one date' : 'Add your typical draw and last shows'); return }
    haptic()
    if (last) send(); else setStep(s => s + 1)
  }
  const back = () => (step === 0 || (openGig && step === 2) ? nav(-1) : setStep(s => s - 1))

  return (
    <div className="screen setup">
      <div className="setup-top">
        <div className="row between center-v"><span style={{ width: 32 }} /><Logo size={48} /><CloseButton /></div>
        <h1 className="setup-title">{cur.title}</h1>
        <div className="progress"><div style={{ width: `${((step + 1) / steps.length) * 100}%` }} /></div>
      </div>
      <form className="setup-body" onSubmit={e => { e.preventDefault(); next() }}>
        {cur.body}
        {last ? (
          <div className="step-footer">
            <button type="button" className="round-btn" aria-label="Back" onClick={back}><ChevronLeft size={24} /></button>
            <button type="submit" className="next-pill" disabled={!cur.valid}>SEND PITCH</button>
          </div>
        ) : (
          <>
            <button type="button" className="prev-btn" aria-label="Back" onClick={back}><ChevronLeft size={26} /></button>
            <button type="submit" className={`next-btn${cur.valid ? '' : ' disabled'}`} aria-label="Next"><ChevronRight size={30} /></button>
          </>
        )}
      </form>
    </div>
  )
}
