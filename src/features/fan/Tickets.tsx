import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Empty, PageHeader, Poster, Screen, Segmented } from '../../components/ui'
import { useCatalog } from '../../state/catalog'
import { useStore } from '../../state/store'
import { formatTime, isPastDate, shortDate } from '../../lib/format'

const TABS = ['Upcoming', 'Past'] as const

/** Ticket wallet. Each card opens the full ticket pass. */
export default function Tickets() {
  const cat = useCatalog()
  const { state } = useStore()
  const [tab, setTab] = useState<(typeof TABS)[number]>('Upcoming')

  const rows = state.tickets
    .map(t => ({ t, show: cat.anyShow(t.showId) }))
    .filter((r): r is { t: typeof r.t; show: NonNullable<typeof r.show> } => !!r.show)
    .filter(r => (tab === 'Past') === isPastDate(r.show.date))
    .sort((a, b) => a.show.date.localeCompare(b.show.date))

  return (
    <Screen tabs>
      <PageHeader title="My Tickets" back="/profile" />
      <div className="pad-x"><Segmented options={TABS} value={tab} onChange={setTab} full /></div>
      <div className="ticket-list pad-x">
        {rows.length ? rows.map(({ t, show }) => {
          const v = cat.venue(show.venueId)
          const checked = state.checkins[show.id]?.includes(t.code)
          return (
            <Link key={t.id} to={`/tickets/${t.id}`} className={`ticket-card${t.transferredTo || show.cancelled ? ' faded' : ''}`}>
              <Poster hue={show.hue} className="ticket-art" photo={show.poster ?? cat.band(show.bandIds[0])?.photo} />
              <div className="ticket-body">
                <b>{show.title}</b>
                <span className="muted small">{v.name}</span>
                <span className="small">{shortDate(show.date)} · {formatTime(show.date)}</span>
                <span className="ticket-qty">
                  {show.cancelled ? 'Cancelled · refunded' : t.transferredTo ? `Sent to ${t.transferredTo}` : checked ? '✓ Checked in' : `${t.qty} × ${t.tierName}`}
                </span>
              </div>
            </Link>
          )
        }) : (
          <Empty>{tab === 'Upcoming' ? <>No tickets yet. <Link to="/explore" className="link">Find a show</Link></> : 'Shows you’ve been to will show up here.'}</Empty>
        )}
      </div>
    </Screen>
  )
}
