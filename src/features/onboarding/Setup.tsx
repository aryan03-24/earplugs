import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { Logo } from '../../components/ui'
import { Check, ChevronRight, Plus } from '../../components/icons'
import { GENRES } from '../../data/seed'
import { useStore } from '../../state/store'
import { haptic, resizeImage, toast } from '../../lib/native'
import type { Profile } from '../../types'

type StepId = 'phone' | 'code' | 'name' | 'artist' | 'band' | 'photo' | 'home' | 'genres' | 'notif' | 'terms'

// Step order follows the Figma onboarding rows for each persona.
const STEPS: Record<'fan' | 'musician', StepId[]> = {
  fan: ['phone', 'code', 'name', 'photo', 'home', 'genres', 'notif', 'terms'],
  musician: ['phone', 'code', 'artist', 'band', 'photo', 'home', 'genres', 'notif', 'terms'],
}

const TITLES: Record<StepId, (artist: boolean) => string> = {
  phone: () => 'What is your phone number?',
  code: () => 'We texted you a code, drop it here',
  name: () => 'What is your name?',
  artist: () => 'What do you go by as an artist?',
  band: () => 'Tell us about your band!',
  photo: a => (a ? 'Add a band photo' : 'Add a profile picture'),
  home: () => 'Where is home for you?',
  genres: a => (a ? 'What do you play?' : 'What are you plugged into?'),
  notif: () => 'Stay plugged in.',
  terms: () => 'Terms and Conditions',
}

export default function Setup() {
  const { step: stepParam } = useParams()
  const nav = useNavigate()
  const { state, updateProfile, completeOnboarding } = useStore()
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const p = state.profile

  if (!p.role) return <Navigate to="/" replace />
  const artist = p.role === 'musician'
  const steps = STEPS[p.role]
  const index = Math.max(0, Math.min(steps.length - 1, Number(stepParam) || 0))
  const step = steps[index]
  const set = (patch: Partial<Profile>) => updateProfile(patch)

  const valid: Record<StepId, boolean> = {
    phone: p.phone.replace(/\D/g, '').length >= 10,
    code: code.every(Boolean),
    name: p.firstName.trim().length > 0,
    artist: p.artistName.trim().length > 0,
    band: p.firstName.trim().length > 0,
    photo: true,
    home: p.homeBase.trim().length > 0,
    genres: p.genres.length > 0,
    notif: true,
    terms: p.acceptedTerms,
  }

  const next = () => {
    if (!valid[step]) {
      toast(step === 'terms' ? 'Please accept the terms to continue' : 'Please fill this in to continue')
      return
    }
    haptic()
    if (step === 'phone') toast('Code sent! (Demo: enter any 6 digits)')
    if (index === steps.length - 1) {
      completeOnboarding()
      nav(artist ? '/analytics' : '/explore', { replace: true })
    } else nav(`/setup/${index + 1}`)
  }

  return (
    <div className="screen setup">
      <div className="setup-top">
        <button className="logo-btn" onClick={() => (index === 0 ? nav('/') : nav(-1))} aria-label="Back">
          <Logo size={40} />
        </button>
        <h1 className="setup-title">{TITLES[step](artist)}</h1>
        <div className="progress" aria-label={`Step ${index + 1} of ${steps.length}`}>
          <div style={{ width: `${((index + 1) / steps.length) * 100}%` }} />
        </div>
      </div>

      <form className="setup-body" onSubmit={e => { e.preventDefault(); next() }}>
        {step === 'phone' && (
          <div className="row gap">
            <select className="field small" defaultValue="+1" aria-label="Country code">
              <option>+1</option><option>+44</option><option>+91</option><option>+61</option>
            </select>
            <input className="field grow" type="tel" inputMode="tel" autoFocus placeholder="(510) 555-0123"
              value={p.phone} onChange={e => set({ phone: formatPhone(e.target.value) })} />
          </div>
        )}

        {step === 'code' && <CodeInput code={code} setCode={setCode} />}

        {step === 'name' && (
          <>
            <LightField label="Name" value={p.firstName} onChange={v => set({ firstName: v })} autoFocus placeholder="Anandi" />
            <LightField label="Last Name" value={p.lastName} onChange={v => set({ lastName: v })} placeholder="Joshi" />
          </>
        )}

        {step === 'artist' && (
          <>
            <LightField label="Artist / Band Name" value={p.artistName} onChange={v => set({ artistName: v })} autoFocus placeholder="SOBO" />
            <LightField label="Tagline (Optional)" value={p.tagline} onChange={v => set({ tagline: v })} placeholder="Suns Out Buns Out" />
          </>
        )}

        {step === 'band' && (
          <>
            <LightField label="First Name" value={p.firstName} onChange={v => set({ firstName: v })} autoFocus placeholder="Anandi" />
            <LightField label="Last Name" value={p.lastName} onChange={v => set({ lastName: v })} placeholder="Joshi" />
            <LightField label="# of Members" value={p.members} onChange={v => set({ members: v.replace(/\D/g, '') })} placeholder="4" inputMode="numeric" />
          </>
        )}

        {step === 'photo' && <PhotoPicker />}

        {step === 'home' && (
          <>
            <p className="setup-copy">
              {artist ? 'We find gigs for you near home, campus, or wherever you spend time.' : <><b>Home Base</b> is where you spend the most time. This can be your college town or home town.</>}
            </p>
            <LightField label="Home Base" value={p.homeBase} onChange={v => set({ homeBase: v })} placeholder="Berkeley, CA" autoFocus />
            <p className="setup-copy">{artist ? 'Where you spend most of your time.' : 'Any other place that’s your home away from home'}</p>
            <LightField label="Second Location (Optional)" value={p.secondLocation} onChange={v => set({ secondLocation: v })} placeholder="New York City, NY" />
            {artist && <p className="setup-copy">Any place you call home.</p>}
          </>
        )}

        {step === 'genres' && (
          <div className="genre-grid">
            {GENRES.map(g => {
              const on = p.genres.includes(g)
              return (
                <button type="button" key={g} className={`genre-pill${on ? ' on' : ''}`} aria-pressed={on}
                  onClick={() => { haptic(); set({ genres: on ? p.genres.filter(x => x !== g) : [...p.genres, g] }) }}>
                  {g}{on && <span className="dot" />}
                </button>
              )
            })}
          </div>
        )}

        {step === 'notif' && (
          <>
            <p className="setup-copy">Can we send you notifications about {artist ? 'bookings, offers and new fans' : 'gigs and artists you’ll love'}?</p>
            <div className="stack center">
              <button type="button" className={`outline-btn${p.notifications ? ' on' : ''}`} onClick={async () => {
                if ('Notification' in window) {
                  try { await Notification.requestPermission() } catch { /* unsupported */ }
                }
                set({ notifications: true })
                next()
              }}>Enable Notification</button>
              <button type="button" className="outline-btn" onClick={() => { set({ notifications: false }); next() }}>Maybe Later</button>
            </div>
          </>
        )}

        {step === 'terms' && (
          <>
            <div className="terms">
              <p>Welcome to EarPlug. By creating an account you agree to:</p>
              <ul>
                <li>Use EarPlug to discover, share and {artist ? 'book' : 'attend'} live music respectfully.</li>
                <li>Only upload photos and video you have the right to share.</li>
                <li>Let us use your location and preferences to recommend {artist ? 'venues and fans' : 'shows'}.</li>
                <li>{artist ? 'Booking terms are agreed directly between you and each venue.' : 'Ticket purchases are handled by the venue or ticket provider.'}</li>
              </ul>
              <p>You can delete your account and data at any time from your profile.</p>
            </div>
            <label className="check-row">
              <input type="checkbox" checked={p.acceptedTerms} onChange={e => set({ acceptedTerms: e.target.checked })} />
              <span className="check-box">{p.acceptedTerms && <Check size={14} />}</span>
              I agree to the Terms and Conditions
            </label>
          </>
        )}

        <button type="submit" className={`next-btn${valid[step] ? '' : ' disabled'}`} aria-label="Next">
          <ChevronRight size={30} />
        </button>
      </form>
    </div>
  )
}

