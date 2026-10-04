import { useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { GlassButton, Sheet } from '../../components/ui'
import { Check, Close, Search } from '../../components/icons'
import { useCatalog, useNow } from '../../state/catalog'
import { useStore } from '../../state/store'
import { ordersFor } from '../../state/ticketing'
import { formatDate } from '../../lib/format'
import { haptic } from '../../lib/native'
import type { Order } from '../../types'

type Detector = { detect: (src: CanvasImageSource) => Promise<{ rawValue: string }[]> }
declare global { interface Window { BarcodeDetector?: new (o: { formats: string[] }) => Detector } }

type Result =
  | { kind: 'valid'; order: Order }
  | { kind: 'already'; order: Order }
  | { kind: 'invalid'; code: string }

/** Check-in from the Figma: scan → "Valid · Admit N" → Admit / Scan next. */
export default function DoorCheckin() {
  const { id } = useParams()
  const nav = useNavigate()
  const cat = useCatalog()
  const now = useNow(10_000)
  const { state, toggleCheckin } = useStore()
  const [result, setResult] = useState<Result | null>(null)
  const [sheet, setSheet] = useState<'code' | 'list' | null>(null)
  const [code, setCode] = useState('')
  const [q, setQ] = useState('')
  const show = cat.anyShow(id ?? '')
  const venue = show ? cat.venue(show.venueId) : undefined
  const orders = useMemo(() => (show && venue ? ordersFor(show, venue, state.tickets, now) : []), [show, venue, state.tickets, now])
  if (!show || !venue) return <Navigate to="/gigs?tab=shows" replace />

  const done = state.checkins[show.id] ?? []
  const total = orders.reduce((n, o) => n + o.qty, 0)
  const inCount = orders.filter(o => done.includes(o.code)).reduce((n, o) => n + o.qty, 0)
  const lineup = show.bandIds.map(b => cat.band(b)?.name).filter(Boolean).join(' + ')

  const lookup = (raw: string) => {
    const c = (raw.includes('|') ? raw.split('|')[1] : raw).trim().toUpperCase()
    const o = orders.find(x => x.code.toUpperCase() === c)
    if (!o) { setResult({ kind: 'invalid', code: c || '—' }); haptic(60); return }
    setResult(done.includes(o.code) ? { kind: 'already', order: o } : { kind: 'valid', order: o })
    haptic(done.includes(o.code) ? 60 : 20)
  }

  const admit = (o: Order) => {
    if (!done.includes(o.code)) toggleCheckin(show.id, o.code)
    haptic(30)
    setResult(null)
  }

  const list = orders.filter(o => !q || o.name.toLowerCase().includes(q.toLowerCase()) || o.code.toLowerCase().includes(q.toLowerCase()))

  return (
    <div className="screen door">
      <div className="row between center-v pad-x top-bar">
        <GlassButton size={34} aria-label="Close" onClick={() => nav(-1)}><Close /></GlassButton>
        <div className="center">
          <b>Check-in</b>
          <div className="muted small">{lineup || show.title} · {formatDate(show.date, { month: 'short', day: 'numeric' })}</div>
        </div>
        <GlassButton size={34} aria-label="Guest list" onClick={() => setSheet('list')}><Search size={16} /></GlassButton>
      </div>

      <div className="pad-x">
        <div className="door-progress">
          <div className="row between small"><span className="muted">Checked in</span><b>{inCount} / {total} {show.price === 0 ? 'RSVPs' : 'tickets'}</b></div>
          <div className="bar"><div style={{ width: `${total ? (inCount / total) * 100 : 0}%` }} /></div>
        </div>

        <Scanner paused={!!result} onCode={lookup} />
        <div className="door-links">
          <button onClick={() => setSheet('code')}>Enter code</button>
          <button onClick={() => setSheet('list')}>Guest list</button>
        </div>
      </div>

      {result && (
        <div className={`scan-card ${result.kind}`} role="status" aria-live="assertive">
          <div className="row gap center-v">
            <span className="scan-ic">{result.kind === 'invalid' ? <Close size={18} /> : <Check size={20} />}</span>
            <div className="min0">
              <b>{result.kind === 'valid' ? `Valid · Admit ${result.order.qty}` : result.kind === 'already' ? 'Already checked in' : 'Not a valid ticket'}</b>
              <div className="small">{result.kind === 'invalid' ? `${result.code} isn’t a ticket for this show` : `${result.order.name} · ${result.order.tierName} × ${result.order.qty}`}</div>
            </div>
          </div>
          <div className="row gap scan-actions">
            <button className="scan-next" onClick={() => setResult(null)}>Scan next</button>
            {result.kind === 'valid' && <button className="scan-admit" onClick={() => admit(result.order)}>Admit {result.order.qty}</button>}
          </div>
        </div>
      )}

      <Sheet open={sheet === 'code'} onClose={() => setSheet(null)} title="Enter ticket code">
        <form className="code-entry" onSubmit={e => { e.preventDefault(); if (code.trim()) { lookup(code); setCode(''); setSheet(null) } }}>
          <input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="EP-XXXXXX" aria-label="Ticket code" autoCapitalize="characters" autoFocus />
          <button type="submit" disabled={!code.trim()}>Check</button>
        </form>
        <p className="muted small">The code is printed under the QR on the fan’s ticket.</p>
      </Sheet>

      <Sheet open={sheet === 'list'} onClose={() => setSheet(null)} title={`Guest list · ${inCount}/${total}`}>
        <label className="search-bar"><Search size={16} /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Search name or code" aria-label="Search guests" /></label>
        <div className="guest-list">
          {list.map(o => {
            const isIn = done.includes(o.code)
            return (
              <button key={o.code + o.at} className={`guest-row${isIn ? ' in' : ''}`} onClick={() => { toggleCheckin(show.id, o.code); haptic() }}>
                <div className="grow min0 left"><b>{o.name}{o.mine && <span className="you-tag">on this device</span>}</b><div className="muted small">{o.code} · {o.tierName} × {o.qty}</div></div>
                <span className={`check-dot${isIn ? ' on' : ''}`}>{isIn && <Check size={14} />}</span>
              </button>
            )
          })}
          {!list.length && <p className="muted small">No matching guests.</p>}
        </div>
      </Sheet>
    </div>
  )
}

/** Camera scanning where supported (Chrome/Android, iOS 17+ PWA via BarcodeDetector polyfills); otherwise use Enter code. */
function Scanner({ onCode, paused }: { onCode: (code: string) => void; paused: boolean }) {
  const video = useRef<HTMLVideoElement>(null)
  const [mode, setMode] = useState<'idle' | 'on' | 'unsupported' | 'denied'>(window.BarcodeDetector ? 'idle' : 'unsupported')
  const pausedRef = useRef(paused)
  pausedRef.current = paused
  const cb = useRef(onCode)
  cb.current = onCode

  useEffect(() => {
    if (mode !== 'on' || !window.BarcodeDetector) return
    let stream: MediaStream | undefined
    let raf = 0
    const det = new window.BarcodeDetector({ formats: ['qr_code'] })
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }).then(s => {
      stream = s
      if (video.current) { video.current.srcObject = s; video.current.play() }
      const loop = async () => {
        if (!pausedRef.current && video.current && video.current.readyState >= 2) {
          const codes = await det.detect(video.current).catch(() => [])
          if (codes[0]?.rawValue && !pausedRef.current) cb.current(codes[0].rawValue)
        }
        raf = requestAnimationFrame(loop)
      }
      loop()
    }).catch(() => setMode('denied'))
    return () => { cancelAnimationFrame(raf); stream?.getTracks().forEach(t => t.stop()) }
  }, [mode])

  return (
    <div className="scan-box">
      {mode === 'on' && <video ref={video} playsInline muted />}
      <div className="scan-corners"><i /><i /><i /><i /><span className="scan-line" /></div>
      <div className="scan-hint">
        {mode === 'idle' && <button className="small-pill white" onClick={() => setMode('on')}>Start camera</button>}
        {mode === 'on' && 'Point at the fan’s ticket QR code'}
        {mode === 'unsupported' && 'Camera scanning isn’t available in this browser. Use Enter code.'}
        {mode === 'denied' && 'Camera blocked. Use Enter code or the guest list.'}
      </div>
    </div>
  )
}
