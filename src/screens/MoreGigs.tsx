import { useSearchParams } from 'react-router-dom'
import { BackButton, BandGrid, GigRow, Logo, Screen } from '../components/ui'
import { BANDS, SHOWS, upcoming, venueById } from '../data'
import { useStore } from '../store'

export default function MoreGigs() {
  const [params] = useSearchParams()
  const { state } = useStore()
  const list = params.get('list') // saved | tickets
  const venue = params.get('venue')
  const tab = params.get('tab')

  let title = params.get('title') || 'More Gigs'
  let shows = upcoming()
  if (list === 'saved') { title = 'My Saved'; shows = SHOWS.filter(s => state.saved.includes(s.id)) }
  if (list === 'tickets') { title = 'My Tickets'; shows = SHOWS.filter(s => state.tickets.includes(s.id)) }
  if (venue) { title = venueById(venue).name; shows = shows.filter(s => s.venueId === venue) }

  return (
    <Screen tabs>
      <header className="page-header">
        <Logo size={42} />
        <div className="row gap-sm center-v">
          <BackButton />
          <h1 className="large-title">{tab === 'bands' ? 'Bands For You' : title}</h1>
        </div>
      </header>
      {tab === 'bands' ? (
        <BandGrid bands={BANDS} />
      ) : shows.length ? (
        <div className="gig-list">{shows.map(s => <GigRow key={s.id} show={s} />)}</div>
      ) : (
        <p className="empty">
          {list === 'saved' ? 'Tap the bookmark on any gig to save it here.' : list === 'tickets' ? 'Shows you get tickets for will appear here.' : 'No gigs here yet.'}
        </p>
      )}
    </Screen>
  )
}
