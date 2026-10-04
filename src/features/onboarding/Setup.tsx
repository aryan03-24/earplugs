import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { Logo, Sheet } from '../../components/ui'
import { Check, ChevronLeft, ChevronRight, Plus } from '../../components/icons'
import { GENRES } from '../../data/seed'
import { useStore } from '../../state/store'
import { haptic, resizeImage, share, toast } from '../../lib/native'
import type { Profile } from '../../types'

export const MAX_GENRES = 5

type StepId = 'phone' | 'code' | 'photo' | 'name' | 'artist' | 'home' | 'band' | 'genres' | 'notif' | 'terms'

// Step order matches the two onboarding rows in the Figma.
const STEPS: Record<'fan' | 'musician', StepId[]> = {
  fan: ['phone', 'code', 'photo', 'name', 'home', 'genres', 'notif', 'terms'],
  musician: ['phone', 'code', 'photo', 'artist', 'home', 'band', 'genres', 'notif', 'terms'],
}

const TITLES: Record<StepId, string> = {
  phone: 'What is your phone number?',
  code: 'We texted you a code, drop it here',
  photo: 'Add a profile picture & username',
  name: 'What is your name?',
  artist: 'What do you go by as an artist?',
  home: 'Where is home for you?',
  band: 'Tell us about you &/or your band!',
  genres: 'What are you plugged into?',
  notif: 'Stay plugged in.',
  terms: 'Terms and Conditions',
}

