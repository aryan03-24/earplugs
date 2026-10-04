import { Link, Navigate, useParams } from 'react-router-dom'
import { CloseButton, Empty, Logo, Poster, SectionHeader } from '../../components/ui'
import { GigRow } from '../../components/cards'
import { Pin } from '../../components/icons'
import { useCatalog } from '../../state/catalog'
import { useStore } from '../../state/store'

export default function VenuePage() {
  const { id } = useParams()
  const cat = useCatalog()
  const { state } = useStore()
  const venue = cat.venues.find(v => v.id === id)
  if (!venue) return <Navigate to="/explore" replace />
  const shows = cat.showsAt(venue.id)
  const musician = state.profile.role === 'musician'

  return (
    <div className="screen">
      <div className="row between pad-x top-bar">
        <Logo />
        <CloseButton />
      </div>
      <Poster hue={venue.hue} photo={venue.photo} className="hero short" />
      <div className="pad-x">
        <h1 className="show-title">{venue.name}</h1>
        <div className="row gap-sm center-v muted"><Pin size={16} />{venue.address}, {venue.city}</div>
        <div className="info-grid">
          <div><span className="muted small">Capacity</span><b>{venue.capacity}</b></div>
          <div><span className="muted small">Ages</span><b>{venue.ages}</b></div>
        </div>
        {musician && <Link to={`/bookings/apply?venue=${venue.id}`} className="primary-btn as-link">Apply to play here</Link>}
      </div>
      <SectionHeader title="Upcoming at this venue" />
      {shows.length ? <div className="gig-list">{shows.map(s => <GigRow key={s.id} show={s} />)}</div> : <Empty>Nothing on the calendar yet.</Empty>}
    </div>
  )
}
