import { useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { BackButton, Screen, Segmented } from '../../components/ui'
import { Check, Search } from '../../components/icons'
import { useCatalog, useNow } from '../../state/catalog'
import { useStore } from '../../state/store'
import { ordersFor } from '../../state/ticketing'
import { haptic, toast } from '../../lib/native'

type Detector = { detect: (src: CanvasImageSource) => Promise<{ rawValue: string }[]> }
declare global { interface Window { BarcodeDetector?: new (o: { formats: string[] }) => Detector } }

/** Door mode: scan or type ticket codes, or tap names on the guest list. */
export default function DoorCheckin() {
  const { id } = useParams()
  const cat = useCatalog()
  const now = useNow(10_000)
  const { state, toggleCheckin } = useStore()
  const [mode, setMode] = useState<'Scan' | 'Guest list'>('Scan')
  const [q, setQ] = useState('')
  const [code, setCode] = useState('')
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null)
  const show = cat.anyShow(id ?? '')
  const venue = show ? cat.venue(show.venueId) : undefined
  const orders = useMemo(() => (show && venue ? ordersFor(show, venue, state.tickets, now) : []), [show, venue, state.tickets, now])
  if (!show || !venue) return <Navigate to="/bookings" replace />

  const done = state.checkins[show.id] ?? []
  const total = orders.reduce((n, o) => n + o.qty, 0)
  const inCount = orders.filter(o => done.includes(o.code)).reduce((n, o) => n + o.qty, 0)

  const check = (raw: string) => {
    const c = (raw.includes('|') ? raw.split('|')[1] : raw).trim().toUpperCase()
    const o = orders.find(x => x.code.toUpperCase() === c)
    if (!o) { setResult({ ok: false, text: `${c || 'Code'} isn’t a ticket for this gig` }); haptic(60); return }
    if (done.includes(o.code)) { setResult({ ok: false, text: `${o.name} is already checked in` }); haptic(60); return }
    toggleCheckin(show.id, o.code)
    setResult({ ok: true, text: `${o.name} · ${o.qty} × ${o.tierName}` })
    haptic(25)
    setCode('')
  }

  const list = orders.filter(o => !q || o.name.toLowerCase().includes(q.toLowerCase()) || o.code.toLowerCase().includes(q.toLowerCase()))

  return (
    <Screen className="door">
      <div className="row between center-v pad-x top-bar">
        <BackButton to={`/host/${show.id}`} />
        <b>Door · {show.title}</b>
        <span style={{ width: 32 }} />
      </div>
      <div className="pad-x">
        <div className="door-count">
          <div className="big-num">{inCount}<span>/{total}</span></div>
          <div className="muted small">checked in</div>
          <div className="bar"><div style={{ width: `${total ? (inCount / total) * 100 : 0}%` }} /></div>
        </div>
        <Segmented options={['Scan', 'Guest list'] as const} value={mode} onChange={m => { setMode(m); setResult(null) }} full />

        {mode === 'Scan' ? (
          <>
            <Scanner onCode={check} />
            <form className="code-entry" onSubmit={e => { e.preventDefault(); check(code) }}>
              <input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="EP-XXXXXX" aria-label="Ticket code" autoCapitalize="characters" />
              <button type="submit" disabled={!code.trim()}>Check in</button>
            </form>
            {result && <div className={`scan-result ${result.ok ? 'ok' : 'bad'}`} role="status">{result.ok ? <Check /> : '✕'} {result.text}</div>}
            {orders.some(o => o.mine) && (
              <p className="muted small">Tip: tickets bought by the fan persona on this device show “on this device” in the guest list.</p>
            )}
          </>
        ) : (
          <>
            <div className="search-bar mt"><Search size={16} /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Search name or code" aria-label="Search guests" /></div>
            <div className="list-card mt">
              {list.map(o => {
                const isIn = done.includes(o.code)
                return (
                  <button key={o.code + o.at} className={`guest-row${isIn ? ' in' : ''}`} onClick={() => { toggleCheckin(show.id, o.code); haptic(); if (!isIn) toast(`${o.name} checked in`) }}>
                    <div className="grow min0 left"><b>{o.name}{o.mine && <span className="you-tag">on this device</span>}</b><div className="muted small">{o.code} · {o.qty} × {o.tierName}</div></div>
                    <span className={`check-dot${isIn ? ' on' : ''}`}>{isIn && <Check size={14} />}</span>
                  </button>
                )
              })}
              {!list.length && <p className="muted small pad-in">No matching guests.</p>}
            </div>
          </>
        )}
      </div>
    </Screen>
  )
}

/** Live camera scanning where the browser supports it (Chrome/Android); otherwise a prompt to type the code. */
function Scanner({ onCode }: { onCode: (code: string) => void }) {
  const video = useRef<HTMLVideoElement>(null)
  const [state, setState] = useState<'idle' | 'on' | 'unsupported' | 'denied'>(window.BarcodeDetector ? 'idle' : 'unsupported')
  const last = useRef('')

  useEffect(() => {
    if (state !== 'on' || !window.BarcodeDetector) return
    let stream: MediaStream | undefined
    let raf = 0
    const det = new window.BarcodeDetector({ formats: ['qr_code'] })
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }).then(s => {
      stream = s
      if (video.current) { video.current.srcObject = s; video.current.play() }
      const loop = async () => {
        if (video.current && video.current.readyState >= 2) {
          const codes = await det.detect(video.current).catch(() => [])
          const v = codes[0]?.rawValue
          if (v && v !== last.current) { last.current = v; onCode(v); setTimeout(() => { last.current = '' }, 2500) }
        }
        raf = requestAnimationFrame(loop)
      }
      loop()
    }).catch(() => setState('denied'))
    return () => { cancelAnimationFrame(raf); stream?.getTracks().forEach(t => t.stop()) }
  }, [state, onCode])

  return (
    <div className="scanner">
      {state === 'on' ? <video ref={video} playsInline muted /> : (
        <div className="scanner-idle">
          <div className="scan-frame" />
          {state === 'idle' && <button className="primary-btn" onClick={() => setState('on')}>Start camera</button>}
          {state === 'unsupported' && <p className="muted small center">Camera scanning isn’t supported in this browser. Type the code from the fan’s ticket below.</p>}
          {state === 'denied' && <p className="muted small center">Camera access was blocked. Type the code below instead.</p>}
        </div>
      )}
    </div>
  )
}
