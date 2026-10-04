import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import QRCode from 'qrcode'
import { Empty, PageHeader, Poster, Screen, Segmented, Sheet } from '../../components/ui'
import { useCatalog } from '../../state/catalog'
import { useStore, type Ticket } from '../../state/store'
import { formatTime, isPastDate, priceText, shortDate } from '../../lib/format'
import { toast } from '../../lib/native'

const TABS = ['Upcoming', 'Past'] as const

export default function Tickets() {
  const cat = useCatalog()
  const { state, cancelTicket } = useStore()
  const [tab, setTab] = useState<(typeof TABS)[number]>('Upcoming')
  const [open, setOpen] = useState<Ticket | null>(null)

  const rows = state.tickets
    .map(t => ({ t, show: cat.show(t.showId) }))
    .filter((r): r is { t: Ticket; show: NonNullable<typeof r.show> } => !!r.show)
    .filter(r => (tab === 'Past') === isPastDate(r.show.date))
    .sort((a, b) => a.show.date.localeCompare(b.show.date))

  const openShow = open ? cat.show(open.showId) : undefined

  return (
    <Screen tabs>
      <PageHeader title="My Tickets" />
      <div className="pad-x"><Segmented options={TABS} value={tab} onChange={setTab} full /></div>
      <div className="ticket-list pad-x">
        {rows.length ? rows.map(({ t, show }) => {
          const v = cat.venue(show.venueId)
          return (
            <button key={show.id} className="ticket-card" onClick={() => setOpen(t)}>
              <Poster hue={show.hue} className="ticket-art" photo={cat.band(show.bandIds[0])?.photo} />
              <div className="ticket-body">
                <b>{show.title}</b>
                <span className="muted small">{v.name}</span>
                <span className="small">{shortDate(show.date)} · {formatTime(show.date)}</span>
                <span className="ticket-qty">{t.qty} × {show.price === 0 ? 'RSVP' : 'GA'}</span>
              </div>
            </button>
          )
        }) : (
          <Empty>{tab === 'Upcoming' ? <>No tickets yet. <Link to="/explore" className="link">Find a show</Link></> : 'Shows you’ve been to will show up here.'}</Empty>
        )}
      </div>

      <Sheet open={!!open && !!openShow} onClose={() => setOpen(null)} title={openShow?.title}>
        {open && openShow && (
          <>
            <p className="muted">{cat.venue(openShow.venueId).name} · {shortDate(openShow.date)} · Doors {formatTime(openShow.date)}</p>
            <QR value={`EARPLUG:${openShow.id}:${open.purchasedAt}`} />
            <div className="row between sheet-row"><span>Admits</span><b>{open.qty}</b></div>
            <div className="row between sheet-row"><span>Price</span><b>{priceText(openShow.price * open.qty)}</b></div>
            <Link to={`/show/${openShow.id}`} className="secondary-btn" onClick={() => setOpen(null)}>View show</Link>
            {!isPastDate(openShow.date) && (
              <button className="danger-btn" onClick={() => { cancelTicket(openShow.id); setOpen(null); toast(openShow.price ? 'Tickets refunded' : 'RSVP cancelled') }}>
                {openShow.price ? 'Request refund' : 'Cancel RSVP'}
              </button>
            )}
          </>
        )}
      </Sheet>
    </Screen>
  )
}

function QR({ value }: { value: string }) {
  const [src, setSrc] = useState('')
  useEffect(() => {
    QRCode.toDataURL(value, { margin: 1, width: 440, color: { dark: '#000000', light: '#ffffff' } }).then(setSrc).catch(() => setSrc(''))
  }, [value])
  return <div className="qr">{src && <img src={src} alt="Ticket QR code" />}<span className="muted small">Show this at the door</span></div>
}
