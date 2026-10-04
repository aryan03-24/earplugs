import { useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { GlassButton, Sheet } from '../../components/ui'
import { Bolt, Check, Close, Search } from '../../components/icons'
import { useCatalog, useNow } from '../../state/catalog'
import { useStore } from '../../state/store'
import { ordersFor } from '../../state/ticketing'
import { formatDate } from '../../lib/format'
import { haptic, toast } from '../../lib/native'
import type { Order } from '../../types'

type Detector = { detect: (src: CanvasImageSource) => Promise<{ rawValue: string }[]> }
declare global { interface Window { BarcodeDetector?: new (o: { formats: string[] }) => Detector } }

type Result = { kind: 'valid' | 'already'; order: Order } | { kind: 'invalid'; code: string }

/** "Check-in" (Fan Ticket Wallet 6 in the Figma): scan → "Valid · Admit N" → Admit / Scan next. */
export default function DoorCheckin() {
  const { id } = useParams()
  const nav = useNavigate()
  const cat = useCatalog()
  const now = useNow(10_000)
  const { state, toggleCheckin } = useStore()
  const [result, setResult] = useState<Result | null>(null)
  const [sheet, setSheet] = useState<'code' | 'list' | null>(null)
  const [torch, setTorch] = useState(false)
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
  const free = (show.tiers ?? []).every(t => t.price === 0) && show.price === 0

  const lookup = (raw: string) => {
    const c = (raw.includes('|') ? raw.split('|')[1] : raw).trim().toUpperCase()
    const o = orders.find(x => x.code.toUpperCase() === c)
    if (!o) { setResult({ kind: 'invalid', code: c || '—' }); haptic(60); return }
    setResult({ kind: done.includes(o.code) ? 'already' : 'valid', order: o })
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
        <GlassButton size={36} aria-label="Close" onClick={() => nav(-1)}><Close /></GlassButton>
        <div className="center">
          <b className="door-title">Check-in</b>
          <div className="muted tiny">{lineup || show.title} · {formatDate(show.date, { month: 'short', day: 'numeric' })}</div>
        </div>
        <GlassButton size={36} aria-label="Flashlight" aria-pressed={torch} className={torch ? 'white' : ''} onClick={() => setTorch(t => !t)}><Bolt /></GlassButton>
      </div>

      <div className="pad-x">
        <button className="door-progress" onClick={() => setSheet('list')} aria-label="Open guest list">
          <div className="row between small"><span className="muted">Checked in</span><span><b>{inCount}</b><span className="muted"> / {total} {free ? 'RSVPs' : 'tickets'}</span></span></div>
          <div className="bar"><div style={{ width: `${total ? (inCount / total) * 100 : 0}%` }} /></div>
        </button>

        <Scanner paused={!!result} torch={torch} onCode={lookup} onManual={() => setSheet('code')} />
      </div>

      {result && (
        <div className={`scan-card ${result.kind}`} role="status" aria-live="assertive">
          <div className="row gap center-v">
            <span className="scan-ic">{result.kind === 'invalid' ? <Close size={18} /> : <Check size={20} />}</span>
            <div className="min0">
              <b className="scan-head">{result.kind === 'valid' ? `Valid · Admit ${result.order.qty}` : result.kind === 'already' ? 'Already checked in' : 'Not a valid ticket'}</b>
              <div className="tiny">{result.kind === 'invalid' ? `${result.code} isn’t a ticket for this show` : `${result.order.name} · ${result.order.tierName} × ${result.order.qty}`}</div>
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
        <p className="muted small">Fans can find their code under ⋯ on their ticket.</p>
      </Sheet>

      <Sheet open={sheet === 'list'} onClose={() => setSheet(null)} title={`Guest list · ${inCount}/${total}`}>
        <label className="search-bar"><Search size={16} /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Search name or code" aria-label="Search guests" /></label>
        <div className="guest-list">
          {list.map(o => {
            const isIn = done.includes(o.code)
            return (
              <button key={o.code + o.at} className={`guest-row${isIn ? ' in' : ''}`} onClick={() => { toggleCheckin(show.id, o.code); haptic(); if (!isIn) toast(`${o.name} checked in`) }}>
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

/** Camera QR scanning where the browser supports it; otherwise (or on denial) a manual code entry. */
function Scanner({ onCode, onManual, paused, torch }: { onCode: (code: string) => void; onManual: () => void; paused: boolean; torch: boolean }) {
  const video = useRef<HTMLVideoElement>(null)
  const track = useRef<MediaStreamTrack | null>(null)
  const supported = !!window.BarcodeDetector && !!navigator.mediaDevices?.getUserMedia
  const [mode, setMode] = useState<'starting' | 'on' | 'off'>(supported ? 'starting' : 'off')
  const pausedRef = useRef(paused)
  pausedRef.current = paused
  const cb = useRef(onCode)
  cb.current = onCode

  useEffect(() => {
    if (!supported) return
    let stream: MediaStream | undefined
    let raf = 0
    let alive = true
    const det = new window.BarcodeDetector!({ formats: ['qr_code'] })
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }).then(s => {
      if (!alive) { s.getTracks().forEach(t => t.stop()); return }
      stream = s
      track.current = s.getVideoTracks()[0] ?? null
      setMode('on')
      if (video.current) { video.current.srcObject = s; video.current.play().catch(() => {}) }
      const loop = async () => {
        if (!pausedRef.current && video.current && video.current.readyState >= 2) {
          const codes = await det.detect(video.current).catch(() => [])
          if (codes[0]?.rawValue && !pausedRef.current) cb.current(codes[0].rawValue)
        }
        raf = requestAnimationFrame(loop)
      }
      loop()
    }).catch(() => setMode('off'))
    return () => { alive = false; cancelAnimationFrame(raf); stream?.getTracks().forEach(t => t.stop()) }
  }, [supported])

  useEffect(() => {
    // Torch is only available on some phones; ignore if unsupported.
    track.current?.applyConstraints({ advanced: [{ torch } as MediaTrackConstraintSet] }).catch(() => {})
  }, [torch])

  return (
    <div className="scan-box">
      <video ref={video} playsInline muted className={mode === 'on' ? '' : 'hidden'} />
      <div className="scan-corners"><i /><i /><i /><i /><span className="scan-line" /></div>
      <div className="scan-hint">
        {mode === 'off'
          ? <button className="manual-btn" onClick={onManual}>Camera unavailable · Enter code</button>
          : <span>Point at the fan’s ticket QR code</span>}
      </div>
    </div>
  )
}
