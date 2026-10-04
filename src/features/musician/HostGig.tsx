import { useState, type ReactNode } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { Chip, GlassButton, Logo, Poster } from '../../components/ui'
import { ChevronLeft, ChevronRight, Close, Plus, Trash } from '../../components/icons'
import { GENRES } from '../../data/seed'
import { MY_BAND_ID, useCatalog } from '../../state/catalog'
import { useStore } from '../../state/store'
import { feesFor } from '../../state/ticketing'
import { formatDate, formatTime, money } from '../../lib/format'
import { haptic, resizeImage, toast, uid } from '../../lib/native'
import type { TicketTier } from '../../types'

const isoIn = (days: number) => new Date(Date.now() + days * 86400e3).toISOString().slice(0, 10)

const TIER_PRESETS: Omit<TicketTier, 'id'>[] = [
  { name: 'Early Bird', price: 8, qty: 30, note: 'Limited first release' },
  { name: 'General Admission', price: 12, qty: 80 },
  { name: 'Student', price: 6, qty: 30, note: 'Bring a student ID' },
  { name: 'VIP', price: 25, qty: 10, note: 'Front row + merch bundle' },
]

const localDate = (iso: string) => { const d = new Date(iso); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }
const localTime = (iso: string) => { const d = new Date(iso); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` }

/** New show / Edit show: musicians create, edit and sell tickets to their own shows. Same step layout as onboarding. */
export default function HostGig() {
  const { id } = useParams()
  const nav = useNavigate()
  const cat = useCatalog()
  const { state, addShow, addVenue, updateShow } = useStore()
  const band = cat.myBand!
  const existing = id ? state.myShows.find(s => s.id === id) : undefined
  const ev = existing ? cat.venue(existing.venueId) : undefined
  const isFree = existing?.tiers?.length === 1 && existing.tiers[0].price === 0

  const [step, setStep] = useState(0)
  const [title, setTitle] = useState(existing?.title ?? `${band.name} Live`)
  const [description, setDescription] = useState(existing?.description ?? '')
  const [poster, setPoster] = useState<string | undefined>(existing ? existing.poster : band.photo)
  const [date, setDate] = useState(existing ? localDate(existing.date) : isoIn(14))
  const [time, setTime] = useState(existing ? localTime(existing.date) : '20:00')
  const [loadIn, setLoadIn] = useState(existing?.loadIn ?? '17:00')
  const [setTime_, setSetTime] = useState(existing?.setTime ?? '21:15')
  const [where, setWhere] = useState<'venue' | 'own'>(ev && !ev.custom ? 'venue' : 'own')
  const [venueId, setVenueId] = useState(ev && !ev.custom ? ev.id : cat.venues[0].id)
  const [own, setOwn] = useState({ name: ev?.custom ? ev.name : '', address: ev?.custom ? ev.address : '', city: ev?.custom ? ev.city : state.profile.homeBase || 'Berkeley, CA', capacity: '80', ages: ev?.custom ? ev.ages : 'All ages' })
  const [lineup, setLineup] = useState<string[]>(existing ? existing.bandIds.filter(b => b !== MY_BAND_ID) : [])
  const [genres, setGenres] = useState<string[]>(existing?.genres ?? band.genres)
  const [pricing, setPricing] = useState<'paid' | 'free'>(isFree ? 'free' : 'paid')
  const [tiers, setTiers] = useState<TicketTier[]>(existing?.tiers && !isFree ? existing.tiers : [
    { id: 'early', ...TIER_PRESETS[0] },
    { id: 'ga', ...TIER_PRESETS[1] },
  ])
  const [freeCap, setFreeCap] = useState(isFree ? String(existing!.tiers![0].qty) : '80')
  if (id && (!existing || !existing.createdByMe)) return <Navigate to="/gigs?tab=shows" replace />

  const when = new Date(`${date}T${time}`)
  const venueName = where === 'own' ? own.name || 'Your spot' : cat.venue(venueId).name
  const capacity = pricing === 'free' ? Number(freeCap) || 0 : tiers.reduce((n, t) => n + t.qty, 0)
  const grossMax = pricing === 'free' ? 0 : tiers.reduce((n, t) => n + t.qty * t.price, 0)
  const setTier = (id: string, patch: Partial<TicketTier>) => setTiers(ts => ts.map(t => (t.id === id ? { ...t, ...patch } : t)))

  const steps: { title: string; valid: boolean; body: ReactNode }[] = [
    {
      title: 'What’s the gig called?', valid: title.trim().length > 1,
      body: (
        <>
          <input className="dark-input big" value={title} onChange={e => setTitle(e.target.value)} placeholder="Backyard Sessions Vol. 2" autoFocus />
          <label className="poster-picker">
            {poster ? <Poster hue={band.hue} photo={poster} /> : <div className="poster-empty"><Plus size={28} /><span>Add a poster</span></div>}
            <input type="file" accept="image/*" hidden onChange={async e => { const f = e.target.files?.[0]; if (f) setPoster(await resizeImage(f, 1000)) }} />
          </label>
          <textarea className="dark-input" rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder="Tell fans what to expect: set times, vibe, BYOB, merch…" />
        </>
      ),
    },
    {
      title: 'When is it?', valid: !isNaN(when.getTime()) && when.getTime() > Date.now(),
      body: (
        <>
          <label className="dark-field"><span>Date</span><input type="date" value={date} min={isoIn(0)} onChange={e => setDate(e.target.value)} /></label>
          <div className="row gap">
            <label className="dark-field grow"><span>Load-in</span><input type="time" value={loadIn} onChange={e => setLoadIn(e.target.value)} /></label>
            <label className="dark-field grow"><span>Doors</span><input type="time" value={time} onChange={e => setTime(e.target.value)} /></label>
            <label className="dark-field grow"><span>Your set</span><input type="time" value={setTime_} onChange={e => setSetTime(e.target.value)} /></label>
          </div>
          <p className="muted small">Fans see the doors time. Load-in and your set time stay on your calendar.</p>
        </>
      ),
    },
    {
      title: 'Where are you playing?', valid: where === 'venue' || (own.name.trim().length > 0 && own.address.trim().length > 0),
      body: (
        <>
          <div className="choice-row">
            <button type="button" className={`choice${where === 'own' ? ' on' : ''}`} onClick={() => setWhere('own')}><b>My own spot</b><span>House show, backyard, studio, pop-up</span></button>
            <button type="button" className={`choice${where === 'venue' ? ' on' : ''}`} onClick={() => setWhere('venue')}><b>A venue</b><span>You’ve rented the room and run the door</span></button>
          </div>
          {where === 'own' ? (
            <div className="stack-sm">
              <label className="dark-field"><span>Spot name</span><input value={own.name} onChange={e => setOwn({ ...own, name: e.target.value })} placeholder="The Blue House" /></label>
              <label className="dark-field"><span>Address (shared with ticket holders)</span><input value={own.address} onChange={e => setOwn({ ...own, address: e.target.value })} placeholder="2420 Durant Ave" /></label>
              <div className="row gap">
                <label className="dark-field grow"><span>City</span><input value={own.city} onChange={e => setOwn({ ...own, city: e.target.value })} /></label>
                <label className="dark-field" style={{ width: 120 }}><span>Ages</span>
                  <select value={own.ages} onChange={e => setOwn({ ...own, ages: e.target.value })}><option>All ages</option><option>18+</option><option>21+</option></select>
                </label>
              </div>
            </div>
          ) : (
            <div className="list-card">
              {cat.venues.map(v => (
                <button key={v.id} type="button" className={`list-item${venueId === v.id ? ' selected' : ''}`} onClick={() => setVenueId(v.id)}>
                  <div className="left"><b>{v.name}</b><div className="muted small">{v.city} · cap. {v.capacity} · {v.ages}</div></div>
                  {venueId === v.id && <span className="dot-on" />}
                </button>
              ))}
            </div>
          )}
        </>
      ),
    },
    {
      title: 'Who’s on the bill?', valid: true,
      body: (
        <>
          <div className="lineup-preview"><span className="muted small">Headliner</span><b>{band.name}</b></div>
          <div className="muted small">Supporting acts (optional)</div>
          <div className="chip-row wrap flush">
            {cat.bands.filter(b => b.id !== MY_BAND_ID).map(b => (
              <Chip key={b.id} active={lineup.includes(b.id)} onClick={() => setLineup(l => (l.includes(b.id) ? l.filter(x => x !== b.id) : [...l, b.id]))}>{b.name}</Chip>
            ))}
          </div>
          <div className="muted small">Genres</div>
          <div className="chip-row wrap flush">
            {GENRES.filter(g => g !== 'A little of everything').map(g => (
              <Chip key={g} active={genres.includes(g)} onClick={() => setGenres(gs => (gs.includes(g) ? gs.filter(x => x !== g) : [...gs, g]))}>{g}</Chip>
            ))}
          </div>
        </>
      ),
    },
    {
      title: 'Set up tickets', valid: pricing === 'free' ? capacity > 0 : tiers.length > 0 && tiers.every(t => t.name.trim() && t.qty > 0),
      body: (
        <>
          <div className="segmented full">
            <button type="button" className={pricing === 'paid' ? 'on' : ''} onClick={() => setPricing('paid')}>Paid tickets</button>
            <button type="button" className={pricing === 'free' ? 'on' : ''} onClick={() => setPricing('free')}>Free RSVP</button>
          </div>
          {pricing === 'free' ? (
            <label className="dark-field"><span>How many spots?</span><input inputMode="numeric" value={freeCap} onChange={e => setFreeCap(e.target.value.replace(/\D/g, ''))} /></label>
          ) : (
            <>
              {tiers.map(t => (
                <div key={t.id} className="tier-editor">
                  <div className="row gap-sm center-v">
                    <input className="tier-name" value={t.name} onChange={e => setTier(t.id, { name: e.target.value })} aria-label="Tier name" />
                    {tiers.length > 1 && <button type="button" className="icon-btn" aria-label="Remove tier" onClick={() => setTiers(ts => ts.filter(x => x.id !== t.id))}><Trash /></button>}
                  </div>
                  <div className="row gap">
                    <label className="dark-field grow"><span>Price ($)</span><input inputMode="numeric" value={t.price} onChange={e => setTier(t.id, { price: Number(e.target.value.replace(/\D/g, '')) || 0 })} /></label>
                    <label className="dark-field grow"><span>Quantity</span><input inputMode="numeric" value={t.qty} onChange={e => setTier(t.id, { qty: Number(e.target.value.replace(/\D/g, '')) || 0 })} /></label>
                  </div>
                  <input className="tier-note" value={t.note ?? ''} onChange={e => setTier(t.id, { note: e.target.value })} placeholder="Short note (optional)" aria-label="Tier note" />
                </div>
              ))}
              <div className="chip-row wrap flush">
                {TIER_PRESETS.filter(p => !tiers.some(t => t.name === p.name)).map(p => (
                  <Chip key={p.name} onClick={() => setTiers(ts => [...ts, { id: uid('tier'), ...p }])}>+ {p.name}</Chip>
                ))}
              </div>
              <p className="muted small">Fans pay a service fee on top (e.g. {money(12)} ticket → {`$${feesFor(12, 1).toFixed(2)}`} fee). You keep 100% of the ticket price.</p>
            </>
          )}
        </>
      ),
    },
    {
      title: 'Review & publish', valid: true,
      body: (
        <div className="review-card">
          <Poster hue={band.hue} photo={poster} className="review-poster" label={title} />
          <dl className="review">
            <dt>When</dt><dd>{isNaN(when.getTime()) ? '—' : `${formatDate(when.toISOString(), { weekday: 'short', month: 'short', day: 'numeric' })} · Doors ${formatTime(when.toISOString())}`}</dd>
            <dt>Where</dt><dd>{venueName}{where === 'own' && own.address ? `, ${own.address}` : ''}</dd>
            <dt>Lineup</dt><dd>{[band.name, ...lineup.map(id => cat.band(id)?.name)].join(', ')}</dd>
            <dt>Tickets</dt><dd>{pricing === 'free' ? `Free RSVP · ${capacity} spots` : tiers.map(t => `${t.name} ${money(t.price)} × ${t.qty}`).join('\n')}</dd>
            <dt>Capacity</dt><dd>{capacity}</dd>
            {pricing === 'paid' && <><dt>If it sells out</dt><dd>{money(grossMax)}</dd></>}
          </dl>
        </div>
      ),
    },
  ]

  const cur = steps[step]
  const last = step === steps.length - 1

  const publish = (asDraft = false) => {
    let vId = venueId
    if (where === 'own' && ev?.custom && ev.name === own.name.trim() && ev.address === own.address.trim()) {
      vId = ev.id
    } else if (where === 'own') {
      vId = uid('spot')
      addVenue({ id: vId, name: own.name.trim(), address: own.address.trim(), city: own.city.trim(), lat: 37.87, lng: -122.27, capacity, ages: own.ages, hue: band.hue, custom: true })
    }
    const finalTiers: TicketTier[] = pricing === 'free' ? [{ id: 'rsvp', name: 'Free RSVP', price: 0, qty: capacity }] : tiers
    const fields = {
      title: title.trim(), venueId: vId, bandIds: [MY_BAND_ID, ...lineup], date: when.toISOString(),
      price: Math.min(...finalTiers.map(t => t.price)), genres: genres.length ? genres : band.genres,
      description: description.trim(), poster, tiers: finalTiers, loadIn, setTime: setTime_, draft: asDraft,
    }
    haptic(30)
    if (existing) {
      const goingLive = existing.draft && !asDraft
      updateShow(existing.id, { ...fields, publishedAt: goingLive ? new Date().toISOString() : existing.publishedAt })
      toast(asDraft ? 'Draft saved' : goingLive ? 'Your gig is live — tickets are on sale' : 'Changes saved. Ticket holders will see the update.')
      nav(`/host/${existing.id}`, { replace: true })
      return
    }
    const newId = uid('gig')
    addShow({ id: newId, ...fields, hue: band.hue, plugging: 0, createdByMe: true, hostedByMe: true, publishedAt: asDraft ? undefined : new Date().toISOString() })
    toast(asDraft ? 'Saved as a draft' : 'Your gig is live — tickets are on sale')
    nav(asDraft ? '/gigs?tab=shows' : `/host/${newId}`, { replace: true })
  }

  const next = () => {
    if (!cur.valid) { toast(step === 1 ? 'Pick a future date and time' : 'Please complete this step'); return }
    haptic()
    if (last) publish(false); else setStep(s => s + 1)
  }

  return (
    <div className="screen setup">
      <div className="setup-top">
        <div className="row between center-v">
          <Logo size={40} />
          <GlassButton aria-label="Close" onClick={() => nav(-1)}><Close size={16} /></GlassButton>
        </div>
        <div className="eyebrow">{existing ? 'Edit show' : 'New show'} · {step + 1} of {steps.length}</div>
        <h1 className="setup-title">{cur.title}</h1>
        <div className="progress"><div style={{ width: `${((step + 1) / steps.length) * 100}%` }} /></div>
      </div>
      <form className="setup-body" onSubmit={e => { e.preventDefault(); next() }}>
        {cur.body}
        {last && <button type="submit" className="primary-btn">{existing && !existing.draft ? 'Save changes' : 'Publish & start selling'}</button>}
        {last && (!existing || existing.draft) && <button type="button" className="secondary-btn" onClick={() => publish(true)}>Save as draft</button>}
        {step > 0 && <button type="button" className="prev-btn" aria-label="Previous" onClick={() => setStep(s => s - 1)}><ChevronLeft size={26} /></button>}
        {!last && <button type="submit" className={`next-btn${cur.valid ? '' : ' disabled'}`} aria-label="Next"><ChevronRight size={30} /></button>}
      </form>
    </div>
  )
}
