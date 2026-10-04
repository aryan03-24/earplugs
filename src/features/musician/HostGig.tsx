import { useMemo, useState, type ReactNode } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { Avatar, CloseButton, Poster, Sheet } from '../../components/ui'
import { Check, Close, Search, Trash } from '../../components/icons'
import { GENRES } from '../../data/seed'
import { MY_BAND_ID, useCatalog } from '../../state/catalog'
import { useStore } from '../../state/store'
import { formatDate, formatTime, money } from '../../lib/format'
import { haptic, resizeImage, toast, uid } from '../../lib/native'
import type { TicketTier } from '../../types'
import { MAX_GENRES } from '../onboarding/Setup'

const isoIn = (days: number) => { const d = new Date(Date.now() + days * 86400e3); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }
const localDate = (iso: string) => { const d = new Date(iso); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }
const localTime = (iso: string) => { const d = new Date(iso); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` }

const TIER_PRESETS: Omit<TicketTier, 'id'>[] = [
  { name: 'Early Entry', price: 7, qty: 30 },
  { name: 'General Admission', price: 12, qty: 80 },
  { name: 'Student', price: 6, qty: 30 },
  { name: 'VIP', price: 25, qty: 10 },
]

/** New show / Edit show: one vertical form laid out like the gig card it creates. */
export default function HostGig() {
  const { id } = useParams()
  const nav = useNavigate()
  const cat = useCatalog()
  const { state, addShow, addVenue, updateShow } = useStore()
  const band = cat.myBand!
  const existing = id ? state.myShows.find(s => s.id === id) : undefined
  const ev = existing ? cat.venue(existing.venueId) : undefined
  const isFree = existing?.tiers?.length === 1 && existing.tiers[0].price === 0

  const [title, setTitle] = useState(existing?.title ?? '')
  const [description, setDescription] = useState(existing?.description ?? '')
  const [poster, setPoster] = useState<string | undefined>(existing?.poster)
  const [date, setDate] = useState(existing ? localDate(existing.date) : isoIn(14))
  const [doors, setDoors] = useState(existing ? localTime(existing.date) : '20:00')
  const [loadIn, setLoadIn] = useState(existing?.loadIn ?? '17:00')
  const [onAt, setOnAt] = useState(existing?.setTime ?? '21:15')
  const [where, setWhere] = useState<'own' | 'venue'>(ev && !ev.custom ? 'venue' : 'own')
  const [venueId, setVenueId] = useState(ev && !ev.custom ? ev.id : '')
  const [venueQ, setVenueQ] = useState('')
  const [ticketing, setTicketing] = useState<'earplug' | 'venue'>(existing?.ticketing ?? 'earplug')
  const [own, setOwn] = useState({ name: ev?.custom ? ev.name : '', address: ev?.custom ? ev.address : '', city: ev?.custom ? ev.city : state.profile.homeBase || '', ages: ev?.custom ? ev.ages : 'All ages' })
  const [lineup, setLineup] = useState<string[]>(existing ? existing.bandIds.filter(b => b !== MY_BAND_ID) : [])
  const [actQ, setActQ] = useState('')
  const [genres, setGenres] = useState<string[]>((existing?.genres ?? band.genres).slice(0, MAX_GENRES))
  const [pricing, setPricing] = useState<'paid' | 'free'>(isFree ? 'free' : 'paid')
  const [tiers, setTiers] = useState<TicketTier[]>(existing?.tiers && !isFree ? existing.tiers : [{ id: 'early', ...TIER_PRESETS[0] }, { id: 'ga', ...TIER_PRESETS[1] }])
  const [freeCap, setFreeCap] = useState(isFree ? String(existing!.tiers![0].qty) : '80')
  const [confirm, setConfirm] = useState<'residential' | 'venue-sent' | null>(null)
  const [liability, setLiability] = useState(false)
  const [createdId, setCreatedId] = useState<string | null>(null)

  const venues = useMemo(() => cat.venues.filter(v => !venueQ.trim() || `${v.name} ${v.city}`.toLowerCase().includes(venueQ.trim().toLowerCase())), [cat, venueQ])
  const actMatches = useMemo(() => {
    const q = actQ.trim().toLowerCase()
    if (!q) return []
    return cat.bands.filter(b => b.id !== MY_BAND_ID && !lineup.includes(b.id) && b.name.toLowerCase().includes(q)).slice(0, 6)
  }, [cat, actQ, lineup])

  if (id && (!existing || !existing.createdByMe)) return <Navigate to="/gigs?tab=shows" replace />

  const when = new Date(`${date}T${doors}`)
  const sellsOnEarplug = where === 'own' || ticketing === 'earplug'
  const capacity = pricing === 'free' ? Number(freeCap) || 0 : tiers.reduce((n, t) => n + t.qty, 0)
  const setTier = (tid: string, patch: Partial<TicketTier>) => setTiers(ts => ts.map(t => (t.id === tid ? { ...t, ...patch } : t)))
  const problems = [
    !title.trim() && 'Add a show title',
    (isNaN(when.getTime()) || when.getTime() < Date.now()) && 'Pick a future date and doors time',
    where === 'own' && !own.address.trim() && 'Add the address',
    where === 'venue' && !venueId && 'Choose a venue',
    sellsOnEarplug && (pricing === 'free' ? capacity <= 0 : !tiers.length || tiers.some(t => !t.name.trim() || t.qty <= 0)) && 'Finish your tickets',
  ].filter(Boolean) as string[]

  const save = (asDraft: boolean) => {
    let vId = venueId
    if (where === 'own') {
      if (ev?.custom && ev.address === own.address.trim() && ev.name === (own.name.trim() || 'Private address')) vId = ev.id
      else {
        vId = uid('spot')
        addVenue({ id: vId, name: own.name.trim() || 'Private address', address: own.address.trim(), city: own.city.trim(), lat: 37.87, lng: -122.27, capacity, ages: own.ages, hue: band.hue, custom: true })
      }
    }
    const finalTiers: TicketTier[] = !sellsOnEarplug ? [{ id: 'venue', name: 'General Admission', price: 0, qty: cat.venue(vId).capacity }]
      : pricing === 'free' ? [{ id: 'rsvp', name: 'Free RSVP', price: 0, qty: capacity }] : tiers
    const needsApproval = where === 'venue' && !asDraft && (!existing || existing.venueId !== vId || existing.venueApproval !== 'approved')
    const fields = {
      title: title.trim(), venueId: vId, bandIds: [MY_BAND_ID, ...lineup], date: when.toISOString(),
      price: Math.min(...finalTiers.map(t => t.price)), genres: genres.length ? genres : band.genres,
      description: description.trim(), poster, tiers: finalTiers, loadIn, setTime: onAt,
      ticketing: where === 'own' ? 'earplug' as const : ticketing, hostedByMe: sellsOnEarplug,
      draft: asDraft || needsApproval,
      venueApproval: where === 'venue' ? (needsApproval ? 'pending' as const : existing?.venueApproval) : undefined,
      approvalRequestedAt: needsApproval ? new Date().toISOString() : existing?.approvalRequestedAt,
    }
    haptic(30)
    let showId = existing?.id
    if (existing) {
      const goingLive = existing.draft && !fields.draft
      updateShow(existing.id, { ...fields, publishedAt: goingLive ? new Date().toISOString() : existing.publishedAt })
    } else {
      showId = uid('gig')
      addShow({ id: showId, ...fields, hue: band.hue, plugging: 0, createdByMe: true, publishedAt: fields.draft ? undefined : new Date().toISOString() })
    }
    if (needsApproval) { setCreatedId(showId!); setConfirm('venue-sent'); return }
    toast(asDraft ? 'Draft saved' : existing ? 'Changes saved' : 'Your gig is live')
    nav(asDraft ? '/gigs?tab=shows' : `/host/${showId}`, { replace: true })
  }

  const publish = () => {
    if (problems.length) { toast(problems[0]); return }
    // Private / unregistered addresses need the host to accept responsibility first.
    if (where === 'own' && !(existing && ev?.custom && ev.address === own.address.trim())) { setLiability(false); setConfirm('residential'); return }
    save(false)
  }

  return (
    <div className="screen gig-form">
      <div className="row between center-v pad-x top-bar">
        <CloseButton />
        <b className="form-heading">{existing ? 'Edit show' : 'New show'}</b>
        <span style={{ width: 32 }} />
      </div>

      <div className="pad-x form-stack">
        <label className="poster-drop">
          {poster ? <Poster hue={band.hue} photo={poster} /> : <span>Drop media</span>}
          <input type="file" accept="image/*" hidden onChange={async e => { const f = e.target.files?.[0]; if (f) setPoster(await resizeImage(f, 1000)) }} />
        </label>
        <input className="title-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Show title" aria-label="Show title" />

        <FormCard title="When">
          <Field label="Date"><input type="date" value={date} min={isoIn(0)} onChange={e => setDate(e.target.value)} /></Field>
          <div className="row gap">
            <Field label="Doors"><input type="time" value={doors} onChange={e => setDoors(e.target.value)} /></Field>
            <Field label="Load-in"><input type="time" value={loadIn} onChange={e => setLoadIn(e.target.value)} /></Field>
          </div>
          <Field label="You go on at"><input type="time" value={onAt} onChange={e => setOnAt(e.target.value)} /></Field>
        </FormCard>

        <FormCard title="Where">
          <div className="seg2">
            <button type="button" className={where === 'own' ? 'on' : ''} onClick={() => setWhere('own')}>My own spot</button>
            <button type="button" className={where === 'venue' ? 'on' : ''} onClick={() => setWhere('venue')}>A venue</button>
          </div>
          {where === 'own' ? (
            <>
              <Field label="Spot name (optional)"><input value={own.name} onChange={e => setOwn({ ...own, name: e.target.value })} placeholder="ex. The Blue House" /></Field>
              <Field label="Address"><input value={own.address} onChange={e => setOwn({ ...own, address: e.target.value })} placeholder="ex. 2420 Durant Ave" /></Field>
              <div className="row gap">
                <Field label="City"><input value={own.city} onChange={e => setOwn({ ...own, city: e.target.value })} placeholder="ex. Berkeley" /></Field>
                <Field label="Ages"><select value={own.ages} onChange={e => setOwn({ ...own, ages: e.target.value })}><option>All ages</option><option>18+</option><option>21+</option></select></Field>
              </div>
            </>
          ) : (
            <>
              <label className="search-bar"><Search size={16} /><input value={venueQ} onChange={e => setVenueQ(e.target.value)} placeholder="Search venues" aria-label="Search venues" /></label>
              <div className="choice-list">
                {venues.map(v => (
                  <button key={v.id} type="button" className={`select-row${venueId === v.id ? ' on' : ''}`} onClick={() => { setVenueId(v.id); haptic() }}>
                    <span className="grow left"><b>{v.name}</b><span className="select-sub">{v.city} · cap. {v.capacity} · {v.ages}</span></span>
                  </button>
                ))}
              </div>
              <div className="field-label">Who’s handling ticketing?</div>
              <div className="seg2">
                <button type="button" className={ticketing === 'earplug' ? 'on' : ''} onClick={() => setTicketing('earplug')}>I’ll sell on EarPlug</button>
                <button type="button" className={ticketing === 'venue' ? 'on' : ''} onClick={() => setTicketing('venue')}>The venue</button>
              </div>
              {ticketing === 'venue' && <p className="muted small">After the show, request attendance from the venue so it counts toward your analytics.</p>}
            </>
          )}
        </FormCard>

        <FormCard title="Lineup">
          <div className="lineup-head"><Avatar name={band.name} hue={band.hue} photo={band.photo} size={36} /><b>{band.name}</b><span className="muted small">Headliner</span></div>
          {lineup.map(bid => {
            const b = cat.band(bid)!
            return (
              <div key={bid} className="lineup-head">
                <Avatar name={b.name} hue={b.hue} photo={b.photo} size={36} /><b>{b.name}</b>
                <button type="button" className="icon-btn" aria-label={`Remove ${b.name}`} onClick={() => setLineup(l => l.filter(x => x !== bid))}><Close size={14} /></button>
              </div>
            )
          })}
          <div className="act-search">
            <label className="search-bar"><Search size={16} /><input value={actQ} onChange={e => setActQ(e.target.value)} placeholder="Add a supporting act" aria-label="Search supporting acts" /></label>
            {actMatches.length > 0 && (
              <div className="dropdown" role="listbox">
                {actMatches.map(b => (
                  <button key={b.id} type="button" role="option" aria-selected={false} onClick={() => { setLineup(l => [...l, b.id]); setActQ(''); haptic() }}>
                    <Avatar name={b.name} hue={b.hue} photo={b.photo} size={28} /><span className="grow left">{b.name}</span><span className="muted small">{b.genres[0]}</span>
                  </button>
                ))}
              </div>
            )}
            {actQ.trim() && !actMatches.length && <p className="muted small">No artists match “{actQ}”.</p>}
          </div>
        </FormCard>

        <FormCard title={`Genres · ${genres.length}/${MAX_GENRES}`}>
          <div className="genre-grid wide">
            {GENRES.filter(g => g !== 'A little of everything').map(g => {
              const on = genres.includes(g)
              return (
                <button key={g} type="button" className={`genre-pill${on ? ' on' : ''}`} aria-pressed={on} onClick={() => {
                  if (!on && genres.length >= MAX_GENRES) { toast(`Pick up to ${MAX_GENRES} genres`); return }
                  setGenres(gs => (on ? gs.filter(x => x !== g) : [...gs, g]))
                }}>{g}</button>
              )
            })}
          </div>
        </FormCard>

        {sellsOnEarplug && (
          <FormCard title="Tickets">
            <div className="seg2">
              <button type="button" className={pricing === 'paid' ? 'on' : ''} onClick={() => setPricing('paid')}>Paid</button>
              <button type="button" className={pricing === 'free' ? 'on' : ''} onClick={() => setPricing('free')}>Free RSVP</button>
            </div>
            {pricing === 'free' ? (
              <Field label="How many spots?"><input inputMode="numeric" value={freeCap} onChange={e => setFreeCap(e.target.value.replace(/\D/g, ''))} /></Field>
            ) : (
              <>
                {tiers.map(t => (
                  <div key={t.id} className="tier-edit">
                    <div className="row gap-sm center-v">
                      <input className="tier-name" value={t.name} onChange={e => setTier(t.id, { name: e.target.value })} aria-label="Ticket name" />
                      {tiers.length > 1 && <button type="button" className="icon-btn" aria-label="Remove ticket type" onClick={() => setTiers(ts => ts.filter(x => x.id !== t.id))}><Trash /></button>}
                    </div>
                    <div className="row gap">
                      <Field label="Price ($)"><input inputMode="numeric" value={t.price} onChange={e => setTier(t.id, { price: Number(e.target.value.replace(/\D/g, '')) || 0 })} /></Field>
                      <Field label="Quantity"><input inputMode="numeric" value={t.qty} onChange={e => setTier(t.id, { qty: Number(e.target.value.replace(/\D/g, '')) || 0 })} /></Field>
                    </div>
                  </div>
                ))}
                <div className="chip-row wrap flush">
                  {TIER_PRESETS.filter(p => !tiers.some(t => t.name === p.name)).map(p => (
                    <button key={p.name} type="button" className="select-chip" onClick={() => setTiers(ts => [...ts, { id: uid('tier'), ...p }])}>+ {p.name}</button>
                  ))}
                </div>
              </>
            )}
          </FormCard>
        )}

        <FormCard title="About the show">
          <textarea className="form-textarea" rows={4} value={description} onChange={e => setDescription(e.target.value)} placeholder="Set times, vibe, what to bring…" />
        </FormCard>

        {!isNaN(when.getTime()) && title.trim() && (
          <p className="muted small center">
            {formatDate(when.toISOString(), { weekday: 'short', month: 'short', day: 'numeric' })} · Doors {formatTime(when.toISOString())}
            {sellsOnEarplug && pricing === 'paid' && ` · up to ${money(tiers.reduce((n, t) => n + t.qty * t.price, 0))} if it sells out`}
          </p>
        )}
      </div>

      <div className="form-footer">
        {(!existing || existing.draft) && <button type="button" className="draft-btn" onClick={() => (title.trim() ? save(true) : toast('Add a show title'))}>Save draft</button>}
        <button type="button" className="next-pill" onClick={publish}>{existing && !existing.draft ? 'SAVE CHANGES' : where === 'venue' ? 'SEND TO VENUE' : 'PUBLISH'}</button>
      </div>

      <Sheet open={confirm === 'residential'} onClose={() => setConfirm(null)} title="Hosting at a private address?">
        <p className="muted">This address isn’t a registered venue on EarPlug. If it’s a home or other residential space, you’re responsible for:</p>
        <ul className="liability-list">
          <li>Fire and occupancy permits</li>
          <li>Local quiet hours and noise rules</li>
          <li>Building, HOA and landlord rules</li>
          <li>The safety of everyone who attends</li>
        </ul>
        <label className="check-row">
          <input type="checkbox" checked={liability} onChange={e => setLiability(e.target.checked)} />
          <span className="check-box">{liability && <Check size={14} />}</span>
          I confirm this is the address I’m hosting at and I accept responsibility. EarPlug is not liable.
        </label>
        <button className="primary-btn" disabled={!liability} onClick={() => { setConfirm(null); save(false) }}>Confirm & publish</button>
        <button className="secondary-btn" onClick={() => setConfirm(null)}>Go back</button>
      </Sheet>

      <Sheet open={confirm === 'venue-sent'} onClose={() => nav(`/host/${createdId}`, { replace: true })} title="Sent to the venue">
        <p className="muted">We sent a confirmation to <b>{venueId ? cat.venue(venueId).name : 'the venue'}</b>. Stand by: your gig goes live for fans once they approve it. We’ll notify you.</p>
        <button className="primary-btn" onClick={() => nav(`/host/${createdId}`, { replace: true })}>Got it</button>
      </Sheet>
    </div>
  )
}

function FormCard({ title, children }: { title: string; children: ReactNode }) {
  return <section className="form-card"><h2>{title}</h2>{children}</section>
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="form-cell"><span>{label}</span>{children}</label>
}
