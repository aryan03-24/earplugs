import { useMemo, useState, type ReactNode } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { Avatar, Chip, CloseButton, Logo, Poster, Segmented } from '../../components/ui'
import { ChevronLeft, ChevronRight, Search } from '../../components/icons'
import { dayKey, keyToDate, MonthCalendar } from '../../components/MonthCalendar'
import { OPEN_GIGS } from '../../data/seed'
import { RANGES, type Range } from '../../data/analytics'
import { MY_BAND_ID, useCatalog } from '../../state/catalog'
import { useStore } from '../../state/store'
import { formatDate, formatTime, money } from '../../lib/format'
import { haptic, toast, uid } from '../../lib/native'
import type { Application } from '../../types'
import { cityFor, kmFrom, LocationButton, type City } from './BookingLocation'
import { buildPitch, expectedDraw, PitchAttachment } from './PitchReport'

const MAX_DATES = 3
const fmtDay = (k: string) => formatDate(keyToDate(k).toISOString(), { weekday: 'short', month: 'short', day: 'numeric' })
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/**
 * Booking request. Every request = your pitch report (loaded from Analytics) + a message.
 *  - Pitch a venue:      1) venue  2) dates  3) pitch + message
 *  - Apply to open gig:  ?gig=ID   → straight to pitch + message
 *  - Join a bill:        ?join=ID  → straight to pitch + message
 */
