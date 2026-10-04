import { useState, type ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { GlassButton, Logo } from '../../components/ui'
import { ChevronLeft, ChevronRight, Close } from '../../components/icons'
import { GENRES } from '../../data/seed'
import { RECENT_SHOWS } from '../../data/analytics'
import { useCatalog } from '../../state/catalog'
import { useStore } from '../../state/store'
import { haptic, toast, uid } from '../../lib/native'
import type { Application } from '../../types'

type Form = Omit<Application, 'id' | 'createdAt' | 'messages' | 'decided' | 'offerDate' | 'showId'> & { note: string }

const isoIn = (days: number) => new Date(Date.now() + days * 86400e3).toISOString().slice(0, 10)

/** "Get Booked": the 11-step venue application from the Figma, one question per screen. */
export default function GetBooked() {
  const nav = useNavigate()
  const [params] = useSearchParams()
  const cat = useCatalog()
  const { state, submitApplication } = useStore()
  const p = state.profile
  const [step, setStep] = useState(params.get('venue') ? 1 : 0)
  const [f, setF] = useState<Form>({
    venueId: params.get('venue') ?? '',
    actName: p.artistName,
    email: '',
    members: p.members,
    targetStart: isoIn(28),
    targetEnd: isoIn(30),
    website: '',
    draw: '',
    soundsLike: '',
    videos: ['', '', ''],
    genres: p.genres.filter(g => g !== 'A little of everything'),
    lastShows: RECENT_SHOWS.slice(0, 3).map(s => `${s.venue} — ${s.attended} attendees`).join('\n'),
    bill: '',
    note: '',
  })
  const set = (patch: Partial<Form>) => setF(x => ({ ...x, ...patch }))

  const steps: { title: string; valid: boolean; body: ReactNode }[] = [
    {
      title: 'Which venue do you want to play?', valid: !!f.venueId,
      body: (
        <div className="list-card">
          {cat.venues.map(v => (
            <button key={v.id} type="button" className={`list-item${f.venueId === v.id ? ' selected' : ''}`} onClick={() => { set({ venueId: v.id }); haptic() }}>
              <div className="left"><b>{v.name}</b><div className="muted small">{v.city} · cap. {v.capacity} · {v.ages}</div></div>
              {f.venueId === v.id && <span className="dot-on" />}
            </button>
          ))}
        </div>
      ),
    },
    { title: 'Step 1: Name of Act/Band/Artist', valid: !!f.actName.trim(), body: <Input value={f.actName} onChange={v => set({ actName: v })} placeholder="SOBO" /> },
    { title: 'Step 2: Email', valid: /\S+@\S+\.\S+/.test(f.email), body: <Input type="email" inputMode="email" value={f.email} onChange={v => set({ email: v })} placeholder="band@email.com" /> },
    { title: 'Step 3: # of Members', valid: !!f.members, body: <Input inputMode="numeric" value={f.members} onChange={v => set({ members: v.replace(/\D/g, '') })} placeholder="4" /> },
    {
      title: 'Step 4: Target Date (3 day range)', valid: !!f.targetStart && f.targetEnd >= f.targetStart,
      body: (
        <div className="stack-sm">
          <label className="dark-field"><span>From</span><input type="date" value={f.targetStart} min={isoIn(1)} onChange={e => set({ targetStart: e.target.value, targetEnd: addDays(e.target.value, 2) })} /></label>
          <label className="dark-field"><span>To</span><input type="date" value={f.targetEnd} min={f.targetStart} onChange={e => set({ targetEnd: e.target.value })} /></label>
        </div>
      ),
    },
    { title: 'Step 5: Website URL', valid: true, body: <Input type="url" inputMode="url" value={f.website} onChange={v => set({ website: v })} placeholder="https://yourband.com (optional)" /> },
    {
      title: 'Step 6: What size crowd do you normally draw on your own?', valid: !!f.draw,
      body: (
        <div className="chip-row wrap flush">
          {['Under 25', '25–50', '50–80', '80–100', '100–150', '150+'].map(d => (
            <button key={d} type="button" className={`genre-pill${f.draw === d ? ' on' : ''}`} onClick={() => set({ draw: d })}>{d}</button>
          ))}
        </div>
      ),
    },
    { title: 'Step 7: 2-3 musicians/bands that you could use to describe your sound and your scene?', valid: !!f.soundsLike.trim(), body: <Input multiline value={f.soundsLike} onChange={v => set({ soundsLike: v })} placeholder="Alvvays, The Strokes, Beach Bunny" /> },
    {
      title: 'Step 8: 2-3 Videos of your sound', valid: f.videos.filter(v => v.trim()).length >= 1,
      body: (
        <div className="stack-sm">
          {f.videos.map((v, i) => (
            <Input key={i} type="url" inputMode="url" value={v} placeholder={`Video link ${i + 1}${i === 0 ? '' : ' (optional)'}`}
              onChange={val => set({ videos: f.videos.map((x, j) => (j === i ? val : x)) })} />
          ))}
        </div>
      ),
    },
    {
      title: 'Step 9: Genres you identify with', valid: f.genres.length > 0,
      body: (
        <div className="genre-grid">
          {GENRES.filter(g => g !== 'A little of everything').map(g => {
            const on = f.genres.includes(g)
            return <button key={g} type="button" className={`genre-pill${on ? ' on' : ''}`} onClick={() => set({ genres: on ? f.genres.filter(x => x !== g) : [...f.genres, g] })}>{g}{on && <span className="dot" />}</button>
          })}
        </div>
      ),
    },
    { title: 'Step 10: List the last 3 shows you played, bands you played with, and how many attendees you had', valid: !!f.lastShows.trim(), body: <Input multiline rows={5} value={f.lastShows} onChange={v => set({ lastShows: v })} /> },
    { title: 'Step 11: Do you have a bill in mind?', valid: true, body: <Input multiline value={f.bill} onChange={v => set({ bill: v })} placeholder="Bands you’d like to share the night with (optional)" /> },
    {
      title: 'Review & send', valid: true,
      body: (
        <div className="stack-sm">
          <dl className="review">
            <dt>Venue</dt><dd>{f.venueId ? cat.venue(f.venueId).name : '—'}</dd>
            <dt>Act</dt><dd>{f.actName}</dd>
            <dt>Email</dt><dd>{f.email}</dd>
            <dt>Members</dt><dd>{f.members}</dd>
            <dt>Dates</dt><dd>{f.targetStart} → {f.targetEnd}</dd>
            <dt>Draw</dt><dd>{f.draw}</dd>
            <dt>Genres</dt><dd>{f.genres.join(', ')}</dd>
          </dl>
          <Input multiline value={f.note} onChange={v => set({ note: v })} placeholder="Add a note to the venue (optional)" />
        </div>
      ),
    },
  ]

  const cur = steps[step]
  const last = step === steps.length - 1

  const next = () => {
    if (!cur.valid) { toast('Please complete this step'); return }
    haptic()
    if (!last) { setStep(s => s + 1); return }
    const { note, ...rest } = f
    const venue = cat.venue(f.venueId)
    submitApplication({
      ...rest,
      videos: f.videos.filter(v => v.trim()),
      id: uid('app'),
      createdAt: new Date().toISOString(),
      messages: [{ from: 'me', text: note.trim() || `Hi ${venue.name}! We’d love to play ${f.targetStart} – ${f.targetEnd}.`, at: new Date().toISOString() }],
    })
    toast(`Application sent to ${venue.name}`)
    nav('/bookings', { replace: true })
  }

  return (
    <div className="screen setup">
      <div className="setup-top">
        <div className="row between center-v">
          <Logo size={40} />
          <GlassButton aria-label="Close" onClick={() => nav('/bookings')}><Close size={16} /></GlassButton>
        </div>
        <div className="eyebrow">Get Booked</div>
        <h1 className="setup-title">{cur.title}</h1>
        <div className="progress"><div style={{ width: `${((step + 1) / steps.length) * 100}%` }} /></div>
      </div>
      <form className="setup-body" onSubmit={e => { e.preventDefault(); next() }}>
        {cur.body}
        {step > 0 && (
          <button type="button" className="prev-btn" aria-label="Previous" onClick={() => setStep(s => s - 1)}><ChevronLeft size={26} /></button>
        )}
        {last
          ? <button type="submit" className="primary-btn send-btn">Send application</button>
          : <button type="submit" className={`next-btn${cur.valid ? '' : ' disabled'}`} aria-label="Next"><ChevronRight size={30} /></button>}
      </form>
    </div>
  )
}

function addDays(iso: string, n: number) {
  const d = new Date(`${iso}T12:00`)
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

function Input({ value, onChange, placeholder, multiline, rows = 3, type = 'text', inputMode }: {
  value: string; onChange: (v: string) => void; placeholder?: string; multiline?: boolean; rows?: number; type?: string; inputMode?: 'numeric' | 'email' | 'url'
}) {
  return multiline
    ? <textarea className="dark-input" rows={rows} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} autoFocus />
    : <input className="dark-input" type={type} inputMode={inputMode} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} autoFocus />
}
