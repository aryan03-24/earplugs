import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { BackButton, GlassButton, Poster, Screen, Sheet } from '../../components/ui'
import { Edit, LinkIcon, Message, QrIcon, Share, TicketIcon } from '../../components/icons'
import { useCatalog, useNow } from '../../state/catalog'
import { useStore } from '../../state/store'
import { ordersFor, salesSummary } from '../../state/ticketing'
import { formatDate, formatTime, isPastDate, money, timeAgo } from '../../lib/format'
import { haptic, share, toast } from '../../lib/native'

/** Musician's live view of a gig they're hosting: sales, orders, door, promotion. */
export default function GigDashboard() {
  const { id } = useParams()
  const nav = useNavigate()
  const cat = useCatalog()
  const now = useNow(4000)
  const { state, updateShow } = useStore()
  const [sheet, setSheet] = useState<'message' | 'cancel' | 'edit' | null>(null)
  const [msg, setMsg] = useState('')
  const [showAll, setShowAll] = useState(false)
  const show = cat.anyShow(id ?? '')
  if (!show || !show.createdByMe) return <Navigate to="/gigs?tab=shows" replace />

  const v = cat.venue(show.venueId)
  const orders = ordersFor(show, v, state.tickets, now)
  const sum = salesSummary(show, v, orders)
  const checked = state.checkins[show.id]?.length ?? 0
  const checkedPeople = orders.filter(o => state.checkins[show.id]?.includes(o.code)).reduce((n, o) => n + o.qty, 0)
  const past = isPastDate(show.date)
  const status = show.cancelled ? 'Cancelled' : show.venueApproval === 'pending' ? 'Pending approval' : show.draft ? 'Draft' : past ? 'Ended' : show.salesPaused ? 'Paused' : sum.pct >= 100 ? 'Sold out' : 'On sale'
  const url = `${location.origin}/show/${show.id}`
  const venueTicketed = !show.hostedByMe || show.ticketing === 'venue'

  return (
    <Screen className="gig-dash">
      <div className="row between center-v pad-x top-bar">
        <BackButton to="/gigs?tab=shows" />
        <b>Manage Gig</b>
        <GlassButton aria-label="Share link" onClick={() => share(show.title, `Tickets for ${show.title}`, url)}><Share size={18} /></GlassButton>
      </div>

      <div className="pad-x">
        <Link to={`/show/${show.id}`} className="dash-head">
          <Poster hue={show.hue} photo={show.poster ?? cat.myBand?.photo} className="dash-poster" />
          <div className="min0">
            {status !== 'On sale' && <span className="status-pill neutral">{status}</span>}
            <h1 className="dash-title">{show.title}</h1>
            <div className="muted small">{formatDate(show.date, { weekday: 'short', month: 'short', day: 'numeric' })} · {formatTime(show.date)}</div>
            <div className="muted small">{v.name}</div>
          </div>
        </Link>

        {show.venueApproval === 'pending' && (
          <div className="draft-banner">
            <div><b>Waiting on {v.name}</b><div className="small muted">We sent your gig to the venue for approval. It goes live for fans once they confirm.</div></div>
          </div>
        )}

        {show.draft && show.venueApproval !== 'pending' && (
          <div className="draft-banner">
            <div><b>This show is a draft</b><div className="small muted">Fans can’t see it or buy tickets yet.</div></div>
            <button className="small-pill white" onClick={() => { updateShow(show.id, { draft: false, publishedAt: new Date().toISOString() }); haptic(30); toast('Published — tickets are on sale') }}>Publish</button>
          </div>
        )}

        {venueTicketed ? (
          <div className="venue-ticketing">
            <b>Ticketing handled by {v.name}</b>
            <p className="muted small">Fans buy tickets through the venue. After the show, request attendance so it counts toward your analytics.</p>
            {show.attendance != null ? (
              <div className="row between center-v"><span className="muted">Attendance reported</span><b className="big">{show.attendance}</b></div>
            ) : show.attendanceRequestedAt ? (
              <div className="muted small">Requested {timeAgo(show.attendanceRequestedAt)} · waiting on {v.name}</div>
            ) : (
              <button className="secondary-btn" disabled={!past} onClick={() => { updateShow(show.id, { attendanceRequestedAt: new Date().toISOString() }); toast(`Asked ${v.name} for attendance`) }}>
                {past ? 'Request attendance data' : 'Request attendance after the show'}
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="sales-ring-card">
              <Ring pct={sum.pct} />
              <div className="grow">
                <div className="big-num">{sum.sold}<span>/{sum.capacity}</span></div>
                <div className="muted small">tickets sold</div>
                <div className="row gap dash-stats">
                  <div><b>{money(sum.revenue)}</b><span>Revenue</span></div>
                  <div><b>{orders.length}</b><span>Orders</span></div>
                  <div><b>{checkedPeople}</b><span>Checked in</span></div>
                </div>
              </div>
            </div>


            <div className="dash-actions">
              <button className="dash-action primary" disabled={!!show.cancelled} onClick={() => nav(`/host/${show.id}/door`)}>
                <QrIcon />Door check-in{checked ? ` · ${checked}` : ''}
              </button>
              <button className="dash-action" onClick={() => { navigator.clipboard?.writeText(url).catch(() => {}); toast('Ticket link copied') }}><LinkIcon />Copy link</button>
              <button className="dash-action" onClick={() => setSheet('message')} disabled={!!show.cancelled}><Message />Message fans</button>
              <button className="dash-action" onClick={() => setSheet('edit')} disabled={!!show.cancelled || past}><TicketIcon size={20} />Tickets</button>
              <button className="dash-action" onClick={() => nav(`/host/${show.id}/edit`)} disabled={!!show.cancelled || past}><Edit size={18} />Edit show</button>
            </div>

            <h2 className="sub-h">Sales by ticket</h2>
            <div className="list-card">
              {sum.tiers.map(t => {
                const pct = t.tier.qty ? Math.round((t.sold / t.tier.qty) * 100) : 0
                return (
                  <div key={t.tier.id} className="perf-row">
                    <div className="row between center-v">
                      <div><b>{t.tier.name}</b><div className="muted small">{t.tier.price ? money(t.tier.price) : 'Free'} · {t.left} left</div></div>
                      <div className="right"><b>{t.sold}/{t.tier.qty}</b><div className="muted small">{money(t.revenue)}</div></div>
                    </div>
                    <div className="bar"><div style={{ width: `${pct}%` }} /></div>
                  </div>
                )
              })}
            </div>

            <div className="section-header flush"><h2>Recent orders</h2>{orders.length > 5 && <button className="link small" onClick={() => setShowAll(s => !s)}>{showAll ? 'Less' : `All ${orders.length}`}</button>}</div>
            {orders.length ? (
              <div className="list-card">
                {orders.slice(0, showAll ? undefined : 5).map(o => (
                  <div key={o.code + o.at} className="order-row">
                    <div className="order-avatar">{o.name.split(' ').map(w => w[0]).join('')}</div>
                    <div className="grow min0"><b>{o.name}{o.mine && <span className="you-tag">on this device</span>}</b><div className="muted small">{o.qty} × {o.tierName} · {timeAgo(o.at)}</div></div>
                    <div className="right"><b>{o.total ? money(o.total) : 'RSVP'}</b>{state.checkins[show.id]?.includes(o.code) && <div className="ok small">✓ In</div>}</div>
                  </div>
                ))}
              </div>
            ) : <p className="muted small">No orders yet. Share your link to get the first one.</p>}

            {(show.announcements?.length ?? 0) > 0 && (
              <>
                <h2 className="sub-h">Updates sent</h2>
                {show.announcements!.slice().reverse().map((a, i) => <div key={i} className="announcement">{a.text}<span className="muted small"> · {timeAgo(a.at)}</span></div>)}
              </>
            )}
          </>
        )}

        {!show.cancelled && !past && (
          <button className="text-danger" onClick={() => setSheet('cancel')}>Cancel gig</button>
        )}
      </div>

      <Sheet open={sheet === 'message'} onClose={() => setSheet(null)} title="Message ticket holders">
        <p className="muted small">Goes to everyone with a ticket ({sum.sold} people) and shows on the gig page.</p>
        <textarea className="dark-input" rows={4} value={msg} onChange={e => setMsg(e.target.value)} placeholder="Doors pushed to 8:30! Openers at 9." autoFocus />
        <div className="chip-row wrap flush">
          {['Doors open soon! 🎸', 'Set times are up', 'Bring a friend: still a few tickets left'].map(t => (
            <button key={t} type="button" className="chip" onClick={() => setMsg(t)}>{t}</button>
          ))}
        </div>
        <button className="primary-btn" disabled={!msg.trim()} onClick={() => {
          updateShow(show.id, { announcements: [...(show.announcements ?? []), { text: msg.trim(), at: new Date().toISOString() }] })
          setMsg(''); setSheet(null); haptic(20); toast(`Sent to ${sum.sold} ticket holders`)
        }}>Send update</button>
      </Sheet>

      <Sheet open={sheet === 'edit'} onClose={() => setSheet(null)} title="Ticket settings">
        {sum.tiers.map(t => (
          <div key={t.tier.id} className="row between center-v sheet-row">
            <div><b>{t.tier.name}</b><div className="muted small">{t.sold} sold of {t.tier.qty}</div></div>
            <div className="stepper">
              <button aria-label="Fewer" disabled={t.tier.qty <= t.sold} onClick={() => updateShow(show.id, { tiers: sum.tiers.map(x => (x.tier.id === t.tier.id ? { ...x.tier, qty: Math.max(t.sold, x.tier.qty - 5) } : x.tier)) })}>−</button>
              <span>{t.tier.qty}</span>
              <button aria-label="More" onClick={() => updateShow(show.id, { tiers: sum.tiers.map(x => (x.tier.id === t.tier.id ? { ...x.tier, qty: x.tier.qty + 5 } : x.tier)) })}>+</button>
            </div>
          </div>
        ))}
        <label className="row between center-v sheet-row">
          <span>Pause sales</span>
          <input type="checkbox" className="switch" checked={!!show.salesPaused} onChange={e => { updateShow(show.id, { salesPaused: e.target.checked }); toast(e.target.checked ? 'Sales paused' : 'Sales resumed') }} />
        </label>
        <button className="primary-btn" onClick={() => setSheet(null)}>Done</button>
      </Sheet>

      <Sheet open={sheet === 'cancel'} onClose={() => setSheet(null)} title="Cancel this gig?">
        <p className="muted">All {sum.sold} ticket holders will be notified and refunded {sum.revenue ? money(sum.revenue) : ''}. This can’t be undone.</p>
        <button className="danger-btn" onClick={() => { updateShow(show.id, { cancelled: true }); setSheet(null); toast('Gig cancelled. Fans have been refunded.') }}>Cancel gig & refund</button>
        <button className="secondary-btn" onClick={() => setSheet(null)}>Keep gig</button>
      </Sheet>
    </Screen>
  )
}

function Ring({ pct }: { pct: number }) {
  const r = 42, c = 2 * Math.PI * r
  return (
    <svg width="104" height="104" viewBox="0 0 104 104" className="ring" role="img" aria-label={`${pct}% sold`}>
      <circle cx="52" cy="52" r={r} className="ring-bg" />
      <circle cx="52" cy="52" r={r} className="ring-fg" strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(100, pct) / 100)} />
      <text x="52" y="58" textAnchor="middle" className="ring-text">{pct}%</text>
    </svg>
  )
}
