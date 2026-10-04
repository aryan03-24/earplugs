import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Logo } from '../../components/ui'
import { ChevronRight } from '../../components/icons'
import { useStore } from '../../state/store'
import { haptic, toast } from '../../lib/native'
import { CodeInput, formatPhone } from './Setup'

/** Log In: phone number, then the texted code. Uses the same layout as the setup steps. */
export default function Login() {
  const nav = useNavigate()
  const { state, signIn } = useStore()
  const [step, setStep] = useState<'phone' | 'code'>('phone')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const digits = (p: string) => p.replace(/\D/g, '')
  const valid = step === 'phone' ? digits(phone).length >= 10 : code.every(Boolean)

  const next = () => {
    if (!valid) { toast(step === 'phone' ? 'Enter your phone number' : 'Enter the 6-digit code'); return }
    haptic()
    if (step === 'phone') {
      const p = state.profile
      if (!p.onboarded || digits(p.phone) !== digits(phone)) {
        toast('No account with that number. Sign up first.')
        return
      }
      toast('Code sent! (Demo: enter any 6 digits)')
      setStep('code')
      return
    }
    signIn()
    nav(state.profile.role === 'musician' ? '/gigs' : '/explore', { replace: true })
  }

  return (
    <div className="screen setup">
      <div className="setup-top">
        <button className="logo-btn" onClick={() => (step === 'code' ? setStep('phone') : nav('/'))} aria-label="Back"><Logo size={40} /></button>
        <h1 className="setup-title">{step === 'phone' ? 'Welcome back. What’s your number?' : 'We texted you a code, drop it here'}</h1>
        <div className="progress"><div style={{ width: step === 'phone' ? '50%' : '100%' }} /></div>
      </div>
      <form className="setup-body" onSubmit={e => { e.preventDefault(); next() }}>
        {step === 'phone' ? (
          <div className="row gap">
            <select className="field small" defaultValue="+1" aria-label="Country code"><option>+1</option><option>+44</option><option>+91</option></select>
            <input className="field grow" type="tel" inputMode="tel" autoFocus placeholder="(510) 555-0123" value={phone} onChange={e => setPhone(formatPhone(e.target.value))} />
          </div>
        ) : <CodeInput code={code} setCode={setCode} />}
        <button type="submit" className={`next-btn${valid ? '' : ' disabled'}`} aria-label="Next"><ChevronRight size={30} /></button>
      </form>
    </div>
  )
}