function formatPhone(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 10)
  if (d.length < 4) return d
  if (d.length < 7) return `(${d.slice(0, 3)}) ${d.slice(3)}`
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`
}

function LightField({ label, value, onChange, placeholder, autoFocus, inputMode }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; autoFocus?: boolean; inputMode?: 'numeric'
}) {
  return (
    <label className="labeled-field">
      <span>{label}</span>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} autoFocus={autoFocus} inputMode={inputMode} />
    </label>
  )
}

function CodeInput({ code, setCode }: { code: string[]; setCode: (c: string[]) => void }) {
  const refs = useRef<(HTMLInputElement | null)[]>([])
  useEffect(() => { refs.current[0]?.focus() }, [])
  return (
    <div className="code-row">
      {code.map((c, i) => (
        <input key={i} ref={el => { refs.current[i] = el }} className="code-box" inputMode="numeric" autoComplete="one-time-code"
          maxLength={i === 0 ? 6 : 1} value={c} aria-label={`Digit ${i + 1}`}
          onChange={e => {
            const val = e.target.value.replace(/\D/g, '')
            if (val.length > 1) { // pasted or autofilled code
              const digits = val.slice(0, 6).split('')
              setCode(code.map((_, j) => digits[j] ?? ''))
              refs.current[Math.min(digits.length, 5)]?.focus()
              return
            }
            const n = [...code]; n[i] = val; setCode(n)
            if (val && i < 5) refs.current[i + 1]?.focus()
          }}
          onKeyDown={e => { if (e.key === 'Backspace' && !c && i > 0) refs.current[i - 1]?.focus() }}
        />
      ))}
    </div>
  )
}

function PhotoPicker() {
  const { state, updateProfile } = useStore()
  const photo = state.profile.photo
  return (
    <div className="stack center">
      <label className="photo-picker">
        {photo ? <img src={photo} alt="Profile" /> : <Plus size={36} />}
        <input type="file" accept="image/*" hidden onChange={async e => {
          const f = e.target.files?.[0]
          if (f) updateProfile({ photo: await resizeImage(f, 400) })
        }} />
      </label>
      <p className="setup-copy center">{photo ? 'Looking good! Tap to change.' : 'Tap to upload a photo. You can skip this for now.'}</p>
    </div>
  )
}