export default function GetBooked() {
  const nav = useNavigate()
  const [params] = useSearchParams()
  const cat = useCatalog()
  const { state, submitApplication } = useStore()
  const band = cat.myBand!
  const openGig = OPEN_GIGS.find(g => g.id === params.get('gig'))
  const joinShow = params.get('join') ? cat.show(params.get('join')!) : undefined
  const fixed = !!openGig || !!joinShow

  const [city, setCity] = useState<City>(cityFor(state.profile.homeBase))
  const [radius, setRadius] = useState(15)
  const [q, setQ] = useState('')
  const [venueId, setVenueId] = useState(openGig?.venueId ?? joinShow?.venueId ?? params.get('venue') ?? '')
  const [dates, setDates] = useState<string[]>(openGig ? [dayKey(new Date(openGig.date))] : joinShow ? [dayKey(new Date(joinShow.date))] : [])
  const [month, setMonth] = useState(() => { const d = openGig ? new Date(openGig.date) : new Date(); return new Date(d.getFullYear(), d.getMonth(), 1) })
  const [step, setStep] = useState(fixed ? 2 : params.get('venue') ? 1 : 0)
  const [range, setRange] = useState<Range>((RANGES as readonly string[]).includes(params.get('range') ?? '') ? (params.get('range') as Range) : '30D')
  const [message, setMessage] = useState<string | null>(null) // null = use the suggested message

  const venues = useMemo(() => cat.venues
    .map(v => ({ v, km: kmFrom(city, v) }))
    .filter(x => x.km <= radius && (!q.trim() || `${x.v.name} ${x.v.city}`.toLowerCase().includes(q.trim().toLowerCase())))
    .sort((a, b) => a.km - b.km), [cat, city, radius, q])

  if (params.get('join') && (!joinShow || joinShow.bandIds.includes(MY_BAND_ID))) return <Navigate to="/gigs" replace />

  const venue = venueId ? cat.venue(venueId) : undefined
  const pitch = buildPitch(band, state.profile.members, range)
  const headliner = joinShow ? cat.band(joinShow.bandIds[0]) : undefined
  const dateText = dates.map(fmtDay).join(' / ')
  const ask = openGig
    ? { slot: `${openGig.slot} · ${openGig.setLength} min`, dates: `${fmtDay(dates[0])} · ${formatTime(openGig.date)}` }
    : joinShow ? { slot: 'Supporting act · 30–40 min', dates: `${fmtDay(dates[0])} · ${formatTime(joinShow.date)}` }
      : { dates: dateText || 'Fri/Sat, next 6 weeks' }

  const suggested = joinShow
    ? `Hi ${headliner?.name ?? 'there'} & ${venue?.name}! ${band.name} would love to open for ${joinShow.title} on ${fmtDay(dates[0])}. We average ${pitch.attendance} fans a show with a ${pitch.showUp}% show-up rate, so we’d bring ${expectedDraw(pitch)} of our own. Our pitch report is attached. Happy to play a 30–40 min set.`
    : openGig
      ? `Hi ${venue?.name}! ${band.name} would love the ${openGig.slot.toLowerCase()} slot on ${fmtDay(dates[0])}. We average ${pitch.attendance} fans with a ${pitch.showUp}% show-up rate. Full pitch report attached.`
      : `Hi ${venue?.name ?? 'there'}! ${band.name} would love to play ${dateText || 'a weekend in the next few weeks'}. We’re drawing ${pitch.attendance} fans on average (${pitch.attendDelta > 0 ? `up ${pitch.attendDelta}%` : 'steady'}) and ${pitch.repeat}% come back. Our pitch report is attached.`
  const text = message ?? suggested

  const toggleDate = (k: string) => {
    haptic()
    if (dates.includes(k)) { setDates(dates.filter(x => x !== k)); return }
    if (dates.length >= MAX_DATES) { toast(`Pick up to ${MAX_DATES} dates`); return }
    setDates([...dates, k].sort((a, b) => keyToDate(a).getTime() - keyToDate(b).getTime()))
  }

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
                <Poster hue={v.hue} photo={v.photo} className="row-thumb" />
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
          {dates.length > 0 && <div className="chip-row wrap flush center-h">{dates.map(k => <Chip key={k} blue>{fmtDay(k)}</Chip>)}</div>}
        </>
      ),
    },
    {
      title: joinShow ? 'Request to join the bill' : 'Send your pitch', valid: text.trim().length > 0,
      body: (
        <>
          {joinShow ? (
            <div className="request-target">
              <Poster hue={joinShow.hue} photo={joinShow.poster ?? headliner?.photo} className="target-art" />
              <div className="grow min0 left">
                <div className="muted small">JOINING</div>
                <b className="block">{joinShow.title}</b>
                <span className="muted small block">{venue?.name} · {fmtDay(dates[0])} · {formatTime(joinShow.date)}</span>
                <div className="lineup-mini">
                  {joinShow.bandIds.map(id => cat.band(id)).filter(b => !!b).map(b => <Avatar key={b.id} name={b.name} hue={b.hue} photo={b.photo} size={24} />)}
                  <span className="muted small">{joinShow.bandIds.length} on the bill + you</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="request-target">
              <Poster hue={venue?.hue ?? 200} photo={venue?.photo} className="target-art" />
              <div className="grow min0 left">
                <div className="muted small">TO</div>
                <b className="block">{venue?.name}</b>
                <span className="muted small block">{dateText}{openGig ? ` · ${openGig.slot} · ${openGig.pay ? money(openGig.pay) : 'Door split'}` : ''}</span>
              </div>
            </div>
          )}

          <div className="field-label left">Pitch report from your Analytics</div>
          <Segmented options={RANGES} value={range} onChange={setRange} full />
          <PitchAttachment pitch={pitch} band={band} cat={cat} venueCity={venue?.city} ask={ask} />

          <label className="labeled-field">
            <span>Message</span>
            <textarea rows={6} value={text} onChange={e => setMessage(e.target.value)} />
          </label>
          {message !== null && <button type="button" className="link small left" onClick={() => setMessage(null)}>Use suggested message</button>}
        </>
      ),
    },
  ]
  const cur = steps[step]
  const last = step === steps.length - 1

  const send = () => {
    if (!venue) return
    const sorted = dates.map(keyToDate).sort((a, b) => a.getTime() - b.getTime())
    const app: Application = {
      id: uid('app'), venueId, kind: joinShow ? 'join' : openGig ? 'open-gig' : 'venue',
      openGigId: openGig?.id, joinShowId: joinShow?.id, createdAt: new Date().toISOString(),
      actName: band.name, email: '', members: state.profile.members,
      targetStart: iso(sorted[0]), targetEnd: iso(sorted[sorted.length - 1]),
      website: '', draw: expectedDraw(pitch), soundsLike: '', videos: [], genres: band.genres,
      lastShows: pitch.recent.map(r => `${r.venue} (${r.attended})`).join(', '), bill: '',
      offerDate: openGig?.date ?? joinShow?.date, pitch,
      messages: [{ from: 'me', text: text.trim(), at: new Date().toISOString() }],
    }
    submitApplication(app)
    haptic(30)
    toast(joinShow ? `Request sent to ${headliner?.name ?? venue.name}` : `Pitch sent to ${venue.name}`)
    nav(`/bookings/${app.id}`, { replace: true })
  }

  const next = () => {
    if (!cur.valid) { toast(step === 0 ? 'Choose a venue' : step === 1 ? 'Pick at least one date' : 'Write a message'); return }
    haptic()
    if (last) send(); else setStep(s => s + 1)
  }
  const back = () => (step === 0 || (fixed && step === 2) || (params.get('venue') && step === 1) ? nav(-1) : setStep(s => s - 1))

  return (
    <div className="screen setup">
      <div className="setup-top">
        <div className="row between center-v"><span style={{ width: 32 }} /><Logo size={48} /><CloseButton /></div>
        <h1 className="setup-title">{cur.title}</h1>
        <div className="progress"><div style={{ width: fixed ? '100%' : `${((step + 1) / steps.length) * 100}%` }} /></div>
      </div>
      <form className="setup-body" onSubmit={e => { e.preventDefault(); next() }}>
        {cur.body}
        {last ? (
          <div className="step-footer">
            <button type="button" className="round-btn" aria-label="Back" onClick={back}><ChevronLeft size={24} /></button>
            <button type="submit" className="next-pill" disabled={!cur.valid}>{joinShow ? 'REQUEST TO JOIN' : 'SEND PITCH'}</button>
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
