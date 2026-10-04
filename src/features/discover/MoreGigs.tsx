import { useSearchParams } from 'react-router-dom'
import { Empty, PageHeader, Screen } from '../../components/ui'
import { BandGrid, GigRow } from '../../components/cards'
import { useCatalog } from '../../state/catalog'

/** Full list view behind the "›" buttons on Explore. */
export default function MoreGigs() {
  const [params] = useSearchParams()
  const cat = useCatalog()

  if (params.get('tab') === 'bands') {
    return (
      <Screen tabs>
        <PageHeader title="Bands For You" back />
        <BandGrid bands={cat.bands.filter(b => b.id !== cat.myBand?.id)} />
      </Screen>
    )
  }

  return (
    <Screen tabs>
      <PageHeader title={params.get('title') || 'More Gigs'} back />
      {cat.upcoming.length
        ? <div className="gig-list">{cat.upcoming.map(s => <GigRow key={s.id} show={s} />)}</div>
        : <Empty>No gigs coming up yet.</Empty>}
    </Screen>
  )
}