export default function Setup() {
  const { step: stepParam } = useParams()
  const nav = useNavigate()
  const { state, updateProfile, completeOnboarding } = useStore()
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [invite, setInvite] = useState(false)
  const p = state.profile

  if (!p.role) return <Navigate to="/start" replace />
  if (p.onboarded && p.signedIn) return <Navigate to={p.role === 'musician' ? '/gigs' : '/explore'} replace />
  const artist = p.role === 'musician'
  const steps = STEPS[p.role]
  const index = Math.max(0, Math.min(steps.length - 1, Number(stepParam) || 0))
  const step = steps[index]
  const set = (patch: Partial<Profile>) => updateProfile(patch)

  const valid: Record<StepId, boolean> = {
    phone: p.phone.replace(/\D/g, '').length >= 10,
    code: code.every(Boolean),
    photo: p.username.trim().length >= 2,
    name: p.firstName.trim().length > 0,
    artist: p.firstName.trim().length > 0,
    home: p.homeBase.trim().length > 0,
    band: p.artistName.trim().length > 0,
    genres: p.genres.length > 0 && p.genres.length <= MAX_GENRES,
    notif: p.location && p.notifications,
    terms: p.acceptedTerms,
  }

  const next = () => {
    if (!valid[step]) {
      toast(step === 'terms' ? 'Please accept the terms to continue' : step === 'notif' ? 'Enable location and notifications to continue' : step === 'photo' ? 'Pick a username (2+ characters)' : 'Please fill this in to continue')
      return
    }
    haptic()
    if (step === 'phone') toast('Code sent! (Demo: enter any 6 digits)')
    if (index === steps.length - 1) {
      completeOnboarding()
      nav(artist ? '/gigs' : '/explore', { replace: true })
    } else nav(`/setup/${index + 1}`)
  }

  return (
    <div className="screen setup">
      <div className="setup-top">
        <div className="setup-logo"><Logo size={48} /></div>
        <h1 className="setup-title">{TITLES[step]}</h1>
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

        {step === 'photo' && (
          <div className="stack center">
            <label className="photo-picker" aria-label="Upload profile picture">
              {p.photo ? <img src={p.photo} alt="" /> : <Plus size={30} className="photo-plus" />}
              <input type="file" accept="image/*" hidden onChange={async e => {
                const f = e.target.files?.[0]
                if (f) set({ photo: await resizeImage(f, 400) })
              }} />
            </label>
            <LightField label="Username" value={p.username}
              onChange={v => set({ username: v.toLowerCase().replace(/[^a-z0-9._]/g, '').slice(0, 24) })} />
          </div>
        )}

        {(step === 'name' || step === 'artist') && (
          <>
            <LightField label="First Name" value={p.firstName} onChange={v => set({ firstName: v })} autoFocus />
            <LightField label="Last Name" value={p.lastName} onChange={v => set({ lastName: v })} />
          </>
        )}

        {step === 'home' && (
          <>
            <p className="setup-copy plain"><b>Home Base</b> is where you spend the most time. This can be your college town or home town.</p>
            <LightField label="Home Base" value={p.homeBase} onChange={v => set({ homeBase: v })} placeholder="ex. Berkeley, CA" autoFocus />
            <p className="setup-copy plain">Any other place that’s your home away from home</p>
            <LightField label="Second Location (Optional)" value={p.secondLocation} onChange={v => set({ secondLocation: v })} placeholder="ex. New York City, NY" />
          </>
        )}

        {step === 'band' && (
          <>
            <LightField label="Stage Name" value={p.artistName} onChange={v => set({ artistName: v })} autoFocus />
            <LightField label="Number of Members" value={p.members} onChange={v => set({ members: v.replace(/\D/g, '').slice(0, 2) })} inputMode="numeric" />
            <button type="button" className="outline-btn wide" onClick={() => setInvite(true)}>+ Invite members from your band</button>
            <Sheet open={invite} onClose={() => setInvite(false)} title="Invite your bandmates">
              <p className="muted small">They’ll join {p.artistName || 'your band'}’s page and can manage gigs with you.</p>
              <button className="primary-btn" onClick={() => {
                share(`Join ${p.artistName || 'my band'} on EarPlug`, `Join ${p.artistName || 'my band'} on EarPlug`, location_origin())
                setInvite(false)
              }}>Share invite link</button>
              <button className="secondary-btn" onClick={() => setInvite(false)}>Later</button>
            </Sheet>
          </>
        )}

        {step === 'genres' && (
          <div className="genre-grid">
            {GENRES.map(g => {
              const on = p.genres.includes(g)
              return (
                <button type="button" key={g} className={`genre-pill${on ? ' on' : ''}`} aria-pressed={on}
                  onClick={() => {
                    if (!on && p.genres.length >= MAX_GENRES) { toast(`Pick up to ${MAX_GENRES} genres`); return }
                    haptic(); set({ genres: on ? p.genres.filter(x => x !== g) : [...p.genres, g] })
                  }}>
                  {g}
                </button>
              )
            })}
          </div>
        )}

        {step === 'notif' && (
          <>
            <p className="setup-copy plain">Enable your location and notifications for the best experience.</p>
            <div className="stack center">
              <button type="button" className={`outline-btn${p.location ? ' on' : ''}`} onClick={() => {
                // The browser may deny or not support location; the demo still records the choice.
                navigator.geolocation?.getCurrentPosition(() => {}, () => {}, { timeout: 8000 })
                set({ location: true }); haptic()
              }}>{p.location ? '✓ Location enabled' : 'Enable Location'}</button>
              <button type="button" className={`outline-btn${p.notifications ? ' on' : ''}`} onClick={async () => {
                if ('Notification' in window) {
                  try { await Notification.requestPermission() } catch { /* unsupported */ }
                }
                set({ notifications: true }); haptic()
              }}>{p.notifications ? '✓ Notifications enabled' : 'Enable Notifications'}</button>
            </div>
            <p className="muted small center">Both are required so we can show gigs near you and tell you when they drop.</p>
          </>
        )}

        {step === 'terms' && (
          <>
            <div className="terms">
              <p>Welcome to EarPlug. By creating an account you agree to:</p>
              <ul>
                <li>Use EarPlug to discover, share and {artist ? 'host and book' : 'attend'} live music respectfully.</li>
                <li>Only upload photos and video you have the right to share.</li>
                <li>Let us use your location and preferences to recommend {artist ? 'gigs and fans' : 'shows'}.</li>
                <li>{artist ? 'You are responsible for gigs you host and the tickets you sell.' : 'Ticket purchases are final unless the host offers a refund.'}</li>
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

        <button type="button" className="prev-btn" aria-label="Back" onClick={() => (index === 0 ? nav('/start') : nav(`/setup/${index - 1}`))}>
          <ChevronLeft size={26} />
        </button>
        <button type="submit" className={`next-btn${valid[step] ? '' : ' disabled'}`} aria-label="Next">
          <ChevronRight size={30} />
        </button>
      </form>
    </div>
  )
}

const location_origin = () => window.location.origin

export function formatPhone(v: string) {
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

export function CodeInput({ code, setCode }: { code: string[]; setCode: (c: string[]) => void }) {
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
